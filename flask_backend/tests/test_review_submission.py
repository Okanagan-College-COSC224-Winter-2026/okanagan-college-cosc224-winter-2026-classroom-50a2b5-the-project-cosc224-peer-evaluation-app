import pytest
from werkzeug.security import generate_password_hash


def login_student(test_client, db, email="student@test.com", password="password123"):
    """
    Create a student with a REAL hashed password (matches project login),
    then login to set JWT cookies for jwt_required endpoints.
    """
    from api.models.user_model import User
    from api.models.db import db as _db

    # Create user with hashed password (User requires hash_pass)
    student = User(
        name="Test Student",
        email=email,
        role="student",
        hash_pass=generate_password_hash(password),
    )
    _db.session.add(student)
    _db.session.commit()

    # Login (sets cookie)
    resp = test_client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code in (200, 201)
    return student


# ============================================================
# RUBRIC ENDPOINT TESTS (Dev 2)
# ============================================================

def test_get_rubric_not_found(test_client, db):
    """
    GIVEN a non-existing assignment (authenticated)
    WHEN GET /assignment/<id>/rubric is called
    THEN return 404
    """
    # Arrange
    login_student(test_client, db)

    # Act
    response = test_client.get("/assignment/999999/rubric")

    # Assert
    assert response.status_code == 404


def test_get_rubric_success(test_client, db):
    """
    GIVEN an assignment with a rubric and criteria (authenticated)
    WHEN GET /assignment/<id>/rubric is called
    THEN return 200 and correct rubric data
    """
    # Arrange
    login_student(test_client, db)

    from api.models.course_model import Course
    from api.models.assignment_model import Assignment
    from api.models.rubric_model import Rubric
    from api.models.criteria_description_model import CriteriaDescription
    from api.models.db import db as _db

    course = Course(name="Test Course", teacherID=1)
    _db.session.add(course)
    _db.session.commit()

    assignment = Assignment(courseID=course.id, name="Test Assignment", rubric_text="Rubric text")
    _db.session.add(assignment)
    _db.session.commit()

    rubric = Rubric(assignmentID=assignment.id, canComment=True)
    _db.session.add(rubric)
    _db.session.commit()

    crit = CriteriaDescription(rubricID=rubric.id, question="Clarity", scoreMax=5, hasScore=True)
    _db.session.add(crit)
    _db.session.commit()

    # Act
    response = test_client.get(f"/assignment/{assignment.id}/rubric")

    # Assert
    assert response.status_code == 200
    data = response.get_json()

    assert data["rubric_id"] == rubric.id
    assert data["assignment_id"] == assignment.id
    assert isinstance(data["criteria"], list)
    assert len(data["criteria"]) == 1

    c0 = data["criteria"][0]
    assert c0["id"] == crit.id
    assert c0["question"] == "Clarity"
    assert c0["score_max"] == 5
    assert c0["has_score"] is True


# ============================================================
# REVIEW SUBMISSION TESTS (Dev 1 endpoint)
# ============================================================

@pytest.mark.skip(reason="Dev 1 endpoint /api/reviews/submit not merged into dev yet")
def test_submit_review_unauthenticated():
    """
    GIVEN no JWT
    WHEN POST /api/reviews/submit is called
    THEN return 401
    """
    from api import create_app
    app = create_app({"TESTING": True})
    client = app.test_client()

    resp = client.post(
        "/api/reviews/submit",
        json={"assignment_id": 1, "reviewee_id": 2, "criteria": []},
    )
    assert resp.status_code == 401