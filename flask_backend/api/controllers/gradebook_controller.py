"""
Gradebook controller — teacher-facing grade overview and override management.

Endpoints:
  GET    /gradebook/course/<id>            — full gradebook (all students, all assignments)
  PUT    /gradebook/course/<id>/override   — set/update a grade override
  DELETE /gradebook/course/<id>/override   — clear a grade override
  GET    /gradebook/course/<id>/reviews    — reviews for a specific student+assignment
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..models import (
    Assignment,
    Course,
    Criterion,
    CriterionSchema,
    GradeOverride,
    Review,
    ReviewSchema,
    User,
    User_Course,
    db,
)
from ..services.grade_service import compute_course_summary
from ..services.group_service import get_user_group_in_course
from .auth_controller import jwt_teacher_required

bp = Blueprint("gradebook", __name__, url_prefix="/gradebook")


@bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_teacher_required
def get_gradebook(course_id):
    """Return full gradebook data for a course."""
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    assignments = Assignment.query.filter_by(courseID=course_id).all()
    enrollments = User_Course.query.filter_by(courseID=course_id).all()
    students = [User.get_by_id(e.userID) for e in enrollments]
    students = [s for s in students if s and s.is_student()]

    # Batch-fetch all overrides for this course
    overrides = GradeOverride.query.filter_by(courseID=course_id).all()
    override_map = {(o.studentID, o.assignmentID): o.override_score for o in overrides}

    teacher = User.get_by_email(get_jwt_identity())

    student_rows = []
    for student in students:
        summary = compute_course_summary(teacher, course_id, assignments, target_student_id=student.id)

        grades = {}
        course_earned = 0.0
        course_max = 0.0

        for a_summary in summary["assignments"]:
            a_id = a_summary["id"]
            ind_avg = a_summary["individualAverage"]
            ind_max = a_summary["individualMax"]
            grp_avg = a_summary["groupAverage"]
            grp_max = a_summary["groupMax"]

            # Compute peer total (individual + group)
            peer_total = 0.0
            peer_max_total = 0.0
            if ind_avg is not None:
                peer_total += ind_avg
            if ind_max is not None:
                peer_max_total += ind_max
            if grp_avg is not None:
                peer_total += grp_avg
            if grp_max is not None:
                peer_max_total += grp_max

            override_score = override_map.get((student.id, a_id))

            if override_score is not None:
                effective = override_score
            elif peer_total > 0:
                effective = peer_total
            else:
                effective = None

            effective_max = peer_max_total if peer_max_total > 0 else None

            grades[str(a_id)] = {
                "individualAverage": ind_avg,
                "individualMax": ind_max,
                "groupAverage": grp_avg,
                "groupMax": grp_max,
                "overrideScore": override_score,
                "effectiveGrade": effective,
                "effectiveMax": effective_max,
            }

            if effective is not None:
                course_earned += effective
            if effective_max is not None:
                course_max += effective_max

        student_rows.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "grades": grades,
            "courseTotal": {
                "earned": round(course_earned, 2) if course_earned else 0,
                "max": round(course_max, 2) if course_max else 0,
            },
        })

    return jsonify({
        "assignments": [{"id": a.id, "name": a.name} for a in assignments],
        "students": student_rows,
    }), 200


@bp.route("/course/<int:course_id>/override", methods=["PUT"])
@jwt_teacher_required
def set_override(course_id):
    """Create or update a grade override for a student+assignment."""
    data = request.get_json()
    student_id = data.get("studentID")
    assignment_id = data.get("assignmentID")
    override_score = data.get("overrideScore")

    if student_id is None or assignment_id is None or override_score is None:
        return jsonify({"msg": "studentID, assignmentID, and overrideScore are required"}), 400

    # Validate student is enrolled
    enrollment = User_Course.get(student_id, course_id)
    if not enrollment:
        return jsonify({"msg": "Student not enrolled in this course"}), 404

    # Validate assignment belongs to course
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment or assignment.courseID != course_id:
        return jsonify({"msg": "Assignment not found in this course"}), 404

    teacher = User.get_by_email(get_jwt_identity())

    override = GradeOverride.query.filter_by(
        studentID=student_id, assignmentID=assignment_id, courseID=course_id
    ).first()

    if override:
        override.override_score = override_score
    else:
        override = GradeOverride(
            studentID=student_id,
            assignmentID=assignment_id,
            courseID=course_id,
            override_score=override_score,
            teacherID=teacher.id,
        )
        db.session.add(override)

    db.session.commit()
    return jsonify({"msg": "Override saved", "overrideScore": override.override_score}), 200


@bp.route("/course/<int:course_id>/override", methods=["DELETE"])
@jwt_teacher_required
def clear_override(course_id):
    """Remove a grade override for a student+assignment."""
    data = request.get_json()
    student_id = data.get("studentID")
    assignment_id = data.get("assignmentID")

    override = GradeOverride.query.filter_by(
        studentID=student_id, assignmentID=assignment_id, courseID=course_id
    ).first()

    if not override:
        return jsonify({"msg": "No override found"}), 404

    db.session.delete(override)
    db.session.commit()
    return jsonify({"msg": "Override cleared"}), 200


@bp.route("/course/<int:course_id>/reviews", methods=["GET"])
@jwt_teacher_required
def get_student_reviews(course_id):
    """Return all reviews (individual + group) for a student on an assignment."""
    student_id = request.args.get("studentID", type=int)
    assignment_id = request.args.get("assignmentID", type=int)

    if not student_id or not assignment_id:
        return jsonify({"msg": "studentID and assignmentID are required"}), 400

    # Individual reviews where this student is the reviewee
    ind_reviews = Review.query.filter_by(
        assignmentID=assignment_id, revieweeID=student_id, review_type="individual"
    ).all()

    # Group reviews where the student's group is the reviewee
    group = get_user_group_in_course(student_id, course_id)
    if group:
        grp_reviews = Review.query.filter_by(
            assignmentID=assignment_id, revieweeID=group.id, review_type="group"
        ).all()
    else:
        grp_reviews = []

    def serialize_reviews(reviews):
        results = []
        for review in reviews:
            dumped = ReviewSchema().dump(review)
            criteria = Criterion.query.filter_by(reviewID=review.id).all()
            dumped["criteria"] = CriterionSchema(many=True).dump(criteria)
            results.append(dumped)
        return results

    return jsonify({
        "individualReviews": serialize_reviews(ind_reviews),
        "groupReviews": serialize_reviews(grp_reviews),
    }), 200
