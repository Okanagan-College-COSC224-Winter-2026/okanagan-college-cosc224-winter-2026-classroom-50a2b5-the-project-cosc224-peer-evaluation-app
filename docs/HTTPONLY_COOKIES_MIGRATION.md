# HTTPOnly Cookie Migration for JWT Authentication

## Summary

The Flask backend now uses **HTTPOnly cookies** to store JWT tokens instead of returning them in the response body. This significantly improves security by protecting the tokens from XSS (Cross-Site Scripting) attacks.

## Changes Made

### Backend Changes (`flask_backend/`)

#### 1. Flask Configuration (`api/__init__.py`)
- Added `flask-cors` dependency for CORS support
- Configured CORS to allow credentials from frontend origins (localhost:3000, localhost:5173)
- Added JWT cookie settings:
  - `JWT_TOKEN_LOCATION = ['cookies']` - Store tokens in cookies only
  - `JWT_COOKIE_SECURE = False` - Set to True in production with HTTPS
  - `JWT_COOKIE_CSRF_PROTECT = False` - Disabled for dev (enable in production)
  - `JWT_COOKIE_SAMESITE = 'Lax'` - Prevent CSRF attacks
  - `JWT_ACCESS_COOKIE_PATH = '/'` - Cookie available for all paths

#### 2. Auth Controller (`api/controllers/auth_controller.py`)
- **Login endpoint** (`/auth/login`):
  - Now uses `set_access_cookies()` to set JWT in httponly cookie
  - Returns only user info (role, user_id, name) - NO token in response body
- **Logout endpoint** (`/auth/logout`):
  - Now uses `unset_jwt_cookies()` to clear the cookie
  - Properly clears authentication state

#### 3. Dependencies (`setup.py`)
- Added `flask-cors` to dependencies list

### Frontend Changes (`frontend/src/util/`)

#### 1. Login Utilities (`login.ts`)
- `getToken()`: Now returns `null` (tokens are in httponly cookies, not accessible to JS)
- `logout()`: Now calls backend `/auth/logout` endpoint with `credentials: 'include'`
- Added comments explaining the cookie-based approach

#### 2. API Utilities (`api.ts`)
- **All fetch requests** now include `credentials: 'include'` option
  - This ensures cookies are sent with requests
- **Removed all `Authorization: Bearer ${token}` headers**
  - No longer needed - JWT is automatically sent via cookie
- `tryLogin()`: Updated to store user info (but not token) in localStorage

### Test Updates (`flask_backend/tests/`)

#### 1. Login Tests (`test_login.py`)
- Updated `test_login()` to verify cookie is set instead of checking for access_token in response
- Updated `test_logout()` to work with cookies (test_client handles cookies automatically)

#### 2. User Tests (`test_user.py`)
- Removed all manual token extraction and Authorization header passing
- Test client automatically handles cookies between requests

## Security Benefits

1. **XSS Protection**: HTTPOnly cookies cannot be accessed by JavaScript, preventing token theft via XSS attacks
2. **Automatic Cookie Management**: Browser handles cookie storage and sending automatically
3. **CSRF Protection**: SameSite=Lax provides basic CSRF protection
4. **Secure Flag**: Can be enabled in production to ensure cookies only sent over HTTPS

## Production Checklist

Before deploying to production, update these settings in `flask_backend/api/__init__.py`:

```python
JWT_COOKIE_SECURE = True  # Require HTTPS
JWT_COOKIE_CSRF_PROTECT = True  # Enable CSRF protection
JWT_COOKIE_SAMESITE = 'Strict'  # Stricter CSRF protection
SECRET_KEY = os.environ.get('SECRET_KEY')  # Use env var
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')  # Use env var
```

Also update CORS origins to match your production domain:
```python
CORS(app, 
     origins=['https://your-production-domain.com'],
     supports_credentials=True)
```

## Testing

All tests pass:
- ✅ `test_login.py` - 5/5 tests passing
- ✅ `test_user.py` - 6/6 tests passing

Run tests with:
```bash
cd flask_backend
source venv/bin/activate
pytest tests/test_login.py tests/test_user.py -v
```

## Compatibility Notes

- Frontend and backend must be running for auth to work (cookies require proper CORS setup)
- In development, backend runs on port 5000, frontend on 3000/5173
- Cookies are automatically included in all requests with `credentials: 'include'`
- Test client (`flask.testing.FlaskClient`) automatically handles cookies across requests

## Migration from Old System

If you have existing users with tokens stored in localStorage:
1. They will need to log in again
2. Old tokens will be ignored (backend expects cookies now)
3. Frontend will automatically switch to cookie-based auth on next login
