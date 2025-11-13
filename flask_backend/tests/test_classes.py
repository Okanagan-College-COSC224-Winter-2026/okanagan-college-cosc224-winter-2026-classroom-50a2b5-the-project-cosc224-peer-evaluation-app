"""
Tests for classes endpoints
"""
import json

def test_create_classes(test_client):
    """
    GIVEN a logged-in teacher user
    WHEN POST /class/create_class is called with valid data
    THEN a new class should be created
    """
    # Register and login as teacher
    test_client.post(
        '/auth/register',
        data=json.dumps({
            'name': 'teacheruser',
            'password': '123456',
            'email': 'teacher@example.com',
            'is_teacher': True
        }),
        headers={'Content-Type': 'application/json'}
    )
    login_response = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'teacher@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    token = login_response.json['access_token']
    # Create class
    response = test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Authorization': f'Bearer {token}',
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
            'email': 'student@example.com',
            'is_teacher': False
        }),
        headers={'Content-Type': 'application/json'}
    )
    login_response = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'student@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    token = login_response.json['access_token']
    # Attempt to create class
    response = test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    assert response.status_code == 403
    assert response.json['msg'] == 'Insufficient permissions'

def test_get_classes(test_client):
    """
    GIVEN a logged-in teacher user with existing classes
    WHEN GET /class/classes is called
    THEN the list of classes should be returned
    """
    # Register and login as teacher
    test_client.post(
        '/auth/register',
        data=json.dumps({
            'name': 'teacheruser2',
            'password': '123456',
            'email': 'teacher2@example.com',
            'is_teacher': True
        }),
        headers={'Content-Type': 'application/json'}
    )
    login_response = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'teacher2@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    token = login_response.json['access_token']
    # Create a class
    test_client.post(
        '/class/create_class',
        data=json.dumps({'name': 'Math 101'}),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    # Get classes
    response = test_client.get(
        '/class/classes',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    assert response.status_code == 200
    classes = response.json
    assert any(c['name'] == 'Math 101' for c in classes)
    assert len(classes) >= 1