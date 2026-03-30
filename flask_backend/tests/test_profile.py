import json
from io import BytesIO


def login(test_client, email, password):
    return test_client.post(
        "/auth/login",
        data=json.dumps({
            "email": email,
            "password": password,
        }),
        headers={"Content-Type": "application/json"},
    )


def test_get_current_profile(test_client, make_admin):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Teacher User",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.get("/user/profile")

    assert response.status_code == 200
    assert response.json["name"] == "Teacher User"
    assert response.json["email"] == "teacher@example.com"


def test_unauthenticated_user_cannot_get_profile(test_client):
    response = test_client.get("/user/profile")
    assert response.status_code == 401


def test_user_can_update_profile_name(test_client, make_admin):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Old Name",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.patch(
        "/user/profile",
        data={
            "name": "New Name",
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.json["msg"] == "Profile updated"
    assert response.json["user"]["name"] == "New Name"

    # confirm it persisted
    profile_response = test_client.get("/user/profile")
    assert profile_response.status_code == 200
    assert profile_response.json["name"] == "New Name"


def test_user_can_upload_profile_picture(test_client, make_admin):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Teacher User",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.patch(
        "/user/profile",
        data={
            "name": "Teacher User",
            "profile_picture": (
                BytesIO(b"fake image data"),
                "profile.jpg",
            ),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.json["msg"] == "Profile updated"
    assert response.json["user"]["profile_picture"] is not None
    assert "profile_pictures/" in response.json["user"]["profile_picture"]

    # confirm it persisted
    profile_response = test_client.get("/user/profile")
    assert profile_response.status_code == 200
    assert profile_response.json["profile_picture"] is not None
    assert "profile_pictures/" in profile_response.json["profile_picture"]


def test_user_can_update_name_and_profile_picture_together(
    test_client,
    make_admin,
):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Original Name",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.patch(
        "/user/profile",
        data={
            "name": "Updated Name",
            "profile_picture": (
                BytesIO(b"fake png data"),
                "avatar.png",
            ),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.json["user"]["name"] == "Updated Name"
    assert response.json["user"]["profile_picture"] is not None

    profile_response = test_client.get("/user/profile")
    assert profile_response.status_code == 200
    assert profile_response.json["name"] == "Updated Name"
    assert profile_response.json["profile_picture"] is not None


def test_profile_update_rejects_empty_name(test_client, make_admin):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Teacher User",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.patch(
        "/user/profile",
        data={
            "name": "",
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.json["msg"] == "Name cannot be empty"


def test_profile_update_rejects_invalid_picture_type(
    test_client,
    make_admin,
):
    make_admin(
        email="teacher@example.com",
        password="teacher",
        name="Teacher User",
    )

    login_response = login(
        test_client,
        "teacher@example.com",
        "teacher",
    )
    assert login_response.status_code == 200

    response = test_client.patch(
        "/user/profile",
        data={
            "name": "Teacher User",
            "profile_picture": (
                BytesIO(b"not an image"),
                "virus.exe",
            ),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.json["msg"] == "Invalid image type"


def test_unauthenticated_user_cannot_update_profile(test_client):
    response = test_client.patch(
        "/user/profile",
        data={
            "name": "Should Fail",
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 401