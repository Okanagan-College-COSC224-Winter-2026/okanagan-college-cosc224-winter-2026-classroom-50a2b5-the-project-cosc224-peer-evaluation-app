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

def get_assignment_feedback(assignment_id, student_id):
    """
    For a given assignment, aggregate all peer review feedback
    received by the student (revieweeID = student_id).
    Returns per-criterion averages and anonymous comments.
    Reviewer identities are never exposed.
    """
    reviews = Review.query.filter_by(
        assignmentID=assignment_id, revieweeID=student_id
    ).all()

    if not reviews:
        return None

    criteria_map = {}

    for review in reviews:
        criteria = Criterion.query.filter_by(reviewID=review.id).all()
        for c in criteria:
            desc = c.criterion_row
            if desc is None:
                continue
            crit_id = desc.id
            if crit_id not in criteria_map:
                criteria_map[crit_id] = {
                    "criterion_id": crit_id,
                    "criterion_name": desc.name if hasattr(desc, "name") else f"Criterion {crit_id}",
                    "score_max": desc.scoreMax,
                    "scores": [],
                    "comments": [],
                }
            if c.grade is not None:
                criteria_map[crit_id]["scores"].append(c.grade)
            if c.comments:
                criteria_map[crit_id]["comments"].append(c.comments)

    aggregated = []
    for crit_id, data in criteria_map.items():
        scores = data["scores"]
        avg_score = round(sum(scores) / len(scores), 2) if scores else None
        aggregated.append(
            {
                "criterion_id": crit_id,
                "criterion_name": data["criterion_name"],
                "average_score": avg_score,
                "score_max": data["score_max"],
                "review_count": len(scores),
                "comments": data["comments"],
            }
        )

    return {
        "assignment_id": assignment_id,
        "student_id": student_id,
        "total_reviews_received": len(reviews),
        "criteria": aggregated,
    }


@student_bp.route("/assignments/<int:assignment_id>/feedback", methods=["GET"])
@jwt_required()
def assignment_feedback(assignment_id):
    """
    GET /student/assignments/<assignment_id>/feedback
    Returns aggregated anonymous feedback for the logged-in student
    for the given assignment.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if user is None:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(assignment_id)
    if assignment is None:
        return jsonify({"msg": "Assignment not found"}), 404

    feedback = get_assignment_feedback(assignment_id, user.id)

    if feedback is None:
        return jsonify(
            {
                "assignment_id": assignment_id,
                "student_id": user.id,
                "total_reviews_received": 0,
                "criteria": [],
            }
        ), 200

    return jsonify(feedback), 200
