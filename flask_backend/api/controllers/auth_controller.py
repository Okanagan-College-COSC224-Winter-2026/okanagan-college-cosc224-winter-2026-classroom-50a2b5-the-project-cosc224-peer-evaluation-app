import functools

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from ..models import User, db


bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user account"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    name = request.json.get('name', None)
    password = request.json.get('password', None)
    email = request.json.get('email', None)
    is_teacher = request.json.get('is_teacher', False)

    if not name:
        return jsonify({"msg": "Name is required"}), 400
    if not password:
        return jsonify({"msg": "Password is required"}), 400
    if not email:
        return jsonify({"msg": "Email is required"}), 400
    if not is_teacher:
        is_teacher = False

    # Check if user already exists
    existing_user = User.get_member_by_email(email)
    if existing_user:
        return jsonify({"msg": f"User with email {email} is already registered"}), 400

    # Create new user
    new_user = User(
        name=name,
        hash_pass=generate_password_hash(password),
        email=email,
        is_teacher=is_teacher
    )
    User.add_member(new_user)
    
    return jsonify({"msg": "User registered successfully"}), 201


@bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if email is None or password is None:
        return jsonify({"msg": "Email and password are required"}), 400

    # Verify credentials
    user = User.get_member_by_email(email)
    if user is None or not check_password_hash(user.hash_pass, password):
        return jsonify({"msg": "Bad email or password"}), 401

    # Generate access token
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout endpoint (JWT is stateless, so this is mainly for consistency)
    Client should discard the token on logout
    """
    return jsonify({"msg": "Successfully logged out"}), 200


# JWT-based decorators for API protection
def jwt_role_required(*roles):
    """Decorator to require specific role(s) for JWT-protected endpoints"""
    def decorator(view):
        @functools.wraps(view)
        @jwt_required()
        def wrapped_view(*args, **kwargs):
            current_email = get_jwt_identity()
            user = None

            if hasattr(User, "get_member_by_email"):
                user = User.get_member_by_email(current_email)
            elif hasattr(User, "get_by_email"):
                user = User.get_by_email(current_email)
            else:
                try:
                    user = User.query.filter_by(email=current_email).first()
                except Exception:
                    user = None
            
            if not user:
                return jsonify({"msg": "User not found"}), 404
            
            # Check teacher flag if requested
            if 'teacher' in roles:
                if not getattr(user, 'is_teacher', False):
                    return jsonify({"msg": "Insufficient permissions"}), 403
                return view(*roles, **kwargs)

            # fallback to checking a role attribute if present
            if roles:
                user_role = getattr(user, 'role', None)
                if user_role is None or user_role not in roles:
                    return jsonify({"msg": "Insufficient permissions"}), 403

            return view(*args, **kwargs)
        return wrapped_view
    return decorator


def jwt_admin_required(view):
    """Decorator to require admin role for JWT-protected endpoints"""
    return jwt_role_required('teacher')(view)
