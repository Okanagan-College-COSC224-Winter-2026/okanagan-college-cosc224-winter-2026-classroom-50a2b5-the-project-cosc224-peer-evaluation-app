"""
User management endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import User, UserSchema


bp = Blueprint('user', __name__, url_prefix='/user')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user information"""
    username = get_jwt_identity()
    user = User.get_by_username(username)
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    if not user.is_active:
        return jsonify({"msg": "User account is inactive"}), 403

    return jsonify(UserSchema().dump(user)), 200


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_by_id(user_id):
    """Get user by ID (users can view their own info, admins can view anyone)"""
    current_username = get_jwt_identity()
    current_user = User.get_by_username(current_username)
    
    if not current_user:
        return jsonify({"msg": "User not found"}), 404
    if not current_user.is_active:
        return jsonify({"msg": "User account is inactive"}), 403
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Users can view their own info, admins can view anyone
    if current_user.id != user_id and not current_user.is_admin():
        return jsonify({"msg": "Insufficient permissions"}), 403
    
    return jsonify(UserSchema().dump(user)), 200


@bp.route('/', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user information"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
    
    username = get_jwt_identity()
    user = User.get_by_username(username)
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    if not user.is_active:
        return jsonify({"msg": "User account is inactive"}), 403
    
    # Update allowed fields
    if 'first_name' in request.json:
        user.first_name = request.json['first_name']
    if 'last_name' in request.json:
        user.last_name = request.json['last_name']
    if 'email' in request.json:
        user.email = request.json['email']
    if 'phone_number' in request.json:
        user.phone_number = request.json['phone_number']
    
    user.update()
    
    return jsonify(UserSchema().dump(user)), 200


@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only or own account)"""
    current_username = get_jwt_identity()
    current_user = User.get_by_username(current_username)
    
    if not current_user:
        return jsonify({"msg": "User not found"}), 404
    if not current_user.is_active:
        return jsonify({"msg": "User account is inactive"}), 403
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Users can delete their own account, admins can delete anyone
    if current_user.id != user_id and not current_user.is_admin():
        return jsonify({"msg": "Insufficient permissions"}), 403
    
    user.delete()
    
    return jsonify({"msg": "User deleted successfully"}), 200
