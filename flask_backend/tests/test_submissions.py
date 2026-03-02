import datetime
import io
import json


def _setup_course_assignment_and_student(test_client):
    test_client.post(
        "/auth/register",
        data=json.dumps(
            {
                "name": "Submission Student",
                "email": "submission.student@example.com",
                "password": "studentpass",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Submission Test Class"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    test_client.post(
        "/class/enroll_students",
        data=json.dumps(
            {
                "class_id": class_id,
                "students": "id,name,email\n1,Submission Student,submission.student@example.com",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    due_date = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)).isoformat()
    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps(
            {
                "courseID": class_id,
                "name": "Submission Assignment",
                "due_date": due_date,
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assignment_id = assignment_response.json["assignment"]["id"]

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "submission.student@example.com", "password": "studentpass"}),
        headers={"Content-Type": "application/json"},
    )

    return assignment_id


def test_student_can_upload_replace_and_remove_attachment(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    assignment_id = _setup_course_assignment_and_student(test_client)

    upload_response = test_client.post(
        f"/submission/{assignment_id}/mine",
        data={"file": (io.BytesIO(b"hello world"), "draft.txt")},
        content_type="multipart/form-data",
    )
    assert upload_response.status_code == 200
    assert upload_response.json["submission"]["filename"].endswith("draft.txt")

    replace_response = test_client.post(
        f"/submission/{assignment_id}/mine",
        data={"file": (io.BytesIO(b"updated contents"), "final.txt")},
        content_type="multipart/form-data",
    )
    assert replace_response.status_code == 200
    assert replace_response.json["submission"]["filename"].endswith("final.txt")

    get_response = test_client.get(f"/submission/{assignment_id}/mine")
    assert get_response.status_code == 200
    assert get_response.json["submission"]["filename"].endswith("final.txt")

    delete_response = test_client.delete(f"/submission/{assignment_id}/mine")
    assert delete_response.status_code == 200

    get_after_delete_response = test_client.get(f"/submission/{assignment_id}/mine")
    assert get_after_delete_response.status_code == 200
    assert get_after_delete_response.json["submission"] is None


def test_student_upload_requires_file(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")
    assignment_id = _setup_course_assignment_and_student(test_client)

    response = test_client.post(
        f"/submission/{assignment_id}/mine",
        data={},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.json["msg"] == "No file provided"


def test_teacher_cannot_upload_student_attachment(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="Teacher User")

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Teacher Restriction Class"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_response.json["class"]["id"]

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({"courseID": class_id, "name": "Teacher Cannot Upload"}),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_response.json["assignment"]["id"]

    response = test_client.post(
        f"/submission/{assignment_id}/mine",
        data={"file": (io.BytesIO(b"teacher attempt"), "teacher.txt")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 403
    assert response.json["msg"] == "Insufficient permissions"
