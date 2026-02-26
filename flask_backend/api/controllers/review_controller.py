"""
review_controller.py
Blueprint handling peer review submission for US1/US11.

Endpoint:
    POST /api/reviews/submit
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.review_model import Review
from ..models.criterion_model import Criterion
from ..models.db import db

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
        201 { "review_id": int }  — review created successfully
        400 { "error": str }      — self-review or missing fields
        401                       — missing/invalid JWT (handled by decorator)
        403 { "error": str }      — reviewer not in the same group as reviewee
        404 { "error": str }      — assignment not found
        409 { "error": str }      — duplicate review
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
    if int(reviewer_id) == int(reviewee_id):
        return jsonify({"error": "You cannot review yourself."}), 400

    # ── Assignment existence check ────────────────────────────────────────────
    # Import here to use whatever assignment model already exists in the project
    from ..models.assignment_model import Assignment
    assignment = Assignment.get_by_id(assignment_id)
    if assignment is None:
        return jsonify({"error": f"Assignment {assignment_id} not found."}), 404

    # ── Group membership check ────────────────────────────────────────────────
    # Verify that the reviewer and reviewee are in the same group for this assignment.
    # Import the existing Group model to perform this check.
    from ..models.group_model import Group
    reviewer_in_group = Group.are_in_same_group(reviewer_id, reviewee_id, assignment_id)
    if not reviewer_in_group:
        return jsonify({"error": "You are not in the same group as this reviewee for this assignment."}), 403

    # ── Duplicate review check ────────────────────────────────────────────────
    if Review.review_exists(reviewer_id, reviewee_id, assignment_id):
        return jsonify({"error": "You have already submitted a review for this student on this assignment."}), 409

    # ── Persist review + criteria in a single transaction ────────────────────
    try:
        # 1. Create the Review record
        review = Review(
            assignmentID=assignment_id,
            reviewerID=reviewer_id,
            revieweeID=reviewee_id,
        )
        db.session.add(review)
        db.session.flush()  # flush so review.id is available for Criterion FK

        # 2. Create a Criterion record for each rubric score
        for entry in criteria_list:
            crit_id  = entry.get("criteria_description_id")
            grade    = entry.get("grade")
            comments = entry.get("comments", None)

            if crit_id is None or grade is None:
                db.session.rollback()
                return jsonify({"error": "Each criterion must include criteria_description_id and grade."}), 400

            criterion = Criterion(
                reviewID=review.id,
                criterionRowID=crit_id,
                grade=grade,
                comments=comments,
            )
            db.session.add(criterion)

        db.session.commit()

    except Exception as exc:
        db.session.rollback()
        current_app.logger.error("Error submitting review: %s", exc)
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500

    return jsonify({"review_id": review.id}), 201
