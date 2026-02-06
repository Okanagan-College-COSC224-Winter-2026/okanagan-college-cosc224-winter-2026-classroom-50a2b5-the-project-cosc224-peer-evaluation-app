# List Class Members - Problem Analysis

## The Problem (Restated with Context)

### What's happening:
1. You click the **"Members"** tab on the course page in the browser.
2. The frontend (`ClassMembers.tsx`) calls the `listCourseMembers()` function.
3. That function sends a **POST request** to: `http://localhost:5000/classes/members`

### The problem:
4. **Flask backend has no route for `/classes/members`!**
   - The `class_controller.py` uses `url_prefix="/class"` (singular)
   - There is no `/members` endpoint defined at all

5. Flask returns **404 Not Found**.
6. The browser's CORS preflight (`OPTIONS /classes/members`) also fails with 404.
7. The frontend shows an error and the members list is blank.

---

## What needs to happen to fix it:

### Option A: Add the missing endpoint to Flask

Create a new route in `class_controller.py`:
```python
@bp.route("/members", methods=["POST"])
@jwt_required()
def get_class_members():
    data = request.get_json()
    class_id = data.get("id")
    
    enrollments = User_Course.query.filter_by(courseID=class_id).all()
    members = [User.get_by_id(e.userID) for e in enrollments]
    
    return jsonify([{"id": m.id, "name": m.name, "email": m.email} for m in members]), 200
```

**AND** fix the frontend URL from `/classes/members` to `/class/members`:
```typescript
const resp = await fetch(`${BASE_URL}/class/members`, { ... });
```

---

### Option B: Create a new blueprint with `/classes` prefix

Add a route that matches exactly what the frontend expects (`/classes/members`).

---

## Summary Table

| Layer | File | What it does | Current state |
|-------|------|--------------|---------------|
| Frontend | `api.ts` | Calls `/classes/members` | ✅ Exists |
| Frontend | `ClassMembers.tsx` | Displays member list | ✅ Exists |
| Controller | `class_controller.py` | Should handle `/class/members` | ❌ Missing `/members` route |
| Model | `user_course_model.py` | Query enrolled students | ⚠️ Needs `get_students_by_course()` method |

---

## User Stories Affected by This Issue

| User Story | Title | How it's affected |
|------------|-------|-------------------|
| **US2** | Group Contribution Evaluation | Requires "Student can see a list of group members" — depends on being able to list class/group members |
| **US3** | Anonymous Peer Review Process | Assumes "Instructor has at least one class with enrolled students" — instructor needs to view enrolled students |
| **US5** | Student Progress Dashboard | Instructor needs to see "per-student submission status" — requires listing students in a class |
| **US22** | Student View Team Submissions | Student needs to see "submitted assignments from my team members" — requires member visibility |
| **US23** | Peer Review Team Members | Student needs to "submit a private review for each member" — requires listing team/class members |

### Most Directly Blocked:

**US2 – Group Contribution Evaluation** has an explicit acceptance criterion:
> - [ ] Student can see a list of group members

This cannot be completed until the system can list members of a class or group.

---

## Related Feature: CSV Roster Upload

### Is the CSV upload feature documented in a user story?

#### What IS documented:

**US16 – Student Login After Roster Upload** (marked **Complete**)
> *"As a student, I want to log in after my teacher uploads the roster so that I can access the system."*

This user story **assumes** the roster upload exists ("Student is included on a roster"), but it's written from the **student's perspective** — it describes what happens *after* the upload, not the upload itself.

**US18 – Student Registration (Roster-Matched)** (marked **Backlog**)
> *"As a student, I want to register if my email is already part of the course roster so that I can join my course."*

Again, this assumes a roster exists but doesn't describe the upload process.

#### What is NOT documented:

There is **no user story** that says something like:
> *"As an instructor, I want to upload a CSV file of students so that they are enrolled in my class."*

### Conclusion

| Feature | Documented in User Story? | Implemented? |
|---------|---------------------------|--------------|
| Teacher uploads CSV roster | ❌ **No dedicated user story** | ✅ Yes (`/class/enroll_students`) |
| Student logs in after roster upload | ✅ US16 | ✅ Yes |
| Student registers with roster-matched email | ✅ US18 | ⚠️ Partially (depends on roster) |

**The CSV upload feature was implemented despite not having its own user story.** It was likely built as an implicit prerequisite for US16 and US18, which both assume a roster exists.

---

## Clarification: Student Registration After Roster Upload

### How the CSV upload actually works:

When the teacher uploads a CSV file via `/class/enroll_students`:

1. **If the student does NOT exist** → A new `User` account is **automatically created** with:
   - Name from CSV
   - Email from CSV
   - Password: `password123` (hardcoded default)
   - Role: `student`

2. **The student is enrolled** in the course (via `User_Course.add()`)

### Key finding:

**Students do NOT need to register after roster upload.** They simply log in with:
- **Email:** from the CSV
- **Password:** `password123`

### User Story Implications:

| User Story | Description | Accuracy |
|------------|-------------|----------|
| **US16** | "Student Login After Roster Upload" | ✅ Accurate — student just logs in |
| **US18** | "Student Registration (Roster-Matched)" | ⚠️ **May be obsolete** — registration happens automatically via CSV upload |

**US18 may be redundant** given the current implementation. The student never needs to "register" — their account is created for them when the teacher uploads the roster.

## Where Do We Go From Here?
This depend on what the client wants for a final product.
### Questions For The Client:
Is the following assumption correct? The course and registered students already exist (e.g. within OC and Moodle). 
Answering this question is important because it limits the scope of this app's functionality.
User Story 18 indicates that students need to register, but this should not be required if it is already covered by another system. What am I getting at? I am proposing that US18 can be dropped as it's functionality is unnecessary to the requirements of this app.

Now, let's say we drop this US18. What problems might this cause?

Scenario 1 (no issue):
- Given a student has not created an account for the peer review app.
- When a teacher uploads a roster with that student's information.
- Then an account will automatically be created for that student with a default password

Scenario 2 (no issue):
- Given a student does have an account for the peer review app.
- When a teacher uploads a roster with that student's information.
- Then the course will be added to the student's account

Scenario 3: (edge case):
- Given a student does have an account for the peer review app.
- When a teacher uploads a roster that does not not match the student's existing account's email.
- Then another account will be created for the student... not ideal