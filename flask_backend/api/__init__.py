import os
import functools

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager

from .controllers import auth_controller, fake_api_controller, user_controller
from .cli import init_app
from .models.db import db, ma


def create_app(test_config=None):
    """Create and configure the Flask application"""
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Default configuration
    app.config.from_mapping(
        SECRET_KEY='dev',
        # A local sqlite database stored in the instance folder for development
        # For production, set the DATABASE_URL environment variable to the database URI
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(app.instance_path, 'app.sqlite')),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY='dev-jwt-secret'  # Change in production
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    
    jwt = JWTManager()
    jwt.init_app(app)

    # a simple page that says hello
    @app.route('/hello')
    def hello():
        return {'message': 'Hello, World!'}

    # Initialize CLI commands
    init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_controller.bp)
    app.register_blueprint(user_controller.bp)
    app.register_blueprint(fake_api_controller.fake)

    return app
