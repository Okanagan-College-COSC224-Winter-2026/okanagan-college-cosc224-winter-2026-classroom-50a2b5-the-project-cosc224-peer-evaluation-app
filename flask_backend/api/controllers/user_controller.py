"""
User management endpoints
"""

import os
from uuid import uuid4

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
    send_from_directory,
)
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from ..models import User, UserSchema

bp = Blueprint("user", __name__, url_prefix="/user")

user_schema = UserSchema()


class UserUpdateSchema(Schema):
    """Schema for updating user information"""

    name = fields.Str(validate=validate.Length(min=1, max=255))


user_update_schema = UserUpdateSchema()


def ensure_upload_dir(path):
    os.makedirs(path, exist_ok=True)


def allowed_profile_picture(filename):
    allowed_extensions = {"png", "jpg", "jpeg", "webp"}
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extensions
    )


@bp.route("/", methods=["GET"])
@jwt_required()
def get_current_user():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user_schema.dump(user)), 200


@bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify(user_schema.dump(user)), 200


@bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    current_email = get_jwt_identity()
    current_user = User.get_by_email(current_email)

    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if current_user.id != user_id and not current_user.has_role("teacher", "admin"):
        return jsonify({"msg": "Insufficient permissions"}), 403

    return jsonify(user_schema.dump(user)), 200


@bp.route("/", methods=["PUT"])
@jwt_required()
def update_current_user():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    try:
        data = user_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify(
            {"msg": "Validation error", "errors": err.messages}
        ), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    if "name" in data:
        user.name = data["name"]

    user.update()

    return jsonify(user_schema.dump(user)), 200


@bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    name = request.form.get("name")
    profile_picture = request.files.get("profile_picture")

    if name is not None:
        cleaned_name = name.strip()
        if not cleaned_name:
            return jsonify({"msg": "Name cannot be empty"}), 400
        if len(cleaned_name) > 255:
            return jsonify({"msg": "Name is too long"}), 400
        user.name = cleaned_name

    if profile_picture:
        if profile_picture.filename == "":
            return jsonify({"msg": "No selected file"}), 400

        if not allowed_profile_picture(profile_picture.filename):
            return jsonify({"msg": "Invalid image type"}), 400

        safe_name = secure_filename(profile_picture.filename)
        unique_name = f"{uuid4().hex}_{safe_name}"

        upload_dir = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "profile_pictures",
            str(user.id),
        )
        ensure_upload_dir(upload_dir)

        full_path = os.path.join(upload_dir, unique_name)
        profile_picture.save(full_path)

        user.profile_picture = (
            f"profile_pictures/{user.id}/{unique_name}"
        )

    user.update()

    return jsonify(
        {
            "msg": "Profile updated",
            "user": user_schema.dump(user),
        }
    ), 200


@bp.route("/profile_pictures/<int:user_id>/<filename>", methods=["GET"])
def get_profile_picture(user_id, filename):
    upload_dir = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        "profile_pictures",
        str(user_id),
    )
    return send_from_directory(upload_dir, filename)


@bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    current_email = get_jwt_identity()
    current_user = User.get_by_email(current_email)

    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if current_user.id != user_id and not current_user.is_admin():
        return jsonify({"msg": "Insufficient permissions"}), 403

    user.delete()

    return jsonify({"msg": "User deleted successfully"}), 200


@bp.route("/password", methods=["PATCH"])
@jwt_required()
def change_password():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    current_password = request.json.get("current_password", None)
    new_password = request.json.get("new_password", None)

    if not current_password:
        return jsonify({"msg": "Current password is required"}), 400
    if not new_password:
        return jsonify({"msg": "New password is required"}), 400
    if len(new_password) < 6:
        return jsonify(
            {"msg": "New password must be at least 6 characters"}
        ), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not check_password_hash(user.hash_pass, current_password):
        return jsonify({"msg": "Current password is incorrect"}), 401

    user.hash_pass = generate_password_hash(new_password)
    user.must_change_password = False
    user.update()

    return jsonify({"msg": "Password updated successfully"}), 200