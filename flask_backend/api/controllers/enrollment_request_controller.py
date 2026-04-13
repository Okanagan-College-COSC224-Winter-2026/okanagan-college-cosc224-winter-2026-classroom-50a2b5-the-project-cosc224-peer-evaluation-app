"""
Enrollment request controller.

Endpoints:
  POST   /enrollment-request/                    — Student requests enrollment
  GET    /enrollment-request/course/<id>          — List pending requests for a course (teacher)
  GET    /enrollment-request/my                   — List current student's requests
  POST   /enrollment-request/<id>/approve         — Approve a request (teacher)
  POST   /enrollment-request/<id>/reject          — Reject a request (teacher)
  POST   /enrollment-request/<id>/block           — Reject + block the student (teacher)
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import BlockedStudent, Course, EnrollmentRequest, EnrollmentRequestSchema, Notification, User, User_Course
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("enrollment_request", __name__, url_prefix="/enrollment-request")

request_schema = EnrollmentRequestSchema()
requests_schema = EnrollmentRequestSchema(many=True)


@bp.route("/", methods=["POST"])
@jwt_required()
def create_request():
    """Enrollment requests by students have been disabled."""
    return jsonify({"msg": "Enrollment requests are not available. Contact your teacher to be added to a course."}), 403


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
    """Get all enrollment requests for the current student.

    Also includes a synthetic 'blocked' entry for any course whose teacher
    has blocked this student, so the frontend can show the correct state
    even when there is no active enrollment request row.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    my_requests = EnrollmentRequest.query.filter_by(studentID=user.id).order_by(
        EnrollmentRequest.created_at.desc()
    ).all()

    result = requests_schema.dump(my_requests)

    # Add blocked entries for courses where the student has no active request
    # but is blocked by the teacher.
    seen_course_ids = {r["courseID"] for r in result}
    blocks = BlockedStudent.query.filter_by(studentID=user.id).all()
    for block in blocks:
        # Find all courses taught by this teacher
        teacher_courses = Course.query.filter_by(teacherID=block.teacherID).all()
        for course in teacher_courses:
            if course.id not in seen_course_ids:
                result.append({
                    "id": None,
                    "studentID": user.id,
                    "courseID": course.id,
                    "status": "blocked",
                    "created_at": None,
                    "resolved_at": None,
                })
                seen_course_ids.add(course.id)

    return jsonify(result), 200


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
    if not user.is_admin_or_above() and course.teacherID != user.id:
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
    if not user.is_admin_or_above() and course.teacherID != user.id:
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


@bp.route("/<int:request_id>/block", methods=["POST"])
@jwt_teacher_required
def block_student(request_id):
    """Reject an enrollment request AND add the student to the teacher's block list.

    Optional body: { "reason": str }
    Blocked students cannot send future enrollment requests to any of the teacher's courses.
    """
    enrollment_request = EnrollmentRequest.get_by_id(request_id)
    if not enrollment_request:
        return jsonify({"msg": "Request not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    course = Course.get_by_id(enrollment_request.courseID)
    if not user.is_admin_or_above() and course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    # Resolve the pending request. Delete it instead of updating to avoid
    # a unique constraint violation when a rejected row already exists for
    # the same (studentID, courseID) pair.
    if enrollment_request.status == "pending":
        db.session.delete(enrollment_request)
        db.session.flush()

    # Block the student (ignore if already blocked)
    data = request.get_json(silent=True) or {}
    reason = data.get("reason")

    existing = BlockedStudent.get_block(user.id, enrollment_request.studentID)
    if not existing:
        block = BlockedStudent(
            teacherID=user.id,
            studentID=enrollment_request.studentID,
            reason=reason,
        )
        db.session.add(block)

    db.session.commit()

    # Notify the student with a specific blocked message
    Notification.create(
        userID=enrollment_request.studentID,
        type="enrollment_blocked",
        message=f"You have been blocked from requesting enrollment in '{course.name}'. Contact your instructor if you believe this is a mistake.",
        reference_id=enrollment_request.courseID,
        reference_type="course",
    )

    return jsonify({"msg": "Student blocked and request rejected"}), 200
