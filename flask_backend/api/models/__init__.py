from api.models.user_model import User
from api.models.course_model import Course
from api.models.course_group_model import CourseGroup
from api.models.assignment_model import Assignment
from api.models.criterion_model import Criterion
from api.models.criteria_description_model import CriteriaDescription
from api.models.review_model import Review
from api.models.review_file_model import ReviewFile
from api.models.conclusion_file_model import ConclusionFile
from api.models.rubric_model import Rubric
from api.models.submission_model import Submission
from api.models.user_course_model import User_Course
from api.models.group_members_model import Group_Members

from api.models.schemas import (
    UserSchema,
    UserLoginSchema,
    UserRegistrationSchema,
    CourseSchema,
    CourseGroupSchema,
    AssignmentSchema,
    CriterionSchema,
    CriteriaDescriptionSchema,
    ReviewSchema,
    ReviewFileSchema,
    ConclusionFileSchema,
    RubricSchema,
    SubmissionSchema,
    UserCourseSchema,
    GroupMembersSchema,
)

__all__ = [
    "User",
    "Course",
    "CourseGroup",
    "Assignment",
    "Criterion",
    "CriteriaDescription",
    "Review",
    "ReviewFile",
    "ConclusionFile",
    "Rubric",
    "Submission",
    "User_Course",
    "Group_Members",
    # Schemas
    "UserSchema",
    "UserLoginSchema",
    "UserRegistrationSchema",
    "CourseSchema",
    "CourseGroupSchema",
    "AssignmentSchema",
    "CriterionSchema",
    "CriteriaDescriptionSchema",
    "ReviewSchema",
    "ReviewFileSchema",
    "ConclusionFileSchema",
    "RubricSchema",
    "SubmissionSchema",
    "UserCourseSchema",
    "GroupMembersSchema",
]