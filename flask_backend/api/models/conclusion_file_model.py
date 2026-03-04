from datetime import datetime

from api.models.db import db


class ConclusionFile(db.Model):
    __tablename__ = "conclusion_files"

    id = db.Column(db.Integer, primary_key=True)

    # FIXED: must match Assignment.__tablename__ = "Assignment"
    assignmentID = db.Column(
        db.Integer,
        db.ForeignKey("Assignment.id"),
        nullable=False,
        index=True,
    )

    # NOTE: if User.__tablename__ is "User" keep as "User.id"
    # If it is something else, replace the string below to match it.
    teacherID = db.Column(
        db.Integer,
        db.ForeignKey("User.id"),
        nullable=False,
        index=True,
    )

    filename = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(512), nullable=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    assignment = db.relationship("Assignment", back_populates="conclusion_files")
    teacher = db.relationship("User")

    @classmethod
    def get_by_id(cls, file_id: int):
        return cls.query.get(file_id)

    @classmethod
    def get_files_by_assignment(cls, assignment_id: int):
        return (
            cls.query.filter_by(assignmentID=assignment_id)
            .order_by(cls.uploaded_at.desc())
            .all()
        )

    @classmethod
    def create_conclusion_file(cls, assignment_id: int, teacher_id: int, filename: str, path: str):
        new_file = cls(
            assignmentID=assignment_id,
            teacherID=teacher_id,
            filename=filename,
            path=path,
        )
        db.session.add(new_file)
        db.session.commit()
        return new_file