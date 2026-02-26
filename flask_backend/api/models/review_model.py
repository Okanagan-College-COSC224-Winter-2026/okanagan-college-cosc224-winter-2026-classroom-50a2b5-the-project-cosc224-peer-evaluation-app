"""
review_model.py
Handles database operations for Review records.
"""

from flask import current_app
from .. import db


class Review(db.Model):
    """ORM model representing a peer review submission."""

    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    criteria = db.relationship("Criterion", backref="review", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "reviewer_id": self.reviewer_id,
            "reviewee_id": self.reviewee_id,
            "assignment_id": self.assignment_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def create_review(reviewer_id: int, reviewee_id: int, assignment_id: int) -> Review:
    """
    Create and persist a new Review record.

    Args:
        reviewer_id: ID of the student submitting the review.
        reviewee_id: ID of the student being reviewed.
        assignment_id: ID of the assignment this review belongs to.

    Returns:
        The newly created Review instance.
    """
    review = Review(
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        assignment_id=assignment_id,
    )
    db.session.add(review)
    db.session.flush()  # Flush to get the auto-generated review.id before commit
    return review


def get_reviews_by_assignment(assignment_id: int) -> list[Review]:
    """
    Retrieve all reviews for a given assignment.

    Args:
        assignment_id: The assignment whose reviews are requested.

    Returns:
        List of Review instances for the assignment.
    """
    return Review.query.filter_by(assignment_id=assignment_id).all()


def review_exists(reviewer_id: int, reviewee_id: int, assignment_id: int) -> bool:
    """
    Check whether a review already exists (duplicate detection).

    Args:
        reviewer_id: The reviewer's user ID.
        reviewee_id: The reviewee's user ID.
        assignment_id: The assignment ID.

    Returns:
        True if a duplicate review exists, False otherwise.
    """
    return Review.query.filter_by(
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        assignment_id=assignment_id,
    ).first() is not None
