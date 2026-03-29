"""
Notification controller.

Endpoints:
  GET    /notification/              — List notifications for current user
  GET    /notification/unread-count  — Get unread count
  PATCH  /notification/<id>/read     — Mark a notification as read
  PATCH  /notification/read-all      — Mark all notifications as read
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Notification, NotificationSchema, User
from ..models.db import db

bp = Blueprint("notification", __name__, url_prefix="/notification")

notifications_schema = NotificationSchema(many=True)


@bp.route("/", methods=["GET"])
@jwt_required()
def list_notifications():
    """List notifications for the current user.

    Query params:
        unread_only (bool): if "true", only return unread notifications
        limit (int): max number of notifications (default 50)
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    unread_only = request.args.get("unread_only", "false").lower() == "true"
    limit = request.args.get("limit", 50, type=int)

    notifications = Notification.get_for_user(user.id, unread_only=unread_only, limit=limit)
    return jsonify(notifications_schema.dump(notifications)), 200


@bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    """Get the count of unread notifications."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    count = Notification.count_unread(user.id)
    return jsonify({"count": count}), 200


@bp.route("/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    """Mark a single notification as read."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    notification = Notification.get_by_id(notification_id)
    if not notification:
        return jsonify({"msg": "Notification not found"}), 404

    if notification.userID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    notification.is_read = True
    db.session.commit()
    return jsonify({"msg": "Notification marked as read"}), 200


@bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_read():
    """Mark all of the current user's notifications as read."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    Notification.query.filter_by(userID=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"msg": "All notifications marked as read"}), 200
