"""
Assignment model for the peer evaluation app.
"""

from .db import db


class Assignment(db.Model):
    """Assignment model representing assignments in the peer evaluation app."""

    __tablename__ = "Assignment"

    id = db.Column(db.Integer, primary_key=True)
    courseID = db.Column(db.Integer, db.ForeignKey("Course.id"), index=True)
    name = db.Column(db.String(255), nullable=True)
    rubric_text = db.Column("rubric", db.String(255), nullable=True)

    # relationships
    course = db.relationship("Course", back_populates="assignments", lazy="joined")
    rubrics = db.relationship(
        "Rubric", back_populates="assignment", cascade="all, delete-orphan", lazy="dynamic"
    )
    groups = db.relationship(
        "CourseGroup", back_populates="assignment", cascade="all, delete-orphan", lazy="dynamic"
    )
    submissions = db.relationship(
        "Submission", back_populates="assignment", cascade="all, delete-orphan", lazy="dynamic"
    )
    reviews = db.relationship(
        "Review", back_populates="assignment", cascade="all, delete-orphan", lazy="dynamic"
    )
    group_members = db.relationship(
        "Group_Members", back_populates="assignment", cascade="all, delete-orphan", lazy="dynamic"
    )

    def __init__(self, courseID, name, rubric):
        self.courseID = courseID
        self.name = name
        self.rubric = rubric

    def __repr__(self):
        return f"<Assignment id={self.id} name={self.name}>"

    @classmethod
    def get_by_id(cls, assignment_id):
        """Get assignment by ID"""
        return db.session.get(cls, int(assignment_id))

    @classmethod
    def create(cls, assignment):
        """Add a new assignment to the database"""
        db.session.add(assignment)
        db.session.commit()
        return assignment

    def update(self):
        """Update assignment in the database"""
        db.session.commit()

    def delete(self):
        """Delete assignment from the database"""
        db.session.delete(self)
        db.session.commit()
