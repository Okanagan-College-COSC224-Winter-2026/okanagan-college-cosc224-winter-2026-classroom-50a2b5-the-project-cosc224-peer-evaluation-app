from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import (
    Assignment,
    Course,
    CourseGroup,
    Group_Members,
    User,
    CourseGroupSchema,
    GroupMembersSchema,
    UserListSchema,
)
from .auth_controller import jwt_teacher_required

bp = Blueprint("group", __name__, url_prefix="/groups")


@bp.route("/create", methods=["POST"])
@jwt_teacher_required
def create_group():
    """Create a new group for an assignment (teacher only)"""
    data = request.get_json()
    assignment_id = data.get("assignmentID")
    group_name = data.get("name")

    if not assignment_id:
        return jsonify({"msg": "Assignment ID is required"}), 400
    if not group_name:
        return jsonify({"msg": "Group name is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Groups cannot be modified after assignment due date"}), 400

    new_group = CourseGroup(name=group_name, assignmentID=assignment_id)
    CourseGroup.create_group(new_group)

    return (
        jsonify(
            {
                "msg": "Group created successfully",
                "group": CourseGroupSchema().dump(new_group),
            }
        ),
        201,
    )


@bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_groups_for_assignment(assignment_id):
    """Get all groups for an assignment (teacher and students can view)"""
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    # Only the teacher of the course or admin can view groups for an assignment
    if not user.is_admin() and course.teacherID != user.id:
        # TODO: Allow students to view their own groups
        return jsonify({"msg": "Unauthorized: You cannot view groups for this assignment"}), 403

    groups = assignment.groups.all()
    groups_data = CourseGroupSchema(many=True).dump(groups)

    return jsonify(groups_data), 200


@bp.route("/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group_details(group_id):
    """Get details of a specific group including members"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    # Only teacher of course or admin can view group details
    if not user.is_admin() and course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You cannot view this group"}), 403

    members = group.members.all()
    members_data = []
    for member in members:
        member_user = User.get_by_id(member.userID)
        if member_user:
            members_data.append(UserListSchema().dump(member_user))

    group_data = CourseGroupSchema().dump(group)
    group_data["members"] = members_data

    return jsonify(group_data), 200


@bp.route("/<int:group_id>", methods=["PATCH"])
@jwt_teacher_required
def edit_group(group_id):
    """Edit group name (teacher only)"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Groups cannot be modified after assignment due date"}), 400

    data = request.get_json()
    new_name = data.get("name")

    if not new_name:
        return jsonify({"msg": "Group name is required"}), 400

    group.name = new_name
    group.update()

    return (
        jsonify(
            {
                "msg": "Group updated successfully",
                "group": CourseGroupSchema().dump(group),
            }
        ),
        200,
    )


@bp.route("/<int:group_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_group(group_id):
    """Delete a group (teacher only) - removes all members first"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Groups cannot be deleted after assignment due date"}), 400

    # Delete all group members first (cascade handled by model)
    group.delete()

    return jsonify({"msg": "Group deleted successfully"}), 200


@bp.route("/<int:group_id>/members", methods=["GET"])
@jwt_required()
def get_group_members(group_id):
    """Get all members of a group"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    # Only teacher of course or admin can view member list
    if not user.is_admin() and course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You cannot view group members"}), 403

    members = group.members.all()
    members_data = []
    for member in members:
        member_user = User.get_by_id(member.userID)
        if member_user:
            members_data.append(UserListSchema().dump(member_user))

    return jsonify(members_data), 200


@bp.route("/<int:group_id>/add_member", methods=["POST"])
@jwt_teacher_required
def add_member_to_group(group_id):
    """Add a student to a group (teacher only)"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Members cannot be added after assignment due date"}), 400

    data = request.get_json()
    student_id = data.get("userID")

    if not student_id:
        return jsonify({"msg": "Student ID is required"}), 400

    student = User.get_by_id(student_id)
    if not student:
        return jsonify({"msg": "Student not found"}), 404

    if not student.is_student():
        return jsonify({"msg": "User must be a student to be added to a group"}), 400

    # Check if student is already in another group for this assignment
    existing_membership = Group_Members.query.filter_by(
        userID=student_id, assignmentID=group.assignmentID
    ).first()

    if existing_membership and existing_membership.groupID != group_id:
        return (
            jsonify(
                {
                    "msg": "Student is already in another group for this assignment",
                }
            ),
            400,
        )

    # Check if student is already in this group
    existing_in_group = Group_Members.get(student_id, group_id)
    if existing_in_group:
        return jsonify({"msg": "Student is already in this group"}), 400

    # Add member to group
    group_member = Group_Members.create_group_member(
        userID=student_id, groupID=group_id, assignmentID=group.assignmentID
    )

    return (
        jsonify(
            {
                "msg": "Student added to group successfully",
                "member": GroupMembersSchema().dump(group_member),
            }
        ),
        201,
    )


@bp.route("/<int:group_id>/remove_member/<int:user_id>", methods=["DELETE"])
@jwt_teacher_required
def remove_member_from_group(group_id, user_id):
    """Remove a student from a group (teacher only)"""
    group = CourseGroup.get_by_id(group_id)
    if not group:
        return jsonify({"msg": "Group not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    assignment = Assignment.get_by_id(group.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify({"msg": "Unauthorized: You are not the teacher of this class"}), 403

    if not assignment.can_modify():
        return jsonify({"msg": "Members cannot be removed after assignment due date"}), 400

    group_member = Group_Members.get(user_id, group_id)
    if not group_member:
        return jsonify({"msg": "Student is not a member of this group"}), 404

    group_member.delete()

    return jsonify({"msg": "Student removed from group successfully"}), 200
