from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import (
    Assignment,
    Course,
    CriteriaDescription,
    Criterion,
    CriterionSchema,
    Review,
    Rubric,
    User,
    User_Course,
)

bp = Blueprint("review", __name__)


def _parse_int(value, field_name):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer")


def _get_current_user():
    email = get_jwt_identity()
    return User.get_by_email(email)


def _get_assignment_criteria_rows(assignment_id):
    return (
        CriteriaDescription.query.join(Rubric, CriteriaDescription.rubricID == Rubric.id)
        .filter(Rubric.assignmentID == assignment_id)
        .order_by(CriteriaDescription.id.asc())
        .all()
    )


def _resolve_criterion_row_for_assignment(assignment_id, criterion_row_id):
    rows = _get_assignment_criteria_rows(assignment_id)

    if not rows:
        return None, None, "No rubric criteria found for assignment"

    for idx, row in enumerate(rows):
        if row.id == criterion_row_id:
            return row, idx, None

    if 0 <= criterion_row_id < len(rows):
        return rows[criterion_row_id], criterion_row_id, None

    return None, None, "criterionRowID does not match assignment rubric criteria"


@bp.route("/create_review", methods=["POST"])
@jwt_required()
def create_review():
    data = request.get_json() or {}

    try:
        assignment_id = _parse_int(data.get("assignmentID"), "assignmentID")
        reviewer_id = _parse_int(data.get("reviewerID"), "reviewerID")
        reviewee_id = _parse_int(data.get("revieweeID"), "revieweeID")
    except ValueError as exc:
        return jsonify({"msg": str(exc)}), 400

    if reviewer_id == reviewee_id:
        return jsonify({"msg": "reviewerID and revieweeID must be different"}), 400

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    reviewer = User.get_by_id(reviewer_id)
    reviewee = User.get_by_id(reviewee_id)
    if not reviewer or not reviewee:
        return jsonify({"msg": "Reviewer or reviewee not found"}), 404

    current_user = _get_current_user()
    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    if current_user.id != reviewer_id and not current_user.is_admin():
        return jsonify({"msg": "Unauthorized: reviewer mismatch"}), 403

    if not User_Course.get(reviewer_id, course.id) or not User_Course.get(reviewee_id, course.id):
        return jsonify({"msg": "Reviewer and reviewee must be enrolled in this course"}), 403

    existing = Review.query.filter_by(
        assignmentID=assignment_id,
        reviewerID=reviewer_id,
        revieweeID=reviewee_id,
    ).first()
    if existing:
        return jsonify({"id": existing.id, "msg": "Review already exists"}), 200

    review = Review(assignmentID=assignment_id, reviewerID=reviewer_id, revieweeID=reviewee_id)
    Review.create_review(review)

    return jsonify({"id": review.id, "msg": "Review created"}), 201


@bp.route("/create_criterion", methods=["POST"])
@jwt_required()
def create_criterion():
    data = request.get_json() or {}

    try:
        review_id = _parse_int(data.get("reviewID"), "reviewID")
        criterion_row_id = _parse_int(data.get("criterionRowID"), "criterionRowID")
    except ValueError as exc:
        return jsonify({"msg": str(exc)}), 400

    grade = data.get("grade")
    comments = data.get("comments") or ""

    review = Review.get_by_id(review_id)
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    assignment = Assignment.get_by_id(review.assignmentID)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    current_user = _get_current_user()
    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    can_manage = current_user.is_admin() or course.teacherID == current_user.id
    if current_user.id != review.reviewerID and not can_manage:
        return jsonify({"msg": "Unauthorized: only reviewer can submit criterion"}), 403

    criterion_row, _, resolve_error = _resolve_criterion_row_for_assignment(
        assignment.id, criterion_row_id
    )
    if resolve_error:
        return jsonify({"msg": resolve_error}), 400

    if criterion_row.hasScore:
        try:
            grade = int(grade)
        except (TypeError, ValueError):
            return jsonify({"msg": "grade must be an integer for scored criteria"}), 400

        if grade < 0 or grade > int(criterion_row.scoreMax):
            return jsonify({"msg": "grade is out of range for this criterion"}), 400
    else:
        grade = None

    if len(comments) > 255:
        return jsonify({"msg": "comments must be 255 characters or fewer"}), 400

    existing = Criterion.query.filter_by(reviewID=review_id, criterionRowID=criterion_row.id).first()
    if existing:
        existing.grade = grade
        existing.comments = comments
        existing.update()
        return jsonify({"msg": "Criterion updated", "criterion": CriterionSchema().dump(existing)}), 200

    criterion = Criterion(
        reviewID=review_id,
        criterionRowID=criterion_row.id,
        grade=grade,
        comments=comments,
    )
    Criterion.create_criterion(criterion)

    return jsonify({"msg": "Criterion created", "criterion": CriterionSchema().dump(criterion)}), 201


@bp.route("/review", methods=["GET"])
@jwt_required()
def get_review():
    try:
        assignment_id = _parse_int(request.args.get("assignmentID"), "assignmentID")
        reviewer_id = _parse_int(request.args.get("reviewerID"), "reviewerID")
        reviewee_id = _parse_int(request.args.get("revieweeID"), "revieweeID")
    except ValueError as exc:
        return jsonify({"msg": str(exc)}), 400

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    current_user = _get_current_user()
    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    can_view = (
        current_user.is_admin()
        or course.teacherID == current_user.id
        or current_user.id == reviewer_id
        or current_user.id == reviewee_id
    )
    if not can_view:
        return jsonify({"msg": "Unauthorized"}), 403

    review = Review.query.filter_by(
        assignmentID=assignment_id,
        reviewerID=reviewer_id,
        revieweeID=reviewee_id,
    ).first()
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    rows = _get_assignment_criteria_rows(assignment_id)
    row_index = {row.id: idx for idx, row in enumerate(rows)}
    grades = [0] * len(rows)

    criteria = Criterion.query.filter_by(reviewID=review.id).all()
    for criterion in criteria:
        idx = row_index.get(criterion.criterionRowID)
        if idx is not None and criterion.grade is not None:
            grades[idx] = criterion.grade

    return (
        jsonify(
            {
                "id": review.id,
                "assignmentID": review.assignmentID,
                "reviewerID": review.reviewerID,
                "revieweeID": review.revieweeID,
                "grades": grades,
                "criteria": CriterionSchema(many=True).dump(criteria),
            }
        ),
        200,
    )
