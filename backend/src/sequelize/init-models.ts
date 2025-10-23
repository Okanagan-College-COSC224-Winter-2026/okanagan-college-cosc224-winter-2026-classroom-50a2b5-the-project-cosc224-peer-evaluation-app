import type { Sequelize } from "sequelize";
import { Assignment as _Assignment } from "./Assignment";
import type { AssignmentAttributes, AssignmentCreationAttributes } from "./Assignment";
import { Course as _Course } from "./Course";
import type { CourseAttributes, CourseCreationAttributes } from "./Course";
import { CourseGroup as _CourseGroup } from "./CourseGroup";
import type { CourseGroupAttributes, CourseGroupCreationAttributes } from "./CourseGroup";
import { Criterion as _Criterion } from "./Criterion";
import type { CriterionAttributes, CriterionCreationAttributes } from "./Criterion";
import { Criteria_Description as _Criteria_Description } from "./Criteria_Description";
import type { Criteria_DescriptionAttributes, Criteria_DescriptionCreationAttributes } from "./Criteria_Description";
import { Group_Member as _Group_Member } from "./Group_Member";
import type { Group_MemberAttributes, Group_MemberCreationAttributes } from "./Group_Member";
import { Review as _Review } from "./Review";
import type { ReviewAttributes, ReviewCreationAttributes } from "./Review";
import { Rubric as _Rubric } from "./Rubric";
import type { RubricAttributes, RubricCreationAttributes } from "./Rubric";
import { Submission as _Submission } from "./Submission";
import type { SubmissionAttributes, SubmissionCreationAttributes } from "./Submission";
import { User as _User } from "./User";
import type { UserAttributes, UserCreationAttributes } from "./User";
import { User_Course as _User_Course } from "./User_Course";
import type { User_CourseAttributes, User_CourseCreationAttributes } from "./User_Course";

export {
  _Assignment as Assignment,
  _Course as Course,
  _CourseGroup as CourseGroup,
  _Criterion as Criterion,
  _Criteria_Description as Criteria_Description,
  _Group_Member as Group_Member,
  _Review as Review,
  _Rubric as Rubric,
  _Submission as Submission,
  _User as User,
  _User_Course as User_Course,
};

export type {
  AssignmentAttributes,
  AssignmentCreationAttributes,
  CourseAttributes,
  CourseCreationAttributes,
  CourseGroupAttributes,
  CourseGroupCreationAttributes,
  CriterionAttributes,
  CriterionCreationAttributes,
  Criteria_DescriptionAttributes,
  Criteria_DescriptionCreationAttributes,
  Group_MemberAttributes,
  Group_MemberCreationAttributes,
  ReviewAttributes,
  ReviewCreationAttributes,
  RubricAttributes,
  RubricCreationAttributes,
  SubmissionAttributes,
  SubmissionCreationAttributes,
  UserAttributes,
  UserCreationAttributes,
  User_CourseAttributes,
  User_CourseCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const Assignment = _Assignment.initModel(sequelize);
  const Course = _Course.initModel(sequelize);
  const CourseGroup = _CourseGroup.initModel(sequelize);
  const Criterion = _Criterion.initModel(sequelize);
  const Criteria_Description = _Criteria_Description.initModel(sequelize);
  const Group_Member = _Group_Member.initModel(sequelize);
  const Review = _Review.initModel(sequelize);
  const Rubric = _Rubric.initModel(sequelize);
  const Submission = _Submission.initModel(sequelize);
  const User = _User.initModel(sequelize);
  const User_Course = _User_Course.initModel(sequelize);


  return {
    Assignment: Assignment,
    Course: Course,
    CourseGroup: CourseGroup,
    Criterion: Criterion,
    Criteria_Description: Criteria_Description,
    Group_Member: Group_Member,
    Review: Review,
    Rubric: Rubric,
    Submission: Submission,
    User: User,
    User_Course: User_Course,
  };
}
