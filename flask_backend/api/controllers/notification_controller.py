"""
Notification controller.

Endpoints:
  GET    /notification/              — List notifications for current user
  GET    /notification/unread-count  — Get unread count
  PATCH  /notification/<id>/read     — Mark a notification as read
  PATCH  /notification/<id>/unread   — Mark a notification as unread
  PATCH  /notification/read-all      — Mark all notifications as read
  DELETE /notification/<id>          — Delete a single notification
  DELETE /notification/read          — Delete all read notifications
  DELETE /notification/all           — Delete all notifications
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from datetime import datetime, timezone

from ..models import EnrollmentRequest, Notification, NotificationSchema, User
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


@bp.route("/<int:notification_id>/unread", methods=["PATCH"])
@jwt_required()
def mark_unread(notification_id):
    """Mark a single notification as unread."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    notification = Notification.get_by_id(notification_id)
    if not notification:
        return jsonify({"msg": "Notification not found"}), 404

    if notification.userID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    notification.is_read = False
    db.session.commit()
    return jsonify({"msg": "Notification marked as unread"}), 200


@bp.route("/<int:notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    """Delete a single notification.

    If the notification is for a pending enrollment_request, the request is
    auto-rejected so the student is not left stuck in a permanent pending state.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    notification = Notification.get_by_id(notification_id)
    if not notification:
        return jsonify({"msg": "Notification not found"}), 404

    if notification.userID != user.id:
        return jsonify({"msg": "Unauthorized"}), 403

    # Auto-reject the underlying enrollment request so the student is not stuck
    if notification.reference_type == "enrollment_request" and notification.reference_id:
        enrollment_request = EnrollmentRequest.get_by_id(notification.reference_id)
        if enrollment_request and enrollment_request.status == "pending":
            enrollment_request.status = "rejected"
            enrollment_request.resolved_at = datetime.now(timezone.utc)
            from ..models import Notification as Notif
            Notif.create(
                userID=enrollment_request.studentID,
                type="enrollment_rejected",
                message=f"Your enrollment request for '{enrollment_request.course.name}' has been rejected.",
                reference_id=enrollment_request.courseID,
                reference_type="course",
            )

    db.session.delete(notification)
    db.session.commit()
    return jsonify({"msg": "Notification deleted"}), 200


@bp.route("/read", methods=["DELETE"])
@jwt_required()
def delete_read_notifications():
    """Delete all read notifications for the current user.

    enrollment_request notifications are skipped — they require explicit action.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    deleted = (
        Notification.query
        .filter_by(userID=user.id, is_read=True)
        .filter(Notification.reference_type != "enrollment_request")
        .delete(synchronize_session="fetch")
    )
    db.session.commit()
    return jsonify({"msg": f"Deleted {deleted} read notification(s)"}), 200


@bp.route("/all", methods=["DELETE"])
@jwt_required()
def delete_all_notifications():
    """Delete all notifications for the current user.

    Any pending enrollment_request notifications are auto-rejected before deletion
    so the student is not left stuck in a permanent pending state.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    # Auto-reject any pending enrollment requests linked to notifications being deleted
    pending_enrollment_notifs = (
        Notification.query
        .filter_by(userID=user.id, reference_type="enrollment_request")
        .all()
    )
    for notif in pending_enrollment_notifs:
        if notif.reference_id:
            enrollment_request = EnrollmentRequest.get_by_id(notif.reference_id)
            if enrollment_request and enrollment_request.status == "pending":
                enrollment_request.status = "rejected"
                enrollment_request.resolved_at = datetime.now(timezone.utc)
                Notification.create(
                    userID=enrollment_request.studentID,
                    type="enrollment_rejected",
                    message=f"Your enrollment request for '{enrollment_request.course.name}' has been rejected.",
                    reference_id=enrollment_request.courseID,
                    reference_type="course",
                )

    deleted = Notification.query.filter_by(userID=user.id).delete(synchronize_session="fetch")
    db.session.commit()
    return jsonify({"msg": f"Deleted {deleted} notification(s)"}), 200
