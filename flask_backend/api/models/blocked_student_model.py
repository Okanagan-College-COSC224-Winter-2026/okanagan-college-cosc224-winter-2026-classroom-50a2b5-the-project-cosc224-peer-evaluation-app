"""
BlockedStudent model.

Teachers can block specific students to prevent repeated
enrollment request spam. Blocked students are auto-rejected
when they try to request enrollment in any of the teacher's courses.
"""

from datetime import datetime, timezone

from .db import db


class BlockedStudent(db.Model):
    """A teacher's block on a student."""

    __tablename__ = "BlockedStudent"

    id = db.Column(db.Integer, primary_key=True)
    teacherID = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    studentID = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    reason = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # One block per teacher-student pair
    __table_args__ = (
        db.UniqueConstraint("teacherID", "studentID", name="uq_block_teacher_student"),
    )

    teacher = db.relationship("User", foreign_keys=[teacherID], backref=db.backref("blocked_students", lazy="dynamic"))
    student = db.relationship("User", foreign_keys=[studentID], backref=db.backref("blocked_by", lazy="dynamic"))

    def __init__(self, teacherID, studentID, reason=None):
        self.teacherID = teacherID
        self.studentID = studentID
        self.reason = reason

    def __repr__(self):
        return f"<BlockedStudent teacher={self.teacherID} student={self.studentID}>"

    @classmethod
    def is_blocked(cls, teacher_id, student_id):
        return cls.query.filter_by(teacherID=teacher_id, studentID=student_id).first() is not None

    @classmethod
    def get_for_teacher(cls, teacher_id):
        return cls.query.filter_by(teacherID=teacher_id).all()

    @classmethod
    def get_block(cls, teacher_id, student_id):
        return cls.query.filter_by(teacherID=teacher_id, studentID=student_id).first()
