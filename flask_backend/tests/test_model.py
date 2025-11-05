from io import BytesIO
from werkzeug.security import generate_password_hash

from api.models import User, Post, Message


def test_user_basic(dbsession):
    """
    GIVEN a new user object
    WHEN the user is created and added to the database
    THEN the user should have correct default values
    """
    user1 = User(
        user_name='testuser',
        password=generate_password_hash('123456'),
        first_name="Test",
        last_name="User",
        email="test@example.com"
    )
    dbsession.add(user1)
    dbsession.flush()
    
    assert user1.id is not None
    assert user1.user_name == 'testuser'
    assert user1.role == User.ROLE_USER  # Default role
    assert user1.is_active is True


def test_user_roles(dbsession):
    """
    GIVEN an admin user and a regular user
    WHEN role checks are performed
    THEN the correct role permissions should be returned
    """
    admin_user = User(
        user_name='admin',
        password=generate_password_hash('admin123'),
        first_name="Admin",
        last_name="User",
        email="admin@example.com",
        role=User.ROLE_ADMIN
    )
    
    regular_user = User(
        user_name='regular',
        password=generate_password_hash('regular123'),
        first_name="Regular",
        last_name="User",
        email="regular@example.com"
    )
    
    dbsession.add(admin_user)
    dbsession.add(regular_user)
    dbsession.flush()
    
    assert admin_user.is_admin() is True
    assert admin_user.has_role(User.ROLE_ADMIN) is True
    assert regular_user.is_admin() is False
    assert regular_user.has_role(User.ROLE_USER) is True


def test_user_methods(dbsession):
    """
    GIVEN a user in the database
    WHEN querying by username, ID, or email
    THEN the correct user should be retrieved
    """
    user = User(
        user_name='methodtest',
        password=generate_password_hash('123456'),
        first_name="Method",
        last_name="Test",
        email="method@example.com"
    )
    dbsession.add(user)
    dbsession.commit()
    
    # Test get_by_username
    found_user = User.get_by_username('methodtest')
    assert found_user is not None
    assert found_user.user_name == 'methodtest'
    
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
        user_name='legacy',
        password=generate_password_hash('123456'),
        first_name="Legacy",
        last_name="User",
        email="legacy@example.com"
    )
    dbsession.add(user)
    dbsession.commit()
    
    # Test old method names still work
    found = User.get_member('legacy')
    assert found is not None
    assert found.user_name == 'legacy'
    
    found_by_id = User.get_member_by_id(user.id)
    assert found_by_id is not None


def test_message_attachment(dbsession):
    """
    GIVEN a message with an attachment
    WHEN the attachment is set and stored
    THEN the attachment should be stored as base64 in JSON format
    """
    message1 = Message(title="example1", body="this is example")
    sample_content = b'Simple text.'

    # Setting the attachment should store base64 content into JSON column
    message1.attachment = BytesIO(sample_content)
    dbsession.add(message1)
    dbsession.flush()
    assert message1.attachment is not None
    assert 'content_base64' in message1.attachment

