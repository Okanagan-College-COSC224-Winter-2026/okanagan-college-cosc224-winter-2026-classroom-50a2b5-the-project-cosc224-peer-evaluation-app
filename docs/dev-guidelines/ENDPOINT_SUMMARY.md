# API Endpoint Summary

This document summarizes all API endpoints documented across the user stories and indicates which endpoints are implemented vs. proposed.

## Implemented Endpoints

### Authentication (UC28, UC29)

| Endpoint | Method | Use Case | Status | Description |
|----------|--------|----------|--------|-------------|
| `/auth/login` | POST | UC28 | ✅ Implemented | User login, returns JWT token |
| `/auth/register` | POST | UC29 | ✅ Implemented | Create new user account |
| `/auth/logout` | POST | N/A | ✅ Implemented | Logout (JWT cleanup) |

### User Management (UC30)

| Endpoint | Method | Use Case | Status | Description |
|----------|--------|----------|--------|-------------|
| `/user/` | GET | UC30 | ✅ Implemented | Get current authenticated user info |
| `/user/` | PUT | N/A | ✅ Implemented | Update current user information |
| `/user/<id>` | GET | N/A | ✅ Implemented | Get user by ID (self or admin) |
| `/user/<id>` | DELETE | N/A | ✅ Implemented | Delete user (self or admin) |

## Authentication Requirements

All protected endpoints require:

- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Admin endpoints**: User must have `role = 'admin'`

Obtain JWT token via `POST /auth/login` with valid credentials.

# API Endpoint Summary (generated)

This summary is generated from `docs/dev-guidelines/endpoints.json` (generatedAt: 2025-10-24). It reflects the backend routes currently implemented under `backend/src/routes`.

- Source of truth for shapes and notes: `endpoints.json`
- Most endpoints are protected and require an Authorization header

## Authentication and access

- Protected routes: require header `Authorization: Bearer <token>` returned by the login endpoint.
- Login: call `GET /login` with header `Authorization: Basic base64(user:pass)` to obtain `{ token, isTeacher }`.
- Public routes: `GET /login`, `GET /ping`.
- Testing: setting `DANGEROUS_DISABLE_ALL_AUTH=true` disables auth checks (tests only; do not use in production).

---

## Public endpoints

| Method | Path   | Headers                                   | Response                        | Notes |
|--------|--------|-------------------------------------------|----------------------------------|-------|
| GET    | `/login` | `Authorization: Basic base64(user:pass)` | `200 { token, isTeacher }` or `400/401` | On success stores session in-memory at `app.session[token]`. |
| GET    | `/ping` | —                                         | `{ message: 'pong!' }`          | Lightweight healthcheck. |

---

## Protected endpoints

All endpoints in this section require `Authorization: Bearer <token>`.

| Method | Path | Params | Query | Body | Response | Notes |
|--------|------|--------|-------|------|----------|-------|
| GET | `/assignments/:course` | `{ course: string }` | — | — | `Array<Assignment>` | Returns all assignments for a course. |
| POST | `/classes/members` | — | — | `{ id: number }` | `Array<User { id, name, email }>` | Uses `User_Course` to look up members. |
| GET | `/classes` | — | — | — | `Array<Course>` | Currently returns all classes; TODO: filter by student membership. |
| POST | `/create_assignment` | — | — | `{ courseID: number, name: string }` | `{ message: string, id: number }` | Creates assignment and returns created id. |
| POST | `/create_class` | — | — | `{ name: string }` | `201 { message: 'Class created', id }` or `400 { message: 'Class already exists' }` | TeacherID currently hardcoded to 0 (TODO: use session). |
| POST | `/create_criteria` | — | — | `{ id: number, rubricID: number, question: string, scoreMax: number, hasScore: boolean }` | `{ message: string, id: number }` | Creates a `Criteria_Description` row. Field `id` is taken from body. |
| POST | `/create_criterion` | — | — | `{ reviewID: number, criterionRowID: number, grade: number, comments: string }` | `{ message: string, id: number }` | Creates one `Criterion` (row within a Review). |
| POST | `/create_group` | — | — | `{ id: number, name: string, assignmentID: number }` | `{ message: string, id: number }` | Creates `CourseGroup`; route swallows DB errors and logs them. |
| POST | `/create_review` | — | — | `{ assignmentID: number, reviewerID: number, revieweeID: number }` | `{ message: string, id: number }` | Links reviewer and reviewee for an assignment. |
| POST | `/create_rubric` | — | — | `{ id: number, assignmentID: number, canComment: boolean }` | `{ message: string, id: number }` | Destroys existing rubric with same id before creating new one. |
| GET | `/criteria` | — | `{ rubricID: string }` | — | `400 if missing` or `Array<Criteria_Description>` | Query param parsed with `parseInt` before DB lookup. |
| POST | `/delete_group` | — | — | `{ groupID: number }` | `{ message: string, id: number, groupMembers: update result }` | Sets members' `groupID` to `-1` then destroys the `CourseGroup`. |
| GET | `/get_className/:classID` | `{ classID: number }` | — | — | `404 if not found; else { className: string }` | Finds Course by id and returns its name. |
| GET | `/review` | — | `{ assignmentID: string, reviewerID: string, revieweeID: string }` | — | `400/404` or `{ grades: number[] }` | Aggregates grade fields from `Criterion` rows. |
| GET | `/rubric` | — | `{ rubricID: string }` | — | `400/404` or `{ id, assignmentID, canComment }` | Returns a simplified rubric object. |
| GET | `/list_all_groups/:assignmentID` | `{ assignmentID: number }` | — | — | `Array<CourseGroup>` | Finds all `CourseGroup` rows where `assignmentID` matches. |
| GET | `/list_group_members/:assignmentID/:groupID` | `{ assignmentID: number, groupID: string }` | — | — | `Array<Group_Member>` | `groupID` treated as string in route typing. |
| GET | `/list_stu_groups/:assignmentID/:studentID` | `{ assignmentID: number, studentID: number }` | — | — | `300 { msg: 'student has no group' }` or `Array<Group_Member>` | Returns peers in the student's group. |
| GET | `/list_ua_groups/:assignmentID` | `{ assignmentID: number }` | — | — | `Array<Group_Member>` | Unassigned students for an assignment (`groupID === -1`). |
| GET | `/next_groupid` | — | — | — | `number` | Count of groups with `id > 0` (Sequelize `count` with `Op.gt`). |
| POST | `/save_groups` | — | — | `{ groupID: number, userID: number, assignmentID: number }` | `{ message: 'successful DB post!' }` or `401` | Updates `Group_Member` rows to set `groupID` for a user in an assignment. |
| POST | `/student_import` | — | — | `{ students: string (CSV), courseID: number }` | `400 if missing course; 200 { message: '<n> students added to course <name>' }` or `500` | Parses CSV, creates `User` and `User_Course` rows. See `backend/src/util/csv.ts`. |
| GET | `/user_id` | — | — | — | `number` | Reads `app.session[token].id`. Handler assumes session contains token; no explicit 401 check. |

---

### Notes

- Parameter types in curly braces are the expected types; some routes accept strings for numeric IDs and cast internally.
- For stability, prefer sending numeric IDs as numbers where indicated.
- If any discrepancy arises between this document and `endpoints.json`, treat `endpoints.json` as canonical.
