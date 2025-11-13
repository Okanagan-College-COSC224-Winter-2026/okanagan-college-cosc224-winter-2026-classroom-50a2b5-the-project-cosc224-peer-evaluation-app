import functools

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies

from ..models import User, db


bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user account (student only - teachers/admins created by admins)"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    name = request.json.get('name', None)
    password = request.json.get('password', None)
    email = request.json.get('email', None)
    
    # Public registration is for students only
    # Teachers and admins must be created by existing admins
    role = 'student'

    if not name:
        return jsonify({"msg": "Name is required"}), 400
    if not password:
        return jsonify({"msg": "Password is required"}), 400
    if not email:
        return jsonify({"msg": "Email is required"}), 400

    # Check if user already exists
    existing_user = User.get_by_email(email)
    if existing_user:
        return jsonify({"msg": f"User with email {email} is already registered"}), 400

    # Create new user
    new_user = User(
        name=name,
        hash_pass=generate_password_hash(password),
        email=email,
        role=role
    )
    User.create_user(new_user)
    
    return jsonify({"msg": "User registered successfully"}), 201


@bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token in httponly cookie"""
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if email is None or password is None:
        return jsonify({"msg": "Email and password are required"}), 400

    # Verify credentials
    user = User.get_by_email(email)
    if user is None or not check_password_hash(user.hash_pass, password):
        return jsonify({"msg": "Bad email or password"}), 401

    # Generate access token with additional claims
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=email, additional_claims=additional_claims)
    
    # Create response with user info (but not the token)
    response = jsonify(
        role=user.role,
        user_id=user.id,
        name=user.name,
        msg="Login successful"
    )
    
    # Set the JWT token as an httponly cookie
    set_access_cookies(response, access_token)
    
    return response, 200


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout endpoint - clears the JWT cookie
    """
    response = jsonify({"msg": "Successfully logged out"})
    unset_jwt_cookies(response)
    return response, 200


# JWT-based decorators for API protection
def jwt_role_required(*roles):
    """Decorator to require specific role(s) for JWT-protected endpoints
    
    Usage:
        @jwt_role_required('admin')  # Only admins
        @jwt_role_required('teacher', 'admin')  # Teachers or admins
        @jwt_role_required('student', 'teacher', 'admin')  # Any authenticated user
    """
    def decorator(view):
        @functools.wraps(view)
        @jwt_required()
        def wrapped_view(*args, **kwargs):
            current_email = get_jwt_identity()
            user = User.get_by_email(current_email)
            
            if not user:
                return jsonify({"msg": "User not found"}), 404
            
            # Check if user has one of the required roles
            if roles and not user.has_role(*roles):
                return jsonify({"msg": "Insufficient permissions"}), 403

            return view(*args, **kwargs)
        return wrapped_view
    return decorator


def jwt_admin_required(view):
    """Decorator to require admin role for JWT-protected endpoints"""
    return jwt_role_required('admin')(view)


def jwt_teacher_required(view):
    """Decorator to require teacher or admin role for JWT-protected endpoints"""
    return jwt_role_required('teacher', 'admin')(view)
