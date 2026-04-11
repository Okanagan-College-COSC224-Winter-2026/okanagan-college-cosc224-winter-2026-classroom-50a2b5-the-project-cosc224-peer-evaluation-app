from marshmallow import fields, validate

from .assignment_model import Assignment
from .course_group_model import CourseGroup
from .course_model import Course
from .criteria_description_model import CriteriaDescription
from .criterion_model import Criterion
from .db import db, ma
from .group_members_model import Group_Members
from .review_model import Review
from .rubric_model import Rubric
from .submission_model import Submission
from .enrollment_request_model import EnrollmentRequest
from .notification_model import Notification
from .review_flag_model import ReviewFlag
from .user_course_model import User_Course
from .user_model import User
from .blocked_student_model import BlockedStudent

# ============================================================
# USER SCHEMAS
# ============================================================


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Full user schema for serialization (excludes password)"""

    class Meta:
        model = User
        load_instance = True
        include_fk = False  # Don't expose raw foreign keys
        sqla_session = db.session
        exclude = ("hash_pass",)

    # Explicit fields for clarity and validation
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    preferred_name = fields.Str(load_default=None, validate=validate.Length(max=255))
    pronouns = fields.Str(load_default=None, validate=validate.Length(max=50))
    display_name = fields.Method("get_display_name", dump_only=True)
    email = fields.Email(required=True)
    role = fields.Str(
        dump_default="student",
        validate=validate.OneOf(["student", "teacher", "admin", "super_admin"]),
    )
    must_change_password = fields.Bool(dump_default=False)
    avatar_url = fields.Method("get_avatar_url", dump_only=True)

    def get_avatar_url(self, obj):
        return f"/user/avatar/{obj.id}" if getattr(obj, "avatar_path", None) else None

    def get_display_name(self, obj):
        return getattr(obj, "preferred_name", None) or obj.name


class UserRegistrationSchema(ma.Schema):
    """Schema for user registration input"""

    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))


class UserLoginSchema(ma.Schema):
    """Schema for login credentials"""

    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class UserListSchema(ma.SQLAlchemyAutoSchema):
    """Lightweight user schema for lists (minimal fields)"""

    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "display_name", "pronouns")
        dump_only = ("id", "display_name")

    display_name = fields.Method("get_display_name")

    def get_display_name(self, obj):
        return getattr(obj, "preferred_name", None) or obj.name


# ============================================================
# COURSE SCHEMAS
# ============================================================


class CourseSchema(ma.SQLAlchemyAutoSchema):
    """Full course schema with nested teacher and students.

    Note: To avoid N+1 queries, use Course.get_by_id_with_relations() or
    Course.get_all_with_relations() when fetching courses for serialization.
    """

    class Meta:
        model = Course
        load_instance = True
        include_fk = False
        sqla_session = db.session

    teacher = fields.Nested(UserListSchema, dump_only=True)
    students = fields.List(fields.Nested(UserListSchema), dump_only=True)


class CourseListSchema(ma.SQLAlchemyAutoSchema):
    """Lightweight course schema for lists"""

    class Meta:
        model = Course
        fields = ("id", "name", "teacherID")
        dump_only = ("id",)
        include_fk = True  # Allow teacherID to be serialized


# ============================================================
# ASSIGNMENT SCHEMAS
# ============================================================


class AssignmentSchema(ma.SQLAlchemyAutoSchema):
    """Full assignment schema"""

    class Meta:
        model = Assignment
        load_instance = True
        include_fk = True  # Include courseID in serialization
        sqla_session = db.session

    course = fields.Nested(CourseListSchema, dump_only=True)


# ============================================================
# RUBRIC & CRITERIA SCHEMAS
# ============================================================


class RubricSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Rubric
        load_instance = True
        include_fk = True
        sqla_session = db.session


class CriteriaDescriptionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CriteriaDescription
        load_instance = True
        include_fk = True
        sqla_session = db.session


class CriterionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Criterion
        load_instance = True
        include_fk = True
        sqla_session = db.session

    # Pull the human-readable criterion name from the related CriteriaDescription
    criterion_name = fields.Method("get_criterion_name")
    score_max = fields.Method("get_score_max")

    def get_criterion_name(self, obj):
        """Return the question text from the linked CriteriaDescription row."""
        if obj.criterion_row:
            return obj.criterion_row.question
        return None

    def get_score_max(self, obj):
        """Return the maximum possible score from the linked CriteriaDescription row."""
        if obj.criterion_row:
            return obj.criterion_row.scoreMax
        return None


# ============================================================
# REVIEW SCHEMAS
# ============================================================


class ReviewSchema(ma.SQLAlchemyAutoSchema):
    """Full review schema with nested relationships.

    Note: To avoid N+1 queries, use Review.get_by_id_with_relations() or
    Review.get_all_with_relations() when fetching reviews for serialization.
    """

    class Meta:
        model = Review
        load_instance = True
        include_fk = False
        sqla_session = db.session

    reviewer = fields.Nested(UserListSchema, dump_only=True)
    reviewee = fields.Nested(UserListSchema, dump_only=True)
    assignment = fields.Nested(AssignmentSchema, dump_only=True)


class ReviewListSchema(ma.SQLAlchemyAutoSchema):
    """Lightweight review schema for list endpoints.

    Uses minimal nested data to reduce query complexity.
    For list views, we don't need full assignment details with nested course.

    Note: Only includes assignmentID as FK since reviewer/reviewee provide their own IDs.
    This avoids redundancy while giving clients the assignment link they need.
    """

    class Meta:
        model = Review
        fields = ("id", "assignmentID", "comments", "reviewer", "reviewee")
        dump_only = ("id",)
        include_fk = True  # Allows assignmentID to be serialized

    reviewer = fields.Nested(UserListSchema, dump_only=True)
    reviewee = fields.Nested(UserListSchema, dump_only=True)


# ============================================================
# GROUP SCHEMAS
# ============================================================


class CourseGroupSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CourseGroup
        load_instance = True
        include_fk = True  # Include courseID in serialization
        sqla_session = db.session


class GroupMembersSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Group_Members
        load_instance = True
        include_fk = True  # Include userID and groupID in serialization
        sqla_session = db.session


# ============================================================
# JUNCTION TABLE SCHEMAS
# ============================================================


class UserCourseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User_Course
        load_instance = True
        include_fk = False
        sqla_session = db.session


class SubmissionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Submission
        load_instance = True
        include_fk = False
        sqla_session = db.session


# ============================================================
# REVIEW FLAG SCHEMAS
# ============================================================


class ReviewFlagSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ReviewFlag
        load_instance = True
        include_fk = True
        sqla_session = db.session

    user = fields.Nested(UserListSchema, dump_only=True)


# ============================================================
# ENROLLMENT REQUEST SCHEMAS
# ============================================================


class EnrollmentRequestSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = EnrollmentRequest
        load_instance = True
        include_fk = True
        sqla_session = db.session

    student = fields.Nested(UserListSchema, dump_only=True)
    course = fields.Nested(CourseListSchema, dump_only=True)


# ============================================================
# NOTIFICATION SCHEMAS
# ============================================================


class BlockedStudentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = BlockedStudent
        load_instance = True
        include_fk = True
        sqla_session = db.session

    student = fields.Nested(UserListSchema, dump_only=True)


class NotificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notification
        load_instance = True
        include_fk = True
        sqla_session = db.session

    reference_status = fields.Method("get_reference_status", dump_only=True)

    def get_reference_status(self, obj):
        """Return the current status of the referenced enrollment request, if applicable."""
        if obj.reference_type == "enrollment_request" and obj.reference_id:
            from .enrollment_request_model import EnrollmentRequest
            req = EnrollmentRequest.get_by_id(obj.reference_id)
            if req:
                return req.status
        return None
