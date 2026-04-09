"""
Random group creation controller with smart distribution logic.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import User, Course, CourseGroup, Group_Members, User_Course
from .auth_controller import jwt_teacher_required
import random

bp = Blueprint("group_creation", __name__, url_prefix="/groups")


# ============================================================================
# RANDOM GROUP CREATION
# ============================================================================

@bp.route("/create-random", methods=["POST"])
@jwt_teacher_required
def create_random_groups():
    """
    Create groups randomly based on:
    1. Number of groups only
    2. Members per group only
    3. Both parameters

    Request body:
        - courseID: int (required)
        - groupCount: int (optional) - number of groups to create
        - membersPerGroup: int (optional) - students per group
        - groupNamePrefix: str (optional, default: "Group")
    
    Returns logic:
        - groupCount only: Distribute students evenly, randomly assign leftovers
        - membersPerGroup only: Create as many complete groups as possible,
          if remaining > (size/2), create another group
        - Both: Create specified groups/sizes, report remaining students
    """
    data = request.get_json()
    course_id = data.get("courseID")
    group_count = data.get("groupCount")
    members_per_group = data.get("membersPerGroup")
    group_name_prefix = data.get("groupNamePrefix", "Group")
    
    # Validate required fields
    if not course_id:
        return jsonify({"msg": "courseID is required"}), 400
    
    if not group_count and not members_per_group:
        return jsonify({
            "msg": "Either groupCount or membersPerGroup (or both) is required"
        }), 400
    
    # Check course exists
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404
    
    # Verify the teacher owns this course
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if course.teacherID != user.id:
        return jsonify({"msg": "You are not authorized to create groups in this course"}), 403
    
    # Get all enrolled students
    enrollments = User_Course.query.filter_by(courseID=course_id).all()
    enrolled_students = [
        {
            "id": e.userID,
            "name": User.get_by_id(e.userID).name,
            "email": User.get_by_id(e.userID).email
        }
        for e in enrollments
    ]
    
    if not enrolled_students:
        return jsonify({"msg": "No students enrolled in this course"}), 400
    
    # Randomize student order
    random.shuffle(enrolled_students)
    
    # Determine distribution strategy
    if group_count and members_per_group:
        # Both parameters provided
        return handle_both_parameters(
            course_id, group_count, members_per_group, 
            enrolled_students, group_name_prefix
        )
    elif group_count:
        # Only group count provided
        return handle_group_count_only(
            course_id, group_count, enrolled_students, group_name_prefix
        )
    else:
        # Only members per group provided
        return handle_members_per_group_only(
            course_id, members_per_group, enrolled_students, group_name_prefix
        )


def handle_group_count_only(course_id, group_count, students, prefix):
    """
    Distribute students evenly across specified number of groups.
    Remaining students are randomly assigned to groups.
    """
    if group_count <= 0:
        return jsonify({"msg": "Group count must be greater than 0"}), 400
    
    # Calculate ideal group size
    total_students = len(students)
    base_size = total_students // group_count
    remainder = total_students % group_count
    
    # Create groups and distribute students
    groups_data = []
    student_idx = 0
    
    for i in range(group_count):
        # Some groups get one extra student to account for remainder
        group_size = base_size + (1 if i < remainder else 0)
        group = CourseGroup(
            name=f"{prefix} {i + 1}",
            courseID=course_id
        )
        CourseGroup.create_group(group)
        
        # Add students to this group
        group_members = []
        for j in range(group_size):
            if student_idx < len(students):
                student = students[student_idx]
                Group_Members.create_group_member(student["id"], group.id)
                group_members.append(student)
                student_idx += 1
        
        groups_data.append({
            "id": group.id,
            "name": group.name,
            "memberCount": len(group_members),
            "members": group_members
        })
    
    return jsonify({
        "msg": "Groups created successfully",
        "strategy": "Even distribution with random assignment",
        "groupCount": group_count,
        "totalStudents": total_students,
        "groups": groups_data,
        "remainingStudents": []
    }), 201


def handle_members_per_group_only(course_id, members_per_group, students, prefix):
    """
    Create as many complete groups as possible with specified member count.
    If remaining students > (size/2), create an additional group.
    """
    if members_per_group <= 0:
        return jsonify({"msg": "Members per group must be greater than 0"}), 400
    
    total_students = len(students)
    complete_groups = total_students // members_per_group
    remaining_count = total_students % members_per_group
    
    # Check if we should create an additional group for remaining students
    should_create_extra = remaining_count > (members_per_group / 2)
    total_groups = complete_groups + (1 if should_create_extra else 0)
    
    groups_data = []
    student_idx = 0
    remaining_students = []
    
    # Create complete groups
    for i in range(complete_groups):
        group = CourseGroup(
            name=f"{prefix} {i + 1}",
            courseID=course_id
        )
        CourseGroup.create_group(group)
        
        group_members = []
        for j in range(members_per_group):
            if student_idx < len(students):
                student = students[student_idx]
                Group_Members.create_group_member(student["id"], group.id)
                group_members.append(student)
                student_idx += 1
        
        groups_data.append({
            "id": group.id,
            "name": group.name,
            "memberCount": len(group_members),
            "members": group_members
        })
    
    # Handle remaining students
    if should_create_extra and remaining_count > 0:
        group = CourseGroup(
            name=f"{prefix} {total_groups}",
            courseID=course_id
        )
        CourseGroup.create_group(group)
        
        group_members = []
        while student_idx < len(students):
            student = students[student_idx]
            Group_Members.create_group_member(student["id"], group.id)
            group_members.append(student)
            student_idx += 1
        
        groups_data.append({
            "id": group.id,
            "name": group.name,
            "memberCount": len(group_members),
            "members": group_members
        })
    else:
        # Remaining students are less than half the group size
        # Notify teacher about these students
        while student_idx < len(students):
            remaining_students.append(students[student_idx])
            student_idx += 1
    
    return jsonify({
        "msg": "Groups created successfully",
        "strategy": "Fixed members per group",
        "membersPerGroup": members_per_group,
        "groupCount": total_groups,
        "totalStudents": total_students,
        "groups": groups_data,
        "remainingStudents": remaining_students,
        "remainingCount": len(remaining_students),
        "action": "NOTIFY" if remaining_students else None,
        "notification": f"{len(remaining_students)} students not assigned (less than half group size). Consider manually assigning." if remaining_students else None
    }), 201


def handle_both_parameters(course_id, group_count, members_per_group, students, prefix):
    """
    Create specified number of groups with specified member count.
    Notify teacher about remaining students with their full details.
    """
    if group_count <= 0:
        return jsonify({"msg": "Group count must be greater than 0"}), 400
    
    if members_per_group <= 0:
        return jsonify({"msg": "Members per group must be greater than 0"}), 400
    
    total_students = len(students)
    expected_capacity = group_count * members_per_group
    remaining_count = total_students - expected_capacity
    
    groups_data = []
    student_idx = 0
    remaining_students = []
    
    # Create specified number of groups with specified size
    for i in range(group_count):
        group = CourseGroup(
            name=f"{prefix} {i + 1}",
            courseID=course_id
        )
        CourseGroup.create_group(group)
        
        group_members = []
        for j in range(members_per_group):
            if student_idx < len(students):
                student = students[student_idx]
                Group_Members.create_group_member(student["id"], group.id)
                group_members.append(student)
                student_idx += 1
        
        groups_data.append({
            "id": group.id,
            "name": group.name,
            "memberCount": len(group_members),
            "members": group_members
        })
    
    # Collect remaining students with full details
    while student_idx < len(students):
        remaining_students.append(students[student_idx])
        student_idx += 1
    
    return jsonify({
        "msg": "Groups created successfully",
        "strategy": "Fixed groups and members per group",
        "groupCount": group_count,
        "membersPerGroup": members_per_group,
        "expectedCapacity": expected_capacity,
        "totalStudents": total_students,
        "groups": groups_data,
        "remainingStudents": remaining_students,
        "remainingCount": len(remaining_students),
        "action": "NOTIFY_WITH_DETAILS" if remaining_students else None,
        "notification": f"{len(remaining_students)} students could not be assigned to groups. Please assign them manually or adjust group parameters." if remaining_students else None
    }), 201
