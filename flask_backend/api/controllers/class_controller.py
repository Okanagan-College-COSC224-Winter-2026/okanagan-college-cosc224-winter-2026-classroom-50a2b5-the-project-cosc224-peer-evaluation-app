from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .auth_controller import jwt_admin_required

from ..models import db, User, Course

bp = Blueprint('class', __name__, url_prefix='/class')

@bp.route('/create_class', methods=['POST'])
@jwt_required()
@jwt_admin_required
def create_class():
    """Create a new class where the authenticated user is the teacher"""
    data = request.get_json()
    class_name = data.get('name')
    if not class_name:
        return jsonify({"msg": "Class name is required"}), 400
    
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    existing_class = Course.get_by_name(class_name)
    if existing_class:
        return jsonify({"msg": "Class already exists"}), 400

    new_class = Course(teacherID=user.id, name=class_name)
    Course.create_course(new_class)
    return jsonify({"msg": "Class created", "class": {"id": new_class.id}}), 201


@bp.route('/classes', methods=['GET'])
@jwt_required()
def get_classes():
    """Retrieve all classes"""
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    classes = Course.get_all_courses()
    return jsonify([{"id": c.id, "name": c.name} for c in classes]), 200