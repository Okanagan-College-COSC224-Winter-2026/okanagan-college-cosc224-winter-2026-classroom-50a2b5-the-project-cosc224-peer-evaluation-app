# Database Schema — Peer Evaluation App (ORM Class Diagram)

This document captures the current relational schema used by the Peer-Evaluation-App-V1 backend. It mirrors the canonical SQL in `schema.sql` and the Sequelize models in `backend/src/sequelize`.

## PlantUML Diagram (source)

Field types, primary keys, and notable constraints are included for quick reference.

![Database schema](database-schema.png)

> Note: In `schema.sql`, most foreign key constraints are commented out for local dev and test convenience. The logical relationships above reflect how the application uses these tables.

## Schema Overview

### Users, Courses, and Enrollment

- User
  - id (PK), name, email (unique), hash_pass, role (default student)
- Course
  - id (PK), teacherID (User.id), name
  - A User who is a teacher can own many Courses via `teacherID`
- User_Courses (enrollment many-to-many)
  - PK: (userID, courseID)
  - Links Users to Courses as students or teachers (role inferred via `User.role` and app logic)

### Assignments and Grouping

- Assignment
  - id (PK), courseID (Course.id), name, rubric (label/name string)
- CourseGroup
  - id (PK), name, assignmentID (Assignment.id)
- Group_Members
  - PK: (userID, groupID)
  - Columns: groupID (CourseGroup.id), userID (User.id), assignmentID (Assignment.id)
  - Represents assignment-specific grouping for users

### Submissions

- Submission
  - id (PK), path, studentID (User.id), assignmentID (Assignment.id)
  - Stores a file path or location to the submitted artifact

### Reviews, Rubrics, and Criteria

- Review
  - id (PK), assignmentID, reviewerID (User.id), revieweeID (User.id)
  - Peer review instances scoped to an assignment
- Rubric
  - id (PK), assignmentID (Assignment.id), canComment (BOOLEAN)
  - The app currently allows multiple rubrics per assignment; uniqueness is not enforced at the DB layer
- Criteria_Description (rubric rows)
  - id (PK), rubricID (Rubric.id), question, scoreMax, hasScore (default TRUE)
  - Describes each rubric row/question and whether it’s scored
- Criterion (filled-in responses per review)
  - id (PK), reviewID (Review.id), criterionRowID (Criteria_Description.id), grade, comments
  - Captures the reviewer’s grade/comments for a specific rubric row

## Constraints and Defaults

- Auto-incrementing primary keys for all base tables except the two join tables which use composite primary keys
- `User.email` is unique
- Defaults
  - `User.role` defaults to `STUDENT`
  - `Criteria_Description.hasScore` defaults to `TRUE`
- Foreign keys
  - Present logically but commented out in `schema.sql`; application code assumes these relationships

## Alignment With Code

- Sequelize models live in `flask_backend/api/models` and mirror the tables above
- Route handlers under `flask_backend/api/controllers` operate on these models; see `docs/dev-guidelines/ENDPOINT_SUMMARY.md` for API-level interactions
If you update `schema.sql`, please keep this document in sync.
