# Notification Service

Real-time, role-based notifications powered by **Flask-SocketIO** (WebSockets) and **React Query**.

---

## Starting the app

You must use `run_dev.py` — not `flask run`.  
`flask run` does not boot the SocketIO server, so real-time push will not work.

**Terminal 1 — backend**

```bash
cd flask_backend
source venv/bin/activate
python run_dev.py
```

Flask + SocketIO starts on `http://localhost:5000`.  
The server auto-reloads when you save a Python file.

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Vite starts on `http://localhost:3000`.

**First time only — seed the database**

```bash
cd flask_backend
source venv/bin/activate
FLASK_APP=api flask init_db           # creates all tables
FLASK_APP=api flask add_users         # student / teacher / admin accounts
FLASK_APP=api flask add_sample_courses  # 3 courses + example assignments
```

Sample accounts after seeding (password `123456` for all):

- `student@example.com` — student role
- `teacher@example.com` — teacher role
- `admin@example.com` — admin role

---

## How a notification travels from server to screen

**Step 1 — something happens**

A user takes an action: publishes an assignment, renames a course, submits a review, etc.

**Step 2 — the controller writes to the database**

The Flask controller calls one of two helpers:

```python
# Single recipient
Notification.create(
    userID=student.id,
    type="assignment_published",
    message="New assignment 'Week 3 Peer Review' is now available.",
    reference_id=assignment.id,
    reference_type="assignment",
)

# Multiple recipients at once
Notification.create_bulk([
    { "userID": uid, "type": "course_updated", "message": "...", ... }
    for uid in student_ids
])
```

Both helpers write the row(s) to the `Notification` table, then immediately call `_emit_realtime()`.

**Step 3 — the server pushes over WebSocket**

`_emit_realtime()` fires a SocketIO event to a private room named `user_<recipientID>`:

```python
socketio.emit(
    "new_notification",
    { "id": ..., "type": ..., "message": ..., "is_read": False, ... },
    room=f"user_{notification.userID}"
)
```

Only that one user's browser receives it — nobody else sees it.

**Step 4 — the browser receives it instantly**

When the user logged in, the React app joined their personal room:

```
ProtectedLayout.tsx  →  socket.emit("join", { user_id: currentUser.id })
```

The socket listener in `useRealtimeNotifications()` catches the event and tells React Query to refetch — the new notification appears in the list with no page reload.

**Step 5 — fallback polling**

If the WebSocket connection drops for any reason, the notifications query automatically polls every **60 seconds** so the data never goes stale for long.

---

## What triggers each notification

### Course enrolled
**Who triggers it:** a teacher uploads a CSV of students to a course.  
**Who receives it:** every student that was just added.  
**Message example:** `You have been enrolled in 'COSC 404' by Example Teacher.`

### Course created
**Who triggers it:** a teacher creates a new course.  
**Who receives it:** all admins and super-admins.  
**Message example:** `Example Teacher created a new course 'COSC 404'.`

### Course updated — rename
**Who triggers it:** a teacher renames one of their courses.  
**Who receives it:** all admins and super-admins.  
**Message example:** `Example Teacher renamed course 'Old Name' to 'New Name'.`

**Who triggers it:** an admin renames any course.  
**Who receives it:** all enrolled students + the course teacher.  
**Message example:** `Course 'Old Name' was renamed to 'New Name' by Example Admin.`

### Course updated — cover image
**Who triggers it:** anyone with access hits Update after choosing a new image.  
**Who receives it:** enrolled students + the course teacher (if different from the person updating) + all other admins.  
**Message example:** `Example Admin updated the cover image for course 'COSC 404'.`

### Course deleted
**Who triggers it:** teacher or admin deletes a course.  
**Who receives it:** all enrolled students always. If an admin deleted it, the course teacher also receives one.  
**Message example (students):** `Your course 'COSC 404' has been removed.`  
**Message example (teacher):** `Your course 'COSC 404' was removed by an administrator.`

### Assignment published
**Who triggers it:** a teacher creates a new assignment inside a course.  
**Who receives it:** all students enrolled in that course.  
**Message example:** `A new assignment 'Week 3 Peer Review' has been published in 'COSC 404'.`

### Assignment updated
**Who triggers it:** a teacher edits an existing assignment.  
**Who receives it:** all students enrolled in that course.  
**Message example:** `Assignment 'Week 3 Peer Review' in 'COSC 404' has been updated.`

### Assignment deleted
**Who triggers it:** a teacher deletes an assignment.  
**Who receives it:** all students enrolled in that course.  
**Message example:** `Assignment 'Week 3 Peer Review' was removed from 'COSC 404' by Example Teacher.`

### Assignment graded (peer review submitted)
**Who triggers it:** any student submits a peer review on someone else's work.  
**Who receives it:** the student whose submission was reviewed.  
**Message example:** `Your submission for 'Week 3 Peer Review' has received a new peer review.`

### Review flagged
**Who triggers it:** a student flags a peer review they received.  
**Who receives it:** the teacher of that course.  
**Message example:** `A review in 'COSC 404' has been flagged for your attention.`

---

## The notifications page

Navigate to `/notifications` after logging in.

**Filter bar**

At the top there are two segmented controls:

- **Status** — `All status` · `Unread` · `Read`
- **Date** — `Any time` · `Today` · `Last 7 days`

Pick any combination to narrow the list. Both filters work together.

**Bulk actions (top right)**

- `Mark all read` — marks every notification as read in one click. Only visible when unread notifications exist.
- `Delete all` — deletes every notification immediately, no confirmation.

**Per-notification actions (hover)**

Hover over any notification row to reveal two icon buttons on the right:

- The envelope icon toggles read / unread.
- The trash icon deletes just that one notification.

**Click to read**

Clicking anywhere on an unread notification card marks it as read instantly.

---

## Where each piece lives in the code

**`flask_backend/api/models/notification_model.py`**  
The `Notification` database model. Contains `create()`, `create_bulk()`, and `_emit_realtime()`. This is the only place that writes to the database and pushes over WebSocket — everything else calls these methods.

**`flask_backend/api/controllers/notification_controller.py`**  
The REST API. Handles listing notifications, marking read/unread, and deleting. Called by the frontend via fetch.

**`flask_backend/api/controllers/class_controller.py`**  
Triggers `course_enrolled`, `course_created`, `course_updated`, and `course_deleted` notifications whenever a course action happens.

**`flask_backend/api/controllers/assignment_controller.py`**  
Triggers `assignment_published`, `assignment_updated`, and `assignment_deleted` notifications.

**`flask_backend/api/controllers/review_controller.py`**  
Triggers `assignment_graded` and `review_flagged` notifications.

**`frontend/src/features/notifications/useNotifications.ts`**  
All React Query hooks used by the UI: `useNotifications`, `useMarkRead`, `useMarkUnread`, `useMarkAllRead`, `useDeleteNotification`, `useDeleteAllNotifications`, and `useRealtimeNotifications` (the WebSocket listener).

**`frontend/src/services/notificationApi.ts`**  
The raw fetch functions that call the REST endpoints above.

**`frontend/src/features/notifications/NotificationsPage.tsx`**  
The notifications page component — filter controls, notification cards, bulk actions.

**`frontend/src/layouts/ProtectedLayout.tsx`**  
Calls `useRealtimeNotifications()` once at app level so the WebSocket is always active while the user is logged in.
