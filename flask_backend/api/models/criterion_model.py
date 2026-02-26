"""
criterion_model.py
Handles database operations for Criterion records (individual rubric scores per review).
"""

from .. import db


class Criterion(db.Model):
    """ORM model representing a single scored criterion within a peer review."""

    __tablename__ = "criteria"

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), nullable=False)
    criteria_description_id = db.Column(
        db.Integer, db.ForeignKey("criteria_descriptions.id"), nullable=False
    )
    grade = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "review_id": self.review_id,
            "criteria_description_id": self.criteria_description_id,
            "grade": self.grade,
            "comments": self.comments,
        }


def create_criterion(
    review_id: int,
    criteria_description_id: int,
    grade: int,
    comments: str = None,
) -> Criterion:
    """
    Create and persist a Criterion record for a single rubric score.

    Args:
        review_id: The review this criterion score belongs to.
        criteria_description_id: The rubric criterion being scored.
        grade: The numeric score awarded.
        comments: Optional free-text comment for this criterion.

    Returns:
        The newly created Criterion instance.
    """
    criterion = Criterion(
        review_id=review_id,
        criteria_description_id=criteria_description_id,
        grade=grade,
        comments=comments,
    )
    db.session.add(criterion)
    return criterion


def get_criteria_by_review(review_id: int) -> list[Criterion]:
    """
    Retrieve all criterion scores for a given review.

    Args:
        review_id: The review whose criteria are requested.

    Returns:
        List of Criterion instances belonging to the review.
    """
    return Criterion.query.filter_by(review_id=review_id).all()
