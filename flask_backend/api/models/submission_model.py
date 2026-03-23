"""
Submission model for the peer evaluation app.
"""

from .db import db


class Submission(db.Model):
    """Submission model representing student submissions"""

    __tablename__ = "Submission"

    id = db.Column(db.Integer, primary_key=True)

    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=True)

    studentID = db.Column(
        db.Integer,
        db.ForeignKey("User.id"),
        nullable=False,
        index=True,
    )
    assignmentID = db.Column(
        db.Integer,
        db.ForeignKey("Assignment.id"),
        nullable=False,
        index=True,
    )

    student = db.relationship("User", back_populates="submissions")
    assignment = db.relationship("Assignment", back_populates="submissions")

    def __init__(self, file_name, file_path, studentID, assignmentID):
        self.file_name = file_name
        self.file_path = file_path
        self.studentID = studentID
        self.assignmentID = assignmentID

    def __repr__(self):
        return (
            f"<Submission id={self.id} "
            f"student={self.studentID} "
            f"assignment={self.assignmentID}>"
        )

    @classmethod
    def get_by_id(cls, submission_id):
        return db.session.get(cls, int(submission_id))

    @classmethod
    def get_by_student_and_assignment(cls, student_id, assignment_id):
        return cls.query.filter_by(
            studentID=student_id,
            assignmentID=assignment_id,
        ).first()

    @classmethod
    def get_by_assignment_id(cls, assignment_id):
        return cls.query.filter_by(
            assignmentID=assignment_id
        ).all()

    @classmethod
    def create_submission(cls, submission):
        db.session.add(submission)
        db.session.commit()
        return submission

    def update(self):
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()