from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from ..models import User, Course, Assignment

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    dashboard_data = []

    if user.role == "teacher":
        classes = Course.get_courses_by_teacher(user.id)

        for c in classes:
            assignments = Assignment.get_by_class_id(c.id)
            assignment_list = [
                {
                    "assignment_id": a.id,
                    "name": a.name,
                    "due_date": a.due_date.isoformat() if a.due_date else None,
                }
                for a in assignments
            ]

            dashboard_data.append(
                {
                    "class_id": c.id,
                    "class_name": c.name,
                    "assignments": assignment_list,
                    # optional: if you want frontend to rely on it
                    "role": "teacher",
                }
            )

        return jsonify(
            {
                "role": "teacher",
                "teacher_id": user.id,
                "teacher_name": user.name,
                "dashboard": dashboard_data,
            }
        ), 200

    # ---- student dashboard ----
    # You need ONE of these model functions:
    # 1) Course.get_courses_by_student(user.id)
    # OR
    # 2) Course.get_courses_by_user(user.id)
    # OR query User_Courses join.
    classes = Course.get_courses_by_student(user.id)  # implement if missing

    for c in classes:
        assignments = Assignment.get_by_class_id(c.id)
        assignment_list = [
            {
                "assignment_id": a.id,
                "name": a.name,
                "due_date": a.due_date.isoformat() if a.due_date else None,
            }
            for a in assignments
        ]

        dashboard_data.append(
            {
                "class_id": c.id,
                "class_name": c.name,
                "assignments": assignment_list,
                "role": "student",
            }
        )

    return jsonify(
        {
            "role": "student",
            "student_id": user.id,
            "student_name": user.name,
            "dashboard": dashboard_data,
        }
    ), 200