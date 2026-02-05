def test_practice_endpoint(test_client):
    
    response = test_client.get("/practice/test")

    assert response.status_code == 200
    assert response is not None

    data = response.json
    assert "course" in data
    assert data["course"] == "cosc 224"
