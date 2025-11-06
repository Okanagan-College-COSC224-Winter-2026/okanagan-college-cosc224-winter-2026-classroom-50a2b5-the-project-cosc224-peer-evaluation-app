from .db import ma, db
from .users_model import User
from .course_model import Course
from .assignment_model import Assignment
from .rubric_model import Rubric
from .criteria_description_model import CriteriaDescription
from .criterion_model import Criterion
from .review_model import Review
from .course_group_model import CourseGroup
from .group_members_model import Group_Members
from .user_course_model import User_Course
from .submission_model import Submission

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        sqla_session = db.session
        exclude = ("hash_pass",)

class CourseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Course
        load_instance = True
        include_fk = True
        sqla_session = db.session

class AssignmentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Assignment
        load_instance = True
        include_fk = True
        sqla_session = db.session

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

class ReviewSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Review
        load_instance = True
        include_fk = True
        sqla_session = db.session

class CourseGroupSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CourseGroup
        load_instance = True
        include_fk = True
        sqla_session = db.session

class GroupMembersSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Group_Members
        load_instance = True
        include_fk = True
        sqla_session = db.session

class UserCourseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User_Course
        load_instance = True
        include_fk = True
        sqla_session = db.session

class SubmissionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Submission
        load_instance = True
        include_fk = True
        sqla_session = db.session