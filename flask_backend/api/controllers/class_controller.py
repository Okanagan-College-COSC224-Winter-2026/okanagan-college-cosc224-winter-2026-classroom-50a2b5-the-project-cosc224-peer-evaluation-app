# controllers/class_controller.py

import csv
import io
import re
import traceback
from typing import Dict, List, Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError
from werkzeug.security import generate_password_hash

from ..models import Course, User, User_Course, Assignment
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("class", __name__, url_prefix="/class")

REQUIRED_HEADERS = {"id", "name", "email"}
EMAIL_RE = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


def csv_to_list(csv_text: str) -> Tuple[List[Dict[str, str]], List[str]]:
    rows: List[Dict[str, str]] = []
    errors: List[str] = []

    if not csv_text or not csv_text.strip():
        return rows, ["CSV text empty"]

    stream = io.StringIO(csv_text.strip())

    try:
        reader = csv.DictReader(stream)
    except Exception as e:
        return rows, [f"Failed to read CSV: {e}"]

    headers = {h.strip() for h in (reader.fieldnames or [])}
    missing = REQUIRED_HEADERS - headers
    if missing:
        errors.append(
            f"Missing required headers: {', '.join(sorted(missing))}"
        )
        return rows, errors

    for line_num, row in enumerate(reader, start=2):
        if row is None:
            continue

        normalized = {
            (k.strip() if isinstance(k, str) else str(k)):
            (v.strip() if isinstance(v, str) else "")
            for k, v in row.items()
        }

        if not any(normalized.values()):
            continue

        if any(not normalized.get(field, "") for field in REQUIRED_HEADERS):
            errors.append(f"Line {line_num}: Missing required fields")
            continue

        rows.append(
            {
                "id": normalized["id"],
                "name": normalized["name"],
                "email": normalized["email"],
            }
        )

    return rows, errors



@bp.route("/create_class", methods=["POST"])
@jwt_teacher_required
def create_class():
    data = request.get_json(silent=True) or {}
    class_name = (data.get("name") or "").strip()

    if not class_name:
        return jsonify({"msg": "Class name is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    existing_class = Course.get_by_name(class_name)
    if existing_class:
        return jsonify({"msg": "Class already exists"}), 400

    try:
        new_class = Course(teacherID=user.id, name=class_name)
        db.session.add(new_class)
        db.session.commit()

        return jsonify(
            {
                "msg": "Class created",
                "class": {"id": new_class.id, "name": new_class.name},
            }
        ), 201

    except Exception as e:
        db.session.rollback()
        print("CREATE CLASS Exception:", e)
        traceback.print_exc()
        return jsonify({"msg": "Create class failed", "error": str(e)}), 500


@bp.route("/browse_classes", methods=["GET"])
@jwt_required()
def get_classes():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    classes = Course.query.all()

    return jsonify(
        [{"id": c.id, "name": c.name} for c in classes]
    ), 200


@bp.route("/classes", methods=["GET"])
@jwt_required()
def get_user_classes():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.is_teacher():
        courses = Course.get_courses_by_teacher(user.id)

    elif user.is_admin():
        courses = Course.query.all()

    elif user.is_student():
        user_courses = User_Course.get_courses_by_student(user.id)
        courses = [Course.get_by_id(uc.courseID) for uc in user_courses]
        courses = [c for c in courses if c is not None]

    else:
        courses = []

    return jsonify(
        [{"id": c.id, "name": c.name} for c in courses]
    ), 200



@bp.route("/<int:class_id>/members", methods=["GET"])
@jwt_required()
def get_class_members(class_id: int):
 
    course = Course.query.get(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    email = get_jwt_identity()
    requester = User.get_by_email(email)
    if not requester:
        return jsonify({"msg": "User not found"}), 404

    is_owner_teacher = requester.is_teacher() and course.teacherID == requester.id
    is_admin = requester.is_admin()

    if not (is_owner_teacher or is_admin):
        return jsonify({"msg": "Unauthorized"}), 403

    # Join users through the enrollment table
    members = (
        db.session.query(User)
        .join(User_Course, User_Course.userID == User.id)
        .filter(User_Course.courseID == class_id)
        .all()
    )

    return jsonify(
        [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": getattr(u, "role", None),
            }
            for u in members
        ]
    ), 200


@bp.route("/delete_class/<int:class_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_class(class_id: int):
  
    course = Course.query.get(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    try:
        # enrollments
        db.session.query(User_Course).filter(
            User_Course.courseID == class_id
        ).delete(synchronize_session=False)

        # assignments
        db.session.query(Assignment).filter(
            Assignment.courseID == class_id
        ).delete(synchronize_session=False)

        # course
        deleted = db.session.query(Course).filter(
            Course.id == class_id
        ).delete(synchronize_session=False)

        if deleted == 0:
            db.session.rollback()
            return jsonify({"msg": "Class not found"}), 404

        db.session.commit()
        return jsonify({"msg": "Class deleted"}), 200

    except StaleDataError as e:
        db.session.rollback()
        print("DELETE CLASS StaleDataError:", e)
        traceback.print_exc()
        return jsonify(
            {
                "msg": "Delete class failed (stale data / double delete)",
                "error": str(e),
            }
        ), 500

    except IntegrityError as e:
        db.session.rollback()
        print("DELETE CLASS IntegrityError:", e)
        traceback.print_exc()
        return jsonify(
            {
                "msg": "Delete class failed (foreign key constraint)",
                "error": str(e),
            }
        ), 400

    except Exception as e:
        db.session.rollback()
        print("DELETE CLASS Exception:", e)
        traceback.print_exc()
        return jsonify(
            {"msg": "Delete class failed", "error": str(e)}
        ), 500


@bp.route("/enroll_students", methods=["POST"])
@jwt_teacher_required
def enroll_students():
    data = request.get_json(silent=True) or {}
    class_id = data.get("class_id")
    student_emails_csv = data.get("students", "")

    if not class_id or not student_emails_csv:
        return jsonify(
            {"msg": "Class ID and student emails are required"}
        ), 400

    course = Course.query.get(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "You are not authorized to enroll students in this class"}
        ), 403

    students, parse_errors = csv_to_list(student_emails_csv)
    if parse_errors:
        return jsonify({"msg": "Errors in CSV", "errors": parse_errors}), 400

    enrolled_students: List[str] = []
    created_students: List[str] = []
    invalid_emails: List[str] = []

    try:
        for student_info in students:
            student_email = (student_info.get("email") or "").strip()
            student_name = (student_info.get("name") or "").strip()

            if not EMAIL_RE.match(student_email):
                invalid_emails.append(student_email)
                continue

            student = User.get_by_email(student_email)

            if not student:
                student = User(
                    name=student_name,
                    email=student_email,
                    hash_pass=generate_password_hash("password123"),
                    role="student",
                )
                db.session.add(student)
                db.session.flush()
                created_students.append(student_email)

            enrollment = User_Course.get(student.id, class_id)
            if not enrollment:
                User_Course.add(student.id, class_id)
                enrolled_students.append(student_email)

        if invalid_emails:
            db.session.rollback()
            return jsonify(
                {
                    "msg": "Invalid email format found",
                    "invalid_emails": invalid_emails,
                }
            ), 400

        db.session.commit()

        return jsonify(
            {
                "msg": f"{len(enrolled_students)} students added to course {course.name}",
                "created_students": created_students,
                "enrolled_students": enrolled_students,
            }
        ), 200

    except IntegrityError as e:
        db.session.rollback()
        print("ENROLL IntegrityError:", e)
        traceback.print_exc()
        return jsonify({"msg": "Enrollment failed", "error": str(e)}), 400

    except Exception as e:
        db.session.rollback()
        print("ENROLL Exception:", e)
        traceback.print_exc()
        return jsonify({"msg": "Enrollment failed", "error": str(e)}), 500