import pytest

def test_practice_get(test_client):
    response = test_client.get('/api/v1/practice/test')
    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert 'course' in data
    assert data['course'] == 'cosc 224'

