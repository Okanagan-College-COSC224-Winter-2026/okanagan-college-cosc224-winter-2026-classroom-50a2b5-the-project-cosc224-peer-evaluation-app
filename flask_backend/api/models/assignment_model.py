"""
Assignment model for the peer evaluation app.
"""

from datetime import datetime, timezone
from .db import db


class Assignment(db.Model):
    """Assignment model representing assignments in the peer evaluation app."""

    __tablename__ = "Assignment"

    id = db.Column(db.Integer, primary_key=True)

    courseID = db.Column(
        db.Integer,
        db.ForeignKey("Course.id"),
        index=True,
        nullable=False,
    )

    name = db.Column(db.String(255), nullable=True)

    rubric_text = db.Column(
        "rubric",
        db.String(255),
        nullable=True,
    )

    due_date = db.Column(
        db.DateTime,
        nullable=True,
        index=True,
    )

    attachment_filename = db.Column(
        db.String(255),
        nullable=True,
    )
    attachment_path = db.Column(
        db.String(500),
        nullable=True,
    )

    course = db.relationship(
        "Course",
        back_populates="assignments",
        lazy="joined",
    )
    rubrics = db.relationship(
        "Rubric",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    groups = db.relationship(
        "CourseGroup",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    submissions = db.relationship(
        "Submission",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    reviews = db.relationship(
        "Review",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    group_members = db.relationship(
        "Group_Members",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __init__(
        self,
        courseID,
        name,
        rubric_text,
        due_date=None,
        attachment_filename=None,
        attachment_path=None,
    ):
        self.courseID = courseID
        self.name = name
        self.rubric_text = rubric_text
        self.due_date = due_date
        self.attachment_filename = attachment_filename
        self.attachment_path = attachment_path

    def __repr__(self):
        return f"<Assignment id={self.id} name={self.name}>"

    @classmethod
    def get_by_id(cls, assignment_id):
        return db.session.get(cls, int(assignment_id))

    @classmethod
    def get_by_class_id(cls, class_id):
        return cls.query.filter_by(courseID=class_id).all()

    @classmethod
    def create(cls, assignment):
        db.session.add(assignment)
        db.session.commit()
        return assignment

    def _get_current_utc_time(self):
        return datetime.now(timezone.utc)

    def _ensure_timezone_aware(self, dt):
        if dt is None:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    def can_modify(self):
        due = self._ensure_timezone_aware(self.due_date)
        now = self._get_current_utc_time()
        return (due is None) or (now < due)

    def update(self):
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()