"""
EnrollmentRequest model for the peer evaluation app.

Stores student requests to join courses they are not enrolled in.
"""

from datetime import datetime, timezone

from .db import db


class EnrollmentRequest(db.Model):
    """A student's request to enroll in a course."""

    __tablename__ = "EnrollmentRequest"

    id = db.Column(db.Integer, primary_key=True)
    studentID = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    courseID = db.Column(db.Integer, db.ForeignKey("Course.id"), nullable=False, index=True)
    status = db.Column(db.String(20), default="pending", nullable=False)  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Only one pending request per student-course pair at a time.
    # Rejected/approved requests do not block new requests.
    __table_args__ = (
        db.UniqueConstraint("studentID", "courseID", "status", name="uq_enrollment_request"),
    )

    # Note: The unique constraint on (studentID, courseID, status) allows
    # at most one row per status value. The controller checks has_pending()
    # before creating, so only one pending row can exist. After rejection,
    # the old row's status is "rejected", so a new "pending" row is allowed.

    # relationships
    student = db.relationship("User", backref=db.backref("enrollment_requests", lazy="dynamic", cascade="all, delete-orphan"))
    course = db.relationship("Course", backref=db.backref("enrollment_requests", lazy="dynamic", cascade="all, delete-orphan"))

    def __init__(self, studentID, courseID):
        self.studentID = studentID
        self.courseID = courseID
        self.status = "pending"

    def __repr__(self):
        return f"<EnrollmentRequest id={self.id} student={self.studentID} course={self.courseID} status={self.status}>"

    @classmethod
    def get_by_id(cls, request_id):
        return db.session.get(cls, int(request_id))

    @classmethod
    def get_pending_for_course(cls, course_id):
        return cls.query.filter_by(courseID=course_id, status="pending").all()

    @classmethod
    def get_by_student_and_course(cls, student_id, course_id):
        """Get the most recent request for a student-course pair."""
        return cls.query.filter_by(
            studentID=student_id, courseID=course_id
        ).order_by(cls.created_at.desc()).first()

    @classmethod
    def has_pending(cls, student_id, course_id):
        """Check if student already has a pending request for this course."""
        return cls.query.filter_by(
            studentID=student_id, courseID=course_id, status="pending"
        ).first() is not None
