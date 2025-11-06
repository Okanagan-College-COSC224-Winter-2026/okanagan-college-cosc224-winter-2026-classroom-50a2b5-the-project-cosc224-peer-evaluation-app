"""
Review model for the peer evaluation app.
"""
from .db import db, ma

class Review(db.Model):
    """Review model representing peer evaluations"""
    __tablename__ = 'Review'

    id = db.Column(db.Integer, primary_key=True)
    assignmentID = db.Column(db.Integer, db.ForeignKey('Assignment.id'), nullable=False, index=True)
    reviewerID = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False, index=True)
    revieweeID = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False, index=True)
    
    # relationships
    assignment = db.relationship('Assignment', back_populates='reviews')
    reviewer = db.relationship('User', foreign_keys=[reviewerID], back_populates='reviews_made')
    reviewee = db.relationship('User', foreign_keys=[revieweeID], back_populates='reviews_received')
    criteria = db.relationship('Criterion', back_populates='review', cascade='all, delete-orphan', lazy='dynamic')

    def __init__(self, assignmentID, reviewerID, revieweeID):
        self.assignmentID = assignmentID
        self.reviewerID = reviewerID
        self.revieweeID = revieweeID

    def __repr__(self):
        return f'<Review id={self.id} assignmentID={self.assignmentID}>'
    
    @classmethod
    def get_by_id(cls, review_id):
        """Get review by ID"""
        return db.session.get(cls, int(review_id))
    
    @classmethod
    def create_review(cls, review):
        """Add a new review to the database"""
        db.session.add(review)
        db.session.commit()
        return review
    
    def update(self):
        """Update review in the database"""
        db.session.commit()

    def delete(self):
        """Delete review from the database"""
        db.session.delete(self)
        db.session.commit()