"""
ReviewFile model for the peer evaluation app.
Stores file attachments linked to peer review submissions (Feature B).
"""

from datetime import datetime, timezone

from .db import db


class ReviewFile(db.Model):
    """ReviewFile model representing a file attached to a peer review."""

    __tablename__ = "ReviewFile"

    id = db.Column(db.Integer, primary_key=True)
    reviewID = db.Column(db.Integer, db.ForeignKey("Review.id"), nullable=False, index=True)
    uploaderID = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(512), nullable=False)
    uploaded_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # relationships
    review = db.relationship("Review", back_populates="files")
    uploader = db.relationship("User", foreign_keys=[uploaderID])

    def __init__(self, reviewID, uploaderID, filename, path):
        self.reviewID = reviewID
        self.uploaderID = uploaderID
        self.filename = filename
        self.path = path

    def __repr__(self):
        return f"<ReviewFile id={self.id} review={self.reviewID} filename={self.filename}>"

    @classmethod
    def get_by_id(cls, file_id):
        """Get a ReviewFile record by its primary key."""
        return db.session.get(cls, int(file_id))

    @classmethod
    def get_files_by_review(cls, review_id):
        """Get all files attached to a given review."""
        return cls.query.filter_by(reviewID=review_id).all()

    @classmethod
    def create_review_file(cls, review_file):
        """Persist a new ReviewFile record to the database."""
        db.session.add(review_file)
        db.session.commit()
        return review_file

    def delete(self):
        """Delete this ReviewFile record from the database."""
        db.session.delete(self)
        db.session.commit()
