import functools
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .cli import init_app
from .controllers.admin_controller import bp as admin_bp
from .controllers.auth_controller import bp as auth_bp
from .controllers.class_controller import bp as class_bp
from .controllers.fake_api_controller import fake as fake_api_bp
from .controllers.user_controller import bp as user_bp
from .controllers.assignment_controller import bp as assignment_bp
from .controllers.student_controller import student_bp
from .controllers.review_controller import review_bp
from .controllers.group_controller import group_bp
from .controllers.file_controller import file_bp
from .controllers.review_file_controller import review_file_bp
from .controllers.message_controller import message_bp
from .models.db import db, ma


def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, instance_relative_config=True)

    is_production = (
        os.environ.get("FLASK_ENV") == "production"
        or os.environ.get("PRODUCTION", "false").lower() == "true"
    )

    if is_production:
        required_secrets = ["SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL"]
        missing = [key for key in required_secrets if not os.environ.get(key)]
        if missing:
            raise RuntimeError(
                f"Production mode requires these environment variables: {', '.join(missing)}"
            )

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL", "sqlite:///" + os.path.join(app.instance_path, "app.sqlite")
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret"),
        JWT_TOKEN_LOCATION=["cookies"],
        JWT_COOKIE_SECURE=is_production,
        JWT_COOKIE_CSRF_PROTECT=is_production,
        JWT_COOKIE_SAMESITE="Strict" if is_production else "Lax",
        JWT_ACCESS_COOKIE_PATH="/",
        JWT_COOKIE_DOMAIN=os.environ.get("JWT_COOKIE_DOMAIN", None),
    )

    if test_config is None:
        app.config.from_pyfile("config.py", silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    ma.init_app(app)

    jwt = JWTManager()
    jwt.init_app(app)

    cors_origins = (
        os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
        if os.environ.get("CORS_ORIGINS")
        else ["http://localhost:3000", "http://localhost:5173"]
    )
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "X-CSRF-TOKEN"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    @app.route("/hello")
    def hello():
        return {"message": "Hello, World!"}

    init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(assignment_bp)
    app.register_blueprint(fake_api_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(review_file_bp)
    app.register_blueprint(message_bp)

    return app