
import os
import zipfile
import json

from werkzeug.datastructures import FileStorage


CURRENT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def test_register(test_client):
    """
    GIVEN POST /auth/register
    WHEN a username and password are provided
    THEN a new user should be created
    """
    response = test_client.post(
        '/auth/register',
        data=json.dumps({'name': 'testuser', 'password': '123456', 'email': 'test@example.com'}),
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 201
    assert response.json['msg'] == 'User registered successfully'


def test_register_duplicate(test_client):
    """
    GIVEN POST /auth/register
    WHEN registering a user that already exists
    THEN it should return an error
    """
    # Create first user
    test_client.post(
        '/auth/register',
        data=json.dumps({'name': 'testuser', 'password': '123456', 'email': 'test@example.com'}),
        headers={'Content-Type': 'application/json'}
    )
    
    # Try to create duplicate
    response = test_client.post(
        '/auth/register',
        data=json.dumps({'name': 'testuser', 'password': '123456', 'email': 'test@example.com'}),
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400
    assert 'already registered' in response.json['msg']


def test_login(test_client):
    """
    GIVEN POST /auth/login
    WHEN valid credentials are provided
    THEN an access token should be returned
    """
    # First register a user
    test_client.post(
        '/auth/register',
        data=json.dumps({'name': 'example', 'password': '123456', 'email': 'example@example.com'}),
        headers={'Content-Type': 'application/json'}
    )
    
    # Then login
    token_request = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'example@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    assert token_request.status_code == 200
    assert token_request.json['access_token'] is not None


def test_login_invalid_credentials(test_client):
    """
    GIVEN POST /auth/login
    WHEN invalid credentials are provided
    THEN it should return 401
    """
    response = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'nonexistent@example.com', 'password': 'wrong'}),
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 401
    assert response.json['msg'] == 'Bad email or password'


def test_logout(test_client):
    """
    GIVEN POST /auth/logout with valid JWT
    WHEN the logout endpoint is called
    THEN it should return success
    """
    # Register and login first
    test_client.post(
        '/auth/register',
        data=json.dumps({'name': 'example', 'password': '123456', 'email': 'example@example.com'}),
        headers={'Content-Type': 'application/json'}
    )
    
    token_response = test_client.post(
        '/auth/login',
        data=json.dumps({'email': 'example@example.com', 'password': '123456'}),
        headers={'Content-Type': 'application/json'}
    )
    token = token_response.json['access_token']
    
    # Logout
    response = test_client.post(
        '/auth/logout',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    assert response.json['msg'] == 'Successfully logged out'
