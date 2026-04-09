"""
Test cases for Random Group Creation
Add these to your flask_backend/tests directory
"""

import pytest
from flask_jwt_extended import create_access_token
from ..api.models import Course, User, User_Course, CourseGroup, Group_Members
from ..api.controllers.group_creation_controller import (
    handle_group_count_only,
    handle_members_per_group_only,
    handle_both_parameters
)


class TestRandomGroupCreation:
    """Test suite for random group creation functionality"""

    @pytest.fixture
    def teacher(self, db):
        """Create a teacher user"""
        user = User(
            name="Test Teacher",
            email="teacher@example.com",
            hash_pass="hashed_password",
            role="teacher"
        )
        db.session.add(user)
        db.session.commit()
        return user

    @pytest.fixture
    def course(self, db, teacher):
        """Create a course"""
        course = Course(teacherID=teacher.id, name="Test Course")
        db.session.add(course)
        db.session.commit()
        return course

    @pytest.fixture
    def students(self, db):
        """Create 20 test students"""
        students = [
            User(
                name=f"Student {i}",
                email=f"student{i}@example.com",
                hash_pass="hashed_password",
                role="student"
            )
            for i in range(1, 21)
        ]
        for student in students:
            db.session.add(student)
        db.session.commit()
        return students

    @pytest.fixture
    def enrolled_students(self, db, course, students):
        """Enroll all students in the course"""
        for student in students:
            enrollment = User_Course(userID=student.id, courseID=course.id)
            db.session.add(enrollment)
        db.session.commit()
        return students

    def test_create_groups_with_group_count_only(self, client, teacher, course, enrolled_students):
        """
        Test: 20 students, 4 groups
        Expected: Each group gets 5 students evenly
        """
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 4,
                "groupNamePrefix": "Group"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        assert data["groupCount"] == 4
        assert data["totalStudents"] == 20
        assert len(data["groups"]) == 4
        
        # Each group should have 5 members
        for group in data["groups"]:
            assert group["memberCount"] == 5

    def test_create_groups_with_members_per_group_exact_fit(self, client, teacher, course, enrolled_students):
        """
        Test: 20 students, 5 members per group
        Expected: 4 complete groups with 0 remaining
        """
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "membersPerGroup": 5,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        assert len(data["groups"]) == 4
        assert data["totalStudents"] == 20
        assert len(data["remainingStudents"]) == 0
        
        for group in data["groups"]:
            assert group["memberCount"] == 5

    def test_create_groups_with_members_per_group_extra_group(self, client, teacher, course, enrolled_students):
        """
        Test: 20 students, 3 members per group
        Expected: 6 complete groups + 1 group with 2 members (since 2 > 1.5)
        """
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "membersPerGroup": 3,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        # 6 groups of 3 (18) + 1 group of 2 (2) = 20
        assert len(data["groups"]) == 7
        assert sum(g["memberCount"] for g in data["groups"]) == 20
        assert len(data["remainingStudents"]) == 0

    def test_create_groups_with_members_per_group_notify_remaining(self, client, teacher, course, enrolled_students):
        """
        Test: 20 students, 4 members per group
        Expected: 5 groups of 4 (20), no remaining
        But let's test with 19 students instead
        """
        # Remove one student from enrollment
        enrollment = User_Course.query.filter_by(
            userID=enrolled_students[0].id,
            courseID=course.id
        ).first()
        from ...api import db
        db.session.delete(enrollment)
        db.session.commit()

        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "membersPerGroup": 4,
                "groupNamePrefix": "Squad"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        # 4 complete groups (16) + 1 group with 3 (3) = 19
        assert len(data["groups"]) == 5
        assert sum(g["memberCount"] for g in data["groups"]) == 19

    def test_create_groups_with_both_parameters(self, client, teacher, course, enrolled_students):
        """
        Test: 20 students, 4 groups with 3 members each
        Expected: 4 groups with 3 members = 12 students, 8 remaining
        """
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 4,
                "membersPerGroup": 3,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        assert len(data["groups"]) == 4
        assert sum(g["memberCount"] for g in data["groups"]) == 12
        assert len(data["remainingStudents"]) == 8
        
        # Check remaining student details
        for student in data["remainingStudents"]:
            assert "id" in student
            assert "name" in student
            assert "email" in student

    def test_missing_parameters(self, client, teacher, course):
        """Test error when no parameters are provided"""
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Either groupCount or membersPerGroup" in data["msg"]

    def test_invalid_group_count(self, client, teacher, course, enrolled_students):
        """Test error with invalid group count"""
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 0,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "greater than 0" in data["msg"]

    def test_course_not_found(self, client, teacher):
        """Test error when course doesn't exist"""
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": 99999,
                "groupCount": 4,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 404
        data = response.get_json()
        assert "Course not found" in data["msg"]

    def test_unauthorized_teacher(self, client, enrolled_students, course):
        """Test error when non-owner teacher tries to create groups"""
        other_teacher = User.query.filter_by(role="teacher").first()
        if not other_teacher:
            other_teacher = User(
                name="Other Teacher",
                email="other@example.com",
                hash_pass="hashed_password",
                role="teacher"
            )
            from ...api import db
            db.session.add(other_teacher)
            db.session.commit()
        
        other_token = create_access_token(identity=other_teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 4,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {other_token}"}
        )

        assert response.status_code == 403
        data = response.get_json()
        assert "not authorized" in data["msg"]

    def test_no_students_enrolled(self, client, teacher, course):
        """Test error when no students are enrolled"""
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 4,
                "groupNamePrefix": "Team"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "No students enrolled" in data["msg"]

    def test_group_naming(self, client, teacher, course, enrolled_students):
        """Test that groups are named correctly"""
        teacher_token = create_access_token(identity=teacher.email)
        
        response = client.post(
            "/groups/create-random",
            json={
                "courseID": course.id,
                "groupCount": 3,
                "groupNamePrefix": "Squad"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 201
        data = response.get_json()
        
        expected_names = ["Squad 1", "Squad 2", "Squad 3"]
        actual_names = [g["name"] for g in data["groups"]]
        assert actual_names == expected_names
