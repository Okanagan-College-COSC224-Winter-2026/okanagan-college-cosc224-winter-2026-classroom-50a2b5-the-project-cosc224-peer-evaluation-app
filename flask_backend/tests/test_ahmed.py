import pytest


def test_practice_endpoint(test_client):
    """Test GET request to /practice/test"""
    response = test_client.get('/practice/test')
    
    # Assert status code is 200
    assert response.status_code == 200
    
    # Assert response is not null
    assert response.data is not None
    
    # Assert course key exists and has correct value
    json_data = response.get_json()
    assert json_data is not None
    assert 'course' in json_data
    assert json_data['course'] == 'cosc 224'
