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
| POST | `/auth/login` | `{ email, password }` | `200 { id, name, email, role, must_change_password }` | Sets HTTPOnly cookie with JWT token |
| POST | `/auth/register` | `{ name, email, password }` | `201 { msg, user }` | Creates student account |
| GET | `/hello` | — | `{ message: 'Hello, World!' }` | Healthcheck |

---

## Authentication Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/auth/login` | `{ email, password }` | `200 { id, name, email, role, must_change_password }` | ✅ Implemented |
| POST | `/auth/register` | `{ name, email, password }` | `201 { msg, user }` | ✅ Implemented |
| POST | `/auth/logout` | — | `200 { msg }` | ✅ Implemented |
| PUT | `/auth/change-password` | `{ current_password, new_password }` | `200 { msg }` | ✅ Change password (any authenticated user) |

---

## User Endpoints

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/user/` | — | `User { id, name, email, role, must_change_password }` | ✅ Get current user |
| PUT | `/user/` | `{ name? }` | `User` | ✅ Update current user (name only) |
| GET | `/user/<id>` | — | `User` | ✅ Get user by ID (self, teacher, or admin) |
| DELETE | `/user/<id>` | — | `{ msg }` | ✅ Delete user (self or admin) |
| PATCH | `/user/password` | `{ current_password, new_password }` | `{ msg }` | ✅ Change password (requires `must_change_password` flag) |

---

## Admin Endpoints

All require `role = 'admin'`.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/admin/users` | — | `Array<User>` | ✅ List all users |
| POST | `/admin/users/create` | `{ name, email, password, role }` | `User` | ✅ Create user with any role |
| PUT | `/admin/users/<id>/role` | `{ role }` | `User` | ✅ Update user's role |
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
| POST | `/groups/create` | `{ courseID, name }` | `201 { msg, group }` | ✅ Create empty group |
| GET | `/groups/course/<course_id>` | — | `Array<Group>` | ✅ List groups in course |
| GET | `/groups/course/<course_id>/my-group` | — | `{ group, members }` or `404` | ✅ Get student's group & peers |
| GET | `/groups/<group_id>/members` | — | `Array<User>` | ✅ List group members |
| POST | `/groups/members/add` | `{ groupID, userID }` | `{ msg, member }` | ✅ Add student to group |
| POST | `/groups/members/remove` | `{ groupID, userID }` | `{ msg }` | ✅ Remove student from group |
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

## Submission Endpoints

File upload/download for student assignment submissions.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/submission/<assignment_id>/mine` | — | `Submission` or `404` | ✅ Get current student's submission |
| POST | `/submission/<assignment_id>/mine` | `file` (multipart) | `{ msg, submission }` | ✅ Upload/replace submission |
| DELETE | `/submission/<assignment_id>/mine` | — | `{ msg }` | ✅ Delete own submission |
| GET | `/submission/file/<submission_id>` | — | File download | ✅ Download submission file |

---

## Assignment Resource Endpoints

Teacher-uploaded supporting documents for assignments (e.g., instructions, rubric PDFs).

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/assignment-resource/assignment/<assignment_id>` | — | `Array<Resource>` | ✅ List resources for assignment |
| POST | `/assignment-resource/assignment/<assignment_id>` | `file` (multipart) | `{ msg, resource }` | ✅ Upload resource (teacher) |
| DELETE | `/assignment-resource/<resource_id>` | — | `{ msg }` | ✅ Delete resource (teacher) |
| GET | `/assignment-resource/file/<resource_id>` | — | File download | ✅ Download resource file |

---

## Not Yet Implemented (Planned)

These endpoints are planned based on the database schema but not yet implemented in Flask:

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| Reviews | `/review/*` | Peer review submissions |

---

## Notes

- All endpoints return JSON
- Error responses follow format: `{ "msg": "error message" }` or `{ "error": "message" }`
- HTTPOnly cookies are used for authentication (not Bearer tokens)
- Frontend must always use `credentials: 'include'` for fetch requests
