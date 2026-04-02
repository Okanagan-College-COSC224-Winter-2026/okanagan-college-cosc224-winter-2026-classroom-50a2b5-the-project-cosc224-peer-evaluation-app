from flask import Blueprint, jsonify
from sqlalchemy import func

from ..models import Assignment, Course, Criterion, Group_Members, Review, User, User_Course
from ..models.db import db
from .auth_controller import jwt_teacher_required

teacher_bp = Blueprint("teacher", __name__, url_prefix="/teacher")


@teacher_bp.route('/classes/<int:course_id>/progress', methods=['GET'])
@jwt_teacher_required
def course_student_progress(course_id):
    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    assignments = db.session.query(Assignment).filter_by(courseID=course_id).all()

    enrolled_students = (
        db.session.query(User)
        .join(User_Course, User_Course.userID == User.id)
        .filter(User_Course.courseID == course_id, User.role == 'student')
        .all()
    )

    students_data = []
    for student in enrolled_students:
        per_assignment = {}
        for assignment in assignments:
            in_group = (
                db.session.query(Group_Members)
                .filter_by(userID=student.id, assignmentID=assignment.id)
                .first() is not None
            )

            reviews_given = (
                db.session.query(func.count(Review.id))
                .filter(Review.reviewerID == student.id, Review.assignmentID == assignment.id)
                .scalar() or 0
            )

            reviews_received = (
                db.session.query(func.count(Review.id))
                .filter(Review.revieweeID == student.id, Review.assignmentID == assignment.id)
                .scalar() or 0
            )

            avg_score = (
                db.session.query(func.avg(Criterion.grade))
                .join(Review, Criterion.reviewID == Review.id)
                .filter(Review.revieweeID == student.id, Review.assignmentID == assignment.id)
                .scalar()
            )

            per_assignment[str(assignment.id)] = {
                'in_group': in_group,
                'reviews_given': reviews_given,
                'reviews_received': reviews_received,
                'avg_score': float(avg_score) if avg_score is not None else None,
            }

        students_data.append({
            'user_id': student.id,
            'name': student.name,
            'email': student.email,
            'per_assignment': per_assignment,
        })

    return jsonify({
        'course_id': course.id,
        'course_name': course.name,
        'assignments': [{'id': a.id, 'name': a.name} for a in assignments],
        'students': students_data,
    }), 200
