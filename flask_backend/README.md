# Peer Evaluation App — Flask Backend

This is the Flask REST API backend for the Peer Evaluation App, built using the MVC architecture with Flask, SQLAlchemy, and Marshmallow for serialization.

## Features

- RESTful API with JWT authentication
- Role-based authorization (Student, Teacher, Admin)
- SQLAlchemy ORM with SQLite (dev) or PostgreSQL (production)
- Marshmallow schemas for request/response validation
- Flask blueprints for modular routing
- CLI commands for database management

## Prerequisites

### Installing Python

#### Windows
1. Download Python 3.8+ from [python.org](https://www.python.org/downloads/)
2. Run the installer and **check "Add Python to PATH"**
3. Verify installation:
   ```powershell
   python --version
   pip --version
   ```

#### macOS
Option 1 - Official Installer:
1. Download Python from [python.org](https://www.python.org/downloads/)
2. Run the `.pkg` installer

Option 2 - Homebrew (recommended):
```bash
brew install python3
```

Verify installation:
```bash
python3 --version
pip3 --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
python3 --version
pip3 --version
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install python3 python3-pip
python3 --version
pip3 --version
```

## Installation

### Windows (PowerShell)

1. **Navigate to the backend directory:**
   ```powershell
   cd flask_backend
   ```

2. **Create a virtual environment:**
   ```powershell
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   *Note: If you get an execution policy error, run:*
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Install the package and dependencies:**
   ```powershell
   pip install -e .
   pip install -r requirements-dev.txt
   ```

5. **Initialize the database:**
   ```powershell
   flask init_db
   ```

6. **Add sample users:**
   ```powershell
   flask add_users
   ```
   
   Or create just an admin:
   ```powershell
   flask create_admin
   ```

7. **Run the development server:**
   ```powershell
   flask run
   ```

The API will be available at [http://localhost:5000](http://localhost:5000)

### macOS/Linux (Bash)

1. **Navigate to the backend directory:**
   ```bash
   cd flask_backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Install the package and dependencies:**
   ```bash
   pip install -e .
   pip install -r requirements-dev.txt
   ```

5. **Initialize the database:**
   ```bash
   flask init_db
   ```

6. **Add sample users:**
   ```bash
   flask add_users
   ```
   
   Or create just an admin:
   ```bash
   flask create_admin
   ```

7. **Run the development server:**
   ```bash
   flask run
   ```

The API will be available at [http://localhost:5000](http://localhost:5000)

## Available CLI Commands

The Flask backend includes several CLI commands for database management:

- `flask init_db` - Initialize/reset the database schema
- `flask add_users` - Add sample users (admin, teacher, student)
- `flask create_admin` - Create a single admin user interactively
- `flask drop_db` - Drop all database tables

## Default Test Users

After running `flask add_users`, the following accounts are available:

| Role    | Email                 | Password   |
|---------|-----------------------|------------|
| Admin   | admin@example.com     | admin123   |
| Teacher | teacher@example.com   | teacher123 |
| Student | student@example.com   | student123 |

## Running Tests

The test suite uses pytest with an in-memory SQLite database. No external services are required.

### Windows (PowerShell)

```powershell
# Make sure you're in flask_backend and venv is activated
.\venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_login.py

# Run a specific test function
pytest tests/test_login.py::test_login

# Stop on first failure
pytest -x

# Run with coverage report
pytest --cov=api --cov-report=html
```

### macOS/Linux

```bash
# Make sure you're in flask_backend and venv is activated
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_login.py

# Run a specific test function
pytest tests/test_login.py::test_login

# Stop on first failure
pytest -x

# Run with coverage report
pytest --cov=api --cov-report=html
```

## Project Structure

```
flask_backend/
├── api/
│   ├── __init__.py           # Flask app factory
│   ├── config.py             # Configuration settings
│   ├── cli/
│   │   └── database.py       # CLI commands
│   ├── controllers/          # Route handlers (blueprints)
│   │   ├── auth_controller.py
│   │   └── user_controller.py
│   └── models/               # Database models & schemas
│       ├── db.py             # SQLAlchemy instance
│       └── user_model.py     # User model & schema
├── tests/                    # Test suite
│   ├── conftest.py           # Pytest fixtures
│   ├── test_login.py
│   └── test_user.py
├── instance/                 # Database files (gitignored)
├── requirements-dev.txt      # Development dependencies
└── setup.py                  # Package configuration
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token

### User Management
- `GET /user/profile` - Get current user profile (requires JWT)
- `GET /user/all` - List all users (admin only)

See [docs/dev-guidelines/ENDPOINT_SUMMARY.md](../docs/dev-guidelines/ENDPOINT_SUMMARY.md) for complete API documentation.

## Configuration

The Flask app uses the following default configuration:
- **Database**: SQLite (`instance/peer_eval.db`)
- **JWT Secret**: Auto-generated (or set via `JWT_SECRET_KEY` env var)
- **Debug Mode**: Enabled for development

To override defaults, create `api/config.py` or set environment variables:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:pass@localhost/dbname"
$env:JWT_SECRET_KEY="your-secret-key"
flask run
```

**macOS/Linux:**
```bash
export DATABASE_URL="postgresql://user:pass@localhost/dbname"
export JWT_SECRET_KEY="your-secret-key"
flask run
```

## Troubleshooting

### Virtual Environment Activation Issues (Windows)

If you get a "cannot be loaded because running scripts is disabled" error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

If port 5000 is already in use:

**Windows:**
```powershell
$env:FLASK_RUN_PORT="5001"
flask run
```

**macOS/Linux:**
```bash
export FLASK_RUN_PORT=5001
flask run
```

### Database Locked Error

If you see "database is locked" errors, ensure no other Flask instance is running and try:
```bash
flask drop_db
flask init_db
flask add_users
```

## Development Workflow

1. **Activate virtual environment** (every time you open a new terminal)
2. **Make code changes**
3. **Run tests**: `pytest`
4. **Test manually** using the frontend or tools like Postman/curl
5. **Deactivate** when done: `deactivate`

## Next Steps

- See [../docs/ROLE_QUICK_REFERENCE.md](../docs/ROLE_QUICK_REFERENCE.md) for API usage examples
- See [../docs/schema/database-schema.md](../docs/schema/database-schema.md) for database structure
- See [../frontend/README.md](../frontend/README.md) to set up the frontend

Coverage plugin (`pytest-cov`) is installed via `requirements-dev.txt`. Run:

```bash
pytest --cov=api --cov-report=term-missing
```

### Notes

- Tests bootstrap the app via `api.create_app` with `TESTING=True` and create/drop tables per session; your local database will not be modified.
- CI-oriented dependencies live in `requirements-ci.txt`. For local development, prefer `requirements-dev.txt`.

## The structure of the project (In the following tree, only important entities are listed)

```text
├── api
│   ├── cli
│   ├── controllers
│   ├── models
│   ├── __init__.py
│   ├── config.py
├── tests
├── .gitignore
├── setup.py
├── requirements-dev.txt

```

In the current directory, you can find the files required to install the project, such as `requirements-dev.txt`, `setup.py`, etc., as well as two directories: `tests` and `api`. The tests directory is a package designed to implement test-driven development. You can use the examples in this package to implement your own tests. The main Flask application is implemented inside the api package. The structure of the api package is as follows:

```text
├── api
│   ├── cli
│   ├── controllers
│   ├── models
│   ├── __init__.py
│   ├── config.py
```

Inside the `__init__.py` file, the Flask application is configured. In this file, you need to import and register your controllers (routes).

# Tutorial for extension

## Let’s Add a New Controller to This Project

Inside the controllers package, create a new file, such as test.py, at api/controllers/test.py.

Now paste the following code into this file:

```python
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for,
    jsonify
)


test = Blueprint('test', __name__)


@test.route('/test', methods=('POST', 'GET'))
def get_scanner():
    if request.method == 'GET':
        return jsonify(
            [
              {
                "test": True
              }
            ]
        ), 200
```

then, go to the `api/__init__.py` and import `test_api`.

```python
from .controllers import auth, member, fake_api, test_api
```

**Note: The import already exists; you only need to import test_api.**

Register the controller inside the create_app function after init_app(app).

```python
app.register_blueprint(test_api.test)
```

**Note: check the auth.py file inside the `controllers` package to see how we can implement authentication**

## Let’s Add a New model to This Project

Make a new file name `example_model.py` inside the `api/models` package.
paste the following code inside this file:

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship


from .db import Base, session, ma


class Example(Base):
    __tablename__ = 'examples'

    id = Column(Integer, primary_key=True)
    name = Column(String)

    def __init__(self, name):

        self.name = name

class ExampleSchema(ma.Schema):


    class Meta:
        fields = (
            "id",
            "name"
        )
```

Now, inside `models/__init__.py` import this new model.

```python
from .example_model import Example
```

Destroy the previous database (if you are using SQLite, then just remove the file) and run

```bash
flask init_db
```
