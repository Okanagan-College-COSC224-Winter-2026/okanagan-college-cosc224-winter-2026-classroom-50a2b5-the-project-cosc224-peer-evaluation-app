"""
Teacher Review Dashboard controller.
Implements US13 (view review submissions) and US14 (add conclusion note).

Endpoints:
    GET  /teacher/assignments/<assignment_id>/reviews
    GET  /teacher/assignments/<assignment_id>/reviews/<review_id>
    POST /teacher/reviews/<review_id>/conclusion
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..models import Assignment, Criterion, CourseGroup, Group_Members, Review, User
from ..models.conclusion_model import Conclusion
from ..models.db import db
from .auth_controller import jwt_teacher_required

teacher_bp = Blueprint("teacher", __name__, url_prefix="/teacher")


# ── Private helper ────────────────────────────────────────────────────────────

def _review_total_score(review) -> int:
    """
    Sum the grades across all Criterion rows for this review.

    This project stores per-criterion scores in the Criterion table
    (columns: grade, comments) linked back to CriteriaDescription
    for the question text and scoreMax.
    criteria is a dynamic relationship so we call .all() to load it.
    """
    return sum(
        (c.grade or 0)
        for c in review.criteria.all()
    )


# ============================================================
# GET /teacher/assignments/<assignment_id>/reviews
# List all reviews for an assignment (teacher/admin only)
# ============================================================

@teacher_bp.route("/assignments/<int:assignment_id>/reviews", methods=["GET"])
@jwt_teacher_required
def list_assignment_reviews(assignment_id):
    """
    Return a summary list of all peer reviews submitted for an assignment.

    Query parameters:
        group_id (int, optional) — filter to reviewees who belong to this group
        sort     (str, optional) — 'id' (default) or 'score' (descending)

    Response 200:
        [
            {
                "review_id":      int,
                "reviewer_id":    int,
                "reviewee_id":    int,
                "total_score":    int,
                "has_conclusion": bool
            },
            ...
        ]

    Response 404: assignment not found
    """
    assignment = Assignment.get_by_id(assignment_id)
    if assignment is None:
        return jsonify({"msg": "Assignment not found"}), 404

    group_id = request.args.get("group_id", None, type=int)
    sort_by  = request.args.get("sort", "id")

    # ── Base query ────────────────────────────────────────────────────────────
    query = Review.query.filter_by(assignmentID=assignment_id)

    # ── Optional group filter ─────────────────────────────────────────────────
    if group_id is not None:
        # Resolve the group, return 404 if it doesn't exist
        group = CourseGroup.get_by_id(group_id)
        if group is None:
            return jsonify({"msg": "Group not found"}), 404

        member_ids = [
            m.userID
            for m in Group_Members.query.filter_by(groupID=group_id).all()
        ]
        query = query.filter(Review.revieweeID.in_(member_ids))

    reviews = query.all()

    # ── Optional sort ─────────────────────────────────────────────────────────
    if sort_by == "score":
        reviews = sorted(reviews, key=_review_total_score, reverse=True)

    return jsonify([
        {
            "review_id":      r.id,
            "reviewer_id":    r.reviewerID,
            "reviewee_id":    r.revieweeID,
            "total_score":    _review_total_score(r),
            "has_conclusion": r.conclusion is not None,
        }
        for r in reviews
    ]), 200


# ============================================================
# GET /teacher/assignments/<assignment_id>/reviews/<review_id>
# Full detail for one review: criteria breakdown + conclusion
# ============================================================

@teacher_bp.route(
    "/assignments/<int:assignment_id>/reviews/<int:review_id>",
    methods=["GET"],
)
@jwt_teacher_required
def get_review_detail(assignment_id, review_id):
    """
    Return the full detail of a single peer review, including each
    criterion's score and comment, and the conclusion note if one exists.

    Response 200:
        {
            "review_id":   int,
            "reviewer_id": int,
            "reviewee_id": int,
            "criteria": [
                {
                    "criterion_id":   int,
                    "criterion_name": str,
                    "score":          int | null,
                    "score_max":      int | null,
                    "comment":        str
                },
                ...
            ],
            "conclusion": { ...to_dict() } | null
        }

    Response 404: assignment or review not found
    """
    assignment = Assignment.get_by_id(assignment_id)
    if assignment is None:
        return jsonify({"msg": "Assignment not found"}), 404

    review = Review.query.filter_by(
        id=review_id, assignmentID=assignment_id
    ).first()
    if review is None:
        return jsonify({"msg": "Review not found"}), 404

    # ── Build criteria breakdown ──────────────────────────────────────────────
    # Each Criterion row has a grade + comments, and a FK to CriteriaDescription
    # which holds the human-readable question and scoreMax.
    criteria_breakdown = [
        {
            "criterion_id":   c.id,
            "criterion_name": (
                c.criterion_row.question if c.criterion_row else ""
            ),
            "score":          c.grade,
            "score_max":      (
                c.criterion_row.scoreMax if c.criterion_row else None
            ),
            "comment":        c.comments or "",
        }
        for c in review.criteria.all()
    ]

    conclusion = Conclusion.get_by_review(review_id)

    return jsonify({
        "review_id":   review.id,
        "reviewer_id": review.reviewerID,
        "reviewee_id": review.revieweeID,
        "criteria":    criteria_breakdown,
        "conclusion":  conclusion.to_dict() if conclusion else None,
    }), 200


# ============================================================
# POST /teacher/reviews/<review_id>/conclusion
# Create or update the conclusion note for a review (upsert)
# ============================================================

@teacher_bp.route("/reviews/<int:review_id>/conclusion", methods=["POST"])
@jwt_teacher_required
def upsert_conclusion(review_id):
    """
    Create or update the instructor note (Conclusion) on a peer review.
    Behaves as an upsert: a second POST to the same review_id updates
    the existing note rather than creating a duplicate.

    Request body (JSON):
        { "note": str }

    Response 200: conclusion.to_dict()
    Response 400: empty note
    Response 404: review not found
    """
    review = Review.get_by_id(review_id)
    if review is None:
        return jsonify({"msg": "Review not found"}), 404

    note = (request.json or {}).get("note", "").strip()
    if not note:
        return jsonify({"error": "Note cannot be empty"}), 400

    # ── Resolve the teacher from the JWT cookie ───────────────────────────────
    email = get_jwt_identity()
    teacher = User.get_by_email(email)
    if teacher is None:
        return jsonify({"msg": "User not found"}), 404

    # ── Upsert ────────────────────────────────────────────────────────────────
    existing = Conclusion.get_by_review(review_id)
    if existing:
        existing.note = note
        existing.update()
    else:
        existing = Conclusion(
            reviewID=review_id,
            teacherID=teacher.id,
            note=note,
        )
        Conclusion.create(existing)

    return jsonify(existing.to_dict()), 200
