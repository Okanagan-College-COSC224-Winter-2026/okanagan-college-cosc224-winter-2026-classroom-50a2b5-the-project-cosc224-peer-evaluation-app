"""
Tests for classes endpoints
"""
import json

def test_create_classes(test_client, make_admin):
    """
    GIVEN a logged-in teacher user
    WHEN POST /class/create_class is called with valid data
    THEN a new class should be created
    """
    # Set the admin user by default into the database
    make_admin(email='admin@example.com', password='admin', name='adminuser')

    # Login as teacher/admin
    test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'admin@example.com', 'password': 'admin'}),
        headers={'Content-Type': 'application/json'}
    )
    response = test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Content-Type': 'application/json'
        }
    )

    assert response.status_code == 201
    assert response.json['msg'] == 'Class created'
    assert 'id' in response.json['class']

def test_create_class_not_teacher(test_client):
    """
    GIVEN a logged-in non-teacher user
    WHEN POST /class/create_class is called
    THEN the request should be forbidden
    """
    # Register and login as non-teacher
    test_client.post(
        '/auth/register',
        data=json.dumps({
            'name': 'studentuser',
            'password': '123456',
            'email': 'student@example.com'
        }),
        headers={'Content-Type': 'application/json'}
    )
    test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'student@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    # Attempt to create class
    response = test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Content-Type': 'application/json'
        }
    )
    assert response.status_code == 403
    assert response.json['msg'] == 'Insufficient permissions'

def test_get_classes(test_client, make_admin):
    """
    GIVEN a logged-in teacher user with existing classes
    WHEN GET /class/classes is called
    THEN the list of classes should be returned
    """

    # Set the admin user by default into the database
    make_admin(email='admin@example.com', password='admin', name='adminuser')

    # Login as teacher/admin
    test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'admin@example.com', 'password': 'admin'}),
        headers={'Content-Type': 'application/json'}
    )
    # Create a class
    test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Content-Type': 'application/json'
        }
    )
    # Get classes
    response = test_client.get(
        '/class/classes',
        headers={
            'Content-Type': 'application/json'
        }
    )
    assert response.status_code == 200
    classes = response.json
    assert any(c['name'] == 'Math 101' for c in classes)
    assert len(classes) >= 1