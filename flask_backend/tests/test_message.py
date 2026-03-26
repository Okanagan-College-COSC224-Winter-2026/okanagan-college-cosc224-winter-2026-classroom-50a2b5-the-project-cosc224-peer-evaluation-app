import json

from werkzeug.security import generate_password_hash

from api.models.assignment_model import Assignment
from api.models.course_group_model import CourseGroup
from api.models.course_model import Course
from api.models.db import db as _db
from api.models.group_members_model import Group_Members
from api.models.message_model import Message
from api.models.user_model import User


def _make_user(email, name, role="student", password="password123"):
    user = User(
        name=name,
        email=email,
        hash_pass=generate_password_hash(password),
        role=role,
    )
    _db.session.add(user)
    _db.session.commit()
    return user


def _login(test_client, email, password="password123"):
    return test_client.post(
        "/auth/login",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )


def _seed_group_data():
    teacher = _make_user("teacher@test.com", "Teacher", role="teacher")
    student_one = _make_user("student1@test.com", "Student One")
    student_two = _make_user("student2@test.com", "Student Two")
    outsider = _make_user("outsider@test.com", "Outsider")

    course = Course(teacherID=teacher.id, name="COSC 224")
    _db.session.add(course)
    _db.session.commit()

    assignment = Assignment(courseID=course.id, name="Sprint 1", rubric_text="Rubric")
    _db.session.add(assignment)
    _db.session.commit()

    group = CourseGroup(name="Group A", assignmentID=assignment.id)
    _db.session.add(group)
    _db.session.commit()

    _db.session.add_all([
        Group_Members(userID=student_one.id, groupID=group.id, assignmentID=assignment.id),
        Group_Members(userID=student_two.id, groupID=group.id, assignmentID=assignment.id),
    ])
    _db.session.commit()

    return {
        "teacher": teacher,
        "student_one": student_one,
        "student_two": student_two,
        "outsider": outsider,
        "course": course,
        "assignment": assignment,
        "group": group,
    }


def test_get_group_messages_returns_200_for_group_member(test_client, db):
    data = _seed_group_data()
    _db.session.add_all([
        Message(group_id=data["group"].id, sender_id=data["student_one"].id, content="Hey team"),
        Message(group_id=data["group"].id, sender_id=data["student_two"].id, content="Working on it"),
    ])
    _db.session.commit()

    _login(test_client, data["student_one"].email)
    response = test_client.get(f"/message/group/{data['group'].id}")

    assert response.status_code == 200
    payload = response.get_json()
    assert len(payload) == 2
    assert payload[0]["content"] == "Hey team"
    assert payload[1]["sender_name"] == "Student Two"


def test_get_group_messages_returns_403_for_non_member(test_client, db):
    data = _seed_group_data()

    _login(test_client, data["outsider"].email)
    response = test_client.get(f"/message/group/{data['group'].id}")

    assert response.status_code == 403
    assert response.get_json()["error"] == "Not a member of this group"


def test_post_group_message_creates_message_and_returns_201(test_client, db):
    data = _seed_group_data()

    _login(test_client, data["student_one"].email)
    response = test_client.post(
        f"/message/group/{data['group'].id}",
        data=json.dumps({"content": "Let's split the review tasks"}),
        content_type="application/json",
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["content"] == "Let's split the review tasks"
    assert payload["sender_id"] == data["student_one"].id

    saved = Message.query.filter_by(group_id=data["group"].id).all()
    assert len(saved) == 1
    assert saved[0].content == "Let's split the review tasks"


def test_post_group_message_returns_400_for_empty_content(test_client, db):
    data = _seed_group_data()

    _login(test_client, data["student_one"].email)
    response = test_client.post(
        f"/message/group/{data['group'].id}",
        data=json.dumps({"content": "   "}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Message content required"


def test_mark_group_messages_read_marks_only_other_users_messages(test_client, db):
    data = _seed_group_data()

    own_message = Message(
        group_id=data["group"].id,
        sender_id=data["student_one"].id,
        content="My own note",
        is_read=False,
    )
    other_message = Message(
        group_id=data["group"].id,
        sender_id=data["student_two"].id,
        content="Unread reply",
        is_read=False,
    )
    _db.session.add_all([own_message, other_message])
    _db.session.commit()

    _login(test_client, data["student_one"].email)
    response = test_client.put(f"/message/group/{data['group'].id}/read")

    assert response.status_code == 200

    refreshed_own = _db.session.get(Message, own_message.id)
    refreshed_other = _db.session.get(Message, other_message.id)
    assert refreshed_own.is_read is False
    assert refreshed_other.is_read is True