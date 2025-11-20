# Peer Evaluation App

A role-based peer evaluation system for academic courses with support for students, teachers, and administrators.

## Features

### [Role-Based Access Control](docs/ROLE_PERMISSION_SUMMARY.md)

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

## Local Development Requirements

- Linux Ubuntu 24.04 (known to work inside of WSL2)
- Python 3.8+ (for Flask backend)
- Node.js 20.x or newer (LTS recommended for frontend)
- npm (package manager)
- SQLite (included with Python) or PostgreSQL

## Getting Started

### Local Development Setup

This project consists of two applications that need to run simultaneously:

- **Flask Backend** (Python) - API server on port 5000
- **React Frontend** (Node.js) - Web interface on port 3000

Before your first run you will need to do some one-time setup.

#### Step 1

[Set up the backend.](flask_backend/README.md) Backend will be available at [http://localhost:5000](http://localhost:5000)

#### Step 2

[Set up the frontend.](frontend/README.md) Frontend will be available at [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After running `flask add_users`, the mock database will be populated with fake credentials you can use for local testing.

**Log in with:**

- **Admin**: `admin@example.com` / 123456
- **Teacher**: `teacher@example.com` / 123456
- **Student**: `student@example.com` / 123456

## Project Structure

```
├── flask_backend/        # Flask REST API (Python)
│   ├── api/              # Application code
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database models
│   │   └── cli/          # CLI commands
│   └── tests/            # Backend tests
├── frontend/             # React app (TypeScript)
│   └── src/
│       ├── components/   # React components
│       ├── pages/        # Page components
│       └── util/         # API client & utilities
└── docs/                 # Documentation
```

## Developer Documentation

- **[Development Guidelines](docs/dev-guidelines/dev-ops.md)** - Project expectations
- **[Project Architecture](docs/schema/project-architecture.md)** - High level Overview
- **[Database ORM](docs/schema/database-schema.md)** - UML class diagram and description of the schema
- **[Endpoint Documentation](docs/dev-guidelines/ENDPOINT_SUMMARY.md)** - API endpoint specifications
- **[Production Deployment Guide](docs/dev-guidelines/PRODUCTION_DEPLOYMENT.md)** - Security requirements and deployment checklist

## Testing

### Backend Tests (Flask)

**Linux:**

```bash
cd flask_backend
source venv/bin/activate
pytest tests/ -v
```

See [flask_backend/README.md](flask_backend/README.md) for more testing options.

## CLI Commands

```bash
flask init_db           # Initialize database
flask create_admin      # Create admin user (interactive)
flask add_users         # Create sample users (student, teacher, admin)
flask drop_db           # Drop all tables (careful!)
```

## Important Notes

- Frontend uses HTTPOnly cookies for JWT token storage
- Backend tests use in-memory SQLite database
- Default role for public registration is 'student'
- Teachers and admins must be created by existing admins
- **PRODUCTION SECURITY**: See [Production Deployment Guide](docs/dev-guidelines/PRODUCTION_DEPLOYMENT.md) for required security configuration before deploying to production

## Contributing

1. Create a feature branch from `dev` ([follow guidelines](docs/dev-guidelines/dev-ops.md))
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request to `dev`

## License

See [LICENSE](LICENSE) file for details.
