"""
Tests for the teacher gradebook feature.

Covers:
  - GradeOverride model CRUD
  - GET  /gradebook/course/<id>            — full gradebook data
  - PUT  /gradebook/course/<id>/override   — set/update grade override
  - DELETE /gradebook/course/<id>/override — clear grade override
  - GET  /gradebook/course/<id>/reviews    — reviews for student+assignment
  - Teacher-only access enforcement
"""

import pytest
from werkzeug.security import generate_password_hash

from api.models import (
    Assignment,
    Course,
    CourseGroup,
    CriteriaDescription,
    Criterion,
    Group_Members,
    Review,
    Rubric,
    User,
    User_Course,
)
from api.models.db import db as _db
from api.models.grade_override_model import GradeOverride


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def teacher(db):
    user = User(
        name="Gradebook Teacher",
        email="gb_teacher@test.com",
        hash_pass=generate_password_hash("password123"),
        role="teacher",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def student_a(db):
    user = User(
        name="Alice",
        email="gb_alice@test.com",
        hash_pass=generate_password_hash("password123"),
        role="student",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def student_b(db):
    user = User(
        name="Bob",
        email="gb_bob@test.com",
        hash_pass=generate_password_hash("password123"),
        role="student",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def course(db, teacher):
    c = Course(teacherID=teacher.id, name="Gradebook Course")
    db.session.add(c)
    db.session.commit()
    return c


@pytest.fixture
def enrolled(db, course, student_a, student_b):
    for s in [student_a, student_b]:
        db.session.add(User_Course(userID=s.id, courseID=course.id))
    db.session.commit()


@pytest.fixture
def assignment(db, course):
    a = Assignment(courseID=course.id, name="HW1", is_anonymous=False)
    db.session.add(a)
    db.session.commit()
    return a


@pytest.fixture
def assignment2(db, course):
    a = Assignment(courseID=course.id, name="HW2", is_anonymous=False)
    db.session.add(a)
    db.session.commit()
    return a


@pytest.fixture
def individual_rubric(db, assignment):
    rubric = Rubric(assignmentID=assignment.id, canComment=True, rubric_type="individual")
    db.session.add(rubric)
    db.session.flush()
    c1 = CriteriaDescription(rubricID=rubric.id, question="Quality", scoreMax=5, hasScore=True)
    c2 = CriteriaDescription(rubricID=rubric.id, question="Effort", scoreMax=5, hasScore=True)
    db.session.add_all([c1, c2])
    db.session.commit()
    return rubric, [c1, c2]


@pytest.fixture
def group_setup(db, course, student_a, student_b, enrolled, assignment):
    """Create two groups and a group rubric for testing group reviews."""
    group_a = CourseGroup(name="Alpha", courseID=course.id)
    group_b = CourseGroup(name="Beta", courseID=course.id)
    db.session.add_all([group_a, group_b])
    db.session.flush()
    db.session.add(Group_Members(userID=student_a.id, groupID=group_a.id))
    db.session.add(Group_Members(userID=student_b.id, groupID=group_b.id))
    db.session.commit()

    rubric = Rubric(assignmentID=assignment.id, canComment=True, rubric_type="group")
    db.session.add(rubric)
    db.session.flush()
    c1 = CriteriaDescription(rubricID=rubric.id, question="Teamwork", scoreMax=10, hasScore=True)
    db.session.add(c1)
    db.session.commit()
    return group_a, group_b, rubric, [c1]


@pytest.fixture
def reviews_for_alice(db, assignment, student_a, student_b, enrolled, individual_rubric):
    """Bob reviews Alice with individual rubric: scores 4 and 3 = 7/10."""
    _, criteria = individual_rubric
    review = Review(
        assignmentID=assignment.id,
        reviewerID=student_b.id,
        revieweeID=student_a.id,
        review_type="individual",
        comments="Good work",
    )
    db.session.add(review)
    db.session.flush()
    db.session.add(Criterion(reviewID=review.id, criterionRowID=criteria[0].id, grade=4))
    db.session.add(Criterion(reviewID=review.id, criterionRowID=criteria[1].id, grade=3))
    db.session.commit()
    return review


@pytest.fixture
def auth_teacher(test_client, teacher):
    test_client.post("/auth/login", json={"email": teacher.email, "password": "password123"})
    return test_client


@pytest.fixture
def auth_student(test_client, student_a):
    test_client.post("/auth/login", json={"email": student_a.email, "password": "password123"})
    return test_client


# ============================================================================
# GradeOverride MODEL TESTS
# ============================================================================


class TestGradeOverrideModel:

    def test_create_override(self, db, teacher, student_a, course, assignment, enrolled):
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=8.5,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()

        fetched = GradeOverride.query.filter_by(
            studentID=student_a.id, assignmentID=assignment.id
        ).first()
        assert fetched is not None
        assert fetched.override_score == 8.5
        assert fetched.teacherID == teacher.id

    def test_unique_constraint(self, db, teacher, student_a, course, assignment, enrolled):
        o1 = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=8.0,
            teacherID=teacher.id,
        )
        db.session.add(o1)
        db.session.commit()

        o2 = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=9.0,
            teacherID=teacher.id,
        )
        db.session.add(o2)
        with pytest.raises(Exception):
            db.session.commit()

    def test_update_override(self, db, teacher, student_a, course, assignment, enrolled):
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=7.0,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()

        override.override_score = 9.5
        db.session.commit()

        fetched = GradeOverride.query.get(override.id)
        assert fetched.override_score == 9.5

    def test_delete_override(self, db, teacher, student_a, course, assignment, enrolled):
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=6.0,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()
        oid = override.id

        db.session.delete(override)
        db.session.commit()

        assert GradeOverride.query.get(oid) is None


# ============================================================================
# GET /gradebook/course/<id> — FULL GRADEBOOK
# ============================================================================


class TestGetGradebook:

    def test_gradebook_returns_students_and_assignments(
        self, auth_teacher, course, assignment, assignment2, enrolled
    ):
        resp = auth_teacher.get(f"/gradebook/course/{course.id}")
        assert resp.status_code == 200
        data = resp.json
        assert "assignments" in data
        assert "students" in data
        assert len(data["assignments"]) == 2
        assert len(data["students"]) == 2

    def test_gradebook_shows_peer_review_averages(
        self, auth_teacher, course, assignment, enrolled, reviews_for_alice, student_a
    ):
        resp = auth_teacher.get(f"/gradebook/course/{course.id}")
        assert resp.status_code == 200

        alice = next(s for s in resp.json["students"] if s["id"] == student_a.id)
        grade = alice["grades"][str(assignment.id)]
        assert grade["individualAverage"] == 7.0
        assert grade["individualMax"] == 10

    def test_gradebook_shows_override_when_set(
        self, auth_teacher, db, course, assignment, enrolled, reviews_for_alice, student_a, teacher
    ):
        # Create an override
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=9.0,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()

        resp = auth_teacher.get(f"/gradebook/course/{course.id}")
        assert resp.status_code == 200

        alice = next(s for s in resp.json["students"] if s["id"] == student_a.id)
        grade = alice["grades"][str(assignment.id)]
        assert grade["overrideScore"] == 9.0
        assert grade["effectiveGrade"] == 9.0
        # Peer average should still be present
        assert grade["individualAverage"] == 7.0

    def test_gradebook_includes_course_totals(
        self, auth_teacher, course, assignment, enrolled, reviews_for_alice, student_a
    ):
        resp = auth_teacher.get(f"/gradebook/course/{course.id}")
        assert resp.status_code == 200

        alice = next(s for s in resp.json["students"] if s["id"] == student_a.id)
        assert "courseTotal" in alice
        assert alice["courseTotal"]["earned"] == 7.0
        assert alice["courseTotal"]["max"] == 10

    def test_gradebook_teacher_only(self, auth_student, course, enrolled):
        resp = auth_student.get(f"/gradebook/course/{course.id}")
        assert resp.status_code == 403

    def test_gradebook_empty_course(self, auth_teacher, db, teacher):
        empty_course = Course(teacherID=teacher.id, name="Empty Course")
        db.session.add(empty_course)
        db.session.commit()

        resp = auth_teacher.get(f"/gradebook/course/{empty_course.id}")
        assert resp.status_code == 200
        assert resp.json["students"] == []
        assert resp.json["assignments"] == []


# ============================================================================
# PUT /gradebook/course/<id>/override — SET GRADE OVERRIDE
# ============================================================================


class TestSetOverride:

    def test_set_override_creates_record(
        self, auth_teacher, course, assignment, enrolled, student_a
    ):
        resp = auth_teacher.put(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id, "overrideScore": 8.5},
        )
        assert resp.status_code == 200

        override = GradeOverride.query.filter_by(
            studentID=student_a.id, assignmentID=assignment.id
        ).first()
        assert override is not None
        assert override.override_score == 8.5

    def test_set_override_updates_existing(
        self, auth_teacher, db, course, assignment, enrolled, student_a, teacher
    ):
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=7.0,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()

        resp = auth_teacher.put(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id, "overrideScore": 9.0},
        )
        assert resp.status_code == 200

        updated = GradeOverride.query.filter_by(
            studentID=student_a.id, assignmentID=assignment.id
        ).first()
        assert updated.override_score == 9.0

    def test_set_override_teacher_only(self, auth_student, course, assignment, enrolled, student_a):
        resp = auth_student.put(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id, "overrideScore": 8.0},
        )
        assert resp.status_code == 403

    def test_set_override_validates_student_enrolled(
        self, auth_teacher, db, course, assignment
    ):
        outsider = User(
            name="Outsider",
            email="gb_outsider@test.com",
            hash_pass=generate_password_hash("password123"),
            role="student",
        )
        db.session.add(outsider)
        db.session.commit()

        resp = auth_teacher.put(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": outsider.id, "assignmentID": assignment.id, "overrideScore": 8.0},
        )
        assert resp.status_code == 404

    def test_set_override_validates_assignment_in_course(
        self, auth_teacher, db, course, enrolled, student_a, teacher
    ):
        other_course = Course(teacherID=teacher.id, name="Other Course")
        db.session.add(other_course)
        db.session.flush()
        other_assignment = Assignment(courseID=other_course.id, name="Other HW")
        db.session.add(other_assignment)
        db.session.commit()

        resp = auth_teacher.put(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": other_assignment.id, "overrideScore": 8.0},
        )
        assert resp.status_code == 404


# ============================================================================
# DELETE /gradebook/course/<id>/override — CLEAR GRADE OVERRIDE
# ============================================================================


class TestClearOverride:

    def test_clear_override_deletes_record(
        self, auth_teacher, db, course, assignment, enrolled, student_a, teacher
    ):
        override = GradeOverride(
            studentID=student_a.id,
            assignmentID=assignment.id,
            courseID=course.id,
            override_score=8.0,
            teacherID=teacher.id,
        )
        db.session.add(override)
        db.session.commit()

        resp = auth_teacher.delete(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 200

        assert GradeOverride.query.filter_by(
            studentID=student_a.id, assignmentID=assignment.id
        ).first() is None

    def test_clear_override_nonexistent(
        self, auth_teacher, course, assignment, enrolled, student_a
    ):
        resp = auth_teacher.delete(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 404

    def test_clear_override_teacher_only(
        self, auth_student, course, assignment, enrolled, student_a
    ):
        resp = auth_student.delete(
            f"/gradebook/course/{course.id}/override",
            json={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 403


# ============================================================================
# GET /gradebook/course/<id>/reviews — STUDENT+ASSIGNMENT REVIEWS
# ============================================================================


class TestGetStudentReviews:

    def test_get_reviews_for_student_assignment(
        self, auth_teacher, course, assignment, enrolled, reviews_for_alice, student_a
    ):
        resp = auth_teacher.get(
            f"/gradebook/course/{course.id}/reviews",
            query_string={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 200
        data = resp.json
        assert "individualReviews" in data
        assert "groupReviews" in data
        assert len(data["individualReviews"]) == 1
        assert data["individualReviews"][0]["comments"] == "Good work"

    def test_get_reviews_includes_group_reviews(
        self, auth_teacher, db, course, assignment, enrolled,
        student_a, student_b, group_setup
    ):
        group_a, group_b, rubric, criteria = group_setup

        # Student B (in group Beta) reviews group Alpha
        review = Review(
            assignmentID=assignment.id,
            reviewerID=student_b.id,
            revieweeID=group_a.id,
            review_type="group",
            comments="Nice teamwork",
        )
        db.session.add(review)
        db.session.flush()
        db.session.add(Criterion(reviewID=review.id, criterionRowID=criteria[0].id, grade=8))
        db.session.commit()

        resp = auth_teacher.get(
            f"/gradebook/course/{course.id}/reviews",
            query_string={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 200
        assert len(resp.json["groupReviews"]) == 1
        assert resp.json["groupReviews"][0]["comments"] == "Nice teamwork"

    def test_get_reviews_teacher_only(self, auth_student, course, assignment, enrolled, student_a):
        resp = auth_student.get(
            f"/gradebook/course/{course.id}/reviews",
            query_string={"studentID": student_a.id, "assignmentID": assignment.id},
        )
        assert resp.status_code == 403
