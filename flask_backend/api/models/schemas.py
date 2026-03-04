from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    password = fields.Str(load_only=True)
    role = fields.Str()
    email = fields.Str()
    first_name = fields.Str()
    last_name = fields.Str()


class CourseSchema(Schema):
    id = fields.Int(dump_only=True)
    course_name = fields.Str()
    course_code = fields.Str()


class CourseGroupSchema(Schema):
    id = fields.Int(dump_only=True)
    courseID = fields.Int()
    group_name = fields.Str()
    course = fields.Nested(CourseSchema, dump_only=True)


class ClassSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int()
    class_name = fields.Str()
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)


class GroupSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int()
    group_name = fields.Str()
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)


class StudentSchema(Schema):
    id = fields.Int(dump_only=True)
    userID = fields.Int()
    classID = fields.Int()
    groupID = fields.Int(allow_none=True)
    user = fields.Nested(UserSchema, dump_only=True)
    group = fields.Nested(GroupSchema, dump_only=True)
    class_ = fields.Nested(ClassSchema, dump_only=True)


class CriterionSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int()
    criterion_name = fields.Str()
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)


class CriteriaDescriptionSchema(Schema):
    id = fields.Int(dump_only=True)
    criterionID = fields.Int()
    rating = fields.Int()
    description = fields.Str()
    criterion = fields.Nested(CriterionSchema, dump_only=True)


class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    reviewerID = fields.Int()
    revieweeID = fields.Int()
    assignmentID = fields.Int()
    criterionID = fields.Int()
    rating = fields.Int()
    comment = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    reviewer = fields.Nested(StudentSchema, dump_only=True)
    reviewee = fields.Nested(StudentSchema, dump_only=True)
    assignment = fields.Nested("AssignmentSchema", dump_only=True)
    criterion = fields.Nested(CriterionSchema, dump_only=True)


class AssignmentSchema(Schema):
    id = fields.Int(dump_only=True)
    courseGroupID = fields.Int()
    classID = fields.Int()
    assignment_name = fields.Str()
    start_date = fields.DateTime()
    end_date = fields.DateTime()
    course_group = fields.Nested(CourseGroupSchema, dump_only=True)
    course_class = fields.Nested(ClassSchema, dump_only=True)


# NEW: ReviewFile schema (for Feature B models)
class ReviewFileSchema(Schema):
    id = fields.Int(dump_only=True)
    review_id = fields.Int(required=True)
    filename = fields.Str(required=True)
    path = fields.Str(required=True)
    uploaded_at = fields.DateTime(dump_only=True)
    uploader_id = fields.Int(required=True)


# NEW: ConclusionFile schema (for Feature B models)
class ConclusionFileSchema(Schema):
    id = fields.Int(dump_only=True)
    assignmentID = fields.Int(required=True)
    teacherID = fields.Int(required=True)
    filename = fields.Str(required=True)
    path = fields.Str(required=True)
    uploaded_at = fields.DateTime(dump_only=True)