from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Course, Assignment, User, AssignmentSchema, Review, Criterion
from ..models.rubric_model import Rubric
from ..models.criteria_description_model import CriteriaDescription
from .auth_controller import jwt_teacher_required
bp = Blueprint("assignment", __name__, url_prefix="/assignment")


@bp.route("/create_assignment", methods=["POST"])
@jwt_teacher_required
def create_assignment():
    """Create a new assignment for a class where the authenticated user is the teacher"""
    data = request.get_json()
    course_id = data.get("courseID")
    assignment_name = data.get("name")
    rubric_text = data.get("rubric")
    due_date = data.get("due_date")
    if not due_date:
        due_date = None
    else:
        due_date = datetime.fromisoformat(due_date)

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
        courseID=course_id, name=assignment_name, rubric_text=rubric_text, due_date=due_date
    )
    Assignment.create(new_assignment)
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
    """Edit an existing assignment if the authenticated user is the teacher of the class and the due date has not passed"""
    data = request.get_json()
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Assignment cannot be modified after its due date"}), 400

    assignment.name = data.get("name", assignment.name)
    assignment.rubric_text = data.get("rubric", assignment.rubric_text)
    assignment.description_html = data.get("description_html", assignment.description_html)
    due_date = data.get("due_date")
    if due_date:
        assignment.due_date = datetime.fromisoformat(due_date)

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
    """Delete an existing assignment if the authenticated user is the teacher of the class and the due date has not passed"""
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Assignment cannot be deleted after its due date"}), 400

    assignment.delete()
    return jsonify({"msg": "Assignment deleted"}), 200


# ============================================================
# US1/US11 — RUBRIC DATA ENDPOINT
# GET /assignment/<assignment_id>/rubric
# ============================================================

@bp.route("/<int:assignment_id>/rubric", methods=["GET"])
@jwt_required()
def get_assignment_rubric(assignment_id: int):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    rubric = Rubric.get_rubric_by_assignment(assignment_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    criteria_rows = CriteriaDescription.get_criteria_by_rubric(rubric.id)

    return (
        jsonify(
            {
                "rubric_id": rubric.id,
                "assignment_id": assignment_id,
                "criteria": [
                    {
                        "id": row.id,
                        "question": row.question,
                        "score_max": row.scoreMax,
                        "has_score": row.hasScore,
                        "can_comment": rubric.canComment,
                    }
                    for row in criteria_rows
                ],
            }
        ),
        200,
    )


# the following routes are for getting the assignments for a given course
@bp.route("/<int:class_id>", methods=["GET"])
@jwt_required()
def get_assignments(class_id):
    """Get all assignments for a given class"""
    course = Course.get_by_id(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    assignments = Assignment.get_by_class_id(class_id)
    assignments_data = AssignmentSchema(many=True).dump(assignments)
    return jsonify(assignments_data), 200


@bp.route("/detail/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):
    """Get a single assignment by ID (used to resolve courseID)"""
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404
    return jsonify(AssignmentSchema().dump(assignment)), 200


# ============================================================
# RUBRIC CREATION — POST /assignment/<assignment_id>/rubric
# ============================================================

@bp.route("/<int:assignment_id>/rubric", methods=["POST"])
@jwt_teacher_required
def create_rubric(assignment_id):
    """
    POST /assignment/<assignment_id>/rubric
    Create a rubric for an assignment (teacher only).
    Replaces any existing rubric for the same assignment.

    Request body: { "canComment": bool }
    Response: { "id": int, "assignment_id": int, "can_comment": bool }
    """
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    data = request.get_json() or {}
    can_comment = data.get("canComment", True)

    # If a rubric already exists for this assignment, delete it and start fresh
    existing = Rubric.get_rubric_by_assignment(assignment_id)
    if existing:
        existing.delete()

    rubric = Rubric(assignmentID=assignment_id, canComment=can_comment)
    Rubric.create_rubric(rubric)

    return jsonify({"id": rubric.id, "assignment_id": assignment_id, "can_comment": rubric.canComment}), 201


# ============================================================
# CRITERIA CREATION — POST /assignment/rubric/<rubric_id>/criteria
# ============================================================

@bp.route("/rubric/<int:rubric_id>/criteria", methods=["POST"])
@jwt_teacher_required
def create_criteria(rubric_id):
    """
    POST /assignment/rubric/<rubric_id>/criteria
    Add a criterion to a rubric (teacher only).

    Request body: { "question": str, "scoreMax": int, "hasScore": bool }
    Response: { "id": int, "rubric_id": int, "question": str, "score_max": int, "has_score": bool }
    """
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    data = request.get_json() or {}
    question = data.get("question", "")
    score_max = data.get("scoreMax", 0)
    has_score = data.get("hasScore", True)

    cd = CriteriaDescription(
        rubricID=rubric_id,
        question=question,
        scoreMax=score_max,
        hasScore=has_score,
    )
    CriteriaDescription.create_criteria_description(cd)

    return jsonify({
        "id": cd.id,
        "rubric_id": rubric_id,
        "question": cd.question,
        "score_max": cd.scoreMax,
        "has_score": cd.hasScore,
    }), 201

# ============================================================
# GET /assignment/rubric/by-id?rubricID=<id>
# Get a rubric by its own ID (used by RubricCreator)
# ============================================================
@bp.route("/rubric/by-id", methods=["GET"])
@jwt_required()
def get_rubric_by_id():
    """Get a rubric by its ID."""
    rubric_id = request.args.get("rubricID", type=int)
    if not rubric_id:
        return jsonify({"msg": "rubricID is required"}), 400
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404
    return jsonify({
        "id": rubric.id,
        "assignmentID": rubric.assignmentID,
        "canComment": rubric.canComment,
    }), 200


# ============================================================
# GET /assignment/criteria?rubricID=<id>
# Get all criteria descriptions for a rubric (used by RubricCreator)
# ============================================================
@bp.route("/criteria", methods=["GET"])
@jwt_required()
def get_criteria_by_rubric():
    """Get all criteria descriptions for a rubric."""
    rubric_id = request.args.get("rubricID", type=int)
    if not rubric_id:
        return jsonify({"msg": "rubricID is required"}), 400
    criteria = CriteriaDescription.get_criteria_by_rubric(rubric_id)
    return jsonify([
        {
            "id": c.id,
            "rubricID": c.rubricID,
            "question": c.question,
            "scoreMax": c.scoreMax,
            "hasScore": c.hasScore,
        }
        for c in criteria
    ]), 200


# ============================================================
# GET /assignment/review?assignmentID=&reviewerID=&revieweeID=
# Check if a review exists and return its grades
# (used by Assignment.tsx to show prior review state)
# ============================================================
@bp.route("/review", methods=["GET"])
@jwt_required()
def get_review():
    """Get a review and its criterion grades."""
    assignment_id = request.args.get("assignmentID", type=int)
    reviewer_id = request.args.get("reviewerID", type=int)
    reviewee_id = request.args.get("revieweeID", type=int)

    if not all([assignment_id, reviewer_id, reviewee_id]):
        return jsonify({"msg": "assignmentID, reviewerID, and revieweeID are required"}), 400

    review = Review.query.filter_by(
        assignmentID=assignment_id,
        reviewerID=reviewer_id,
        revieweeID=reviewee_id,
    ).first()

    if not review:
        return jsonify({"msg": "Review not found"}), 404

    grades = [c.grade for c in Criterion.query.filter_by(reviewID=review.id).all()]
    return jsonify({
        "id": review.id,
        "assignmentID": review.assignmentID,
        "reviewerID": review.reviewerID,
        "revieweeID": review.revieweeID,
        "grades": grades,
    }), 200
