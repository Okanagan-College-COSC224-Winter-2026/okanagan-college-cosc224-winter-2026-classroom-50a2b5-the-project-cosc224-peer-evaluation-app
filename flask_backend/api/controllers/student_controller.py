from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_backend.database import db
from flask_backend.models import User, User_Course, Course, Assignment, Review, Criterion

student_bp = Blueprint('student', __name__, url_prefix='/student')

@student_bp.route('/grades', methods=['GET'])
@jwt_required()
def get_student_grades():
    """
    Get aggregated peer review grades for all courses the student is enrolled in.
    
    Returns:
        JSON response with student_id and list of courses with grades
    """
    # Get the current logged-in user's ID from JWT token
    current_user_id = get_jwt_identity()
    
    # Get the user from database
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get all courses the student is enrolled in
    user_courses = User_Course.query.filter_by(userID=current_user_id).all()
    
    courses_data = []
    
    for user_course in user_courses:
        course = Course.query.get(user_course.courseID)
        if not course:
            continue
            
        # Get all assignments for this course
        assignments = Assignment.query.filter_by(courseID=course.courseID).all()
        total_assignments = len(assignments)
        
        # Calculate grades for this course
        total_score = 0
        graded_assignments = 0
        
        for assignment in assignments:
            # Find all reviews where the current user is the reviewee
            reviews = Review.query.filter_by(
                assignmentID=assignment.assignmentID,
                revieweeID=current_user_id
            ).all()
            
            if not reviews:
                continue
            
            # Calculate average score for this assignment
            assignment_scores = []
            for review in reviews:
                # Get all criteria scores for this review
                criteria = Criterion.query.filter_by(reviewID=review.reviewID).all()
                if criteria:
                    review_score = sum(c.score for c in criteria) / len(criteria)
                    assignment_scores.append(review_score)
            
            if assignment_scores:
                avg_assignment_score = sum(assignment_scores) / len(assignment_scores)
                total_score += avg_assignment_score
                graded_assignments += 1
        
        # Calculate overall course grade
        has_grades = graded_assignments > 0
        grade = (total_score / graded_assignments) if has_grades else None
        
        course_data = {
            "course_id": course.courseID,
            "course_name": course.courseName,
            "grade": round(grade, 2) if grade else None,
            "max_score": 5,
            "graded_assignments": graded_assignments,
            "total_assignments": total_assignments,
            "has_grades": has_grades
        }
        
        courses_data.append(course_data)
    
    response = {
        "student_id": current_user_id,
        "courses": courses_data
    }
    
    return jsonify(response), 200
    