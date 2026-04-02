"""
Tests for the student progress endpoint (GET /teacher/classes/<course_id>/progress).
Covers US5 — Instructor Student Progress Dashboard.

Test cases follow the AAA (Arrange-Act-Assert) pattern.
"""

import json

import pytest
from werkzeug.security import generate_password_hash

from api.models import (
    Assignment,
    Course,
    Criterion,
    Group_Members,
    Review,
    User,
    User_Course,
)
from api.models.course_group_model import CourseGroup
from api.models.criteria_description_model import CriteriaDescription
from api.models.db import db as _db
from api.models.rubric_model import Rubric


# ============================================================
# HELPERS
# ============================================================


def login_as(test_client, email, password="password"):
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": email, "password": password}),
        headers={"Content-Type": "application/json"},
    )


def make_user(name, email, role="student"):
    user = User(
        name=name,
        email=email,
        hash_pass=generate_password_hash("password"),
        role=role,
    )
    _db.session.add(user)
    _db.session.commit()
    return user


def make_course(teacher_id, name="Test Course"):
    course = Course(teacherID=teacher_id, name=name)
    _db.session.add(course)
    _db.session.commit()
    return course


def make_assignment(course_id, name="Assignment 1"):
    assignment = Assignment(courseID=course_id, name=name, rubric_text="Rubric")
    _db.session.add(assignment)
    _db.session.commit()
    return assignment


def make_criteria_desc(assignment_id):
    rubric = Rubric(assignmentID=assignment_id, canComment=True)
    _db.session.add(rubric)
    _db.session.commit()
    criteria_desc = CriteriaDescription(
        rubricID=rubric.id, question="Quality", scoreMax=10, hasScore=True
    )
    _db.session.add(criteria_desc)
    _db.session.commit()
    return criteria_desc


def add_to_group(user_id, assignment_id):
    group = CourseGroup(name="Group A", assignmentID=assignment_id)
    _db.session.add(group)
    _db.session.commit()
    member = Group_Members(userID=user_id, groupID=group.id, assignmentID=assignment_id)
    _db.session.add(member)
    _db.session.commit()
    return member


def make_review(assignment_id, reviewer_id, reviewee_id, criteria_desc_id, grades):
    review = Review(
        assignmentID=assignment_id,
        reviewerID=reviewer_id,
        revieweeID=reviewee_id,
    )
    _db.session.add(review)
    _db.session.commit()
    for grade in grades:
        criterion = Criterion(
            reviewID=review.id,
            criterionRowID=criteria_desc_id,
            grade=grade,
            comments="",
        )
        _db.session.add(criterion)
    _db.session.commit()
    return review


# ============================================================
# TEST CASES
# ============================================================


def test_teacher_gets_200_with_correct_data(test_client, db):
    """
    GIVEN a teacher with a course, one enrolled student, and one assignment
    WHEN GET /teacher/classes/<course_id>/progress
    THEN return 200 with correct course, assignments, and student data
    """
    teacher = make_user("Teacher", "teacher@example.com", role="teacher")
    course = make_course(teacher.id)
    assignment = make_assignment(course.id)

    student = make_user("Student One", "student1@example.com")
    User_Course.add(student.id, course.id)

    login_as(test_client, "teacher@example.com")
    response = test_client.get(f"/teacher/classes/{course.id}/progress")

    assert response.status_code == 200
    data = response.get_json()

    assert data["course_id"] == course.id
    assert data["course_name"] == course.name
    assert len(data["assignments"]) == 1
    assert data["assignments"][0]["id"] == assignment.id
    assert len(data["students"]) == 1
    assert data["students"][0]["user_id"] == student.id
    assert data["students"][0]["email"] == student.email
    assert str(assignment.id) in data["students"][0]["per_assignment"]


def test_student_receives_403(test_client, db):
    """
    GIVEN a student user
    WHEN GET /teacher/classes/<course_id>/progress
    THEN return 403
    """
    teacher = make_user("Teacher", "teacher@example.com", role="teacher")
    course = make_course(teacher.id)

    student = make_user("Student", "student@example.com")
    User_Course.add(student.id, course.id)

    login_as(test_client, "student@example.com")
    response = test_client.get(f"/teacher/classes/{course.id}/progress")

    assert response.status_code == 403


def test_nonexistent_course_returns_404(test_client, db):
    """
    GIVEN a teacher user
    WHEN GET /teacher/classes/99999/progress for a non-existent course
    THEN return 404
    """
    make_user("Teacher", "teacher@example.com", role="teacher")
    login_as(test_client, "teacher@example.com")

    response = test_client.get("/teacher/classes/99999/progress")

    assert response.status_code == 404


def test_student_with_no_groups_shows_in_group_false(test_client, db):
    """
    GIVEN a student enrolled in a course but not in any group
    WHEN GET /teacher/classes/<course_id>/progress
    THEN in_group is False for all assignments
    """
    teacher = make_user("Teacher", "teacher@example.com", role="teacher")
    course = make_course(teacher.id)
    assignment = make_assignment(course.id)

    student = make_user("Student", "student@example.com")
    User_Course.add(student.id, course.id)

    login_as(test_client, "teacher@example.com")
    response = test_client.get(f"/teacher/classes/{course.id}/progress")

    assert response.status_code == 200
    student_data = response.get_json()["students"][0]
    assert student_data["per_assignment"][str(assignment.id)]["in_group"] is False


def test_review_counts_and_avg_score_are_accurate(test_client, db):
    """
    GIVEN a student with seeded reviews and criterion scores
    WHEN GET /teacher/classes/<course_id>/progress
    THEN reviews_given, reviews_received, and avg_score are correct
    """
    teacher = make_user("Teacher", "teacher@example.com", role="teacher")
    course = make_course(teacher.id)
    assignment = make_assignment(course.id)
    criteria_desc = make_criteria_desc(assignment.id)

    student = make_user("Student", "student@example.com")
    reviewer1 = make_user("Reviewer1", "reviewer1@example.com")
    reviewer2 = make_user("Reviewer2", "reviewer2@example.com")
    User_Course.add(student.id, course.id)
    User_Course.add(reviewer1.id, course.id)
    User_Course.add(reviewer2.id, course.id)

    # student gives 1 review, receives 2 reviews with grades [4] and [6]
    make_review(assignment.id, student.id, reviewer1.id, criteria_desc.id, [3])
    make_review(assignment.id, reviewer1.id, student.id, criteria_desc.id, [4])
    make_review(assignment.id, reviewer2.id, student.id, criteria_desc.id, [6])

    login_as(test_client, "teacher@example.com")
    response = test_client.get(f"/teacher/classes/{course.id}/progress")

    assert response.status_code == 200
    students = response.get_json()["students"]
    student_data = next(s for s in students if s["user_id"] == student.id)
    per = student_data["per_assignment"][str(assignment.id)]

    assert per["reviews_given"] == 1
    assert per["reviews_received"] == 2
    assert per["avg_score"] == pytest.approx(5.0)  # (4 + 6) / 2
