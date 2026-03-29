"""
Enrollment request controller.

Endpoints:
  POST   /enrollment-request/                    — Student requests enrollment
  GET    /enrollment-request/course/<id>          — List pending requests for a course (teacher)
  GET    /enrollment-request/my                   — List current student's requests
  POST   /enrollment-request/<id>/approve         — Approve a request (teacher)
  POST   /enrollment-request/<id>/reject          — Reject a request (teacher)
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Course, EnrollmentRequest, EnrollmentRequestSchema, Notification, User, User_Course
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("enrollment_request", __name__, url_prefix="/enrollment-request")

request_schema = EnrollmentRequestSchema()
requests_schema = EnrollmentRequestSchema(many=True)


@bp.route("/", methods=["POST"])
@jwt_required()
def create_request():
    """Student requests enrollment in a course.

    Request body: { "courseID": int }
    """
    data = request.get_json()
    course_id = data.get("courseID")

    if not course_id:
        return jsonify({"msg": "courseID is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    if not user.is_student():
        return jsonify({"msg": "Only students can request enrollment"}), 403

    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    # Check if already enrolled
    if User_Course.get(user.id, course_id):
        return jsonify({"msg": "You are already enrolled in this course"}), 409

    # Check for existing pending request
    if EnrollmentRequest.has_pending(user.id, course_id):
        return jsonify({"msg": "You already have a pending request for this course"}), 409

    enrollment_request = EnrollmentRequest(studentID=user.id, courseID=course_id)
    db.session.add(enrollment_request)
    db.session.commit()

    # Notify the course teacher
    Notification.create(
        userID=course.teacherID,
        type="enrollment_request",
        message=f"{user.display_name} requested to join '{course.name}'.",
        reference_id=enrollment_request.id,
        reference_type="enrollment_request",
    )

    return jsonify({"msg": "Enrollment request submitted", "id": enrollment_request.id}), 201


@bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_teacher_required
def get_pending_requests(course_id):
    """Get all pending enrollment requests for a course (teacher/admin only)."""
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    requests_list = EnrollmentRequest.get_pending_for_course(course_id)
    return jsonify(requests_schema.dump(requests_list)), 200


@bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_requests():
    """Get all enrollment requests for the current student."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    my_requests = EnrollmentRequest.query.filter_by(studentID=user.id).order_by(
        EnrollmentRequest.created_at.desc()
    ).all()
    return jsonify(requests_schema.dump(my_requests)), 200


@bp.route("/<int:request_id>/approve", methods=["POST"])
@jwt_teacher_required
def approve_request(request_id):
    """Approve an enrollment request (teacher/admin only)."""
    enrollment_request = EnrollmentRequest.get_by_id(request_id)
    if not enrollment_request:
        return jsonify({"msg": "Request not found"}), 404

    if enrollment_request.status != "pending":
        return jsonify({"msg": f"Request is already {enrollment_request.status}"}), 400

    # Verify teacher owns the course
    email = get_jwt_identity()
    user = User.get_by_email(email)
    course = Course.get_by_id(enrollment_request.courseID)
    if not user.is_admin() and course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    # Approve and enroll
    enrollment_request.status = "approved"
    enrollment_request.resolved_at = datetime.now(timezone.utc)

    # Enroll the student if not already enrolled
    if not User_Course.get(enrollment_request.studentID, enrollment_request.courseID):
        User_Course.add(enrollment_request.studentID, enrollment_request.courseID)

    db.session.commit()

    # Notify the student
    Notification.create(
        userID=enrollment_request.studentID,
        type="enrollment_approved",
        message=f"Your enrollment request for '{course.name}' has been approved!",
        reference_id=enrollment_request.courseID,
        reference_type="course",
    )

    return jsonify({"msg": "Request approved, student enrolled"}), 200


@bp.route("/<int:request_id>/reject", methods=["POST"])
@jwt_teacher_required
def reject_request(request_id):
    """Reject an enrollment request (teacher/admin only)."""
    enrollment_request = EnrollmentRequest.get_by_id(request_id)
    if not enrollment_request:
        return jsonify({"msg": "Request not found"}), 404

    if enrollment_request.status != "pending":
        return jsonify({"msg": f"Request is already {enrollment_request.status}"}), 400

    # Verify teacher owns the course
    email = get_jwt_identity()
    user = User.get_by_email(email)
    course = Course.get_by_id(enrollment_request.courseID)
    if not user.is_admin() and course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    enrollment_request.status = "rejected"
    enrollment_request.resolved_at = datetime.now(timezone.utc)
    db.session.commit()

    # Notify the student
    Notification.create(
        userID=enrollment_request.studentID,
        type="enrollment_rejected",
        message=f"Your enrollment request for '{course.name}' has been rejected.",
        reference_id=enrollment_request.courseID,
        reference_type="course",
    )

    return jsonify({"msg": "Request rejected"}), 200
