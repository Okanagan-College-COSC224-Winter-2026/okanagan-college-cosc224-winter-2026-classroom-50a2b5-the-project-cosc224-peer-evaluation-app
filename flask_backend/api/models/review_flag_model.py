"""
ReviewFlag model for the peer evaluation app.

Stores flags/reports on reviews for moderation purposes.
"""

from datetime import datetime, timezone

from .db import db


class ReviewFlag(db.Model):
    """A flag/report on a review, submitted by any authenticated user."""

    __tablename__ = "ReviewFlag"

    id = db.Column(db.Integer, primary_key=True)
    reviewID = db.Column(db.Integer, db.ForeignKey("Review.id"), nullable=False, index=True)
    flaggedBy = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    reason = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Prevent duplicate flags: one user can only flag a review once
    __table_args__ = (
        db.UniqueConstraint("reviewID", "flaggedBy", name="uq_review_flag_user"),
    )

    # relationships
    review = db.relationship("Review", backref=db.backref("flags", lazy="dynamic", cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref("review_flags", lazy="dynamic"))

    def __init__(self, reviewID, flaggedBy, reason):
        self.reviewID = reviewID
        self.flaggedBy = flaggedBy
        self.reason = reason

    def __repr__(self):
        return f"<ReviewFlag id={self.id} review={self.reviewID} by={self.flaggedBy}>"

    @classmethod
    def get_by_id(cls, flag_id):
        return db.session.get(cls, int(flag_id))

    @classmethod
    def get_flags_for_review(cls, review_id):
        return cls.query.filter_by(reviewID=review_id).all()

    @classmethod
    def get_flagged_reviews_for_course(cls, course_id):
        """Get all reviews in a course that have been flagged at least once."""
        from .review_model import Review
        from .assignment_model import Assignment

        return (
            db.session.query(Review)
            .join(Assignment, Review.assignmentID == Assignment.id)
            .filter(Assignment.courseID == course_id)
            .filter(Review.flags.any())
            .all()
        )

    @classmethod
    def exists(cls, review_id, user_id):
        """Check if a user already flagged a review."""
        return cls.query.filter_by(reviewID=review_id, flaggedBy=user_id).first() is not None
