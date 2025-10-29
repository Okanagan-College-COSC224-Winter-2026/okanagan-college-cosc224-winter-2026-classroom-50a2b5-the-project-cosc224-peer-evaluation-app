# Copilot / AI agent instructions — Peer-Evaluation-App-V1

These notes make an AI agent productive quickly in this repo. Keep edits small, lean on existing tests, and don’t touch secrets.

## Big picture
- Monorepo with two apps: `backend/` (Flask + SQLAlchemy + Marshmallow) and `frontend/` (React + TypeScript + Vite).
- Backend exposes REST via Flask blueprints; auth is JWT (Flask-JWT-Extended). Dev DB defaults to SQLite.
- Frontend calls the backend through `frontend/src/util/api.ts` (BASE_URL currently http://localhost:8081).

## Files to know
- Backend entry: `backend/api/__init__.py` (Flask app factory, JWT, blueprint registration).
- Routes: `backend/api/controllers/{auth_controller.py,user_controller.py}`.
- Models: `backend/api/models/{db.py,user_model.py}`; tests reference extra models that are TODO.
- Tests (truth for current behavior): `backend/tests/{conftest.py,test_login.py,test_user.py}`.
- Frontend API contract: `frontend/src/util/api.ts` and token helpers `frontend/src/util/login.ts`.
- Future frontend endpoints: `docs/dev-guidelines/endpoints.json`.

## Dev workflows (local)
- Backend: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -e . && pip install -r requirements-dev.txt && flask --app api run` (port 5000 by default).
- DB CLI: `flask init_db`, `flask add_users`, `flask drop_db` (see `backend/api/cli/database.py`).
- Tests: `cd backend && pytest` (uses in-memory SQLite via `conftest.py`).
- Frontend: `cd frontend && pnpm install && pnpm dev` (http://localhost:3000).

Notes on ports/contracts
- Frontend expects backend at http://localhost:8081 and stores `{ token, isTeacher }` in localStorage, but Flask `/auth/login` returns `{ access_token }` and runs on 5000 by default.
- For local dev without Docker, either update `BASE_URL` to 5000 or add a Vite proxy; align token shape in a follow-up.

## Conventions and patterns
- Blueprints per feature, registered in the app factory. Use Marshmallow schemas for JSON responses and never expose passwords (see `UserSchema`).
- Tests are the contract: implement/modify endpoints to satisfy `test_login.py` and `test_user.py` first.
- Config: defaults are set in `api/__init__.py`; optional overrides live in `api/config.py`.

## Gaps and integration points
- `docs/dev-guidelines/endpoints.json` reflects a legacy/Node-style API spec; treat it as a target spec, not current implementation.
- Many endpoints used by the frontend (`/classes`, `/create_*`, groups/rubrics) are not implemented yet—coordinate changes to frontend or implement matching Flask routes.
- No `docker-compose.yml` is present in this repo; if you add Docker later, keep ports 3000 (frontend) and 8081/5000 (backend) consistent with `api.ts`.

## Quick examples
- JWT flow: `POST /auth/register` => `POST /auth/login` (get `access_token`) => use `Authorization: Bearer <token>` for `/user/*` routes.
- Add a route: create a blueprint handler under `api/controllers/…` and register it in `api/__init__.py`.
