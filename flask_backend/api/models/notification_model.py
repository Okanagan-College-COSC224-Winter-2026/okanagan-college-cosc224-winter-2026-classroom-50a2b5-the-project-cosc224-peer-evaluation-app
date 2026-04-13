"""
Notification model for the peer evaluation app.

Stores per-user notifications for events like assignment publication,
grading, enrollment requests, etc.
"""

from datetime import datetime, timezone

from .db import db


class Notification(db.Model):
    """A notification for a specific user."""

    __tablename__ = "Notification"

    id = db.Column(db.Integer, primary_key=True)
    userID = db.Column(db.Integer, db.ForeignKey("User.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    # Types: assignment_published, assignment_updated, assignment_deleted, assignment_graded,
    #        course_enrolled, course_created, course_updated, course_deleted, review_flagged
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Optional reference IDs for linking to the relevant resource
    reference_id = db.Column(db.Integer, nullable=True)  # e.g., assignment ID, course ID
    reference_type = db.Column(db.String(50), nullable=True)  # e.g., "assignment", "course", "enrollment_request"

    # relationships
    user = db.relationship("User", backref=db.backref("notifications", lazy="dynamic", cascade="all, delete-orphan"))

    def __init__(self, userID, type, message, reference_id=None, reference_type=None):
        self.userID = userID
        self.type = type
        self.message = message
        self.reference_id = reference_id
        self.reference_type = reference_type

    def __repr__(self):
        return f"<Notification id={self.id} user={self.userID} type={self.type}>"

    @classmethod
    def get_by_id(cls, notification_id):
        return db.session.get(cls, int(notification_id))

    @classmethod
    def get_for_user(cls, user_id, unread_only=False, limit=50):
        query = cls.query.filter_by(userID=user_id)
        if unread_only:
            query = query.filter_by(is_read=False)
        return query.order_by(cls.created_at.desc()).limit(limit).all()

    @classmethod
    def count_unread(cls, user_id):
        return cls.query.filter_by(userID=user_id, is_read=False).count()

    @classmethod
    def create(cls, userID, type, message, reference_id=None, reference_type=None):
        """Helper to create and persist a notification, then push via WebSocket."""
        notification = cls(
            userID=userID,
            type=type,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        db.session.add(notification)
        db.session.commit()
        cls._emit_realtime(notification)
        return notification

    @classmethod
    def create_bulk(cls, notifications_data):
        """Create multiple notifications at once, then push via WebSocket.

        Args:
            notifications_data: list of dicts with keys userID, type, message, reference_id, reference_type
        """
        notifications = [cls(**data) for data in notifications_data]
        db.session.add_all(notifications)
        db.session.commit()
        for notification in notifications:
            cls._emit_realtime(notification)
        return notifications

    @staticmethod
    def _emit_realtime(notification):
        """Push a notification to the target user's personal room via SocketIO."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            from ..extensions import socketio

            room = f"user_{notification.userID}"
            logger.info(f"Emitting new_notification to room {room}: {notification.message}")
            socketio.emit(
                "new_notification",
                {
                    "id": notification.id,
                    "type": notification.type,
                    "message": notification.message,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                    "reference_id": notification.reference_id,
                    "reference_type": notification.reference_type,
                },
                room=room,
            )
        except Exception as e:
            logger.error(f"Socket emit failed: {e}")
            pass
