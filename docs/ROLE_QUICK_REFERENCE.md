# Role-Based Access Control - Quick Reference

## Quick Start

### Create First Admin
```bash
cd flask_backend
source venv/bin/activate  # if using venv
flask create_admin
```

### Sample Login (After creating admin)
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

Response (JWT token is set in HTTPOnly cookie, not in body):
```json
{
  "role": "admin",
  "user_id": 1,
  "name": "Admin User",
  "msg": "Login successful"
}
```

Use the cookie for subsequent requests:
```bash
curl http://localhost:5000/user/ -b cookies.txt
```

## User Roles

| Role | Can Do |
|------|--------|
| **student** | View own profile, submit assignments, peer reviews |
| **teacher** | All student + create courses, assignments, manage rosters |
| **admin** | All teacher + create teacher/admin accounts, manage all users |

## API Quick Reference

### Authentication
```bash
# Register (student only)
POST /auth/register
Content-Type: application/json
{"name": "John Doe", "email": "john@example.com", "password": "secure123"}

# Login (all roles)
POST /auth/login
Content-Type: application/json
Credentials: include
{"email": "john@example.com", "password": "secure123"}
# Response sets HTTPOnly cookie automatically

# Logout
POST /auth/logout
Credentials: include
# Clears HTTPOnly cookie
```

### User Endpoints
```bash
# Get current user
GET /user/
Credentials: include
# JWT cookie automatically included

# Get user by ID (own or if teacher/admin)
GET /user/<id>
Credentials: include
# JWT cookie automatically included
```

### Admin Endpoints
```bash
# List all users
GET /admin/users
Credentials: include
# JWT cookie automatically included

# Create teacher account
POST /admin/users/create
Content-Type: application/json
Credentials: include
{"name": "Jane Teacher", "email": "jane@example.com", "password": "pass123", "role": "teacher"}

# Update user role
PUT /admin/users/<id>/role
Content-Type: application/json
Credentials: include
{"role": "teacher"}

# Delete user
DELETE /admin/users/<id>
Credentials: include
```

**Note:** All authenticated endpoints use HTTPOnly cookies for JWT tokens. No `Authorization: Bearer` headers needed - the browser automatically sends the cookie when `credentials: 'include'` is specified.

## Code Examples

### Backend - Check User Role
```python
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import User

@jwt_required()
def my_endpoint():
    email = get_jwt_identity()
    user = User.get_by_email(email)
    
    # Check single role
    if user.is_admin():
        # Admin-only code
        pass
    
    # Check multiple roles
    if user.has_role('teacher', 'admin'):
        # Teacher or admin code
        pass
```

### Backend - Protect Routes
```python
from api.controllers.auth_controller import jwt_admin_required, jwt_teacher_required, jwt_role_required

# Admin only
@bp.route('/admin-only')
@jwt_admin_required
def admin_only():
    return {"msg": "Admin access"}

# Teacher or admin
@bp.route('/teacher-only')
@jwt_teacher_required
def teacher_only():
    return {"msg": "Teacher access"}

# Custom roles
@bp.route('/custom')
@jwt_role_required('teacher', 'admin')
def custom_roles():
    return {"msg": "Custom roles"}
```

### Frontend - Check User Role
```typescript
import { getUserRole, isAdmin, isTeacher, isStudent, hasRole } from './util/login';

// Get current role
const role = getUserRole(); // 'student' | 'teacher' | 'admin'

// Check specific role
if (isAdmin()) {
  // Show admin panel
}

if (isTeacher()) {
  // Show teacher features
}

// Check multiple roles
if (hasRole('teacher', 'admin')) {
  // Show for teachers and admins
}
```

### Frontend - Conditional Rendering
```typescript
import { hasRole, isAdmin } from './util/login';

function MyComponent() {
  return (
    <>
      {isAdmin() && <AdminPanel />}
      {hasRole('teacher', 'admin') && <CourseManagement />}
      <StudentDashboard />
    </>
  );
}
```

## Database Migration

### SQLite
```sql
ALTER TABLE User ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';
UPDATE User SET role = 'teacher' WHERE is_teacher = TRUE;
UPDATE User SET role = 'student' WHERE is_teacher = FALSE;
```

### PostgreSQL
```sql
ALTER TABLE "User" ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';
ALTER TABLE "User" ADD CONSTRAINT check_role CHECK (role IN ('student', 'teacher', 'admin'));
UPDATE "User" SET role = 'teacher' WHERE is_teacher = TRUE;
UPDATE "User" SET role = 'student' WHERE is_teacher = FALSE;
ALTER TABLE "User" DROP COLUMN is_teacher;
```

## CLI Commands

```bash
# Initialize database
flask init_db

# Create sample users (student, teacher, admin)
flask add_users

# Create admin interactively
flask create_admin

# Drop all tables (careful!)
flask drop_db
```

## Testing

```bash
# Run all tests
cd flask_backend
pytest tests/ -v

# Run specific test file
pytest tests/test_model.py -v

# Run specific test
pytest tests/test_model.py::test_user_roles -v
```

## Common Issues

### Issue: JWT token expired
**Solution**: Login again to get a new token

### Issue: 403 Forbidden
**Solution**: Check if user has required role for the endpoint

### Issue: User shows old role after update
**Solution**: 
1. Logout and login again to get new JWT with updated role
2. Or, implement token refresh mechanism

### Issue: Frontend shows old isTeacher state
**Solution**: Clear localStorage and login again
```javascript
localStorage.clear();
window.location.href = '/';
```

## Security Best Practices

1. **Always validate on backend**: Never trust frontend role checks alone
2. **Use HTTPS in production**: Protect JWT tokens in transit
3. **Set JWT expiration**: Configure appropriate token lifetime
4. **Rotate secrets**: Change JWT_SECRET_KEY regularly
5. **Audit admin actions**: Log all admin operations
6. **Validate role transitions**: Not all role changes should be allowed

## Development Workflow

1. **Start with tests**: Write tests for new role-based features
2. **Backend first**: Implement and test backend endpoints
3. **Frontend integration**: Update UI to use new endpoints
4. **Test authorization**: Verify unauthorized access is blocked
5. **Document changes**: Update API docs and user guides

## Next Steps

- [ ] Implement course management for teachers
- [ ] Add student roster upload (auto-creates accounts)
- [ ] Create group management (course + assignment level)
- [ ] Build role-based UI dashboards
- [ ] Add audit logging for admin actions
- [ ] Implement email verification
- [ ] Add password reset flow

## Resources

- Full Migration Guide: `docs/ROLE_MIGRATION.md`
- Implementation Details: `docs/IMPLEMENTATION_SUMMARY.md`
- API Documentation: `docs/dev-guidelines/ENDPOINT_SUMMARY.md`
- Database Schema: `docs/schema/database-schema.md`
