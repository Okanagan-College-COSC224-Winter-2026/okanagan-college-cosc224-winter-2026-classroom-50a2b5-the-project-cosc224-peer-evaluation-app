from marshmallow import Schema, fields


# ----------------------------
# Core entities
# ----------------------------

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    password = fields.Str(load_only=True)
    role = fields.Str()
    email = fields.Str()
    first_name = fields.Str()
    last_name = fields.Str()

class UserLoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserRegistrationSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)
    role = fields.Str(required=True)
    email = fields.Str(required=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)


class CourseSchema(Schema):
    id = fields.Int(dump_only=True)
    course_name = fields.Str()
    course_code = fields.Str()


class CourseListSchema(Schema):
    id = fields.Int(dump_only=True)
    course_name = fields.Str()
    course_code = fields.Str()


class CourseGroupSchema(Schema):
    id = fields.Int(dump_only=True)
    courseID = fields.Int(required=True)
    group_name = fields.Str(required=True)
    # keep nested course optional (dump only) if relationship exists
    course = fields.Nested(CourseSchema, dump_only=True)


class AssignmentSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int(required=True)
    assignment_name = fields.Str(required=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)


# ----------------------------
# Rubric / criteria
# ----------------------------

class CriterionSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int(required=True)
    criterion_name = fields.Str(required=True)
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)


class CriteriaDescriptionSchema(Schema):
    id = fields.Int(dump_only=True)
    criterionID = fields.Int(required=True)
    rating = fields.Int(required=True)
    description = fields.Str(required=True)
    criterion = fields.Nested(CriterionSchema, dump_only=True)


class RubricSchema(Schema):
    id = fields.Int(dump_only=True)
    assignmentID = fields.Int(required=True)
    criterionID = fields.Int(required=True)
    weight = fields.Float(allow_none=True)
    assignment = fields.Nested(AssignmentSchema, dump_only=True)
    criterion = fields.Nested(CriterionSchema, dump_only=True)


# ----------------------------
# Reviews + attached review files
# ----------------------------

class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    reviewerID = fields.Int(required=True)
    revieweeID = fields.Int(required=True)
    assignmentID = fields.Int(required=True)
    criterionID = fields.Int(required=True)
    rating = fields.Int(required=True)
    comment = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)


class ReviewFileSchema(Schema):
    id = fields.Int(dump_only=True)
    review_id = fields.Int(required=True)
    filename = fields.Str(required=True)
    path = fields.Str(required=True)
    uploaded_at = fields.DateTime(dump_only=True)
    uploader_id = fields.Int(required=True)


# ----------------------------
# Submissions
# ----------------------------

class SubmissionSchema(Schema):
    id = fields.Int(dump_only=True)
    assignmentID = fields.Int(required=True)
    userID = fields.Int(required=True)
    submitted_at = fields.DateTime(dump_only=True)


class UserCourseSchema(Schema):
    id = fields.Int(dump_only=True)
    userID = fields.Int(required=True)
    courseID = fields.Int(required=True)


class GroupMembersSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int(required=True)
    userID = fields.Int(required=True)

# ----------------------------
# Conclusion files (teacher uploads)
# ----------------------------

class ConclusionFileSchema(Schema):
    id = fields.Int(dump_only=True)
    assignmentID = fields.Int(required=True)
    teacherID = fields.Int(required=True)
    filename = fields.Str(required=True)
    path = fields.Str(required=True)
    uploaded_at = fields.DateTime(dump_only=True)


# ----------------------------
# Password change (Feature C)
# ----------------------------

class PasswordChangeSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True)