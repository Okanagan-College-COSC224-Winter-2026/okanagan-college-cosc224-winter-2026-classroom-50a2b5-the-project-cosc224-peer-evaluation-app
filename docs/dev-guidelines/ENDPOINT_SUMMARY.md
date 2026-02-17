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
| POST | `/assignment/create_assignment` | `{ courseID, name, rubric?, due_date? }` | `{ msg, assignment }` | ✅ Create assignment |
| PATCH | `/assignment/edit_assignment/<id>` | `{ name?, rubric?, due_date? }` | `{ msg, assignment }` | ✅ Edit assignment |
| DELETE | `/assignment/delete_assignment/<id>` | — | `{ msg }` | ✅ Delete assignment |

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

## Not Yet Implemented (Planned)

These endpoints are planned based on the database schema but not yet implemented in Flask:

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| Rubrics | `/rubric/*` | Create/read rubrics |
| Criteria | `/criteria/*` | Rubric questions/scoring |
| Reviews | `/review/*` | Peer review submissions |
| Submissions | `/submission/*` | File uploads |

---

## Notes

- All endpoints return JSON
- Error responses follow format: `{ "msg": "error message" }` or `{ "error": "message" }`
- HTTPOnly cookies are used for authentication (not Bearer tokens)
- Frontend must always use `credentials: 'include'` for fetch requests
