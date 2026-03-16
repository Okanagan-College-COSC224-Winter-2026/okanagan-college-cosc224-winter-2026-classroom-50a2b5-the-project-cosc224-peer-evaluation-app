"""Tests for group management endpoints (US27)"""
import json
import pytest
import datetime


@pytest.fixture
def course_with_assignment(test_client, make_admin):
    """Create a course with an assignment for testing"""
    # Create a teacher user and login
    make_admin(email="teacher@example.com", password="password", name="Teacher")
    test_client.post(
        "/auth/login",
        data=json.dumps({"email": "teacher@example.com", "password": "password"}),
        headers={"Content-Type": "application/json"},
    )

    # Create class
    class_response = test_client.post(
        "/class/create_class",
        data=json.dumps({"name": "Test Group Course"}),
        headers={"Content-Type": "application/json"},
    )
    assert class_response.status_code == 201
    course_id = class_response.json["class"]["id"]

    # Create assignment with future due date
    future_due = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    ).replace(microsecond=0)
    due_str = future_due.replace(tzinfo=None).isoformat()

    assignment_response = test_client.post(
        "/assignment/create_assignment",
        data=json.dumps(
            {
                "courseID": course_id,
                "name": "Group Assignment",
                "rubric": "Test rubric",
                "due_date": due_str,
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert assignment_response.status_code == 201
    assignment_id = assignment_response.json["assignment"]["id"]

    return {
        "course_id": course_id,
        "assignment_id": assignment_id,
        "test_client": test_client,
    }


class TestGroupCreation:
    """Test group creation endpoint"""

    def test_create_group_success(self, test_client, course_with_assignment):
        """Test successful group creation by teacher"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Group A"}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 201
        assert response.json["msg"] == "Group created successfully"
        assert response.json["group"]["name"] == "Group A"

    def test_create_group_duplicate_name(self, test_client, course_with_assignment):
        """Creating two groups with same name should fail"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        resp1 = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Dup"}),
            headers={"Content-Type": "application/json"},
        )
        assert resp1.status_code == 201

        resp2 = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Dup"}),
            headers={"Content-Type": "application/json"},
        )
        assert resp2.status_code == 400
        assert "already exists" in resp2.json["msg"]

    def test_create_group_missing_assignment_id(self, test_client, make_admin):
        """Test group creation fails without assignment ID"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        response = test_client.post(
            "/groups/create",
            data=json.dumps({"name": "Group A"}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400
        assert "Assignment ID is required" in response.json["msg"]

    def test_create_group_missing_name(self, test_client, course_with_assignment):
        """Test group creation fails without group name"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400
        assert "Group name is required" in response.json["msg"]

    def test_create_group_invalid_assignment(self, test_client, make_admin):
        """Test group creation fails with non-existent assignment"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": 9999, "name": "Group A"}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 404
        assert "Assignment not found" in response.json["msg"]

    def test_create_group_unauthorized_teacher(
        self, test_client, course_with_assignment, make_admin
    ):
        """Test non-course teacher cannot create group"""
        # Create a different teacher
        make_admin(
            email="other_teacher@example.com", password="password", name="Other Teacher"
        )

        # Logout and login as other teacher
        test_client.get("/auth/logout")
        test_client.post(
            "/auth/login",
            data=json.dumps(
                {"email": "other_teacher@example.com", "password": "password"}
            ),
            headers={"Content-Type": "application/json"},
        )

        response = test_client.post(
            "/groups/create",
            data=json.dumps(
                {"assignmentID": course_with_assignment["assignment_id"], "name": "Group A"}
            ),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 403
        assert "not the teacher" in response.json["msg"]


class TestGetGroups:
    """Test retrieving groups for an assignment"""

    def test_get_groups_success(self, test_client, course_with_assignment):
        """Test retrieving groups for an assignment as teacher"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create multiple groups
        for i in range(2):
            test_client.post(
                "/groups/create",
                data=json.dumps({"assignmentID": assignment_id, "name": f"Group {i + 1}"}),
                headers={"Content-Type": "application/json"},
            )

        response = test_client.get(f"/groups/{assignment_id}")
        assert response.status_code == 200
        groups = response.json
        assert len(groups) == 2

    def test_get_groups_student_can_see_all(self, test_client, course_with_assignment):
        """Student should see every group on the assignment"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]
        course_id = course_with_assignment["course_id"]

        # create multiple groups
        for i in range(3):
            test_client.post(
                "/groups/create",
                data=json.dumps({"assignmentID": assignment_id, "name": f"G{i}"}),
                headers={"Content-Type": "application/json"},
            )

        # enroll a student and login
        test_client.post(
            "/class/enroll_students",
            data=json.dumps({
                "class_id": course_id,
                "students": "id,name,email\n1,Test Student,student@example.com",
            }),
            headers={"Content-Type": "application/json"},
        )
        from api.models import User
        student = User.get_by_email("student@example.com")
        test_client.get("/auth/logout")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "student@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        resp = test_client.get(f"/groups/{assignment_id}")
        assert resp.status_code == 200
        groups = resp.json
        assert len(groups) == 3

    def test_get_groups_invalid_assignment(self, test_client, make_admin):
        """Test retrieving groups for non-existent assignment"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        response = test_client.get("/groups/9999")
        assert response.status_code == 404
        assert "Assignment not found" in response.json["msg"]

    def test_next_groupid_counts(self, test_client, course_with_assignment):
        """Endpoint should return number of groups for assignment"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        # no groups initially
        resp = test_client.get(f"/groups/next_groupid?assignmentID={assignment_id}")
        assert resp.status_code == 200
        assert resp.json == 0

        # create a new group and check count increments
        test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "CountMe"}),
            headers={"Content-Type": "application/json"},
        )
        resp2 = test_client.get(f"/groups/next_groupid?assignmentID={assignment_id}")
        assert resp2.status_code == 200
        assert resp2.json == 1

    def test_next_groupid_no_param(self, test_client, make_admin):
        """Missing assignmentID yields 400"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        r = test_client.get("/groups/next_groupid")
        assert r.status_code == 400
        assert "assignmentID" in r.json.get("msg", "")

    def test_next_groupid_invalid_assignment(self, test_client, make_admin):
        """Non-existent assignment returns 404"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        r = test_client.get("/groups/next_groupid?assignmentID=9999")
        assert r.status_code == 404
        assert "Assignment not found" in r.json.get("msg", "")

    def test_list_all_groups_alias(self, test_client, course_with_assignment):
        """Legacy /list_all_groups path should behave like /groups/<id>"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        # create one group so the list is non-empty
        test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Alias"}),
            headers={"Content-Type": "application/json"},
        )

        resp = test_client.get(f"/groups/list_all_groups/{assignment_id}")
        assert resp.status_code == 200
        assert isinstance(resp.json, list)
        assert len(resp.json) == 1

    def test_list_ua_groups(self, test_client, course_with_assignment):
        """Test listing unassigned groups (students not in any group)"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]
        course_id = course_with_assignment["course_id"]

        # Enroll students
        test_client.post(
            "/class/enroll_students",
            data=json.dumps({
                "class_id": course_id,
                "students": "id,name,email\n1,Student A,a@example.com\n2,Student B,b@example.com\n3,Student C,c@example.com",
            }),
            headers={"Content-Type": "application/json"},
        )

        # Create a group
        group_resp = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Group 1"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_resp.json["group"]["id"]

        # Add Student A to the group
        from api.models import User
        student_a = User.get_by_email("a@example.com")
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student_a.id}),
            headers={"Content-Type": "application/json"},
        )

        # Check unassigned students
        resp = test_client.get(f"/groups/list_ua_groups/{assignment_id}")
        assert resp.status_code == 200
        assert isinstance(resp.json, list)
        # Should have all 3 students (since list_ua_groups now returns all enrolled)
        assert len(resp.json) == 3
        emails = [stu["email"] for stu in resp.json]
        assert "a@example.com" in emails
        assert "b@example.com" in emails
        assert "c@example.com" in emails
        # Check groupID is -1
        for stu in resp.json:
            assert stu["groupID"] == -1

    def test_list_student_group_members(self, test_client, course_with_assignment):
        """Test listing members of a student's group"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]
        course_id = course_with_assignment["course_id"]

        # Enroll students
        test_client.post(
            "/class/enroll_students",
            data=json.dumps({
                "class_id": course_id,
                "students": "id,name,email\n1,Student A,a@example.com\n2,Student B,b@example.com\n3,Student C,c@example.com",
            }),
            headers={"Content-Type": "application/json"},
        )

        # Create a group and add Student A and B
        group_resp = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Group 1"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_resp.json["group"]["id"]

        from api.models import User
        student_a = User.get_by_email("a@example.com")
        student_b = User.get_by_email("b@example.com")

        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student_a.id}),
            headers={"Content-Type": "application/json"},
        )
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student_b.id}),
            headers={"Content-Type": "application/json"},
        )

        # Request group members for student A
        resp = test_client.get(f"/groups/list_stu_groups/{assignment_id}/{student_a.id}")
        assert resp.status_code == 200
        assert isinstance(resp.json, list)
        assert len(resp.json) == 2
        assert all(item["groupID"] == group_id for item in resp.json)
        user_ids = {item["userID"] for item in resp.json}
        assert student_a.id in user_ids
        assert student_b.id in user_ids


class TestEditGroup:
    """Test editing group information"""

    def test_edit_group_name_success(self, test_client, course_with_assignment):
        """Test successfully editing group name"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create a group
        create_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Original Name"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = create_response.json["group"]["id"]

        # Edit the group
        response = test_client.patch(
            f"/groups/{group_id}",
            data=json.dumps({"name": "Updated Name"}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 200
        assert response.json["group"]["name"] == "Updated Name"

    def test_edit_group_missing_name(self, test_client, course_with_assignment):
        """Test editing group fails without new name"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        create_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Group A"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = create_response.json["group"]["id"]

        response = test_client.patch(
            f"/groups/{group_id}",
            data=json.dumps({}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400


class TestDeleteGroup:
    """Test deleting groups"""

    def test_delete_group_success(self, test_client, course_with_assignment):
        """Test successfully deleting a group"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        create_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Group to Delete"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = create_response.json["group"]["id"]

        response = test_client.delete(f"/groups/{group_id}")
        assert response.status_code == 200
        assert "deleted successfully" in response.json["msg"]

    def test_delete_group_invalid_id(self, test_client, make_admin):
        """Test deleting non-existent group"""
        make_admin(email="teacher@example.com", password="password", name="Teacher")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "teacher@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        response = test_client.delete("/groups/9999")
        assert response.status_code == 404


class TestGroupMembers:
    """Test managing group members"""

    def test_add_member_success(self, test_client, course_with_assignment):
        """Test successfully adding a student to a group"""
        test_client = course_with_assignment["test_client"]
        course_id = course_with_assignment["course_id"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create group
        group_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Test Group"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_response.json["group"]["id"]

        # Enroll a student
        test_client.post(
            "/class/enroll_students",
            data=json.dumps(
                {
                    "class_id": course_id,
                    "students": "id,name,email\n1,Test Student,student@example.com",
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        # Get student ID
        from api.models import User

        student = User.get_by_email("student@example.com")

        response = test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 201
        assert "added to group successfully" in response.json["msg"]

    def test_add_member_missing_user_id(self, test_client, course_with_assignment):
        """Test adding member fails without user ID"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create group
        group_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Test Group"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_response.json["group"]["id"]

        response = test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400

    def test_remove_member_success(self, test_client, course_with_assignment):
        """Test successfully removing a student from a group"""
        test_client = course_with_assignment["test_client"]
        course_id = course_with_assignment["course_id"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create group
        group_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Test Group"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_response.json["group"]["id"]

        # Enroll a student
        test_client.post(
            "/class/enroll_students",
            data=json.dumps(
                {
                    "class_id": course_id,
                    "students": "id,name,email\n1,Test Student,student@example.com",
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        # Get student ID
        from api.models import User

        student = User.get_by_email("student@example.com")

        # Add member first
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )

        # Remove member
        response = test_client.delete(f"/groups/{group_id}/remove_member/{student.id}")
        assert response.status_code == 200
        assert "removed from group successfully" in response.json["msg"]

    def test_get_group_members(self, test_client, course_with_assignment):
        """Test retrieving members of a group"""
        test_client = course_with_assignment["test_client"]
        course_id = course_with_assignment["course_id"]
        assignment_id = course_with_assignment["assignment_id"]

        # Create group
        group_response = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Test Group"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_response.json["group"]["id"]

        # Enroll a student
        test_client.post(
            "/class/enroll_students",
            data=json.dumps(
                {
                    "class_id": course_id,
                    "students": "id,name,email\n1,Test Student,student@example.com",
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        # Get student ID
        from api.models import User

        student = User.get_by_email("student@example.com")

        # Add member
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )

    def test_student_view_group_details(self, test_client, course_with_assignment):
        """Student should be able to fetch their group's details"""
        test_client = course_with_assignment["test_client"]
        course_id = course_with_assignment["course_id"]
        assignment_id = course_with_assignment["assignment_id"]

        # create group and enroll student as above
        group_resp = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "GroupX"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_resp.json["group"]["id"]

        test_client.post(
            "/class/enroll_students",
            data=json.dumps(
                {
                    "class_id": course_id,
                    "students": "id,name,email\n1,Test Student,student@example.com",
                }
            ),
            headers={"Content-Type": "application/json"},
        )
        from api.models import User
        student = User.get_by_email("student@example.com")
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )

        # login as student
        test_client.get("/auth/logout")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "student@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        resp = test_client.get(f"/groups/details/{group_id}")
        assert resp.status_code == 200
        assert resp.json.get("id") == group_id

    def test_student_view_any_group(self, test_client, course_with_assignment):
        """Student should be able to fetch details of any group"""
        test_client = course_with_assignment["test_client"]
        course_id = course_with_assignment["course_id"]
        assignment_id = course_with_assignment["assignment_id"]

        # create two groups and enroll student in only the first
        resp1 = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "First"}),
            headers={"Content-Type": "application/json"},
        )
        gid1 = resp1.json["group"]["id"]
        resp2 = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Second"}),
            headers={"Content-Type": "application/json"},
        )
        gid2 = resp2.json["group"]["id"]

        test_client.post(
            "/class/enroll_students",
            data=json.dumps({
                "class_id": course_id,
                "students": "id,name,email\n1,Test Student,student@example.com",
            }),
            headers={"Content-Type": "application/json"},
        )
        from api.models import User
        student = User.get_by_email("student@example.com")
        test_client.post(
            f"/groups/{gid1}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )

        # login as the student
        test_client.get("/auth/logout")
        test_client.post(
            "/auth/login",
            data=json.dumps({"email": "student@example.com", "password": "password"}),
            headers={"Content-Type": "application/json"},
        )

        # should be able to fetch details for second group even though not a member
        resp = test_client.get(f"/groups/details/{gid2}")
        assert resp.status_code == 200
        assert resp.json.get("id") == gid2

    def test_list_group_members_legacy(self, test_client, course_with_assignment):
        """Test legacy /list_group_members/<assignment_id>/<group_id> route"""
        test_client = course_with_assignment["test_client"]
        assignment_id = course_with_assignment["assignment_id"]
        course_id = course_with_assignment["course_id"]

        # Create a group
        group_resp = test_client.post(
            "/groups/create",
            data=json.dumps({"assignmentID": assignment_id, "name": "Test Group"}),
            headers={"Content-Type": "application/json"},
        )
        group_id = group_resp.json["group"]["id"]

        # Enroll and add a student to the group
        test_client.post(
            "/class/enroll_students",
            data=json.dumps({
                "class_id": course_id,
                "students": "id,name,email\n1,Test Student,student@example.com",
            }),
            headers={"Content-Type": "application/json"},
        )
        from api.models import User
        student = User.get_by_email("student@example.com")
        test_client.post(
            f"/groups/{group_id}/add_member",
            data=json.dumps({"userID": student.id}),
            headers={"Content-Type": "application/json"},
        )

        # Test the legacy route
        resp = test_client.get(f"/groups/list_group_members/{assignment_id}/{group_id}")
        assert resp.status_code == 200
        assert isinstance(resp.json, list)
        assert len(resp.json) == 1
        assert resp.json[0]["email"] == "student@example.com"
        assert resp.json[0]["groupID"] == group_id
