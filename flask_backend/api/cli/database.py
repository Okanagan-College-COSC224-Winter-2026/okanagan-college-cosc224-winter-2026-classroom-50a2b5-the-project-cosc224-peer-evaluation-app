import click
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash

from ..models.db import db
from ..models import User


@click.command('init_db')
@with_appcontext
def init_db_command():
    """Initialize the database"""
    db.create_all()
    click.echo('Database is created')


@click.command('drop_db')
@with_appcontext
def drop_db_command():
    """Drop all database tables"""
    if click.confirm('Are you sure you want to drop all tables?'):
        db.drop_all()
        click.echo('Database tables dropped')


@click.command('add_users')
@with_appcontext
def add_users_command():
    """Add sample users to the database"""
    # Regular user
    user1_dict = {
        "user_name": "example",
        "password": generate_password_hash("123456", method="pbkdf2:sha256"),
        "first_name": "example",
        "last_name": "example",
        "phone_number": "123456",
        "email": "example@example.com",
        "role": User.ROLE_USER
    }
    
    # Admin user
    user2_dict = {
        "user_name": "admin",
        "password": generate_password_hash("123456", method="pbkdf2:sha256"),
        "first_name": "admin",
        "last_name": "admin",
        "phone_number": "123456",
        "email": "admin@example.com",
        "role": User.ROLE_ADMIN
    }
    
    # Moderator user
    user3_dict = {
        "user_name": "moderator",
        "password": generate_password_hash("123456", method="pbkdf2:sha256"),
        "first_name": "moderator",
        "last_name": "moderator",
        "phone_number": "123456",
        "email": "moderator@example.com",
        "role": User.ROLE_MODERATOR
    }
    
    if not User.get_by_username(user1_dict["user_name"]):
        user1 = User(**user1_dict)
        User.create_user(user1)
        click.echo(f"User '{user1.user_name}' created with role '{user1.role}'")
    
    if not User.get_by_username(user2_dict["user_name"]):
        user2 = User(**user2_dict)
        User.create_user(user2)
        click.echo(f"User '{user2.user_name}' created with role '{user2.role}'")
    
    if not User.get_by_username(user3_dict["user_name"]):
        user3 = User(**user3_dict)
        User.create_user(user3)
        click.echo(f"User '{user3.user_name}' created with role '{user3.role}'")


# Backward compatibility alias
@click.command('add_members')
@with_appcontext
def db_mock_command():
    """Legacy command: Add sample users (calls add_users)"""
    click.echo("Note: 'add_members' is deprecated, use 'add_users' instead")
    ctx = click.get_current_context()
    ctx.invoke(add_users_command)


def init_app(app):
    """Register CLI commands with the Flask app"""
    app.cli.add_command(init_db_command)
    app.cli.add_command(drop_db_command)
    app.cli.add_command(add_users_command)
    app.cli.add_command(db_mock_command)  # Keep for backward compatibility
