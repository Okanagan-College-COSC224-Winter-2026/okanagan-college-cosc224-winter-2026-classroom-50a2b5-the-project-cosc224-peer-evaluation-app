"""
Tests for the review controller (peer review submission & retrieval).

Covers:
  POST  /review/submit         — atomic review + criteria creation
  GET   /review/<id>           — single review with criteria
  GET   /review/lookup         — look up existing review
  GET   /review/assignment/<id> — list reviews for an assignment

US2: Group Contribution Evaluation
US3: Anonymous Peer Review (reviewer identity hidden when is_anonymous=True)
"""

import pytest
from werkzeug.security import generate_password_hash

from api.models import (
    User,
    Course,
    Assignment,
    Rubric,
    CriteriaDescription,
    Review,
    Criterion,
)
from api.models.db import db as _db


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def teacher(db):
    """Create a teacher user."""
    user = User(
        name="Review Teacher",
        email="review_teacher@test.com",
        hash_pass=generate_password_hash("password123"),
        role="teacher",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def student_a(db):
    """First student (will be the reviewer)."""
    user = User(
        name="Alice Student",
        email="alice@test.com",
        hash_pass=generate_password_hash("password123"),
        role="student",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def student_b(db):
    """Second student (will be the reviewee)."""
    user = User(
        name="Bob Student",
        email="bob@test.com",
        hash_pass=generate_password_hash("password123"),
        role="student",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def course(db, teacher):
    """Create a course owned by the teacher."""
    c = Course(teacherID=teacher.id, name="Review Test Course")
    db.session.add(c)
    db.session.commit()
    return c


@pytest.fixture
def assignment(db, course):
    """Create a non-anonymous assignment."""
    a = Assignment(courseID=course.id, name="Peer Review HW", is_anonymous=False)
    db.session.add(a)
    db.session.commit()
    return a


@pytest.fixture
def anon_assignment(db, course):
    """Create an anonymous assignment (reviewer identity hidden)."""
    a = Assignment(courseID=course.id, name="Anon Peer Review HW", is_anonymous=True)
    db.session.add(a)
    db.session.commit()
    return a


@pytest.fixture
def rubric_with_criteria(db, assignment):
    """Create a rubric with 2 criteria rows for the assignment."""
    rubric = Rubric(assignmentID=assignment.id, canComment=True)
    db.session.add(rubric)
    db.session.flush()

    c1 = CriteriaDescription(
        rubricID=rubric.id, question="Communication skills", scoreMax=5, hasScore=True
    )
    c2 = CriteriaDescription(
        rubricID=rubric.id, question="Technical quality", scoreMax=10, hasScore=True
    )
    db.session.add_all([c1, c2])
    db.session.commit()
    return rubric, [c1, c2]


@pytest.fixture
def auth_student_a(test_client, student_a):
    """Log in as student A — cookie is set on the test client."""
    test_client.post(
        "/auth/login", json={"email": student_a.email, "password": "password123"}
    )
    return test_client


@pytest.fixture
def auth_student_b(test_client, student_b):
    """Log in as student B — cookie is set on the test client."""
    test_client.post(
        "/auth/login", json={"email": student_b.email, "password": "password123"}
    )
    return test_client


@pytest.fixture
def auth_teacher(test_client, teacher):
    """Log in as teacher — cookie is set on the test client."""
    test_client.post(
        "/auth/login", json={"email": teacher.email, "password": "password123"}
    )
    return test_client


# ============================================================================
# POST /review/submit — SUBMIT REVIEW
# ============================================================================


class TestSubmitReview:
    """Tests for the atomic review + criteria submission endpoint."""

    def test_submit_review_with_criteria(
        self, auth_student_a, student_b, assignment, rubric_with_criteria
    ):
        """Student can submit a review with criteria scores."""
        _, criteria = rubric_with_criteria

        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [
                    {"criterionRowID": criteria[0].id, "grade": 4, "comments": "Good"},
                    {"criterionRowID": criteria[1].id, "grade": 8, "comments": ""},
                ],
            },
        )

        assert resp.status_code == 201
        data = resp.get_json()
        assert data["msg"] == "Review submitted"
        assert "id" in data

        # Verify review was persisted
        review = Review.get_by_id(data["id"])
        assert review is not None
        assert review.assignmentID == assignment.id
        assert review.revieweeID == student_b.id

        # Verify criteria were persisted
        stored_criteria = Criterion.query.filter_by(reviewID=review.id).all()
        assert len(stored_criteria) == 2

    def test_submit_review_with_comments(
        self, auth_student_a, student_b, assignment, rubric_with_criteria
    ):
        """Review-level comments are stored on the Review model."""
        _, criteria = rubric_with_criteria

        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "comments": "Great teamwork overall!",
                "criteria": [
                    {"criterionRowID": criteria[0].id, "grade": 5, "comments": ""},
                ],
            },
        )

        assert resp.status_code == 201
        review = Review.get_by_id(resp.get_json()["id"])
        assert review.comments == "Great teamwork overall!"

    def test_submit_review_without_comments_defaults_empty(
        self, auth_student_a, student_b, assignment
    ):
        """Omitting comments defaults to empty string."""
        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )

        assert resp.status_code == 201
        review = Review.get_by_id(resp.get_json()["id"])
        assert review.comments == ""

    def test_submit_review_without_criteria(
        self, auth_student_a, student_b, assignment
    ):
        """Submitting a review with no criteria still creates the review."""
        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )

        assert resp.status_code == 201

    def test_cannot_review_self(self, auth_student_a, student_a, assignment):
        """A student cannot review themselves."""
        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_a.id,
                "criteria": [],
            },
        )

        assert resp.status_code == 400
        assert "cannot review yourself" in resp.get_json()["msg"].lower()

    def test_duplicate_review_rejected(
        self, auth_student_a, student_b, assignment
    ):
        """Submitting a second review for the same assignment+reviewee is rejected."""
        payload = {
            "assignmentID": assignment.id,
            "revieweeID": student_b.id,
            "criteria": [],
        }

        resp1 = auth_student_a.post("/review/submit", json=payload)
        assert resp1.status_code == 201

        resp2 = auth_student_a.post("/review/submit", json=payload)
        assert resp2.status_code == 409
        assert "already reviewed" in resp2.get_json()["msg"].lower()

    def test_submit_missing_fields(self, auth_student_a):
        """Missing required fields returns 400."""
        resp = auth_student_a.post("/review/submit", json={"assignmentID": 1})
        assert resp.status_code == 400

    def test_submit_nonexistent_assignment(
        self, auth_student_a, student_b
    ):
        """Submitting a review for a non-existent assignment returns 404."""
        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": 99999,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        assert resp.status_code == 404

    def test_submit_nonexistent_reviewee(self, auth_student_a, assignment):
        """Submitting a review for a non-existent reviewee returns 404."""
        resp = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": 99999,
                "criteria": [],
            },
        )
        assert resp.status_code == 404

    def test_unauthenticated_submit_rejected(self, test_client, db, assignment):
        """Unauthenticated users cannot submit reviews."""
        resp = test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": 1,
                "criteria": [],
            },
        )
        assert resp.status_code == 401


# ============================================================================
# GET /review/lookup — LOOKUP EXISTING REVIEW
# ============================================================================


class TestLookupReview:
    """Tests for looking up an existing review."""

    def test_lookup_existing_review(
        self, auth_student_a, student_a, student_b, assignment, rubric_with_criteria
    ):
        """Can look up a review that was previously submitted."""
        _, criteria = rubric_with_criteria

        # Submit a review first
        auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "comments": "Nice work",
                "criteria": [
                    {"criterionRowID": criteria[0].id, "grade": 3, "comments": "OK"},
                ],
            },
        )

        # Look it up
        resp = auth_student_a.get(
            f"/review/lookup?assignmentID={assignment.id}&revieweeID={student_b.id}"
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "review" in data
        assert "criteria" in data
        assert len(data["criteria"]) == 1
        assert data["criteria"][0]["grade"] == 3
        assert data["review"]["comments"] == "Nice work"

    def test_lookup_nonexistent_review(
        self, auth_student_a, student_b, assignment
    ):
        """Looking up a review that doesn't exist returns 404."""
        resp = auth_student_a.get(
            f"/review/lookup?assignmentID={assignment.id}&revieweeID={student_b.id}"
        )
        assert resp.status_code == 404

    def test_lookup_missing_params(self, auth_student_a):
        """Missing query params returns 400."""
        resp = auth_student_a.get("/review/lookup?assignmentID=1")
        assert resp.status_code == 400


# ============================================================================
# GET /review/<id> — SINGLE REVIEW
# ============================================================================


class TestGetReview:
    """Tests for fetching a single review by ID."""

    def test_reviewer_can_view_own_review(
        self, auth_student_a, student_b, assignment
    ):
        """The reviewer can view a review they submitted."""
        submit = auth_student_a.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "comments": "Overall solid effort",
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        resp = auth_student_a.get(f"/review/{review_id}")
        assert resp.status_code == 200
        assert resp.get_json()["comments"] == "Overall solid effort"

    def test_reviewee_can_view_received_review(
        self, test_client, db, student_a, student_b, assignment
    ):
        """The reviewee can view a review they received."""
        # Login as student A and submit a review OF student B
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Login as student B (the reviewee) and view it
        test_client.post(
            "/auth/login",
            json={"email": student_b.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 200

    def test_unrelated_student_cannot_view(
        self, test_client, db, student_a, student_b, assignment
    ):
        """A student who is neither reviewer nor reviewee gets 403."""
        # Create a third student
        student_c = User(
            name="Charlie",
            email="charlie@test.com",
            hash_pass=generate_password_hash("password123"),
            role="student",
        )
        db.session.add(student_c)
        db.session.commit()

        # Login as A, submit review of B
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Login as C (unrelated) — should be forbidden
        test_client.post(
            "/auth/login",
            json={"email": student_c.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 403

    def test_teacher_can_view_any_review(
        self, test_client, db, teacher, student_a, student_b, assignment
    ):
        """Teachers can view any review."""
        # Submit as student A
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Login as teacher
        test_client.post(
            "/auth/login",
            json={"email": teacher.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 200

    def test_nonexistent_review_returns_404(self, auth_student_a):
        """Getting a nonexistent review returns 404."""
        resp = auth_student_a.get("/review/99999")
        assert resp.status_code == 404


# ============================================================================
# GET /review/assignment/<id> — LIST REVIEWS FOR ASSIGNMENT
# ============================================================================


class TestListReviewsForAssignment:
    """Tests for listing all reviews for an assignment."""

    def test_teacher_sees_all_reviews(
        self, test_client, db, teacher, student_a, student_b, assignment
    ):
        """Teacher sees every review for the assignment."""
        # Student A reviews Student B
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )

        # Student B reviews Student A
        test_client.post(
            "/auth/login",
            json={"email": student_b.email, "password": "password123"},
        )
        test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_a.id,
                "criteria": [],
            },
        )

        # Teacher sees both
        test_client.post(
            "/auth/login",
            json={"email": teacher.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/assignment/{assignment.id}")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 2

    def test_student_sees_only_received_reviews(
        self, test_client, db, student_a, student_b, assignment
    ):
        """Students see only reviews where they are the reviewee."""
        # Student A reviews Student B
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )

        # Student B reviews Student A
        test_client.post(
            "/auth/login",
            json={"email": student_b.email, "password": "password123"},
        )
        test_client.post(
            "/review/submit",
            json={
                "assignmentID": assignment.id,
                "revieweeID": student_a.id,
                "criteria": [],
            },
        )

        # Student B sees only the review they RECEIVED (from A → B)
        resp = test_client.get(f"/review/assignment/{assignment.id}")
        assert resp.status_code == 200
        reviews = resp.get_json()
        assert len(reviews) == 1
        assert reviews[0]["reviewee"]["id"] == student_b.id

    def test_nonexistent_assignment_returns_404(self, auth_teacher):
        """Listing reviews for a nonexistent assignment returns 404."""
        resp = auth_teacher.get("/review/assignment/99999")
        assert resp.status_code == 404


# ============================================================================
# US3: ANONYMOUS PEER REVIEW
# ============================================================================


class TestAnonymousReview:
    """When assignment.is_anonymous is True, reviewer identity should be hidden
    from the reviewee (but visible to the teacher)."""

    def test_anonymous_single_review_hides_reviewer(
        self, test_client, db, student_a, student_b, anon_assignment
    ):
        """When fetching a single anonymous review, the reviewee sees 'Anonymous'."""
        # Student A reviews Student B on an anonymous assignment
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": anon_assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Login as Student B (reviewee) — reviewer should be anonymous
        test_client.post(
            "/auth/login",
            json={"email": student_b.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["reviewer"]["name"] == "Anonymous"
        assert data["reviewer"]["id"] is None

    def test_anonymous_review_visible_to_teacher(
        self, test_client, db, teacher, student_a, student_b, anon_assignment
    ):
        """Teachers can still see the real reviewer on anonymous assignments."""
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": anon_assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Teacher sees the real reviewer
        test_client.post(
            "/auth/login",
            json={"email": teacher.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["reviewer"]["name"] == "Alice Student"

    def test_anonymous_reviewer_can_see_own_review(
        self, test_client, db, student_a, student_b, anon_assignment
    ):
        """The reviewer can still see their own identity on their own review."""
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        submit = test_client.post(
            "/review/submit",
            json={
                "assignmentID": anon_assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )
        review_id = submit.get_json()["id"]

        # Reviewer sees their own name (not anonymized)
        resp = test_client.get(f"/review/{review_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["reviewer"]["name"] == "Alice Student"

    def test_anonymous_assignment_list_hides_reviewer(
        self, test_client, db, student_a, student_b, anon_assignment
    ):
        """When listing reviews for an anonymous assignment, student sees Anonymous."""
        test_client.post(
            "/auth/login",
            json={"email": student_a.email, "password": "password123"},
        )
        test_client.post(
            "/review/submit",
            json={
                "assignmentID": anon_assignment.id,
                "revieweeID": student_b.id,
                "criteria": [],
            },
        )

        # Student B views assignment reviews — reviewer should be anonymous
        test_client.post(
            "/auth/login",
            json={"email": student_b.email, "password": "password123"},
        )
        resp = test_client.get(f"/review/assignment/{anon_assignment.id}")
        assert resp.status_code == 200
        reviews = resp.get_json()
        assert len(reviews) == 1
        assert reviews[0]["reviewer"]["name"] == "Anonymous"
