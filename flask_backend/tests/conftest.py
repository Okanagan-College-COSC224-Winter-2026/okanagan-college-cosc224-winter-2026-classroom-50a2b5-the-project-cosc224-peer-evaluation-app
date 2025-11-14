import pytest
from werkzeug.security import generate_password_hash

from api import create_app
from api.models import User
from api.models.db import db as _db

base_url = "http://localhost:5000/assets"
TEMP_PATH = "/tmp/sqlalchemy-media"


@pytest.fixture(scope="session")
def app():
    """Create application for the tests."""
    _app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SECRET_KEY": "test-secret",
            "JWT_SECRET_KEY": "test-jwt-secret",
        }
    )

    # Create the database and tables
    with _app.app_context():
        _db.create_all()

    yield _app

    # Cleanup
    with _app.app_context():
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    """Create a fresh database session for each test."""
    with app.app_context():
        # Clear all data from tables
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()

        yield _db

        # Cleanup after test
        _db.session.rollback()


@pytest.fixture(scope="function")
def dbsession(db):
    """Returns the database session (alias for db fixture)."""
    return db.session


@pytest.fixture(scope="function")
def test_client(app, db):
    """Create a test client for the app."""
    with app.test_client() as testing_client:
        with app.app_context():
            yield testing_client


@pytest.fixture
def make_admin():
    """Fixture to create an admin user in the database."""

    def _make_admin(email="admin@example.com", password="admin", name="Admin User"):
        user = User(
            name=name, email=email, hash_pass=generate_password_hash(password), role="admin"
        )
        _db.session.add(user)
        _db.session.commit()
        return user

    return _make_admin
