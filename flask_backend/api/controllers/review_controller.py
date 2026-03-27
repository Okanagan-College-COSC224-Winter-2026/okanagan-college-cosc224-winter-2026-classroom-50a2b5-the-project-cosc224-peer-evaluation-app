"""
Review controller for the peer evaluation app.

Handles peer review submission and retrieval (US2 & US3).

Endpoints:
  POST  /review/submit                              — Submit a review with criteria (atomic)
  PUT   /review/<id>                                 — Update an existing review
  GET   /review/<id>                                 — Get a review by ID with criteria
  GET   /review/lookup?assignmentID=X&revieweeID=Y   — Lookup existing review (reviewer from JWT)
  GET   /review/assignment/<id>                      — List all reviews for an assignment
  GET   /review/assignment/<id>/my-reviewed          — Reviewee IDs already reviewed by current user
  GET   /review/course/<id>/my-progress              — Per-assignment review completion for current student
  GET   /review/course/<id>/summary                  — Grade summary for all assignments in a course
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import (
    Assignment,
    Course,
    CourseGroup,
    CriteriaDescription,
    Criterion,
    CriterionSchema,
    Group_Members,
    Review,
    ReviewSchema,
    Rubric,
    User,
)
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("review", __name__, url_prefix="/review")


# ============================================================================
# HELPERS
# ============================================================================


def _get_user_group_in_course(user_id, course_id):
    """Return the CourseGroup the user belongs to in this course, or None."""
    membership = (
        Group_Members.query
        .join(CourseGroup, CourseGroup.id == Group_Members.groupID)
        .filter(Group_Members.userID == user_id, CourseGroup.courseID == course_id)
        .first()
    )
    if membership:
        return CourseGroup.get_by_id(membership.groupID)
    return None


def _can_edit_review(user, review):
    """Check if a user is authorized to edit a review.

    Individual reviews: only the original reviewer can edit.
    Group reviews: any member of the reviewer's group can edit.
    """
    if user.is_teacher() or user.is_admin():
        return True

    if review.review_type == "individual":
        return review.reviewerID == user.id

    # Group review — check if user is in the same group as the original reviewer
    assignment = Assignment.get_by_id(review.assignmentID)
    if not assignment:
        return False

    user_group = _get_user_group_in_course(user.id, assignment.courseID)
    reviewer_group = _get_user_group_in_course(review.reviewerID, assignment.courseID)

    return (
        user_group is not None
        and reviewer_group is not None
        and user_group.id == reviewer_group.id
    )


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
            "review_type": str (optional — "individual" or "group", default "individual"),
            "comments": str (optional — overall review comment),
            "criteria": [
                { "criterionRowID": int, "grade": int, "comments": str (optional) },
                ...
            ]
        }

    Returns 201 with the created review (including id) on success.
    Returns 409 if a duplicate review exists.
    """
    data = request.get_json()

    # --- validate required fields ---
    assignment_id = data.get("assignmentID")
    reviewee_id = data.get("revieweeID")
    review_type = data.get("review_type", "individual")
    review_comments = data.get("comments", "")
    criteria_data = data.get("criteria", [])

    if not assignment_id or not reviewee_id:
        return jsonify({"msg": "assignmentID and revieweeID are required"}), 400

    if review_type not in ("individual", "group"):
        return jsonify({"msg": "review_type must be 'individual' or 'group'"}), 400

    # --- resolve reviewer from JWT ---
    email = get_jwt_identity()
    reviewer = User.get_by_email(email)
    if not reviewer:
        return jsonify({"msg": "Authenticated user not found"}), 404

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    # --- check if review type is enabled on the assignment ---
    if review_type == "individual" and not assignment.individual_reviews:
        return jsonify({"msg": "Individual reviews are not enabled for this assignment"}), 400
    if review_type == "group" and not assignment.group_reviews:
        return jsonify({"msg": "Group reviews are not enabled for this assignment"}), 400

    # --- type-specific validation ---
    if review_type == "individual":
        if reviewer.id == reviewee_id:
            return jsonify({"msg": "You cannot review yourself"}), 400

        reviewee = User.get_by_id(reviewee_id)
        if not reviewee:
            return jsonify({"msg": "Reviewee not found"}), 404

        # Prevent duplicate individual reviews
        existing = Review.query.filter_by(
            assignmentID=assignment_id,
            reviewerID=reviewer.id,
            revieweeID=reviewee_id,
            review_type="individual",
        ).first()
        if existing:
            return (
                jsonify({"msg": "You have already reviewed this person for this assignment"}),
                409,
            )
    else:
        # Group review
        target_group = CourseGroup.get_by_id(reviewee_id)
        if not target_group:
            return jsonify({"msg": "Target group not found"}), 404

        # Reviewer must be in a group for this course
        reviewer_group = _get_user_group_in_course(reviewer.id, assignment.courseID)
        if not reviewer_group:
            return jsonify({"msg": "You must be in a group to submit a group review"}), 400

        # Cannot review own group
        if reviewer_group.id == target_group.id:
            return jsonify({"msg": "You cannot review your own group"}), 400

        # Prevent duplicate: check if ANY member of reviewer's group already reviewed this target
        group_member_ids = [
            m.userID for m in Group_Members.query.filter_by(groupID=reviewer_group.id).all()
        ]
        existing = Review.query.filter(
            Review.assignmentID == assignment_id,
            Review.reviewerID.in_(group_member_ids),
            Review.revieweeID == reviewee_id,
            Review.review_type == "group",
        ).first()
        if existing:
            return (
                jsonify({"msg": "Your group has already reviewed this group for this assignment"}),
                409,
            )

    # --- create review + criteria in one transaction ---
    try:
        review = Review(
            assignmentID=assignment_id,
            reviewerID=reviewer.id,
            revieweeID=reviewee_id,
            review_type=review_type,
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
# UPDATE (edit existing review)
# ============================================================================


@bp.route("/<int:review_id>", methods=["PUT"])
@jwt_required()
def update_review(review_id):
    """Update an existing review's criteria and/or comments.

    For individual reviews: only the original reviewer can edit.
    For group reviews: any member of the reviewer's group can edit.

    Request body:
        {
            "comments": str (optional),
            "criteria": [
                { "criterionRowID": int, "grade": int, "comments": str (optional) },
                ...
            ]
        }
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    review = Review.get_by_id(review_id)
    if not review:
        return jsonify({"msg": "Review not found"}), 404

    if not _can_edit_review(user, review):
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.get_json()

    try:
        # Update comments if provided
        if "comments" in data:
            review.comments = data["comments"]

        # Replace criteria if provided
        if "criteria" in data:
            # Delete existing criteria
            Criterion.query.filter_by(reviewID=review.id).delete()

            for crit in data["criteria"]:
                criterion_row_id = crit.get("criterionRowID")
                if criterion_row_id is None:
                    db.session.rollback()
                    return jsonify({"msg": "Each criterion must include criterionRowID"}), 400

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
        return jsonify({"msg": f"Failed to update review: {str(e)}"}), 500

    return jsonify({"msg": "Review updated"}), 200


# ============================================================================
# LOOKUP (check if a review already exists)
# ============================================================================


@bp.route("/lookup", methods=["GET"])
@jwt_required()
def lookup_review():
    """Look up an existing review by assignment and reviewee.

    The reviewer is taken from the JWT token.
    For group reviews, any member of the reviewer's group can look up the review.

    Query params:  assignmentID (int), revieweeID (int), review_type (str, optional)
    Returns the review with its criteria, or 404 if none exists.
    """
    assignment_id = request.args.get("assignmentID", type=int)
    reviewee_id = request.args.get("revieweeID", type=int)
    review_type = request.args.get("review_type", "individual")

    if not assignment_id or not reviewee_id:
        return jsonify({"msg": "assignmentID and revieweeID are required"}), 400

    email = get_jwt_identity()
    reviewer = User.get_by_email(email)
    if not reviewer:
        return jsonify({"msg": "Authenticated user not found"}), 404

    if review_type == "group":
        # For group reviews, find the review submitted by any member of the user's group
        assignment = Assignment.get_by_id(assignment_id)
        if not assignment:
            return jsonify({"msg": "Assignment not found"}), 404

        user_group = _get_user_group_in_course(reviewer.id, assignment.courseID)
        if not user_group:
            return jsonify({"msg": "Review not found"}), 404

        group_member_ids = [
            m.userID for m in Group_Members.query.filter_by(groupID=user_group.id).all()
        ]
        review = Review.query.filter(
            Review.assignmentID == assignment_id,
            Review.reviewerID.in_(group_member_ids),
            Review.revieweeID == reviewee_id,
            Review.review_type == "group",
        ).first()
    else:
        review = Review.query.filter_by(
            assignmentID=assignment_id,
            reviewerID=reviewer.id,
            revieweeID=reviewee_id,
            review_type="individual",
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
    For group reviews, any member of the reviewing or reviewed group can view.
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
        if review.review_type == "individual":
            if review.reviewerID != user.id and review.revieweeID != user.id:
                return jsonify({"msg": "Unauthorized"}), 403
        else:
            # Group review — user must be in the reviewer or reviewee group
            assignment = Assignment.get_by_id(review.assignmentID)
            user_group = _get_user_group_in_course(user.id, assignment.courseID) if assignment else None
            reviewer_group = _get_user_group_in_course(review.reviewerID, assignment.courseID) if assignment else None

            is_in_reviewer_group = user_group and reviewer_group and user_group.id == reviewer_group.id
            is_in_reviewee_group = user_group and user_group.id == review.revieweeID

            if not is_in_reviewer_group and not is_in_reviewee_group:
                return jsonify({"msg": "Unauthorized"}), 403

    criteria = Criterion.query.filter_by(reviewID=review.id).all()

    result = ReviewSchema().dump(review)

    # Strip or replace reviewer identity for students
    assignment = Assignment.get_by_id(review.assignmentID)
    is_student = not user.is_teacher() and not user.is_admin()
    if assignment and is_student:
        if review.review_type == "individual":
            if assignment.is_anonymous and review.revieweeID == user.id:
                result["reviewer"] = {"id": None, "name": "Anonymous", "email": None}
        elif review.review_type == "group":
            if assignment.is_anonymous:
                result["reviewer"] = {"id": None, "name": "Anonymous", "email": None}
            else:
                reviewer_group = _get_user_group_in_course(review.reviewerID, assignment.courseID)
                result["reviewer"] = {
                    "id": None,
                    "name": reviewer_group.name if reviewer_group else "Unknown Group",
                    "email": None,
                }

    result["criteria"] = CriterionSchema(many=True).dump(criteria)
    return jsonify(result), 200


# ============================================================================
# MY REVIEWED (which reviewees has the current user already reviewed?)
# ============================================================================


@bp.route("/assignment/<int:assignment_id>/my-reviewed", methods=["GET"])
@jwt_required()
def my_reviewed(assignment_id):
    """Return reviewee IDs that the current user has already reviewed.

    For individual reviews: returns user IDs the logged-in user reviewed.
    For group reviews: returns group IDs that anyone on the user's team reviewed.

    Query param: review_type (default "individual")
    Returns: { "reviewee_ids": [int, ...] }
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    review_type = request.args.get("review_type", "individual")

    if review_type == "group":
        user_group = _get_user_group_in_course(user.id, assignment.courseID)
        if not user_group:
            return jsonify({"reviewee_ids": []}), 200

        group_member_ids = [
            m.userID for m in Group_Members.query.filter_by(groupID=user_group.id).all()
        ]
        reviews = Review.query.filter(
            Review.assignmentID == assignment_id,
            Review.reviewerID.in_(group_member_ids),
            Review.review_type == "group",
        ).all()
    else:
        reviews = Review.query.filter_by(
            assignmentID=assignment_id,
            reviewerID=user.id,
            review_type="individual",
        ).all()

    reviewee_ids = list({r.revieweeID for r in reviews})
    return jsonify({"reviewee_ids": reviewee_ids}), 200


# ============================================================================
# LIST REVIEWS FOR AN ASSIGNMENT
# ============================================================================


@bp.route("/assignment/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_reviews_for_assignment(assignment_id):
    """List all reviews for an assignment.

    Supports optional query param ``review_type`` to filter by type.
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

    review_type_filter = request.args.get("review_type")

    is_teacher_or_admin = user.is_teacher() or user.is_admin()

    query = Review.query.filter_by(assignmentID=assignment_id)

    if review_type_filter:
        query = query.filter_by(review_type=review_type_filter)

    if is_teacher_or_admin:
        reviews = query.all()
    else:
        if review_type_filter == "group":
            # Students see group reviews targeting their group
            user_group = _get_user_group_in_course(user.id, assignment.courseID)
            if user_group:
                reviews = query.filter_by(revieweeID=user_group.id).all()
            else:
                reviews = []
        else:
            # Students see only individual reviews they received
            reviews = query.filter_by(revieweeID=user.id).all()

    results = []
    for review in reviews:
        dumped = ReviewSchema().dump(review)

        # Load criteria for each review
        criteria = Criterion.query.filter_by(reviewID=review.id).all()
        dumped["criteria"] = CriterionSchema(many=True).dump(criteria)

        # Anonymize or replace reviewer for students
        if not is_teacher_or_admin:
            if review.review_type == "individual" and assignment.is_anonymous:
                dumped["reviewer"] = {"id": None, "name": "Anonymous", "email": None}
            elif review.review_type == "group":
                if assignment.is_anonymous:
                    dumped["reviewer"] = {"id": None, "name": "Anonymous", "email": None}
                else:
                    reviewer_group = _get_user_group_in_course(review.reviewerID, assignment.courseID)
                    dumped["reviewer"] = {
                        "id": None,
                        "name": reviewer_group.name if reviewer_group else "Unknown Group",
                        "email": None,
                    }

        results.append(dumped)

    return jsonify(results), 200


# ============================================================================
# MY PROGRESS (per-assignment review completion for current student)
# ============================================================================


@bp.route("/course/<int:course_id>/my-progress", methods=["GET"])
@jwt_required()
def my_progress(course_id):
    """Return per-assignment review completion counts for the current student.

    Individual required = group members minus self.
    Group required = other groups in the course.
    Group completed counts reviews by any member of the student's group.

    Returns: { "assignments": [ { assignment_id, individual_completed,
    individual_required, group_completed, group_required }, ... ] }
    """
    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "Authenticated user not found"}), 404

    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    # Determine user's group and group members
    user_group = _get_user_group_in_course(user.id, course_id)

    if user_group:
        group_member_ids = [
            m.userID for m in Group_Members.query.filter_by(groupID=user_group.id).all()
        ]
        other_member_ids = [mid for mid in group_member_ids if mid != user.id]
        individual_required = len(other_member_ids)

        all_groups = CourseGroup.query.filter_by(courseID=course_id).all()
        group_required = len([g for g in all_groups if g.id != user_group.id])
    else:
        group_member_ids = []
        individual_required = 0
        group_required = 0

    assignments = Assignment.get_by_class_id(course_id)
    result = []

    for assignment in assignments:
        # Individual: reviews by this user (only if enabled)
        if assignment.individual_reviews:
            ind_completed = Review.query.filter_by(
                assignmentID=assignment.id,
                reviewerID=user.id,
                review_type="individual",
            ).count()
            ind_required = individual_required
        else:
            ind_completed = 0
            ind_required = 0

        # Group: reviews by any member of user's group (only if enabled)
        if assignment.group_reviews and user_group and group_member_ids:
            grp_completed = Review.query.filter(
                Review.assignmentID == assignment.id,
                Review.reviewerID.in_(group_member_ids),
                Review.review_type == "group",
            ).count()
            grp_required = group_required
        else:
            grp_completed = 0
            grp_required = 0

        result.append({
            "assignment_id": assignment.id,
            "individual_completed": ind_completed,
            "individual_required": ind_required,
            "group_completed": grp_completed,
            "group_required": grp_required,
        })

    return jsonify({"assignments": result}), 200


# ============================================================================
# COURSE GRADE SUMMARY
# ============================================================================


@bp.route("/course/<int:course_id>/summary", methods=["GET"])
@jwt_required()
def course_grade_summary(course_id):
    """Compute grade summary for all assignments in a course.

    Returns separate individual and group averages, plus a 50/50 weighted
    course average.

    For students: averages are based on reviews *they received* (individual)
    and reviews *their group received* (group).
    For teachers: averages are based on *all* reviews for the assignment.

    An optional query param ``studentID`` lets teachers request a summary
    scoped to a specific student.

    Returns:
        {
            "assignments": [ ... ],
            "individualAverage": float | null,
            "individualMax": float | null,
            "groupAverage": float | null,
            "groupMax": float | null,
            "courseAverage": float | null,
            "courseMax": float | null
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
            target_student_id = None
    else:
        target_student_id = user.id

    # Determine target student's group for group review lookups
    target_group = None
    if target_student_id:
        target_group = _get_user_group_in_course(target_student_id, course_id)

    assignments = Assignment.get_by_class_id(course_id)
    assignment_summaries = []

    # Track per-type averages across all assignments
    individual_assignment_avgs = []
    individual_max_values = []
    group_assignment_avgs = []
    group_max_values = []

    for assignment in assignments:
        # --- Individual reviews ---
        if target_student_id:
            ind_reviews = Review.query.filter_by(
                assignmentID=assignment.id, revieweeID=target_student_id, review_type="individual"
            ).all()
        else:
            ind_reviews = Review.query.filter_by(
                assignmentID=assignment.id, review_type="individual"
            ).all()

        ind_totals = []
        for review in ind_reviews:
            criteria = Criterion.query.filter_by(reviewID=review.id).all()
            scored = [c for c in criteria if c.grade is not None]
            if scored:
                ind_totals.append(sum(c.grade for c in scored))

        ind_avg = sum(ind_totals) / len(ind_totals) if ind_totals else None
        ind_max = _compute_max_score(assignment.id, "individual")

        if ind_avg is not None:
            individual_assignment_avgs.append(ind_avg)
            if ind_max is not None:
                individual_max_values.append(ind_max)

        # --- Group reviews ---
        if target_group:
            grp_reviews = Review.query.filter_by(
                assignmentID=assignment.id, revieweeID=target_group.id, review_type="group"
            ).all()
        elif target_student_id and not target_group:
            grp_reviews = []
        else:
            grp_reviews = Review.query.filter_by(
                assignmentID=assignment.id, review_type="group"
            ).all()

        grp_totals = []
        for review in grp_reviews:
            criteria = Criterion.query.filter_by(reviewID=review.id).all()
            scored = [c for c in criteria if c.grade is not None]
            if scored:
                grp_totals.append(sum(c.grade for c in scored))

        grp_avg = sum(grp_totals) / len(grp_totals) if grp_totals else None
        grp_max = _compute_max_score(assignment.id, "group")

        if grp_avg is not None:
            group_assignment_avgs.append(grp_avg)
            if grp_max is not None:
                group_max_values.append(grp_max)

        assignment_summaries.append(
            {
                "id": assignment.id,
                "name": assignment.name,
                "individualReviewCount": len(ind_reviews),
                "individualAverage": round(ind_avg, 2) if ind_avg is not None else None,
                "individualMax": ind_max,
                "groupReviewCount": len(grp_reviews),
                "groupAverage": round(grp_avg, 2) if grp_avg is not None else None,
                "groupMax": grp_max,
            }
        )

    # Compute per-type course totals (sum of scores / sum of maxes)
    ind_course_avg = (
        sum(individual_assignment_avgs)
        if individual_assignment_avgs
        else None
    )
    ind_course_max = (
        sum(individual_max_values)
        if individual_max_values
        else None
    )
    grp_course_avg = (
        sum(group_assignment_avgs)
        if group_assignment_avgs
        else None
    )
    grp_course_max = (
        sum(group_max_values)
        if group_max_values
        else None
    )

    # Course total: sum all points earned / sum all points possible
    course_avg_parts = []
    course_max_parts = []
    if ind_course_avg is not None:
        course_avg_parts.append(ind_course_avg)
        if ind_course_max is not None:
            course_max_parts.append(ind_course_max)
    if grp_course_avg is not None:
        course_avg_parts.append(grp_course_avg)
        if grp_course_max is not None:
            course_max_parts.append(grp_course_max)

    course_avg = sum(course_avg_parts) if course_avg_parts else None
    course_max = sum(course_max_parts) if course_max_parts else None

    return (
        jsonify(
            {
                "assignments": assignment_summaries,
                "individualAverage": round(ind_course_avg, 2) if ind_course_avg is not None else None,
                "individualMax": round(ind_course_max, 2) if ind_course_max is not None else None,
                "groupAverage": round(grp_course_avg, 2) if grp_course_avg is not None else None,
                "groupMax": round(grp_course_max, 2) if grp_course_max is not None else None,
                "courseAverage": round(course_avg, 2) if course_avg is not None else None,
                "courseMax": round(course_max, 2) if course_max is not None else None,
            }
        ),
        200,
    )


def _compute_max_score(assignment_id, rubric_type="individual"):
    """Compute the max possible score for an assignment from its rubric criteria.

    Sums scoreMax across all CriteriaDescription rows for the rubric
    of the given type.  Returns None if no rubric exists.
    """
    rubric = Rubric.query.filter_by(
        assignmentID=assignment_id, rubric_type=rubric_type
    ).first()
    if not rubric:
        return None

    descriptions = CriteriaDescription.query.filter_by(rubricID=rubric.id).all()
    if not descriptions:
        return None

    total = sum(d.scoreMax for d in descriptions if d.scoreMax is not None)
    return total if total > 0 else None
