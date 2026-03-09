import datetime
import json


def _create_student_and_get_id(test_client, name, email, password="studentpass"):
    test_client.post(
        "/auth/register",
        data=json.dumps({"name": name, "email": email, "password": password}),
        headers={"Content-Type": "application/json"},
    )
    login_response = test_client.post(
        "/auth/login",
        data=json.dumps({"email": email, "password": password}),
        headers={"Content-Type": "application/json"},
    )
    return login_response.json["id"]


def _setup_review_flow_data(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")

    student_a_id = _create_student_and_get_id(
        test_client,
        name="Student A",
        email="student.a@example.com",
    )
    student_b_id = _create_student_and_get_id(
        test_client,
        name="Student B",
        email="student.b@example.com",
    )

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Review Test Course"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    students_csv = (
        "id,name,email\n"
        "1,Student A,student.a@example.com\n"
        "2,Student B,student.b@example.com\n"
    )
    test_client.post(
        "/class/enroll_students",
        data=json.dumps({"class_id": class_id, "students": students_csv}),
        headers={"Content-Type": "application/json"},
    )

    due_date = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).isoformat()
    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Review Assignment", "due_date": due_date}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    rubric_response = test_client.post(
        "/rubric/create",
        data=json.dumps({"assignmentID": assignment_id, "canComment": True}),
        headers={"Content-Type": "application/json"},
    )
    rubric_id = rubric_response.json["rubric"]["id"]

    test_client.post(
        f"/rubric/{rubric_id}/criteria",
        data=json.dumps({"question": "Quality", "scoreMax": 5, "hasScore": True}),
        headers={"Content-Type": "application/json"},
    )
    test_client.post(
        f"/rubric/{rubric_id}/criteria",
        data=json.dumps({"question": "Communication", "scoreMax": 5, "hasScore": True}),
        headers={"Content-Type": "application/json"},
    )

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "student.a@example.com", "password": "studentpass"}),
        headers={"Content-Type": "application/json"},
    )

    return {
        "assignment_id": assignment_id,
        "reviewer_id": student_a_id,
        "reviewee_id": student_b_id,
    }


def test_create_review_and_criteria_then_get_review(test_client, make_admin):
    ctx = _setup_review_flow_data(test_client, make_admin)

    create_review_response = test_client.post(
        "/create_review",
        data=json.dumps(
            {
                "assignmentID": ctx["assignment_id"],
                "reviewerID": ctx["reviewer_id"],
                "revieweeID": ctx["reviewee_id"],
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert create_review_response.status_code == 201
    review_id = create_review_response.json["id"]

    create_criterion_response = test_client.post(
        "/create_criterion",
        data=json.dumps(
            {
                "reviewID": review_id,
                "criterionRowID": 0,
                "grade": 4,
                "comments": "",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert create_criterion_response.status_code == 201

    get_review_response = test_client.get(
        f"/review?assignmentID={ctx['assignment_id']}&reviewerID={ctx['reviewer_id']}&revieweeID={ctx['reviewee_id']}"
    )

    assert get_review_response.status_code == 200
    assert get_review_response.json["id"] == review_id
    assert len(get_review_response.json["grades"]) == 2
    assert get_review_response.json["grades"][0] == 4


def test_create_review_rejects_reviewer_mismatch(test_client, make_admin):
    ctx = _setup_review_flow_data(test_client, make_admin)

    response = test_client.post(
        "/create_review",
        data=json.dumps(
            {
                "assignmentID": ctx["assignment_id"],
                "reviewerID": ctx["reviewee_id"],
                "revieweeID": ctx["reviewer_id"],
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 403


def test_create_criterion_rejects_grade_out_of_range(test_client, make_admin):
    ctx = _setup_review_flow_data(test_client, make_admin)

    create_review_response = test_client.post(
        "/create_review",
        data=json.dumps(
            {
                "assignmentID": ctx["assignment_id"],
                "reviewerID": ctx["reviewer_id"],
                "revieweeID": ctx["reviewee_id"],
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    review_id = create_review_response.json["id"]

    response = test_client.post(
        "/create_criterion",
        data=json.dumps(
            {
                "reviewID": review_id,
                "criterionRowID": 0,
                "grade": 99,
                "comments": "",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "grade is out of range for this criterion"
