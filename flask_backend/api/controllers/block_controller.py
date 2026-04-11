"""
Block controller.

Manages a teacher's list of blocked students.

Endpoints:
  GET    /block/               — List teacher's blocked students
  DELETE /block/<student_id>   — Unblock a student
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import BlockedStudent, BlockedStudentSchema, User
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("block", __name__, url_prefix="/block")

blocked_schema = BlockedStudentSchema(many=True)


@bp.route("/", methods=["GET"])
@jwt_teacher_required
def list_blocked():
    """Return all students blocked by the current teacher."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    blocked = BlockedStudent.get_for_teacher(user.id)
    return jsonify(blocked_schema.dump(blocked)), 200


@bp.route("/<int:student_id>", methods=["DELETE"])
@jwt_teacher_required
def unblock_student(student_id):
    """Remove a student from the teacher's block list."""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    block = BlockedStudent.get_block(user.id, student_id)
    if not block:
        return jsonify({"msg": "Student is not blocked"}), 404

    db.session.delete(block)
    db.session.commit()
    return jsonify({"msg": "Student unblocked"}), 200
