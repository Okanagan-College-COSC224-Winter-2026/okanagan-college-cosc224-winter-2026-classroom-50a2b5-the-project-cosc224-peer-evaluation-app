"""
Tests for rubric endpoints
"""

import json


def test_teacher_can_create_rubric(test_client, make_admin):
    """
    GIVEN a teacher user with an existing assignment
    WHEN they create a new rubric via POST /create_rubric
    THEN the rubric should be created successfully with an ID
    """
    # Create and log in as teacher
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # Create a class
    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    # Create an assignment
    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps(
            {"courseID": class_id, "name": "Essay 1", "rubric": "text rubric"}
        ),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    # Create a rubric
    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps(
            {"assignmentID": assignment_id, "canComment": True}
        ),
        headers={"Content-Type": "application/json"},
    )

    assert rubric_response.status_code == 201
    assert rubric_response.json["msg"] == "Rubric created"
    assert "id" in rubric_response.json
    assert isinstance(rubric_response.json["id"], int)


def test_create_rubric_missing_assignment_id(test_client, make_admin):
    """
    GIVEN a teacher user
    WHEN they try to create a rubric without assignmentID
    THEN the API should return a 400 error
    """
    # Create and log in as teacher
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # Try to create rubric without assignmentID
    response = test_client.post(
        "/create_rubric",
        data=json.dumps({"canComment": True}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "assignmentID is required"


def test_create_rubric_nonexistent_assignment(test_client, make_admin):
    """
    GIVEN a teacher user
    WHEN they try to create a rubric for a non-existent assignment
    THEN the API should return a 404 error
    """
    # Create and log in as teacher
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # Try to create rubric for non-existent assignment
    response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": 999, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 404
    assert response.json["msg"] == "Assignment not found"


def test_non_teacher_cannot_create_rubric(test_client, make_admin):
    """
    GIVEN a teacher user who is not assigned to the class
    WHEN they try to create a rubric for an assignment in that class
    THEN the API should return a 403 error
    """
    # Create first teacher and class
    make_admin(email="teacher1@example.com", password="teacher1", name="Teacher 1")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher1@example.com", "password": "teacher1"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Math 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps(
            {"courseID": class_id, "name": "Assignment 1", "rubric": "text"}
        ),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    # Create second teacher and log in
    make_admin(email="teacher2@example.com", password="teacher2", name="Teacher 2")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher2@example.com", "password": "teacher2"}),
        headers={"Content-Type": "application/json"},
    )

    # Try to create rubric for assignment in class they don't teach
    response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 403
    assert "Unauthorized" in response.json["msg"]


def test_unauthenticated_user_cannot_create_rubric(test_client):
    """
    GIVEN an unauthenticated user
    WHEN they try to create a rubric
    THEN the API should return a 401 error
    """
    response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": 1, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 401


def test_teacher_can_create_criteria(test_client, make_admin):
    """
    GIVEN a teacher user with an existing rubric
    WHEN they create criteria via POST /create_criteria
    THEN the criteria should be created successfully with an ID
    """
    # Create and log in as teacher
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # Create class, assignment, and rubric
    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps(
            {"courseID": class_id, "name": "Essay 1", "rubric": "text"}
        ),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Create criteria
    criteria_response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "How well is the essay written?",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )

    assert criteria_response.status_code == 201
    assert criteria_response.json["msg"] == "Criteria created"
    assert "id" in criteria_response.json
    assert isinstance(criteria_response.json["id"], int)


def test_create_multiple_criteria_for_rubric(test_client, make_admin):
    """
    GIVEN a teacher user with an existing rubric
    WHEN they create multiple criteria for the rubric
    THEN all criteria should be created with unique IDs
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Create first criteria
    criteria1_response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "Quality of Writing",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )
    criteria1_id = criteria1_response.json["id"]

    # Create second criteria
    criteria2_response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "Argument Strength",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )
    criteria2_id = criteria2_response.json["id"]

    # Verify both were created with different IDs
    assert criteria1_response.status_code == 201
    assert criteria2_response.status_code == 201
    assert criteria1_id != criteria2_id


def test_create_criteria_missing_question(test_client, make_admin):
    """
    GIVEN a teacher user with an existing rubric
    WHEN they try to create criteria without a question
    THEN the API should return a 400 error
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Try to create criteria without question
    response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "question is required"


def test_create_criteria_nonexistent_rubric(test_client, make_admin):
    """
    GIVEN a teacher user
    WHEN they try to create criteria for a non-existent rubric
    THEN the API should return a 404 error
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # Try to create criteria for non-existent rubric
    response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": 999,
            "question": "Test Question",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 404
    assert response.json["msg"] == "Rubric not found"


def test_get_rubric(test_client, make_admin):
    """
    GIVEN an existing rubric
    WHEN a user retrieves it via GET /rubric?rubricID=<id>
    THEN the rubric should be returned with correct data
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Get the rubric
    get_response = test_client.get(
        f"/rubric?rubricID={rubric_id}",
        headers={"Content-Type": "application/json"},
    )

    assert get_response.status_code == 200
    assert get_response.json["id"] == rubric_id
    assert get_response.json["canComment"] is True


def test_get_rubric_nonexistent(test_client):
    """
    GIVEN a non-existent rubric ID
    WHEN a user tries to retrieve it via GET /rubric?rubricID=<id>
    THEN the API should return a 404 error
    """
    response = test_client.get(
        "/rubric?rubricID=999",
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 404
    assert response.json["msg"] == "Rubric not found"


def test_get_rubric_missing_rubric_id(test_client):
    """
    GIVEN a missing rubricID query parameter
    WHEN a user tries to retrieve a rubric
    THEN the API should return a 400 error
    """
    response = test_client.get(
        "/rubric",
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "rubricID is required"


def test_get_rubric_invalid_id_type(test_client):
    """
    GIVEN an invalid rubricID (non-integer)
    WHEN a user tries to retrieve a rubric
    THEN the API should return a 400 error
    """
    response = test_client.get(
        "/rubric?rubricID=invalid",
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert "must be an integer" in response.json["msg"]


def test_get_criteria(test_client, make_admin):
    """
    GIVEN an existing rubric with criteria
    WHEN a user retrieves the criteria via GET /criteria?rubricID=<id>
    THEN all criteria should be returned
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Create two criteria
    test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "Quality of Writing",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )

    test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "Argument Strength",
            "scoreMax": 10,
            "hasScore": True
        }),
        headers={"Content-Type": "application/json"},
    )

    # Get criteria
    get_response = test_client.get(
        f"/criteria?rubricID={rubric_id}",
        headers={"Content-Type": "application/json"},
    )

    assert get_response.status_code == 200
    criteria_list = get_response.json
    assert len(criteria_list) == 2
    assert criteria_list[0]["question"] == "Quality of Writing"
    assert criteria_list[1]["question"] == "Argument Strength"
    assert criteria_list[0]["scoreMax"] == 10
    assert criteria_list[1]["scoreMax"] == 10


def test_get_criteria_empty_rubric(test_client, make_admin):
    """
    GIVEN a rubric with no criteria
    WHEN a user retrieves the criteria via GET /criteria?rubricID=<id>
    THEN an empty array should be returned
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Get criteria for empty rubric
    get_response = test_client.get(
        f"/criteria?rubricID={rubric_id}",
        headers={"Content-Type": "application/json"},
    )

    assert get_response.status_code == 200
    assert get_response.json == []


def test_get_criteria_nonexistent_rubric(test_client):
    """
    GIVEN a non-existent rubric ID
    WHEN a user tries to retrieve its criteria
    THEN the API should return a 404 error
    """
    response = test_client.get(
        "/criteria?rubricID=999",
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 404
    assert response.json["msg"] == "Rubric not found"


def test_criteria_with_has_score_false(test_client, make_admin):
    """
    GIVEN a teacher creating criteria with hasScore=False
    WHEN the criteria is created and retrieved
    THEN hasScore should be False and scoreMax should be 0 or not required
    """
    # Setup
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "History 101"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Essay 1", "rubric": "text"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/create_rubric",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["id"]

    # Create criteria with hasScore=False
    criteria_response = test_client.post(
        "/create_criteria",
        data=json.dumps({
            "rubricID": rubric_id,
            "question": "Please provide feedback",
            "hasScore": False
        }),
        headers={"Content-Type": "application/json"},
    )

    assert criteria_response.status_code == 201
    criteria_id = criteria_response.json["id"]

    # Retrieve and verify
    get_response = test_client.get(
        f"/criteria?rubricID={rubric_id}",
        headers={"Content-Type": "application/json"},
    )

    assert get_response.status_code == 200
    criteria_list = get_response.json
    assert len(criteria_list) == 1
    assert criteria_list[0]["hasScore"] is False
    assert criteria_list[0]["question"] == "Please provide feedback"
