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
    # Create mock users that match the User model: (name, email, hash_pass, is_teacher)
    sample_users = [
        {"name": "Example Student", "email": "example@example.com", "password": "123456", "is_teacher": False},
        {"name": "Admin Teacher", "email": "admin@example.com", "password": "123456", "is_teacher": True},
        {"name": "Moderator User", "email": "moderator@example.com", "password": "123456", "is_teacher": False},
    ]

    for u in sample_users:
        # check existence by email
        if not User.get_by_email(u["email"]):
            hashed = generate_password_hash(u["password"], method="pbkdf2:sha256")
            user = User(name=u["name"], email=u["email"], hash_pass=hashed, is_teacher=u["is_teacher"])
            User.create_user(user)
            click.echo(f"User '{user.email}' created (is_teacher={user.is_teacher})")
        else:
            click.echo(f"User '{u['email']}' already exists")


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
