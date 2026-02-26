"""
review_controller.py
Blueprint handling peer review submission for US1/US11.

Endpoint:
    POST /api/reviews/submit
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.review_model import create_review, review_exists
from ..models.criterion_model import create_criterion
from ..models.assignment_model import get_assignment_by_id          # existing model
from ..models.group_model import is_student_in_assignment_group     # existing model
from .. import db

review_bp = Blueprint("review", __name__, url_prefix="/api/reviews")


@review_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_review():
    """
    Submit a rubric-based peer review.

    Expected JSON body:
        {
            "assignment_id": int,
            "reviewee_id":   int,
            "criteria": [
                {
                    "criteria_description_id": int,
                    "grade":                   int,
                    "comments":                str   (optional)
                },
                ...
            ]
        }

    Returns:
        201 { "review_id": int }           — review created successfully
        400 { "error": str }               — self-review or validation failure
        401                                — missing / invalid JWT (handled by decorator)
        403 { "error": str }               — reviewer not in the same group
        404 { "error": str }               — assignment not found
        409 { "error": str }               — duplicate review
    """
    reviewer_id = get_jwt_identity()
    data = request.get_json(silent=True)

    # ── Basic payload validation ──────────────────────────────────────────────
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    assignment_id = data.get("assignment_id")
    reviewee_id   = data.get("reviewee_id")
    criteria_list = data.get("criteria")

    if assignment_id is None or reviewee_id is None or not isinstance(criteria_list, list):
        return jsonify({"error": "assignment_id, reviewee_id, and criteria are required."}), 400

    if not criteria_list:
        return jsonify({"error": "criteria must contain at least one entry."}), 400

    # ── Self-review guard ─────────────────────────────────────────────────────
    if reviewer_id == reviewee_id:
        return jsonify({"error": "You cannot review yourself."}), 400

    # ── Assignment existence check ────────────────────────────────────────────
    assignment = get_assignment_by_id(assignment_id)
    if assignment is None:
        return jsonify({"error": f"Assignment {assignment_id} not found."}), 404

    # ── Group membership check ────────────────────────────────────────────────
    if not is_student_in_assignment_group(reviewer_id, reviewee_id, assignment_id):
        return jsonify({"error": "You are not in the same group as this reviewee for this assignment."}), 403

    # ── Duplicate review check ────────────────────────────────────────────────
    if review_exists(reviewer_id, reviewee_id, assignment_id):
        return jsonify({"error": "You have already submitted a review for this student on this assignment."}), 409

    # ── Persist review + criteria ─────────────────────────────────────────────
    try:
        review = create_review(
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            assignment_id=assignment_id,
        )

        for entry in criteria_list:
            crit_id  = entry.get("criteria_description_id")
            grade    = entry.get("grade")
            comments = entry.get("comments", None)

            if crit_id is None or grade is None:
                db.session.rollback()
                return jsonify({"error": "Each criterion must include criteria_description_id and grade."}), 400

            create_criterion(
                review_id=review.id,
                criteria_description_id=crit_id,
                grade=grade,
                comments=comments,
            )

        db.session.commit()

    except Exception as exc:
        db.session.rollback()
        # Log the exception through Flask's logger so it appears in server output
        from flask import current_app
        current_app.logger.error("Error submitting review: %s", exc)
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500

    return jsonify({"review_id": review.id}), 201
