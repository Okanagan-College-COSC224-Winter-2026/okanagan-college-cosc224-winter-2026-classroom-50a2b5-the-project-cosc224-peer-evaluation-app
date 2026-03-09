import json


def test_teacher_can_change_password_successfully(test_client, make_admin):
    """
    GIVEN a logged-in teacher user
    WHEN they submit the correct current password and a new password
    THEN the system updates it successfully and returns confirmation
    """
    make_admin(email="teacher@example.com", password="oldpass", name="teacheruser")

    # Login first
    login_response = test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "oldpass"}),
        headers={"Content-Type": "application/json"},
    )
    assert login_response.status_code == 200

    # Change password
    response = test_client.post(
        "/auth/change_password",
        data=json.dumps(
            {
                "current_password": "oldpass",
                "new_password": "newpass123",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 200
    assert response.json["msg"] == "Password changed successfully"


def test_teacher_can_login_with_new_password_after_change(test_client, make_admin):
    """
    GIVEN a logged-in teacher user
    WHEN they change their password
    THEN they can log in immediately using the updated credentials
    """
    make_admin(email="teacher@example.com", password="oldpass", name="teacheruser")

    # Login first
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "oldpass"}),
        headers={"Content-Type": "application/json"},
    )

    # Change password
    change_response = test_client.post(
        "/auth/change_password",
        data=json.dumps(
            {
                "current_password": "oldpass",
                "new_password": "newpass123",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert change_response.status_code == 200

    # Logout
    test_client.post("/auth/logout")

    # Login with new password
    login_response = test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "newpass123"}),
        headers={"Content-Type": "application/json"},
    )

    assert login_response.status_code == 200
    assert login_response.json["email"] == "teacher@example.com"


def test_teacher_cannot_change_password_with_wrong_current_password(test_client, make_admin):
    """
    GIVEN a logged-in teacher user
    WHEN they submit the wrong current password
    THEN the system should reject the password change
    """
    make_admin(email="teacher@example.com", password="oldpass", name="teacheruser")

    # Login first
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "oldpass"}),
        headers={"Content-Type": "application/json"},
    )

    response = test_client.post(
        "/auth/change_password",
        data=json.dumps(
            {
                "current_password": "wrongpass",
                "new_password": "newpass123",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "Current password is incorrect"


def test_change_password_requires_both_fields(test_client, make_admin):
    """
    GIVEN a logged-in teacher user
    WHEN they omit current_password or new_password
    THEN the request should return a 400 error
    """
    make_admin(email="teacher@example.com", password="oldpass", name="teacheruser")

    # Login first
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "oldpass"}),
        headers={"Content-Type": "application/json"},
    )

    response = test_client.post(
        "/auth/change_password",
        data=json.dumps({"current_password": "oldpass"}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json["msg"] == "Current password and new password are required"


def test_unauthenticated_user_cannot_change_password(test_client):
    """
    GIVEN an unauthenticated user
    WHEN they try to change a password
    THEN the request should be unauthorized
    """
    response = test_client.post(
        "/auth/change_password",
        data=json.dumps(
            {
                "current_password": "oldpass",
                "new_password": "newpass123",
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 401