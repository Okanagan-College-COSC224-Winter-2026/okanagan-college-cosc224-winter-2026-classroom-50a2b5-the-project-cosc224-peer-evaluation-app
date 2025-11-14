"""
User management endpoints
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate

from ..models import User, UserSchema

bp = Blueprint("user", __name__, url_prefix="/user")

# Create schema instances once (reusable)
user_schema = UserSchema()


class UserUpdateSchema(Schema):
    """Schema for updating user information"""

    name = fields.Str(validate=validate.Length(min=1, max=255))


user_update_schema = UserUpdateSchema()


@bp.route("/", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current authenticated user information"""
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user_schema.dump(user)), 200


@bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    """Get user by ID (users can view their own info, teachers/admins can view anyone)"""
    current_email = get_jwt_identity()
    current_user = User.get_by_email(current_email)

    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Users can view their own info, teachers and admins can view anyone
    if current_user.id != user_id and not current_user.has_role("teacher", "admin"):
        return jsonify({"msg": "Insufficient permissions"}), 403

    return jsonify(user_schema.dump(user)), 200


@bp.route("/", methods=["PUT"])
@jwt_required()
def update_current_user():
    """Update current user information"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    # Validate input with Marshmallow
    try:
        data = user_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Update allowed fields
    if "name" in data:
        user.name = data["name"]

    user.update()

    return jsonify(user_schema.dump(user)), 200


@bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only or own account)"""
    current_email = get_jwt_identity()
    current_user = User.get_by_email(current_email)

    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Users can delete their own account, admins can delete anyone
    if current_user.id != user_id and not current_user.is_admin():
        return jsonify({"msg": "Insufficient permissions"}), 403

    user.delete()

    return jsonify({"msg": "User deleted successfully"}), 200
