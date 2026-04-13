import csv
import io
import os
import re
from typing import List, Dict, Tuple

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename

from ..models import Course, Notification, User, User_Course
from .auth_controller import jwt_teacher_required

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def _allowed_image(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

bp = Blueprint("class", __name__, url_prefix="/class")


@bp.route("/members", methods=["POST"])
@jwt_required()
def list_class_members():
    """List all members (students) enrolled in a class"""
    data = request.get_json()
    class_id = data.get("id")
    
    if not class_id:
        return jsonify({"msg": "Missing class id"}), 400
    
    # Check if class exists
    course = Course.get_by_id(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404
    
    # Get all enrolled users via User_Course
    enrollments = User_Course.query.filter_by(courseID=class_id).all()
    members = []
    for enrollment in enrollments:
        user = User.get_by_id(enrollment.userID)
        if user:
            members.append({
                "id": user.id,
                "name": user.name,
                "email": user.email
            })
    
    return jsonify(members), 200


@bp.route("/create_class", methods=["POST"])
@jwt_teacher_required
def create_class():
    """Create a new class where the authenticated user is the teacher"""
    data = request.get_json()
    class_name = data.get("name")
    if not class_name:
        return jsonify({"msg": "Class name is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    existing_class = Course.get_by_name(class_name)
    if existing_class:
        return jsonify({"msg": "Class already exists"}), 400

    new_class = Course(teacherID=user.id, name=class_name)
    Course.create_course(new_class)

    # Notify admins and super-admins about the new course
    admins = User.query.filter(User.role.in_(["admin", "super_admin"])).all()
    if admins:
        Notification.create_bulk([
            {
                "userID": admin.id,
                "type": "course_created",
                "message": f"{user.name} created a new course '{class_name}'.",
                "reference_id": new_class.id,
                "reference_type": "course",
            }
            for admin in admins
        ])

    return jsonify({"msg": "Class created", "class": {"id": new_class.id}}), 201


@bp.route("/search", methods=["GET"])
@jwt_required()
def search_classes():
    """Search classes by name for the authenticated user"""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([]), 200

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Get user's courses based on role
    if user.is_teacher():
        user_courses = Course.get_courses_by_teacher(user.id)
    elif user.is_admin_or_above():
        user_courses = Course.get_all_courses()
    elif user.is_student():
        user_course_entries = User_Course.get_courses_by_student(user.id)
        user_courses = [Course.get_by_id(uc.courseID) for uc in user_course_entries]
    else:
        user_courses = []

    # Filter by search query (case-insensitive)
    lower_query = query.lower()
    results = [c for c in user_courses if c and lower_query in c.name.lower()]

    return jsonify([{"id": c.id, "name": c.name, "image_path": c.image_path} for c in results]), 200


@bp.route("/browse_classes", methods=["GET"])
@jwt_required()
def get_classes():
    """Retrieve all classes"""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    classes = Course.get_all_courses()
    return jsonify([{"id": c.id, "name": c.name, "image_path": c.image_path} for c in classes]), 200


@bp.route("/classes", methods=["GET"])
@jwt_required()
def get_user_classes():
    """Retrieve classes for the authenticated user (if user is a student look up User_Course, if teacher look up Course, else return empty)"""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.is_teacher():
        courses = Course.get_courses_by_teacher(user.id)
        return jsonify([{"id": c.id, "name": c.name, "image_path": c.image_path} for c in courses]), 200
    elif user.is_admin_or_above():
        courses = Course.get_all_courses()
        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "image_path": c.image_path,
                "teacherID": c.teacherID,
                "teacher_name": User.get_by_id(c.teacherID).name if c.teacherID and User.get_by_id(c.teacherID) else "Unknown",
            }
            for c in courses
        ]), 200
    elif user.is_student():
        user_courses = User_Course.get_courses_by_student(user.id)
        courses = [Course.get_by_id(uc.courseID) for uc in user_courses]
    else:
        courses = []

    return jsonify([{"id": c.id, "name": c.name, "image_path": c.image_path} for c in courses]), 200

@bp.route("/<int:course_id>", methods=["PUT"])
@jwt_teacher_required
def update_course(course_id):
    """Update a course's name (teacher who owns it only)."""
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if course.teacherID != user.id and not user.is_admin_or_above():
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.get_json()
    old_name = course.name
    if "name" in data and data["name"].strip():
        course.name = data["name"].strip()

    course.update()

    # Notify when name changes
    if course.name != old_name:
        enrollments = User_Course.query.filter_by(courseID=course.id).all()
        notifications = [
            {
                "userID": e.userID,
                "type": "course_updated",
                "message": f"Course '{old_name}' was renamed to '{course.name}' by {user.name}.",
                "reference_id": course.id,
                "reference_type": "course",
            }
            for e in enrollments
            if User.get_by_id(e.userID) and User.get_by_id(e.userID).is_student()
        ]
        if user.is_admin_or_above() and course.teacherID and course.teacherID != user.id:
            notifications.append({
                "userID": course.teacherID,
                "type": "course_updated",
                "message": f"Your course '{old_name}' was renamed to '{course.name}' by {user.name}.",
                "reference_id": course.id,
                "reference_type": "course",
            })
        # Notify admins/super-admins when the change is made by the teacher themselves
        if not user.is_admin_or_above():
            admins = User.query.filter(User.role.in_(["admin", "super_admin"])).all()
            for admin in admins:
                notifications.append({
                    "userID": admin.id,
                    "type": "course_updated",
                    "message": f"{user.name} renamed course '{old_name}' to '{course.name}'.",
                    "reference_id": course.id,
                    "reference_type": "course",
                })
        if notifications:
            Notification.create_bulk(notifications)

    return jsonify({"id": course.id, "name": course.name, "image_path": course.image_path}), 200


@bp.route("/<int:course_id>/image", methods=["POST"])
@jwt_teacher_required
def upload_course_image(course_id):
    """Upload or replace a course cover image."""
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if course.teacherID != user.id and not user.is_admin_or_above():
        return jsonify({"msg": "Unauthorized"}), 403

    if "image" not in request.files:
        return jsonify({"msg": "No image file provided"}), 400

    file = request.files["image"]
    if not file or not file.filename:
        return jsonify({"msg": "No file selected"}), 400

    if not _allowed_image(file.filename):
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        return jsonify({"msg": f"File type not allowed. Allowed: {allowed}"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = secure_filename(f"course_{course.id}.{ext}")

    images_dir = os.path.join(current_app.instance_path, "uploads", "courses")
    os.makedirs(images_dir, exist_ok=True)

    # Remove previous image if extension changed
    if course.image_path and course.image_path != filename:
        old_path = os.path.join(images_dir, course.image_path)
        if os.path.exists(old_path):
            os.remove(old_path)

    file.save(os.path.join(images_dir, filename))
    course.image_path = filename
    course.update()

    # Notify enrolled students and teacher about the image update
    enrollments = User_Course.query.filter_by(courseID=course.id).all()
    notifications = [
        {
            "userID": e.userID,
            "type": "course_updated",
            "message": f"The cover image for '{course.name}' was updated by {user.name}.",
            "reference_id": course.id,
            "reference_type": "course",
        }
        for e in enrollments
        if User.get_by_id(e.userID) and User.get_by_id(e.userID).is_student()
    ]
    if user.is_admin_or_above() and course.teacherID and course.teacherID != user.id:
        notifications.append({
            "userID": course.teacherID,
            "type": "course_updated",
            "message": f"The cover image for your course '{course.name}' was updated by {user.name}.",
            "reference_id": course.id,
            "reference_type": "course",
        })
    # Notify admins/super-admins: when teacher updates, or when admin updates their own course
    # (covers the edge case where admin is also the teacher with no enrolled students)
    notified_ids = {n["userID"] for n in notifications}
    admins = User.query.filter(User.role.in_(["admin", "super_admin"])).all()
    for admin in admins:
        if admin.id != user.id and admin.id not in notified_ids:
            notifications.append({
                "userID": admin.id,
                "type": "course_updated",
                "message": f"{user.name} updated the cover image for course '{course.name}'.",
                "reference_id": course.id,
                "reference_type": "course",
            })
    if notifications:
        Notification.create_bulk(notifications)

    return jsonify({"id": course.id, "name": course.name, "image_path": course.image_path}), 200


@bp.route("/<int:course_id>/image", methods=["GET"])
def get_course_image(course_id):
    """Serve the cover image for a course."""
    course = Course.get_by_id(course_id)
    if not course or not course.image_path:
        return jsonify({"msg": "No image found"}), 404

    images_dir = os.path.join(current_app.instance_path, "uploads", "courses")
    return send_from_directory(images_dir, course.image_path)


@bp.route("/<int:course_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_course(course_id):
    """Delete a course and all associated data (teacher who owns it only)."""
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if course.teacherID != user.id and not user.is_admin_or_above():
        return jsonify({"msg": "Unauthorized"}), 403

    course_name = course.name

    # Collect enrolled student IDs before deletion
    enrollments = User_Course.query.filter_by(courseID=course_id).all()
    student_ids = [
        e.userID for e in enrollments
        if User.get_by_id(e.userID) and User.get_by_id(e.userID).is_student()
    ]

    # If an admin/super_admin is deleting, also notify the course teacher
    notify_teacher = user.is_admin_or_above() and course.teacherID and course.teacherID != user.id
    teacher_id = course.teacherID

    course.delete()

    # Notify enrolled students
    if student_ids:
        Notification.create_bulk([
            {
                "userID": uid,
                "type": "course_deleted",
                "message": f"Your course '{course_name}' has been removed.",
                "reference_id": None,
                "reference_type": "course",
            }
            for uid in student_ids
        ])

    # Notify the teacher if deleted by admin/super_admin
    if notify_teacher:
        Notification.create(
            userID=teacher_id,
            type="course_deleted",
            message=f"Your course '{course_name}' was removed by an administrator.",
            reference_id=None,
            reference_type="course",
        )

    return jsonify({"msg": "Course deleted"}), 200


REQUIRED_HEADERS = {"id", "name", "email"}
def csv_to_list(csv_text):
    """Convert CSV text to a list of emails"""
    rows: List[Dict[str, str]] = []
    errors: List[str] = []
    if not csv_text or not csv_text.strip():
        return rows, ["CSV text empty"]
    
    stream = io.StringIO(csv_text.strip())
    try:
        reader = csv.DictReader(stream)
    except Exception as e:
        return rows, [f"Failed to read CSV: {e}"]
    
    headers = {h.strip() for h in reader.fieldnames or []}
    missing = REQUIRED_HEADERS - headers
    if missing:
        errors.append(f"Missing required headers: {', '.join(sorted(missing))}")
        return rows, errors
    
    for line_num, row in enumerate(reader, start=2):
        if row is None:
            continue
        normalized = {k.strip(): (v.strip() if isinstance(v, str) else "") for k, v in row.items()}
        if not any(normalized.values()):
            continue

        if any(not normalized[field] for field in REQUIRED_HEADERS):
            errors.append(f"Line {line_num}: Missing required fields")
            continue

        rows.append({
            "id": normalized["id"],
            "name": normalized["name"],
            "email": normalized["email"]
        })
    return rows, errors

@bp.route("/enroll_students", methods=["POST"])
@jwt_teacher_required
def enroll_students():
    """
    Enroll students into a class by class ID and list of student emails from a csv file.
    -    If a student is already enrolled, skip them.
    -    If a student email does not exist, create it with a default password and enroll them.
    -    The list of student emails is passed in the request body as a CSV file.
    """

    data = request.get_json()
    class_id = data.get("class_id")
    student_emails_csv = data.get("students", "")

    if not class_id or not student_emails_csv:
        return jsonify({"msg": "Class ID and student emails are required"}), 400

    course = Course.get_by_id(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404
    
    # check if the authenticated user is the teacher of the class
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if course.teacherID != user.id:
        return jsonify({"msg": "You are not authorized to enroll students in this class"}), 403

    students, parse_errors = csv_to_list(student_emails_csv)
    if parse_errors:
        return jsonify({"msg": "Errors in CSV", "errors": parse_errors}), 400

    enrolled_students = []
    for student_info in students:
        email = student_info["email"]
        # validate email format with regex
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"msg": f"Invalid email format: {email}"}), 400
        
        name = student_info["name"]
        student = User.get_by_email(email)
        if not student:
            # Create new student with default password
            # TODO: Create random password and email it to the student
            # Current implementation sets the password to "password123"
            student = User(name=name, email=email, hash_pass=generate_password_hash("password123"), role="student")
            try:
                User.create_user(student)
            except Exception as e:
                return jsonify({"msg": f"Error creating user {email}: {str(e)}"}), 500

        # Check if already enrolled
        enrollment = User_Course.get(student.id, class_id)
        if not enrollment:
            # Enroll student
            User_Course.add(student.id, class_id)
            enrolled_students.append(student.id)

    # Notify newly enrolled students
    if enrolled_students:
        Notification.create_bulk([
            {
                "userID": uid,
                "type": "course_enrolled",
                "message": f"You have been enrolled in '{course.name}' by {user.name}.",
                "reference_id": course.id,
                "reference_type": "course",
            }
            for uid in enrolled_students
        ])

    return jsonify({"msg": f"{len(enrolled_students)} students added to course {course.name}"}), 200
