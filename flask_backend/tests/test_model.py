from io import BytesIO
from werkzeug.security import generate_password_hash

from api.models import User


def test_user_basic(dbsession):
    """
    GIVEN a new user object
    WHEN the user is created and added to the database
    THEN the user should have correct default values
    """
    user1 = User(
        name='testuser',
        hash_pass=generate_password_hash('123456'),
        email="test@example.com"
    )
    dbsession.add(user1)
    dbsession.flush()
    
    assert user1.id is not None
    assert user1.name == 'testuser'
    assert user1.is_teacher is False


def test_user_roles(dbsession):
    """
    GIVEN an admin user and a regular user
    WHEN role checks are performed
    THEN the correct role permissions should be returned
    """
    teacher_user = User(
        name='teacher',
        hash_pass=generate_password_hash('admin123'),
        email="admin@example.com",
        is_teacher=True
    )
    
    regular_user = User(
        name='regular',
        hash_pass=generate_password_hash('regular123'),
        email="regular@example.com",
        is_teacher=False
    )

    dbsession.add(teacher_user)
    dbsession.add(regular_user)
    dbsession.flush()

    assert teacher_user.is_teacher_user() is True
    assert regular_user.is_teacher_user() is False


def test_user_methods(dbsession):
    """
    GIVEN a user in the database
    WHEN querying by username, ID, or email
    THEN the correct user should be retrieved
    """
    user = User(
        name='methodtest',
        hash_pass=generate_password_hash('123456'),
        email="method@example.com",
        is_teacher=False
    )
    dbsession.add(user)
    dbsession.commit()
    
    # Test get_by_email
    found_user = User.get_by_email('method@example.com')
    assert found_user is not None
    assert found_user.name == 'methodtest'

    # Test get_by_id
    found_user_by_id = User.get_by_id(user.id)
    assert found_user_by_id is not None
    assert found_user_by_id.id == user.id
    
    # Test get_by_email
    found_user_by_email = User.get_by_email('method@example.com')
    assert found_user_by_email is not None
    assert found_user_by_email.email == 'method@example.com'


def test_user_backward_compatibility(dbsession):
    """
    GIVEN a user in the database
    WHEN using legacy method names
    THEN the user should still be retrieved correctly
    """
    user = User(
        name='legacy',
        hash_pass=generate_password_hash('123456'),
        email="legacy@example.com"
    )
    dbsession.add(user)
    dbsession.commit()
    
    # Test old method names still work
    found = User.get_member_by_email('legacy@example.com')
    assert found is not None
    assert found.email == 'legacy@example.com'
    
    found_by_id = User.get_member_by_id(user.id)
    assert found_by_id is not None

