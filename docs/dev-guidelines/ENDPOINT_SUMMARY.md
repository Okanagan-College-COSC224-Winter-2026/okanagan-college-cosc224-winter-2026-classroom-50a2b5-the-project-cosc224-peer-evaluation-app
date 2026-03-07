# API Endpoint Summary

This document summarizes all API endpoints for the **Flask backend** (`flask_backend/`). 

> **Note**: The legacy Node.js backend (`backend/`) is no longer actively maintained. The `endpoints.json` file documents the legacy Node endpoints for reference only.

## Authentication Requirements

All protected endpoints require:

- **HTTPOnly Cookie**: JWT token is automatically included by the browser
- **Credentials**: All fetch requests must include `credentials: 'include'`
- **Admin endpoints**: User must have `role = 'admin'`
- **Teacher endpoints**: User must have `role = 'teacher'` or `role = 'admin'`

Obtain JWT token via `POST /auth/login` with valid credentials. The token is automatically stored in an HTTPOnly cookie.

---

## Public Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/auth/login` | `{ email, password }` | `200 { role, user_id, name, msg }` | Sets HTTPOnly cookie with JWT token |
| POST | `/auth/register` | `{ name, email, password }` | `201 { msg, user }` | Creates student account |
| GET | `/ping` | — | `{ message: 'pong!' }` | Healthcheck |

---

## Authentication Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/auth/login` | `{ email, password }` | `200 { role, user_id, name, msg }` | ✅ Implemented |
| POST | `/auth/register` | `{ name, email, password }` | `201 { msg, user }` | ✅ Implemented |
| POST | `/auth/logout` | — | `200 { msg }` | ✅ Implemented |

---

## User Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/user/` | — | `User { id, name, email, role }` | ✅ Get current user |
| PUT | `/user/` | `{ name?, email? }` | `User` | ✅ Update current user |
| GET | `/user/<id>` | — | `User` | ✅ Get user by ID (self, teacher, or admin) |
| DELETE | `/user/<id>` | — | `{ msg }` | ✅ Delete user (self or admin) |
| PATCH | `/user/password` | `{ current_password, new_password }` | `{ msg }` | ✅ Change password |

---

## Admin Endpoints

All require `role = 'admin'`.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/admin/users` | — | `Array<User>` | ✅ List all users |
| POST | `/admin/users` | `{ name, email, password, role }` | `User` | ✅ Create user with any role |
| GET | `/admin/users/<id>` | — | `User` | ✅ Get any user by ID |
| PUT | `/admin/users/<id>` | `{ name?, email?, role? }` | `User` | ✅ Update any user |
| DELETE | `/admin/users/<id>` | — | `{ msg }` | ✅ Delete any user |

---

## Class/Course Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/class/classes` | — | `Array<Course>` | ✅ Get user's courses |
| GET | `/class/browse_classes` | — | `Array<Course>` | ✅ Get all courses (admin/teacher) |
| POST | `/class/create_class` | `{ name }` | `201 { msg, course }` | ✅ Create course (teacher) |
| POST | `/class/members` | `{ id }` | `Array<User>` | ✅ Get course members |
| POST | `/class/enroll_students` | `{ class_id, students (CSV) }` | `{ msg }` | ✅ Bulk enroll from CSV |

---

## Assignment Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/assignment/<course_id>` | — | `Array<Assignment>` | ✅ Get assignments for course |
| GET | `/assignment/detail/<id>` | — | `Assignment` | ✅ Get single assignment |
| POST | `/assignment/create_assignment` | `{ courseID, name, description?, start_date?, rubric?, due_date? }` | `{ msg, assignment }` | ✅ Create assignment (teacher/admin only, must own course) |
| PATCH | `/assignment/edit_assignment/<id>` | `{ name?, description?, start_date?, rubric?, due_date? }` | `{ msg, assignment }` | ✅ Edit assignment (teacher/admin only, must own course) |
| DELETE | `/assignment/delete_assignment/<id>` | — | `{ msg }` | ✅ Delete assignment (teacher/admin only, must own course) |

---

## Group Endpoints (Course-Level)

> **Important**: Groups belong to **courses**, not assignments. This is a key architectural decision - students remain in the same group for all assignments in a course.

All group endpoints require teacher or admin role.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/groups/create` | `{ courseId, name }` | `201 { msg, group }` | ✅ Create empty group |
| GET | `/groups/course/<course_id>` | — | `Array<Group>` | ✅ List groups in course |
| GET | `/groups/course/<course_id>/my-group` | — | `{ group, members }` or `404` | ✅ Get student's group & peers |
| GET | `/groups/<group_id>/members` | — | `Array<User>` | ✅ List group members |
| POST | `/groups/<group_id>/members` | `{ userId }` | `{ msg, member }` | ✅ Add student to group |
| DELETE | `/groups/<group_id>/members/<user_id>` | — | `{ msg }` | ✅ Remove student from group |
| DELETE | `/groups/<group_id>` | — | `{ msg }` | ✅ Delete group |
| GET | `/groups/course/<course_id>/unassigned` | — | `Array<User>` | ✅ List students not in any group |

### Group Response Shapes

**Group object:**
```json
{
  "id": 1,
  "name": "Group A",
  "courseID": 1
}
```

**Member object (from `/groups/<id>/members`):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

**My-group response:**
```json
{
  "group": { "id": 1, "name": "Group A", "courseID": 1 },
  "members": [
    { "id": 2, "name": "Jane Doe", "email": "jane@example.com" }
  ]
}
```

---

## Rubric Endpoints

Rubrics belong to **assignments** and contain multiple **criteria descriptions** (questions) for peer evaluation.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/rubric/create` | `{ assignmentID, canComment? }` | `201 { msg, rubric }` | ✅ Create rubric (teacher) |
| GET | `/rubric/<id>` | — | `Rubric { id, assignmentID, canComment }` | ✅ Get rubric by ID |
| GET | `/rubric/assignment/<assignment_id>` | — | `Rubric` | ✅ Get rubric for assignment |
| DELETE | `/rubric/<id>` | — | `{ msg }` | ✅ Delete rubric + cascade criteria (teacher) |
| POST | `/rubric/<rubric_id>/criteria` | `{ question, scoreMax?, hasScore? }` | `201 { msg, criterion }` | ✅ Add criterion (teacher) |
| GET | `/rubric/<rubric_id>/criteria` | — | `Array<CriteriaDescription>` | ✅ List criteria for rubric |

### Rubric Response Shapes

**Rubric object:**
```json
{
  "id": 1,
  "assignmentID": 1,
  "canComment": true
}
```

**CriteriaDescription object:**
```json
{
  "id": 1,
  "rubricID": 1,
  "question": "How well did the student communicate?",
  "scoreMax": 10,
  "hasScore": true
}
```

---

## Review Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/review/submit` | JWT (any) | Submit a review with criteria (atomic) |
| `GET` | `/review/lookup?assignmentID=X&revieweeID=Y` | JWT (any) | Look up an existing review (reviewer from JWT) |
| `GET` | `/review/<id>` | JWT (any) | Get a single review with its criteria |
| `GET` | `/review/assignment/<id>` | JWT (any) | List reviews for an assignment |
| `GET` | `/review/course/<id>/summary` | JWT (any) | Grade summary for all assignments in a course |

**Authorization notes:**
- `submit`: Reviewer is derived from the JWT token (prevents impersonation). Cannot review yourself. Duplicate reviews return 409.
- `lookup`: Reviewer is derived from JWT. Returns 404 if no review exists.
- `GET /<id>`: Students can only view reviews they authored or received. Teachers can view any.
- `assignment/<id>`: Teachers see all reviews. Students only see reviews they received.
- **Anonymous reviews (US3):** When `assignment.is_anonymous` is `true`, the reviewer identity is replaced with `{ id: null, name: "Anonymous", email: null }` for the reviewee. Teachers always see the real reviewer.
- `course/<id>/summary`: Students see averages based on reviews they received. Teachers see aggregate across all reviews. Teachers can pass `?studentID=X` to get a specific student's summary.

### Review Request Shape

**POST /review/submit:**
```json
{
  "assignmentID": 1,
  "revieweeID": 3,
  "comments": "Great teamwork overall!",
  "criteria": [
    { "criterionRowID": 5, "grade": 4, "comments": "" },
    { "criterionRowID": 6, "grade": 8, "comments": "" }
  ]
}
```

> **Note:** The `comments` field at the top level is the overall review comment (stored on the Review model). Per-criterion `comments` fields exist in the schema but are not currently used by the frontend.
```

### Review Response Shapes

**Review object (from GET endpoints):**
```json
{
  "id": 1,
  "assignmentID": 1,
  "comments": "Great teamwork overall!",
  "reviewer": { "id": 2, "name": "Alice", "email": "alice@test.com" },
  "reviewee": { "id": 3, "name": "Bob", "email": "bob@test.com" },
  "criteria": [
    { "id": 1, "reviewID": 1, "criterionRowID": 5, "criterion_name": "Communication", "score_max": 5, "grade": 4, "comments": "" }
  ]
}
```

**Submit response (POST /review/submit):**
```json
{
  "msg": "Review submitted",
  "id": 1
}
```

**Course grade summary (GET /review/course/<id>/summary):**
```json
{
  "assignments": [
    {
      "id": 1,
      "name": "Peer Review HW",
      "reviewCount": 3,
      "averageScore": 12.5,
      "maxScore": 15
    }
  ],
  "courseAverage": 12.5,
  "courseMax": 15.0
}
```

**Query parameters:**
- `studentID` (optional, teacher/admin only): Scope the summary to a specific student's received reviews

---

## Not Yet Implemented (Planned)

These endpoints are planned based on the database schema but not yet implemented in Flask:

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| *(none currently)* | — | — |

---

## Notes

- All endpoints return JSON
- Error responses follow format: `{ "msg": "error message" }` or `{ "error": "message" }`
- HTTPOnly cookies are used for authentication (not Bearer tokens)
- Frontend must always use `credentials: 'include'` for fetch requests
