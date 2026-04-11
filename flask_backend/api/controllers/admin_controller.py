"""
Admin management endpoints.

Permission matrix
─────────────────────────────────────────────────────────────────
Action                    │ super_admin │ admin │ teacher │ student
──────────────────────────┼─────────────┼───────┼─────────┼────────
List all users            │     ✓       │   ✓   │    ✗    │   ✗
Create student/teacher    │     ✓       │   ✓   │    ✗    │   ✗
Create admin              │     ✓       │   ✗   │    ✗    │   ✗
Create super_admin        │     ✓       │   ✗   │    ✗    │   ✗
Edit student/teacher      │     ✓       │   ✓   │    ✗    │   ✗
Edit admin                │     ✓       │   ✗   │    ✗    │   ✗
Edit super_admin          │     ✗       │   ✗   │    ✗    │   ✗
Delete student/teacher    │     ✓       │   ✓   │    ✗    │   ✗
Delete admin              │     ✓       │   ✗   │    ✗    │   ✗
Delete super_admin        │     ✗       │   ✗   │    ✗    │   ✗
Assign admin role         │     ✓       │   ✗   │    ✗    │   ✗
Assign super_admin role   │     ✗       │   ✗   │    ✗    │   ✗
"""

import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from werkzeug.security import generate_password_hash

from ..models import AuditLog, User, UserSchema
from ..models.db import db
from .auth_controller import jwt_admin_required

bp = Blueprint("admin", __name__, url_prefix="/admin")

# Roles that admins (non-super) are allowed to create / edit / delete
_ADMIN_MANAGEABLE_ROLES = {"student", "teacher"}
# Roles that nobody can assign via the API (super_admin is set only via CLI/DB)
_FORBIDDEN_ASSIGN_ROLES = {"super_admin"}


def _get_actor():
    """Return the currently-authenticated User object."""
    return User.get_by_email(get_jwt_identity())


def _can_actor_manage_target(actor: User, target: User) -> tuple[bool, str]:
    """
    Return (allowed, error_message).
    Super admin is completely protected — nobody can modify them.
    Admin-level accounts can only be touched by super_admin.
    """
    if target.is_super_admin():
        return False, "Super Admin accounts cannot be modified by anyone"
    if target.is_admin() and not actor.is_super_admin():
        return False, "Admin accounts can only be managed by Super Admin"
    return True, ""


def _can_actor_assign_role(actor: User, role: str) -> tuple[bool, str]:
    """
    Return (allowed, error_message).
    Only super_admin may assign the admin role.
    Nobody may assign super_admin.
    """
    if role in _FORBIDDEN_ASSIGN_ROLES:
        return False, "The super_admin role cannot be assigned via the API"
    if role == "admin" and not actor.is_super_admin():
        return False, "Only Super Admin can assign the admin role"
    return True, ""


@bp.route("/users", methods=["GET"])
@jwt_admin_required
def list_all_users():
    """List all users (admin + super_admin only)."""
    users = User.query.all()
    return jsonify(UserSchema(many=True).dump(users)), 200


@bp.route("/users/create", methods=["POST"])
@jwt_admin_required
def create_user():
    """Create a new user.

    Admin: student and teacher only.
    Super Admin: student, teacher, and admin.
    Nobody can create a super_admin via the API.
    """
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    actor = _get_actor()
    if not actor:
        return jsonify({"msg": "Actor not found"}), 404

    name = request.json.get("name")
    password = request.json.get("password")
    email = request.json.get("email")
    role = request.json.get("role", "student")
    must_change_password = request.json.get("must_change_password", False)

    if not name:
        return jsonify({"msg": "Name is required"}), 400
    if not password:
        return jsonify({"msg": "Password is required"}), 400
    if not email:
        return jsonify({"msg": "Email is required"}), 400

    # Validate role value
    valid_roles = {"student", "teacher", "admin", "super_admin"}
    if role not in valid_roles:
        return jsonify({"msg": f"Invalid role. Must be one of: {', '.join(sorted(valid_roles - {'super_admin'}))}"}), 400

    # Enforce role-assignment permissions
    allowed, err = _can_actor_assign_role(actor, role)
    if not allowed:
        return jsonify({"msg": err}), 403

    # Non-super admins cannot create admin accounts
    if role not in _ADMIN_MANAGEABLE_ROLES and not actor.is_super_admin():
        return jsonify({"msg": "Admins can only create student or teacher accounts"}), 403

    existing_user = User.get_by_email(email)
    if existing_user:
        return jsonify({"msg": f"User with email {email} is already registered"}), 400

    new_user = User(
        name=name,
        hash_pass=generate_password_hash(password),
        email=email,
        role=role,
        must_change_password=must_change_password,
    )
    db.session.add(new_user)

    AuditLog.log(
        actor=actor,
        action="create_user",
        target=new_user,
        detail=json.dumps({"role": role}),
    )

    db.session.commit()

    return (
        jsonify(
            {
                "msg": f"{role.capitalize()} account created successfully",
                "user": UserSchema().dump(new_user),
            }
        ),
        201,
    )


@bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_admin_required
def update_user(user_id):
    """Update a user's name, email, and/or role.

    Admin: can only edit student/teacher; cannot assign admin role.
    Super Admin: can edit anyone except super_admin accounts.
    """
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    actor = _get_actor()
    if not actor:
        return jsonify({"msg": "Actor not found"}), 404

    target = User.get_by_id(user_id)
    if not target:
        return jsonify({"msg": "User not found"}), 404

    # Permission check on target
    allowed, err = _can_actor_manage_target(actor, target)
    if not allowed:
        return jsonify({"msg": err}), 403

    name = request.json.get("name")
    email = request.json.get("email")
    role = request.json.get("role")

    if role:
        valid_roles = {"student", "teacher", "admin", "super_admin"}
        if role not in valid_roles:
            return jsonify({"msg": f"Invalid role. Must be one of: {', '.join(sorted(valid_roles - {'super_admin'}))}"}), 400

        allowed_role, err_role = _can_actor_assign_role(actor, role)
        if not allowed_role:
            return jsonify({"msg": err_role}), 403

        # Admin cannot demote/change their own role
        if actor.id == user_id and not actor.is_super_admin():
            return jsonify({"msg": "Cannot change your own role"}), 400

    if email and email != target.email:
        existing = User.get_by_email(email)
        if existing:
            return jsonify({"msg": f"User with email {email} is already registered"}), 400

    changes = {}
    if name and name != target.name:
        changes["name"] = {"from": target.name, "to": name}
        target.name = name
    if email and email != target.email:
        changes["email"] = {"from": target.email, "to": email}
        target.email = email
    if role and role != target.role:
        changes["role"] = {"from": target.role, "to": role}
        target.role = role

    action = "change_role" if "role" in changes else "update_user"
    AuditLog.log(actor=actor, action=action, target=target, detail=json.dumps(changes))

    db.session.commit()

    return (
        jsonify({"msg": "User updated successfully", "user": UserSchema().dump(target)}),
        200,
    )


@bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_admin_required
def update_user_role(user_id):
    """Update a user's role only.

    Admin: can set student ↔ teacher only.
    Super Admin: can set student / teacher / admin.
    Nobody can set super_admin.
    """
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    actor = _get_actor()
    if not actor:
        return jsonify({"msg": "Actor not found"}), 404

    new_role = request.json.get("role")
    if not new_role:
        return jsonify({"msg": "Role is required"}), 400

    valid_roles = {"student", "teacher", "admin", "super_admin"}
    if new_role not in valid_roles:
        return jsonify({"msg": f"Invalid role. Must be one of: {', '.join(sorted(valid_roles - {'super_admin'}))}"}), 400

    allowed_role, err_role = _can_actor_assign_role(actor, new_role)
    if not allowed_role:
        return jsonify({"msg": err_role}), 403

    target = User.get_by_id(user_id)
    if not target:
        return jsonify({"msg": "User not found"}), 404

    allowed, err = _can_actor_manage_target(actor, target)
    if not allowed:
        return jsonify({"msg": err}), 403

    if actor.id == user_id:
        return jsonify({"msg": "Cannot change your own role"}), 400

    old_role = target.role
    target.role = new_role

    AuditLog.log(
        actor=actor,
        action="change_role",
        target=target,
        detail=json.dumps({"from": old_role, "to": new_role}),
    )

    db.session.commit()

    return (
        jsonify({"msg": f"User role updated from {old_role} to {new_role}", "user": UserSchema().dump(target)}),
        200,
    )


@bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_admin_required
def delete_user(user_id):
    """Delete a user.

    Admin: can delete student/teacher only.
    Super Admin: can delete anyone except super_admin accounts.
    """
    actor = _get_actor()
    if not actor:
        return jsonify({"msg": "Actor not found"}), 404

    if actor.id == user_id:
        return jsonify({"msg": "Cannot delete your own account"}), 400

    target = User.get_by_id(user_id)
    if not target:
        return jsonify({"msg": "User not found"}), 404

    allowed, err = _can_actor_manage_target(actor, target)
    if not allowed:
        return jsonify({"msg": err}), 403

    AuditLog.log(
        actor=actor,
        action="delete_user",
        target=target,
        detail=json.dumps({"role": target.role, "name": target.name}),
    )

    target.delete()
    # target.delete() already commits

    return jsonify({"msg": "User deleted successfully"}), 200


@bp.route("/audit-log", methods=["GET"])
@jwt_admin_required
def get_audit_log():
    """Return the audit log (admin + super_admin only; super_admin sees full log)."""
    from ..models.audit_log_model import AuditLog as AL

    actor = _get_actor()
    if not actor:
        return jsonify({"msg": "Actor not found"}), 404

    entries = AL.query.order_by(AL.timestamp.desc()).limit(500).all()
    return jsonify(
        [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "actor_email": e.actor_email,
                "action": e.action,
                "target_email": e.target_email,
                "detail": e.detail,
            }
            for e in entries
        ]
    ), 200
