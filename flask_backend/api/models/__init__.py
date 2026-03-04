from api.models.user_model import User
from api.models.course_model import Course
from api.models.course_group_model import CourseGroup
from api.models.class_model import Class
from api.models.group_model import Group
from api.models.student_model import Student
from api.models.criterion_model import Criterion
from api.models.criteria_description_model import CriteriaDescription
from api.models.assignment_model import Assignment
from api.models.review_model import Review

# NEW imports for Feature B
from api.models.conclusion_file_model import ConclusionFile

from api.models.schemas import (
    UserSchema,
    CourseSchema,
    CourseGroupSchema,
    ClassSchema,
    GroupSchema,
    StudentSchema,
    CriterionSchema,
    CriteriaDescriptionSchema,
    ReviewSchema,
    AssignmentSchema,
    # NEW schemas for Feature B
    ReviewFileSchema,
    ConclusionFileSchema,
)

__all__ = [
    "User",
    "Course",
    "CourseGroup",
    "Class",
    "Group",
    "Student",
    "Criterion",
    "CriteriaDescription",
    "Assignment",
    "Review",
    # Feature B model
    "ConclusionFile",
    # Schemas
    "UserSchema",
    "CourseSchema",
    "CourseGroupSchema",
    "ClassSchema",
    "GroupSchema",
    "StudentSchema",
    "CriterionSchema",
    "CriteriaDescriptionSchema",
    "ReviewSchema",
    "AssignmentSchema",
    # Feature B schemas
    "ReviewFileSchema",
    "ConclusionFileSchema",
]