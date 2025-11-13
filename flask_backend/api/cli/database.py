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
    # Create mock users that match the User model: (name, email, hash_pass, role)
    sample_users = [
        {"name": "Example Student", "email": "student@example.com", "password": "123456", "role": "student"},
        {"name": "Example Teacher", "email": "teacher@example.com", "password": "123456", "role": "teacher"},
        {"name": "Example Admin", "email": "admin@example.com", "password": "123456", "role": "admin"},
    ]

    for u in sample_users:
        # check existence by email
        if not User.get_by_email(u["email"]):
            hashed = generate_password_hash(u["password"], method="pbkdf2:sha256")
            user = User(name=u["name"], email=u["email"], hash_pass=hashed, role=u["role"])
            User.create_user(user)
            click.echo(f"User '{user.email}' created (role={user.role})")
        else:
            click.echo(f"User '{u['email']}' already exists")


@click.command('create_admin')
@with_appcontext
def create_admin_command():
    """Create an admin user"""
    name = click.prompt('Admin name')
    email = click.prompt('Admin email')
    password = click.prompt('Password', hide_input=True, confirmation_prompt=True)
    
    # Check if user already exists
    if User.get_by_email(email):
        click.echo(f"Error: User with email '{email}' already exists", err=True)
        return
    
    # Create admin user
    hashed = generate_password_hash(password, method="pbkdf2:sha256")
    admin = User(name=name, email=email, hash_pass=hashed, role='admin')
    User.create_user(admin)
    click.echo(f"Admin user '{email}' created successfully")


def init_app(app):
    """Register CLI commands with the Flask app"""
    app.cli.add_command(init_db_command)
    app.cli.add_command(drop_db_command)
    app.cli.add_command(add_users_command)
    app.cli.add_command(create_admin_command)
