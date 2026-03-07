"""
Review controller for the peer evaluation app.

Handles peer review submission and retrieval (US2 & US3).

Endpoints:
  POST  /review/submit                              — Submit a review with criteria (atomic)
  GET   /review/<id>                                 — Get a review by ID with criteria
  GET   /review/lookup?assignmentID=X&revieweeID=Y   — Lookup existing review (reviewer from JWT)
  GET   /review/assignment/<id>                      — List all reviews for an assignment
  GET   /review/course/<id>/summary                  — Grade summary for all assignments in a course
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import (
    Assignment,
    Course,
    CriteriaDescription,
    Criterion,
    CriterionSchema,
    Review,
    ReviewSchema,
    Rubric,
    User,
)
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("review", __name__, url_prefix="/review")


# ============================================================================
# SUBMIT (create review + criteria atomically)
# ============================================================================


@bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_review():
    """Submit a peer review with all criteria scores in one atomic operation.

    The reviewer is determined from the JWT token (prevents impersonation).

    Request body:
        {
            "assignmentID": int,
            "revieweeID": int,
            "comments": str (optional — overall review comment),
            "criteria": [
                { "criterionRowID": int, "grade": int, "comments": str (optional) },
                ...
            ]
        }

    Returns 201 with the created review (including id) on success.
    Returns 409 if the user already reviewed this person for this assignment.
    """
    data = request.get_json()

    # --- validate required fields ---
    assignment_id = data.get("assignmentID")
    reviewee_id = data.get("revieweeID")
    review_comments = data.get("comments", "")
    criteria_data = data.get("criteria", [])

    if not assignment_id or not reviewee_id:
        return jsonify({"msg": "assignmentID and revieweeID are required"}), 400

    # --- resolve reviewer from JWT ---
    email = get_jwt_identity()
    reviewer = User.get_by_email(email)
    if not reviewer:
        return jsonify({"msg": "Authenticated user not found"}), 404

    # --- basic validation ---
    if reviewer.id == reviewee_id:
        return jsonify({"msg": "You cannot review yourself"}), 400

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    reviewee = User.get_by_id(reviewee_id)
    if not reviewee:
        return jsonify({"msg": "Reviewee not found"}), 404

    # --- prevent duplicate reviews ---
    existing = Review.query.filter_by(
        assignmentID=assignment_id,
        reviewerID=reviewer.id,
        revieweeID=reviewee_id,
    ).first()
    if existing:
        return (
            jsonify(
                {"msg": "You have already reviewed this person for this assignment"}
            ),
            409,
        )

    # --- create review + criteria in one transaction ---
    try:
        review = Review(
            assignmentID=assignment_id,
            reviewerID=reviewer.id,
            revieweeID=reviewee_id,
            comments=review_comments,
        )
        db.session.add(review)
        db.session.flush()  # assigns review.id without committing

        for crit in criteria_data:
            criterion_row_id = crit.get("criterionRowID")
            if criterion_row_id is None:
                db.session.rollback()
                return (
                    jsonify({"msg": "Each criterion must include criterionRowID"}),
                    400,
                )

            criterion = Criterion(
                reviewID=review.id,
                criterionRowID=criterion_row_id,
                grade=crit.get("grade"),
                comments=crit.get("comments", ""),
            )
            db.session.add(criterion)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to submit review: {str(e)}"}), 500

    return (
        jsonify(
            {
                "msg": "Review submitted",
                "id": review.id,
            }
        ),
        201,
    )


# ============================================================================
# LOOKUP (check if a review already exists)
# ============================================================================


@bp.route("/lookup", methods=["GET"])
@jwt_required()
def lookup_review():
    """Look up an existing review by assignment and reviewee.

    The reviewer is taken from the JWT token.

    Query params:  assignmentID (int), revieweeID (int)
    Returns the review with its criteria, or 404 if none exists.
    """
    assignment_id = request.args.get("assignmentID", type=int)
    reviewee_id = request.args.get("revieweeID", type=int)

    if not assignment_id or not reviewee_id:
        return jsonify({"msg": "assignmentID and revieweeID are required"}), 400

    email = get_jwt_identity()
    reviewer = User.get_by_email(email)
    if not reviewer:
        return jsonify({"msg": "Authenticated user not found"}), 404

    review = Review.query.filter_by(
        assignmentID=assignment_id,
        reviewerID=reviewer.id,
        revieweeID=reviewee_id,
    ).first()

    if not review:
        return jsonify({"msg": "Review not found"}), 404

    # Load criteria for this review
    criteria = Criterion.query.filter_by(reviewID=review.id).all()

    return (
        jsonify(
            {
                "review": ReviewSchema().dump(review),
                "criteria": CriterionSchema(many=True).dump(criteria),
            }
        ),
        200,
    )


# ============================================================================
# GET SINGLE REVIEW
# ============================================================================


@bp.route("/<int:review_id>", methods=["GET"])
@jwt_required()
def get_review(review_id):
    """Get a single review by ID, including its criteria.

    Students can only view reviews they authored or received.
    Teachers can view any review.
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    review = Review.get_by_id(review_id)
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    # Authorization: students can only see their own reviews
    if not user.is_teacher() and not user.is_admin():
        if review.reviewerID != user.id and review.revieweeID != user.id:
            return jsonify({"msg": "Unauthorized"}), 403

    criteria = Criterion.query.filter_by(reviewID=review.id).all()

    result = ReviewSchema().dump(review)

    # If the assignment is anonymous and the user is the reviewee (not the
    # reviewer or a teacher), strip reviewer identity
    assignment = Assignment.get_by_id(review.assignmentID)
    if (
        assignment
        and assignment.is_anonymous
        and review.revieweeID == user.id
        and not user.is_teacher()
        and not user.is_admin()
    ):
        result["reviewer"] = {"id": None, "name": "Anonymous", "email": None}

    result["criteria"] = CriterionSchema(many=True).dump(criteria)
    return jsonify(result), 200


# ============================================================================
# LIST REVIEWS FOR AN ASSIGNMENT
# ============================================================================


@bp.route("/assignment/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_reviews_for_assignment(assignment_id):
    """List all reviews for an assignment.

    Teachers see all reviews.  Students see only reviews they received
    (with reviewer anonymized when the assignment's is_anonymous flag is set).
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    is_teacher_or_admin = user.is_teacher() or user.is_admin()

    if is_teacher_or_admin:
        # Teachers see every review for this assignment
        reviews = Review.query.filter_by(assignmentID=assignment_id).all()
    else:
        # Students see only reviews they received
        reviews = Review.query.filter_by(
            assignmentID=assignment_id, revieweeID=user.id
        ).all()

    results = []
    for review in reviews:
        dumped = ReviewSchema().dump(review)

        # Load criteria for each review
        criteria = Criterion.query.filter_by(reviewID=review.id).all()
        dumped["criteria"] = CriterionSchema(many=True).dump(criteria)

        # Anonymize reviewer if needed
        if (
            not is_teacher_or_admin
            and assignment.is_anonymous
        ):
            dumped["reviewer"] = {"id": None, "name": "Anonymous", "email": None}

        results.append(dumped)

    return jsonify(results), 200


# ============================================================================
# COURSE GRADE SUMMARY
# ============================================================================


@bp.route("/course/<int:course_id>/summary", methods=["GET"])
@jwt_required()
def course_grade_summary(course_id):
    """Compute grade summary for all assignments in a course.

    For students: averages are based on reviews *they received*.
    For teachers: averages are based on *all* reviews for the assignment.

    An optional query param ``studentID`` lets teachers request a summary
    scoped to a specific student (useful for US20 course-card grades).

    Returns:
        {
            "assignments": [
                {
                    "id": 1,
                    "name": "Peer Review HW",
                    "reviewCount": 3,
                    "averageScore": 12.5,
                    "maxScore": 15
                }, ...
            ],
            "courseAverage": 12.5,
            "courseMax": 15.0
        }
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    is_teacher_or_admin = user.is_teacher() or user.is_admin()

    # Teachers may pass ?studentID=X to view a specific student's summary
    target_student_id = None
    if is_teacher_or_admin:
        student_id_param = request.args.get("studentID", type=int)
        if student_id_param:
            target_student_id = student_id_param
        else:
            # Teacher viewing without studentID → aggregate all reviews
            target_student_id = None
    else:
        # Students always see their own received reviews
        target_student_id = user.id

    assignments = Assignment.get_by_class_id(course_id)
    assignment_summaries = []

    for assignment in assignments:
        # Get reviews scoped to target student or all reviews
        if target_student_id:
            reviews = Review.query.filter_by(
                assignmentID=assignment.id, revieweeID=target_student_id
            ).all()
        else:
            reviews = Review.query.filter_by(assignmentID=assignment.id).all()

        # Compute per-review totals, then average
        review_totals = []
        for review in reviews:
            criteria = Criterion.query.filter_by(reviewID=review.id).all()
            scored = [c for c in criteria if c.grade is not None]
            if scored:
                review_totals.append(sum(c.grade for c in scored))

        avg = (
            sum(review_totals) / len(review_totals) if review_totals else None
        )

        # Max score: sum of scoreMax from RubricCriteria (via any review's criteria)
        max_score = _compute_max_score(assignment.id)

        assignment_summaries.append(
            {
                "id": assignment.id,
                "name": assignment.name,
                "reviewCount": len(reviews),
                "averageScore": round(avg, 2) if avg is not None else None,
                "maxScore": max_score,
            }
        )

    # Course-level average: mean of assignment averages
    scored_assignments = [a for a in assignment_summaries if a["averageScore"] is not None]
    if scored_assignments:
        course_avg = sum(a["averageScore"] for a in scored_assignments) / len(
            scored_assignments
        )
        course_max_values = [
            a["maxScore"] for a in scored_assignments if a["maxScore"] is not None
        ]
        course_max = (
            sum(course_max_values) / len(course_max_values)
            if course_max_values
            else None
        )
    else:
        course_avg = None
        course_max = None

    return (
        jsonify(
            {
                "assignments": assignment_summaries,
                "courseAverage": round(course_avg, 2) if course_avg is not None else None,
                "courseMax": round(course_max, 2) if course_max is not None else None,
            }
        ),
        200,
    )


def _compute_max_score(assignment_id):
    """Compute the max possible score for an assignment from its rubric criteria.

    Sums scoreMax across all CriteriaDescription rows for the first rubric
    associated with the assignment.  Returns None if no rubric exists.
    """
    rubric = Rubric.query.filter_by(assignmentID=assignment_id).first()
    if not rubric:
        return None

    descriptions = CriteriaDescription.query.filter_by(rubricID=rubric.id).all()
    if not descriptions:
        return None

    total = sum(d.scoreMax for d in descriptions if d.scoreMax is not None)
    return total if total > 0 else None
