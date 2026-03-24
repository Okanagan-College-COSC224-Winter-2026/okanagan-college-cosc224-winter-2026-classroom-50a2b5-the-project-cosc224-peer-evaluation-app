"""
Rubric and Criteria controller for the peer evaluation app.

Endpoints:
  POST   /rubric/create                  — Create a rubric for an assignment
  GET    /rubric/<id>                    — Get a rubric by ID
  GET    /rubric/assignment/<id>         — Get the rubric for an assignment
  DELETE /rubric/<id>                    — Delete a rubric (cascades criteria)
  POST   /rubric/<id>/criteria           — Add a criterion to a rubric
  GET    /rubric/<id>/criteria           — List criteria for a rubric
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import (
    Assignment,
    Course,
    CriteriaDescription,
    CriteriaDescriptionSchema,
    Rubric,
    RubricSchema,
    User,
)
from .auth_controller import jwt_teacher_required

bp = Blueprint("rubric", __name__, url_prefix="/rubric")


# ============================================================================
# RUBRIC CRUD
# ============================================================================


@bp.route("/create", methods=["POST"])
@jwt_teacher_required
def create_rubric():
    """Create a rubric for an assignment the teacher owns."""
    data = request.get_json()
    assignment_id = data.get("assignmentID")

    if not assignment_id:
        return jsonify({"msg": "assignmentID is required"}), 400

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    # Verify the logged-in teacher owns the course
    email = get_jwt_identity()
    user = User.get_by_email(email)
    course = Course.get_by_id(assignment.courseID)
    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: you are not the teacher of this course"}), 403

    can_comment = data.get("canComment", True)
    rubric_type = data.get("rubric_type", "individual")

    if rubric_type not in ("individual", "group"):
        return jsonify({"msg": "rubric_type must be 'individual' or 'group'"}), 400

    rubric = Rubric(assignmentID=assignment_id, canComment=can_comment, rubric_type=rubric_type)
    Rubric.create_rubric(rubric)

    return jsonify({
        "msg": "Rubric created",
        "rubric": RubricSchema().dump(rubric),
    }), 201


@bp.route("/<int:rubric_id>", methods=["GET"])
@jwt_required()
def get_rubric(rubric_id):
    """Get a rubric by its ID."""
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    return jsonify(RubricSchema().dump(rubric)), 200


@bp.route("/assignment/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_rubric_for_assignment(assignment_id):
    """Get the rubric attached to an assignment.

    Optional query param ``rubric_type`` filters by type (default: "individual").
    """
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    rubric_type = request.args.get("rubric_type", "individual")
    rubric = Rubric.query.filter_by(
        assignmentID=assignment_id, rubric_type=rubric_type
    ).first()
    if not rubric:
        return jsonify({"msg": "No rubric found for this assignment"}), 404

    return jsonify(RubricSchema().dump(rubric)), 200


@bp.route("/<int:rubric_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_rubric(rubric_id):
    """Delete a rubric and cascade-delete its criteria."""
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    rubric.delete()
    return jsonify({"msg": "Rubric deleted"}), 200


# ============================================================================
# CRITERIA CRUD
# ============================================================================


@bp.route("/<int:rubric_id>/criteria", methods=["POST"])
@jwt_teacher_required
def add_criterion(rubric_id):
    """Add a criterion (question row) to a rubric."""
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    data = request.get_json()
    question = data.get("question")
    if not question:
        return jsonify({"msg": "question is required"}), 400

    score_max = data.get("scoreMax", 0)
    has_score = data.get("hasScore", True)

    criterion = CriteriaDescription(
        rubricID=rubric_id,
        question=question,
        scoreMax=score_max,
        hasScore=has_score,
    )
    CriteriaDescription.create_criteria_description(criterion)

    return jsonify({
        "msg": "Criterion added",
        "criterion": CriteriaDescriptionSchema().dump(criterion),
    }), 201


@bp.route("/<int:rubric_id>/criteria", methods=["GET"])
@jwt_required()
def get_criteria(rubric_id):
    """List all criteria for a rubric."""
    rubric = Rubric.get_by_id(rubric_id)
    if not rubric:
        return jsonify({"msg": "Rubric not found"}), 404

    criteria = CriteriaDescription.query.filter_by(rubricID=rubric_id).all()
    return jsonify(CriteriaDescriptionSchema(many=True).dump(criteria)), 200
