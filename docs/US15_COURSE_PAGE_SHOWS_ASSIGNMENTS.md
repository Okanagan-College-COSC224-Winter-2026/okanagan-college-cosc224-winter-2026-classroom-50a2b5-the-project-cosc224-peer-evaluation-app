# US15 – Course Page Shows Assignments

## Summary

Implements US15 by showing each course on the teacher dashboard along with its assignments and key metadata (due date and status). Teachers can see what they have created at a glance and click through to assignment details.

## Capabilities (Checklist)

- Dashboard lists each course created by the teacher
- Each course entry shows its assignments
- Each assignment displays metadata:
	- Due date (or No due date)
	- Status (Upcoming or Overdue)
- Assignment rows are clickable and open the assignment page

## Changes

### Frontend (React/TypeScript)

- Updated [frontend/src/pages/Home.tsx](frontend/src/pages/Home.tsx)
	- Renders assignments per course on the dashboard
	- Computes due date display and status
	- Links assignment rows to `/assignments/<id>`

- Updated [frontend/src/pages/Home.css](frontend/src/pages/Home.css)
	- Styles assignment list and status badges

### Backend (Flask)

- Existing endpoint already returns assignment metadata used by the dashboard:
	- `GET /assignment/<course_id>`

- Added tests in [flask_backend/tests/test_assignments.py](flask_backend/tests/test_assignments.py)
	- Assignment list includes `due_date` when set
	- Assignment list includes `due_date: null` when unset

## Testing

Automated (from `flask_backend`):

```powershell
python -m flask --app api init_db
python -m pytest tests/test_assignments.py -k "due_date_metadata or missing_due_date_metadata" -q
```

Manual:

1. Start backend: `python -m flask --app api run`
2. Start frontend: `npm run dev`
3. Open `/home`
4. Verify each course lists assignments with due date + status
5. Click an assignment row and confirm navigation to `/assignments/<id>`