"""
Review flag (moderation) controller.

Endpoints:
  POST   /review-flag/              — Flag a review
  GET    /review-flag/review/<id>   — Get flags for a review (teacher/admin)
  GET    /review-flag/course/<id>   — Get all flagged reviews in a course (teacher/admin)
  DELETE /review-flag/<id>          — Dismiss a flag (teacher/admin)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Review, ReviewFlag, ReviewFlagSchema, ReviewSchema, User
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("review_flag", __name__, url_prefix="/review-flag")

flag_schema = ReviewFlagSchema()
flags_schema = ReviewFlagSchema(many=True)


@bp.route("/", methods=["POST"])
@jwt_required()
def flag_review():
    """Flag a review as inappropriate.

    Request body:
        { "reviewID": int, "reason": str }

    Returns 201 on success, 409 if already flagged by this user.
    """
    data = request.get_json()
    review_id = data.get("reviewID")
    reason = data.get("reason", "").strip()

    if not review_id:
        return jsonify({"msg": "reviewID is required"}), 400
    if not reason:
        return jsonify({"msg": "reason is required"}), 400
    if len(reason) > 500:
        return jsonify({"msg": "reason must be 500 characters or fewer"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    review = Review.get_by_id(review_id)
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    if ReviewFlag.exists(review_id, user.id):
        return jsonify({"msg": "You have already flagged this review"}), 409

    flag = ReviewFlag(reviewID=review_id, flaggedBy=user.id, reason=reason)
    db.session.add(flag)
    db.session.commit()

    return jsonify({"msg": "Review flagged", "id": flag.id}), 201


@bp.route("/review/<int:review_id>", methods=["GET"])
@jwt_teacher_required
def get_flags_for_review(review_id):
    """Get all flags for a specific review (teacher/admin only)."""
    review = Review.get_by_id(review_id)
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    flags = ReviewFlag.get_flags_for_review(review_id)
    return jsonify(flags_schema.dump(flags)), 200


@bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_teacher_required
def get_flagged_reviews_for_course(course_id):
    """Get all flagged reviews in a course (teacher/admin only)."""
    reviews = ReviewFlag.get_flagged_reviews_for_course(course_id)
    result = []
    for review in reviews:
        dumped = ReviewSchema().dump(review)
        dumped["flag_count"] = review.flags.count()
        result.append(dumped)
    return jsonify(result), 200


@bp.route("/<int:flag_id>", methods=["DELETE"])
@jwt_teacher_required
def dismiss_flag(flag_id):
    """Dismiss (delete) a flag (teacher/admin only)."""
    flag = ReviewFlag.get_by_id(flag_id)
    if not flag:
        return jsonify({"msg": "Flag not found"}), 404

    db.session.delete(flag)
    db.session.commit()
    return jsonify({"msg": "Flag dismissed"}), 200
