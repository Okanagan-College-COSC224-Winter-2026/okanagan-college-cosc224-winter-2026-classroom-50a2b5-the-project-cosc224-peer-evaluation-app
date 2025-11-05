from .db import db, ma

from .users import User
from .course import Course
from .assignment import Assignment
from .rubric import Rubric
from .criteria_description import CriteriaDescription
from .criterion import Criterion
from .review import Review
from .course_group import CourseGroup
from .group_members import Group_Members
from .user_course import User_Course
from .submission import Submission

from .schemas import (
    UserSchema, CourseSchema, AssignmentSchema, RubricSchema,
    CriteriaDescriptionSchema, CriterionSchema, ReviewSchema, CourseGroupSchema,
    GroupMembersSchema, UserCourseSchema, SubmissionSchema
)

__all__ = [
    'db', 'ma',
    'User', 'Course', 'Assignment', 'Rubric',
    'CriteriaDescription', 'Criterion', 'Review',
    'CourseGroup', 'Group_Members', 'User_Course', 'Submission',
    'UserSchema', 'CourseSchema', 'AssignmentSchema', 'RubricSchema',
    'CriteriaDescriptionSchema', 'CriterionSchema', 'ReviewSchema',
    'CourseGroupSchema', 'GroupMembersSchema', 'UserCourseSchema', 'SubmissionSchema',
]

