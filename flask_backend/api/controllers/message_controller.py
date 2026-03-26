"""
Message controller for the peer evaluation app.
Provides in-group student messaging endpoints.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models.user_model import User
from ..models.group_members_model import Group_Members
from ..models.message_model import Message
from ..models.schemas import MessageSchema
from ..models.db import db

message_bp = Blueprint("message", __name__, url_prefix="/message")
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)


def _get_current_user():
    email = get_jwt_identity()
    return User.get_by_email(email)


def _user_in_group(user_id, group_id):
    return Group_Members.query.filter_by(userID=user_id, groupID=group_id).first() is not None


@message_bp.route("/group/<int:group_id>", methods=["GET"])
@jwt_required()
def get_messages(group_id):
    user = _get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not _user_in_group(user.id, group_id):
        return jsonify({"error": "Not a member of this group"}), 403

    messages = Message.query.filter_by(group_id=group_id).order_by(Message.created_at.asc()).all()
    return jsonify(messages_schema.dump(messages)), 200


@message_bp.route("/group/<int:group_id>", methods=["POST"])
@jwt_required()
def send_message(group_id):
    user = _get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not _user_in_group(user.id, group_id):
        return jsonify({"error": "Not a member of this group"}), 403

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"error": "Message content required"}), 400

    message = Message(group_id=group_id, sender_id=user.id, content=content)
    db.session.add(message)
    db.session.commit()

    return jsonify(message_schema.dump(message)), 201


@message_bp.route("/group/<int:group_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(group_id):
    user = _get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not _user_in_group(user.id, group_id):
        return jsonify({"error": "Not a member of this group"}), 403

    Message.query.filter(
        Message.group_id == group_id,
        Message.sender_id != user.id,
        Message.is_read.is_(False),
    ).update({"is_read": True}, synchronize_session=False)
    db.session.commit()

    return jsonify({"message": "Marked as read"}), 200