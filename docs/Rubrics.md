# Rubric & Criteria Management

Rubrics belong to **assignments** and contain multiple **criteria descriptions** (questions) that students evaluate their peers against.

## No Database Migration Required

This feature uses existing models (`Rubric`, `CriteriaDescription`) that were already in the schema. Only a new controller and schema changes were needed.

---

## Implementation Summary

### Backend Changes

| File | Change |
|------|--------|
| `controllers/rubric_controller.py` | **New file** with 6 endpoints for rubric & criteria CRUD |
| `models/schemas.py` | Changed `include_fk = True` on `RubricSchema`, `CriteriaDescriptionSchema`, `CriterionSchema` so FK fields appear in JSON |
| `api/__init__.py` | Registered `rubric_controller` blueprint |

### Frontend Changes

| File | Change |
|------|--------|
| `util/api.ts` | Updated `getCriteria`, `createCriteria`, `createRubric`, `getRubric` to point at Flask `/rubric/` endpoints |
| `util/api.ts` | Added `getRubricForAssignment(assignmentID)` — fetches rubric by assignment (returns `null` on 404) |
| `util/api.ts` | Added `deleteRubric(rubricID)` — calls `DELETE /rubric/<id>` |
| `components/RubricCreator.tsx` | Updated `createRubric(id, id, canComment)` → `createRubric(id, canComment)` (backend auto-generates rubric ID); removed page reload in favour of `onRubricCreated` callback |
| `pages/Assignment.tsx` | Fetches rubric by assignment ID on mount; conditionally shows `RubricCreator` (no rubric) or `RubricDisplay` + Delete button (rubric exists); fixed bug where assignment ID was passed as rubric ID |

### Tests

| File | Status |
|------|--------|
| `tests/test_rubrics.py` | **21 tests, all passing** |

---

## API Endpoints

### Rubric Management (`/rubric/`)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/rubric/create` | Create a rubric for an assignment | Teacher |
| `GET` | `/rubric/<id>` | Get a rubric by ID | Any |
| `GET` | `/rubric/assignment/<assignment_id>` | Get the rubric for an assignment | Any |
| `DELETE` | `/rubric/<id>` | Delete a rubric (cascades criteria) | Teacher |
| `POST` | `/rubric/<rubric_id>/criteria` | Add a criterion to a rubric | Teacher |
| `GET` | `/rubric/<rubric_id>/criteria` | List criteria for a rubric | Any |

### Request / Response Shapes

**Create rubric:**
```json
// POST /rubric/create
{ "assignmentID": 1, "canComment": true }
// → 201 { "msg": "Rubric created", "rubric": { "id": 1, "assignmentID": 1, "canComment": true } }
```

**Add criterion:**
```json
// POST /rubric/1/criteria
{ "question": "How well did the student communicate?", "scoreMax": 10, "hasScore": true }
// → 201 { "msg": "Criterion added", "criterion": { "id": 1, "rubricID": 1, "question": "...", "scoreMax": 10, "hasScore": true } }
```

**Get criteria:**
```json
// GET /rubric/1/criteria
// → 200 [
//   { "id": 1, "rubricID": 1, "question": "Communication", "scoreMax": 10, "hasScore": true },
//   { "id": 2, "rubricID": 1, "question": "Teamwork", "scoreMax": 5, "hasScore": true }
// ]
```

---

## Data Model

```
Assignment (1) ──→ (0..*) Rubric
Rubric     (1) ──→ (0..*) CriteriaDescription
```

- **Rubric**: `id`, `assignmentID` (FK → Assignment), `canComment` (boolean)
- **CriteriaDescription**: `id`, `rubricID` (FK → Rubric), `question`, `scoreMax`, `hasScore`
- Deleting a rubric **cascades** and removes all its criteria descriptions

---

## Test Coverage

### Fixtures

| Fixture | Purpose |
|---------|---------|
| `teacher` | Creates a teacher user |
| `student` | Creates a student user |
| `course` | Creates a course owned by the teacher |
| `assignment` | Creates an assignment in the course |
| `auth_teacher` | Logs in as teacher |
| `auth_student` | Logs in as student (for permission tests) |

### Tests (21 total)

| Test | What It Verifies |
|------|------------------|
| `test_create_rubric_as_teacher` | Teacher can create a rubric |
| `test_create_rubric_unauthorized_student` | Students cannot create rubrics |
| `test_create_rubric_missing_assignment_id` | Validation: requires assignmentID |
| `test_create_rubric_nonexistent_assignment` | 404 for bad assignment |
| `test_create_rubric_not_course_teacher` | Can't create for another teacher's course |
| `test_get_rubric_by_id` | Fetch rubric by ID |
| `test_get_rubric_not_found` | 404 for missing rubric |
| `test_get_rubric_for_assignment` | Fetch rubric by assignment ID |
| `test_get_rubric_for_assignment_none_exists` | 404 when no rubric attached |
| `test_add_criterion_to_rubric` | Add a criterion question |
| `test_add_criterion_missing_question` | Validation: requires question |
| `test_add_criterion_nonexistent_rubric` | 404 for bad rubric |
| `test_add_criterion_unauthorized_student` | Students cannot add criteria |
| `test_get_criteria_for_rubric` | List all criteria |
| `test_get_criteria_empty_rubric` | Empty list when no criteria |
| `test_get_criteria_nonexistent_rubric` | 404 for bad rubric |
| `test_delete_rubric` | Delete works |
| `test_delete_rubric_cascades_criteria` | Cascade deletes criteria too |
| `test_delete_rubric_not_found` | 404 for missing |
| `test_delete_rubric_unauthorized_student` | Students cannot delete rubrics |
| `test_full_rubric_workflow` | End-to-end: create → add criteria → read → delete |

---

## Implementation Status

- [x] Create `rubric_controller.py` with 6 endpoints
- [x] Update schemas to `include_fk = True`
- [x] Register blueprint in `__init__.py`
- [x] 21 tests written and passing (109 total)
- [x] Update frontend `api.ts` to use new Flask routes
- [x] Update `RubricCreator.tsx` call signature for new API
- [x] Fix `Assignment.tsx` — fetch rubric by assignment ID, conditional creator/display, delete button
- [x] Verify `RubricCreator.tsx` and `RubricDisplay.tsx` work end-to-end
- [x] Update `ENDPOINT_SUMMARY.md` with rubric endpoints

## Known Limitations

- Review endpoints are now available in Flask (`POST /create_review`, `POST /create_criterion`, `GET /review`).

## Related Documentation

- **API Reference**: See `docs/dev-guidelines/ENDPOINT_SUMMARY.md` for full endpoint docs
- **Database Schema**: See `docs/schema/database-schema.md` for table definitions
- **User Story**: US11 – Rubric Creation in `docs/user_stories.md`
