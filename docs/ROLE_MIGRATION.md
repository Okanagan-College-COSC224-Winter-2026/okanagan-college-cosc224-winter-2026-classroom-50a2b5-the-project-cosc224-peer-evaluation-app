# Role-Based Access Control Migration

This document describes the migration from `isTeacher` boolean field to a role-based system with `student`, `teacher`, and `admin` roles.

## Database Migration

If you have an existing database with the `is_teacher` field, you need to migrate it to use the new `role` field.

### SQLite Migration

```sql
-- Add new role column with default value
ALTER TABLE User ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';

-- Migrate existing data
UPDATE User SET role = 'teacher' WHERE is_teacher = TRUE;
UPDATE User SET role = 'student' WHERE is_teacher = FALSE;

-- Drop old column (optional, for clean migration)
-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- If needed, create a new table and copy data over

-- Add check constraint (SQLite 3.37.0+)
-- For older versions, this is enforced at the application level
-- ALTER TABLE User ADD CONSTRAINT check_role CHECK (role IN ('student', 'teacher', 'admin'));
```

### PostgreSQL Migration

```sql
-- Add new role column with default value
ALTER TABLE "User" ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';

-- Add check constraint
ALTER TABLE "User" ADD CONSTRAINT check_role CHECK (role IN ('student', 'teacher', 'admin'));

-- Migrate existing data
UPDATE "User" SET role = 'teacher' WHERE is_teacher = TRUE;
UPDATE "User" SET role = 'student' WHERE is_teacher = FALSE;

-- Drop old column
ALTER TABLE "User" DROP COLUMN is_teacher;
```

## Changes Summary

### Backend (Flask)

1. **User Model** (`flask_backend/api/models/users_model.py`):
   - Changed `is_teacher` field to `role` field with values: 'student', 'teacher', 'admin'
   - Added helper methods: `is_teacher()`, `is_admin()`, `is_student()`, `has_role(*roles)`
   - Kept `is_teacher_user()` for backward compatibility

2. **Auth Controller** (`flask_backend/api/controllers/auth_controller.py`):
   - Registration now creates students by default (only public endpoint)
   - Login returns role information in response
   - Updated `jwt_role_required` decorator to check roles properly
   - Added `jwt_admin_required` and `jwt_teacher_required` decorators

3. **Admin Controller** (NEW: `flask_backend/api/controllers/admin_controller.py`):
   - `/admin/users` - List all users (admin only)
   - `/admin/users/create` - Create user with any role (admin only)
   - `/admin/users/<id>/role` - Update user role (admin only)
   - `/admin/users/<id>` - Delete user (admin only)

4. **User Controller** (`flask_backend/api/controllers/user_controller.py`):
   - Updated authorization checks to use role-based methods
   - Teachers and admins can view any user info
   - Only admins can delete other users

5. **Tests**:
   - Updated all tests to use `role` field instead of `is_teacher`
   - Added comprehensive role testing

### Frontend (React)

1. **Login Utilities** (`frontend/src/util/login.ts`):
   - Added `getUserRole()`, `isAdmin()`, `isStudent()`, `hasRole()` functions
   - Updated `isTeacher()` to use role field
   - Backward compatible with existing code

2. **TypeScript Types** (`frontend/src/types.d.ts`):
   - Added `User` interface with role field
   - Updated `Member` interface with role field

### Database Schema

1. **schema.sql**:
   - Changed `is_teacher BOOLEAN` to `role VARCHAR(50)` with CHECK constraint
   - Updated all seed data to use role values

## User Roles and Permissions

### Student Role
- Can view their own profile
- Can view courses they're enrolled in
- Can submit assignments
- Can view/create peer reviews
- **Cannot** create courses, assignments, or manage other users

### Teacher Role
- All student permissions
- Can create and manage courses
- Can create assignments and rubrics
- Can add student rosters (which auto-creates student accounts)
- Can create course-level and assignment-level groups
- Can view all students in their courses
- **Cannot** create teacher or admin accounts

### Admin Role
- All teacher permissions
- Can create teacher accounts
- Can create additional admin accounts
- Can manage any user (view, update role, delete)
- Can view all users in the system
- System-wide administrative access

## API Endpoints

### Public Endpoints
- `POST /auth/register` - Register as student (public)
- `POST /auth/login` - Login and get JWT token

### Student Endpoints (require authentication)
- `GET /user/` - Get current user info
- `PUT /user/` - Update current user info
- `DELETE /user/<id>` - Delete own account

### Teacher Endpoints (require teacher or admin role)
- `POST /courses` - Create course
- `POST /courses/<id>/roster` - Upload student roster (auto-creates accounts)
- `POST /courses/<id>/assignments` - Create assignment
- `POST /courses/<id>/groups` - Create course-level groups
- `POST /assignments/<id>/groups` - Create assignment-level groups

### Admin Endpoints (require admin role)
- `GET /admin/users` - List all users
- `POST /admin/users/create` - Create user with any role
- `PUT /admin/users/<id>/role` - Update user role
- `DELETE /admin/users/<id>` - Delete any user

## Breaking Changes

### Backend
- Login response now includes `role`, `user_id`, and `name` in addition to `access_token`
- Registration endpoint no longer accepts `is_teacher` parameter
- User schema now exposes `role` instead of `is_teacher`

### Frontend
- LocalStorage structure changed from `{ token, isTeacher }` to `{ token, role, user_id, name }`
- Components using `isTeacher()` need to verify they work with the updated implementation
- New role-checking functions available: `isAdmin()`, `isStudent()`, `hasRole()`

## Migration Steps

1. **Backup your database**

2. **Run database migration** (see SQL scripts above)

3. **Create first admin user** (if you don't have one):
   ```sql
   INSERT INTO User (name, email, hash_pass, role)
   VALUES ('Admin User', 'admin@example.com', '<hashed_password>', 'admin');
   ```

4. **Deploy backend changes**

5. **Deploy frontend changes**

6. **Clear browser localStorage** on client machines to force re-login with new token structure

7. **Test thoroughly**:
   - Student registration
   - Admin creating teacher accounts
   - Teacher creating courses and managing students
   - Role-based access restrictions

## Future Enhancements

Consider implementing:
- Course-specific roles (e.g., teaching assistants)
- Role inheritance/hierarchies
- Fine-grained permissions system
- Audit logging for admin actions
- Bulk user import/export
- Self-service role requests with approval workflow
