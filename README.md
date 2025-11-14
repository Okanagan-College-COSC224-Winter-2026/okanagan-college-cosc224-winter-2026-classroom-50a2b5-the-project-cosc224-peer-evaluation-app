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

### Local Development
* Python 3.8+ (for Flask backend)
* Node.js 20.x or newer (LTS recommended for frontend)
* npm (package manager)
* SQLite (included with Python) or PostgreSQL

## Prerequisites Installation

### Installing Python

#### Windows
1. Download Python from [python.org](https://www.python.org/downloads/)
2. Run the installer and **check "Add Python to PATH"**
3. Verify installation:
   ```powershell
   python --version
   ```

#### macOS
Option 1 - Official Installer:
1. Download Python from [python.org](https://www.python.org/downloads/)
2. Run the `.pkg` installer
3. Verify installation:
   ```bash
   python3 --version
   ```

Option 2 - Homebrew (recommended):
```bash
brew install python3
python3 --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
python3 --version
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install python3 python3-pip
python3 --version
```

### Installing Node.js

#### Windows
Option 1 - Official Installer:
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer (includes npm)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

Option 2 - Using Chocolatey:
```powershell
choco install nodejs-lts
```

#### macOS
Option 1 - Official Installer:
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the `.pkg` installer
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

Option 2 - Homebrew (recommended):
```bash
brew install node
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
Using NodeSource repository (recommended):
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install nodejs npm
node --version
npm --version
```

## Getting Started

### Local Development Setup

This project consists of two applications that need to run simultaneously:
1. **Flask Backend** (Python) - API server on port 5000
2. **React Frontend** (Node.js) - Web interface on port 3000

#### Step 1: Set Up the Backend

**Windows (PowerShell):**
```powershell
cd flask_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .
pip install -r requirements-dev.txt

# Initialize database
flask init_db

# Add sample users (or use 'flask create_admin' for first admin)
flask add_users

# Run development server
flask run
```

**macOS/Linux:**
```bash
cd flask_backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -e .
pip install -r requirements-dev.txt

# Initialize database
flask init_db

# Add sample users (or use 'flask create_admin' for first admin)
flask add_users

# Run development server
flask run
```

Backend will be available at [http://localhost:5000](http://localhost:5000)

#### Step 2: Set Up the Frontend

Open a **new terminal window** (keep the backend running) and run:

**All Platforms:**
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After running `flask add_users`, you can log in with:
- **Admin**: admin@example.com / admin123
- **Teacher**: teacher@example.com / teacher123
- **Student**: student@example.com / student123

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

## Documentation

- **[Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)** - Security requirements and deployment checklist
- **[Role Migration Guide](docs/ROLE_MIGRATION.md)** - Complete migration guide from isTeacher to role-based system
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Detailed list of all changes made
- **[Quick Reference](docs/ROLE_QUICK_REFERENCE.md)** - API endpoints, code examples, and common tasks
- **[Endpoint Documentation](docs/dev-guidelines/ENDPOINT_SUMMARY.md)** - API endpoint specifications
- **[Database Schema](docs/schema/database-schema.md)** - Database structure and relationships

## Testing

### Backend Tests (Flask)

**Windows (PowerShell):**
```powershell
cd flask_backend
.\venv\Scripts\Activate.ps1
pytest tests/ -v
```

**macOS/Linux:**
```bash
cd flask_backend
source venv/bin/activate
pytest tests/ -v
```

See [flask_backend/README.md](flask_backend/README.md) for more testing options.

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
