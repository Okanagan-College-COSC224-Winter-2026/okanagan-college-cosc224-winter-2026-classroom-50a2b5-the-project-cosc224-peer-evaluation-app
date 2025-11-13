# Peer Evaluation App

A role-based peer evaluation system for academic courses with support for students, teachers, and administrators.

## Features

### Role-Based Access Control
- **Students**: Submit assignments, participate in peer reviews, view their courses
- **Teachers**: Create courses and assignments, manage student rosters, create groups
- **Admins**: Create teacher/admin accounts, manage all users, system-wide administration

### Core Functionality
- JWT-based authentication with role-based authorization
- RESTful API with Flask backend
- React + TypeScript frontend
- SQLite/PostgreSQL database support
- Automated student account creation via roster upload (planned)
- Course-level and assignment-level group management (planned)

## Requirements

### Docker Setup (Recommended)
* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)

### Local Development
* Python 3.8+ (for Flask backend)
* Node.js 16+ with pnpm (for frontend)
* PostgreSQL or SQLite

## Getting Started

### Option 1: Docker (Quick Start)

1. Clone this repository
2. Run `docker-compose up --build` to start the containers
3. Frontend is available at [http://localhost:3000](http://localhost:3000)
4. API is available at [http://localhost:5000](http://localhost:5000)

The frontend hot-reloads when you make changes, but changes to the backend or database schema will require you to delete and rebuild the containers.

### Option 2: Local Development

#### Backend (Flask)
```bash
cd flask_backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
pip install -r requirements-dev.txt

# Initialize database
flask init_db

# Create first admin user
flask create_admin

# Or create sample users
flask add_users

# Run development server
flask run
```

Backend will be available at [http://localhost:5000](http://localhost:5000)

#### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at [http://localhost:3000](http://localhost:3000)

## Documentation

- **[Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)** - Security requirements and deployment checklist
- **[Role Migration Guide](docs/ROLE_MIGRATION.md)** - Complete migration guide from isTeacher to role-based system
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Detailed list of all changes made
- **[Quick Reference](docs/ROLE_QUICK_REFERENCE.md)** - API endpoints, code examples, and common tasks
- **[Endpoint Documentation](docs/dev-guidelines/ENDPOINT_SUMMARY.md)** - API endpoint specifications
- **[Database Schema](docs/schema/database-schema.md)** - Database structure and relationships

## Testing

### Backend Tests (Flask)
```bash
cd flask_backend
source venv/bin/activate
pytest tests/ -v
```

### Frontend Tests (TypeScript/Jest)
```bash
cd backend  # Note: TypeScript backend, not flask_backend
pnpm test
```

## API Quick Reference

### Authentication
```bash
# Register (student only)
POST /auth/register
Body: {"name": "John Doe", "email": "john@example.com", "password": "secure123"}

# Login
POST /auth/login
Body: {"email": "john@example.com", "password": "secure123"}
Response: {"role": "student", "user_id": 1, "name": "John Doe", "msg": "Login successful"}
```

### Admin Endpoints
```bash
# Create teacher account (admin only)
POST /admin/users/create
Headers: Authorization: Bearer <admin_token>
Body: {"name": "Jane Teacher", "email": "jane@example.com", "password": "pass123", "role": "teacher"}

# List all users (admin only)
GET /admin/users
Headers: Authorization: Bearer <admin_token>
```

See [Quick Reference](docs/ROLE_QUICK_REFERENCE.md) for complete API documentation.

## CLI Commands

```bash
flask init_db           # Initialize database
flask create_admin      # Create admin user (interactive)
flask add_users         # Create sample users (student, teacher, admin)
flask drop_db           # Drop all tables (careful!)
```

## Project Structure

```
├── backend/               # TypeScript/Node.js backend (legacy)
├── flask_backend/         # Flask/Python backend (current)
│   ├── api/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   └── cli/           # CLI commands
│   └── tests/             # Backend tests
├── frontend/              # React + TypeScript frontend
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       └── util/          # Utilities (API, auth)
├── docs/                  # Documentation
└── schema.sql            # Database schema
```

## Important Notes

* Database schema is in `schema.sql`
* Frontend uses HTTPOnly cookies for JWT token storage
* Backend tests use in-memory SQLite database
* Default role for public registration is 'student'
* Teachers and admins must be created by existing admins
* **PRODUCTION SECURITY**: See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) for required security configuration before deploying to production

## Migration from isTeacher to Role-Based System

If you have an existing database, see [docs/ROLE_MIGRATION.md](docs/ROLE_MIGRATION.md) for migration instructions.

Quick migration:
```sql
ALTER TABLE User ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';
UPDATE User SET role = 'teacher' WHERE is_teacher = TRUE;
UPDATE User SET role = 'student' WHERE is_teacher = FALSE;
```

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request to `dev`

## License

See [LICENSE](LICENSE) file for details.
