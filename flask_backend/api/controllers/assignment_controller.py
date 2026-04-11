from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Course, Assignment, Notification, User, AssignmentSchema, User_Course
from ..models.db import db
from ..models.criterion_model import Criterion
from ..models.review_model import Review
from ..models.rubric_model import Rubric
from ..models.criteria_description_model import CriteriaDescription
from .auth_controller import jwt_teacher_required

bp = Blueprint("assignment", __name__, url_prefix="/assignment")


def _coerce_optional_bool(value, field_name):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "y", "on"}:
            return True
        if normalized in {"false", "0", "no", "n", "off"}:
            return False
    if isinstance(value, int) and value in {0, 1}:
        return bool(value)
    raise ValueError(f"Invalid boolean format for {field_name}.")


def _can_access_course_assignments(user, course):
    if user.is_admin_or_above():
        return True
    if course.teacherID == user.id:
        return True
    if user.is_student() and User_Course.get(user.id, course.id):
        return True
    return False

@bp.route("/create_assignment", methods=["POST"])
@jwt_teacher_required
def create_assignment():
    """Create a new assignment for a class where the authenticated user is the teacher"""
    data = request.get_json()
    course_id = data.get("courseID")
    assignment_name = data.get("name")
    description = data.get("description")
    start_date = data.get("start_date")
    rubric_text = data.get("rubric")
    due_date = data.get("due_date")
    is_anonymous = data.get("is_anonymous", True)

    try:
        if start_date:
            start_date = datetime.fromisoformat(start_date)
        else:
            start_date = None

        if not due_date:
            due_date = None
        else:
            due_date = datetime.fromisoformat(due_date)
        is_anonymous = _coerce_optional_bool(is_anonymous, "is_anonymous")
        if is_anonymous is None:
            is_anonymous = True
    except ValueError:
        return jsonify({"msg": "Invalid format. Use ISO format for start_date/due_date and boolean for is_anonymous."}), 400

    if not course_id:
        return jsonify({"msg": "Course ID is required"}), 400
    if not assignment_name:
        return jsonify({"msg": "Assignment name is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404
    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    new_assignment = Assignment(
        courseID=course_id,
        name=assignment_name,
        description=description,
        start_date=start_date,
        rubric_text=rubric_text,
        due_date=due_date,
        is_anonymous=is_anonymous,
    )
    Assignment.create(new_assignment)

    # Notify enrolled students about the new assignment
    enrollments = User_Course.query.filter_by(courseID=course_id).all()
    if enrollments:
        notif_data = [
            {
                "userID": e.userID,
                "type": "assignment_published",
                "message": f"New assignment '{assignment_name}' published in {course.name}.",
                "reference_id": new_assignment.id,
                "reference_type": "assignment",
            }
            for e in enrollments
        ]
        Notification.create_bulk(notif_data)

    return (
        jsonify(
            {
                "msg": "Assignment created",
                "assignment": AssignmentSchema().dump(new_assignment),
            }
        ),
        201,
    )

@bp.route("/edit_assignment/<int:assignment_id>", methods=["PATCH"])
@jwt_teacher_required
def edit_assignment(assignment_id):
    """Edit an existing assignment if the authenticated user is the teacher of the class"""
    data = request.get_json()
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if course is None:
        return jsonify({"msg": "Course not found"}), 404
    
    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    assignment.name = data.get("name", assignment.name)
    assignment.description = data.get("description", assignment.description)
    assignment.rubric_text = data.get("rubric", assignment.rubric_text)

    try:
        start_date = data.get("start_date")
        if start_date:
            assignment.start_date = datetime.fromisoformat(start_date)

        due_date = data.get("due_date")
        if due_date:
            assignment.due_date = datetime.fromisoformat(due_date)

        if "is_anonymous" in data:
            assignment.is_anonymous = _coerce_optional_bool(data.get("is_anonymous"), "is_anonymous")
    except ValueError:
        return jsonify({"msg": "Invalid format. Use ISO format for start_date/due_date and boolean for is_anonymous."}), 400

    assignment.update()
    return (
        jsonify(
            {
                "msg": "Assignment updated",
                "assignment": AssignmentSchema().dump(assignment),
            }
        ),
        200,
    )
@bp.route("/delete_assignment/<int:assignment_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_assignment(assignment_id):
    """Delete an existing assignment if the authenticated user is the teacher of the class"""
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    try:
        # Criterion has FKs to both Review and CriteriaDescription.
        # Delete all Criterion rows for this assignment first to avoid
        # FK constraint conflicts during cascade.
        review_ids = [r.id for r in assignment.reviews.all()]
        if review_ids:
            Criterion.query.filter(Criterion.reviewID.in_(review_ids)).delete(
                synchronize_session="fetch"
            )

        db.session.delete(assignment)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to delete assignment: {str(e)}"}), 500

    return jsonify({"msg": "Assignment deleted"}), 200


@bp.route("/detail/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):
    """Get a single assignment by ID"""
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    if not _can_access_course_assignments(user, course):
        return jsonify({"msg": "Unauthorized: You do not have access to this class"}), 403

    return jsonify(AssignmentSchema().dump(assignment)), 200
    

# the following routes are for getting the assignments for a given course
@bp.route("/<int:class_id>", methods=["GET"])
@jwt_required()
def get_assignments(class_id):
    """Get all assignments for a given class"""
    course = Course.get_by_id(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not _can_access_course_assignments(user, course):
        return jsonify({"msg": "Unauthorized: You do not have access to this class"}), 403

    assignments = Assignment.get_by_class_id(class_id)
    assignments_data = AssignmentSchema(many=True).dump(assignments)
    return jsonify(assignments_data), 200