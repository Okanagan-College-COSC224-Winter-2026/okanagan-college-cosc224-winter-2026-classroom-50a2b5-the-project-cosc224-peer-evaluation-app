import json
from io import BytesIO


def test_student_can_submit_assignment_file(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="teacheruser")
    make_admin(email="student@example.com", password="student", name="studentuser")

    # login teacher
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    # create class
    class_res = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Upload Class"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_res.json["class"]["id"]

    # create assignment
    assignment_res = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({
            "courseID": class_id,
            "name": "Upload Assignment",
            "rubric": "Test",
        }),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_res.json["assignment"]["id"]

    # enroll student
    test_client.post(
        "/class/enroll_students",
        data=json.dumps({
            "class_id": class_id,
            "students": "id,name,email\n1,Student,student@example.com"
        }),
        headers={"Content-Type": "application/json"},
    )

    # login student
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "student@example.com", "password": "student"}),
        headers={"Content-Type": "application/json"},
    )

    # upload file
    response = test_client.post(
        f"/assignment/submit/{assignment_id}",
        data={"file": (BytesIO(b"test file"), "test.txt")},
        content_type="multipart/form-data",
    )

    assert response.status_code in (200, 201)
    assert "Submission" in response.json["msg"]


def test_teacher_can_view_submissions(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="teacheruser")
    make_admin(email="student@example.com", password="student", name="studentuser")

    # login teacher
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_res = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Submission Class"}),
        headers={"Content-Type": "application/json"},
    )
    class_id = class_res.json["class"]["id"]

    assignment_res = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({
            "courseID": class_id,
            "name": "Submission Assignment",
            "rubric": "Test",
        }),
        headers={"Content-Type": "application/json"},
    )
    assignment_id = assignment_res.json["assignment"]["id"]

    # enroll student
    test_client.post(
        "/class/enroll_students",
        data=json.dumps({
            "class_id": class_id,
            "students": "id,name,email\n1,Student,student@example.com"
        }),
        headers={"Content-Type": "application/json"},
    )

    # student uploads
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "student@example.com", "password": "student"}),
        headers={"Content-Type": "application/json"},
    )

    test_client.post(
        f"/assignment/submit/{assignment_id}",
        data={"file": (BytesIO(b"file"), "file.txt")},
        content_type="multipart/form-data",
    )

    # teacher views submissions
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    res = test_client.get(f"/assignment/submissions/{assignment_id}")

    assert res.status_code == 200
    assert len(res.json) == 1
    assert res.json[0]["assignmentID"] == assignment_id


def test_student_can_download_own_submission(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="teacheruser")
    make_admin(email="student@example.com", password="student", name="studentuser")

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_id = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Download Class"}),
        headers={"Content-Type": "application/json"},
    ).json["class"]["id"]

    assignment_id = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({
            "courseID": class_id,
            "name": "Assignment",
            "rubric": "Test",
        }),
        headers={"Content-Type": "application/json"},
    ).json["assignment"]["id"]

    test_client.post(
        "/class/enroll_students",
        data=json.dumps({
            "class_id": class_id,
            "students": "id,name,email\n1,Student,student@example.com"
        }),
        headers={"Content-Type": "application/json"},
    )

    # student upload
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "student@example.com", "password": "student"}),
        headers={"Content-Type": "application/json"},
    )

    test_client.post(
        f"/assignment/submit/{assignment_id}",
        data={"file": (BytesIO(b"download me"), "download.txt")},
        content_type="multipart/form-data",
    )

    res = test_client.get(f"/assignment/download_my_submission/{assignment_id}")

    assert res.status_code == 200
    assert "download.txt" in res.headers.get("Content-Disposition", "")


def test_student_cannot_submit_if_not_enrolled(test_client, make_admin):
    make_admin(email="teacher@example.com", password="teacher", name="teacheruser")
    make_admin(email="student@example.com", password="student", name="studentuser")

    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "teacher"}),
        headers={"Content-Type": "application/json"},
    )

    class_id = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "NoEnroll"}),
        headers={"Content-Type": "application/json"},
    ).json["class"]["id"]

    assignment_id = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps({
            "courseID": class_id,
            "name": "Assignment",
            "rubric": "Test",
        }),
        headers={"Content-Type": "application/json"},
    ).json["assignment"]["id"]

    # student NOT enrolled
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "student@example.com", "password": "student"}),
        headers={"Content-Type": "application/json"},
    )

    res = test_client.post(
        f"/assignment/submit/{assignment_id}",
        data={"file": (BytesIO(b"bad"), "bad.txt")},
        content_type="multipart/form-data",
    )

    assert res.status_code == 403