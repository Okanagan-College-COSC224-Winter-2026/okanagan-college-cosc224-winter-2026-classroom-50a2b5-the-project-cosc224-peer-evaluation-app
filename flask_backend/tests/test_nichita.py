import json

def test_practice_endpoint(test_client):
    """
    GIVEN GET /practice/test
    WHEN the endpoint is called
    THEN it should return course: cosc 224
    """
    response = test_client.get("/practice/test")
    
    # Assert status code is 200
    assert response.status_code == 200
    
    # Assert response is not null
    assert response.json is not None
    
    # Assert the value for course is present
    assert "course" in response.json
    assert response.json["course"] == "cosc 224"