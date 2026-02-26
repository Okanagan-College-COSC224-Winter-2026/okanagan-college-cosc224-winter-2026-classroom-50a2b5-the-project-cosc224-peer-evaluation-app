"""
Student controller for the peer evaluation app.
Provides endpoints for student-specific data like grades.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from api.models import User, User_Course, Assignment, Review, Criterion, CriteriaDescription, Rubric

student_bp = Blueprint("student", __name__, url_prefix="/student")


def get_student_grades(student_id):
    """
    For each course the student is enrolled in:
    - Get all assignments
    - Get all reviews where revieweeID = student_id
    - Get all criterion scores from those reviews
    - Calculate averages
    Returns list of course grade dictionaries
    """
    enrollments = User_Course.get_courses_by_student(student_id)
    courses = []

    for enrollment in enrollments:
        course = enrollment.course
        assignments = Assignment.get_by_class_id(course.id)
        total_assignments = len(assignments)
        graded_assignments = 0
        assignment_averages = []
        max_scores = []

        for assignment in assignments:
            reviews = Review.query.filter_by(
                assignmentID=assignment.id, revieweeID=student_id
            ).all()

            criterion_grades = []
            for review in reviews:
                criteria = Criterion.query.filter_by(reviewID=review.id).all()
                for c in criteria:
                    if c.grade is not None:
                        criterion_grades.append(c.grade)
                        if c.criterion_row and c.criterion_row.scoreMax is not None:
                            max_scores.append(c.criterion_row.scoreMax)

            if criterion_grades:
                graded_assignments += 1
                assignment_avg = sum(criterion_grades) / len(criterion_grades)
                assignment_averages.append(assignment_avg)

        if graded_assignments > 0:
            grade = round(sum(assignment_averages) / len(assignment_averages), 1)
            max_score = max(max_scores) if max_scores else None
            has_grades = True
        else:
            grade = None
            max_score = None
            has_grades = False

        courses.append(
            {
                "course_id": course.id,
                "course_name": course.name,
                "grade": grade,
                "max_score": max_score,
                "graded_assignments": graded_assignments,
                "total_assignments": total_assignments,
                "has_grades": has_grades,
            }
        )

    return courses


@student_bp.route("/grades", methods=["GET"])
@jwt_required()
def grades():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if user is None:
        return jsonify({"msg": "User not found"}), 404

    courses = get_student_grades(user.id)

    return jsonify({"student_id": user.id, "courses": courses}), 200


@student_bp.route("/assignments/<int:assignment_id>/feedback", methods=["GET"])
@jwt_required()
def feedback(assignment_id):
    """Get anonymous aggregated feedback for the current student on an assignment.
    Reviewer identities are never exposed."""
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if user is None:
        return jsonify({"msg": "User not found"}), 404

    # Verify assignment exists
    assignment = Assignment.get_by_id(assignment_id)
    if assignment is None:
        return jsonify({"msg": "Assignment not found"}), 404

    # Verify student is enrolled in the assignment's course
    enrollment = User_Course.get(user.id, assignment.courseID)
    if enrollment is None:
        return jsonify({"msg": "Student not enrolled in this course"}), 403

    # Get all reviews where this student is the reviewee
    reviews = Review.get_reviews_for_student(assignment_id, user.id)

    if len(reviews) == 0:
        return jsonify({
            "assignment_name": assignment.name,
            "total_reviews": 0,
            "criteria_feedback": [],
            "overall_avg": 0.0,
        }), 200

    # Aggregate scores and comments per criteria description
    # Key: criterionRowID -> { scores: [], comments: [], question: str, max_score: int }
    criteria_map = {}

    for review in reviews:
        criteria = Criterion.get_criteria_by_review(review.id)
        for c in criteria:
            row_id = c.criterionRowID
            if row_id not in criteria_map:
                desc = CriteriaDescription.get_by_id(row_id)
                criteria_map[row_id] = {
                    "question": desc.question if desc else "Unknown",
                    "max_score": desc.scoreMax if desc else 0,
                    "scores": [],
                    "comments": [],
                }
            if c.grade is not None:
                criteria_map[row_id]["scores"].append(c.grade)
            if c.comments and c.comments.strip():
                criteria_map[row_id]["comments"].append(c.comments)

    # Build response — no reviewer identity included
    criteria_feedback = []
    all_avgs = []

    for data in criteria_map.values():
        avg_score = (
            round(sum(data["scores"]) / len(data["scores"]), 2)
            if data["scores"]
            else 0.0
        )
        all_avgs.append(avg_score)
        criteria_feedback.append({
            "question": data["question"],
            "avg_score": avg_score,
            "max_score": data["max_score"],
            "comments": data["comments"],
        })

    overall_avg = (
        round(sum(all_avgs) / len(all_avgs), 2)
        if all_avgs
        else 0.0
    )

    return jsonify({
        "assignment_name": assignment.name,
        "total_reviews": len(reviews),
        "criteria_feedback": criteria_feedback,
        "overall_avg": overall_avg,
    }), 200