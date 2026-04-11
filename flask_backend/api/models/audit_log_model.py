"""
AuditLog model — records security-relevant actions (user creation, deletion,
role changes, credential updates).
"""

from datetime import datetime, timezone

from .db import db


class AuditLog(db.Model):
    __tablename__ = "AuditLog"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    actor_id = db.Column(db.Integer, db.ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    actor_email = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(50), nullable=False)   # create_user | delete_user | change_role | update_credentials | update_user
    target_id = db.Column(db.Integer, nullable=True)
    target_email = db.Column(db.String(255), nullable=True)
    detail = db.Column(db.Text, nullable=True)          # JSON-serialisable string with extra context

    @classmethod
    def log(cls, actor, action, target=None, detail=None):
        entry = cls(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else "system",
            action=action,
            target_id=target.id if target else None,
            target_email=target.email if target else None,
            detail=detail,
        )
        db.session.add(entry)
        # Flushed together with the main transaction — caller must commit.
