# Production Deployment Guide

This guide covers the security and configuration requirements for deploying the Peer Evaluation App to production.

## ⚠️ Critical Security Requirements

### 1. JWT Cookie Security Configuration

The application uses HTTPOnly cookies for JWT token storage. The following environment variables **MUST** be configured in production:

#### Required Environment Variables

```bash
# Enable production mode - this automatically enables secure JWT settings
FLASK_ENV=production
# OR
PRODUCTION=true

# CRITICAL: Set a strong, random secret key (use a cryptographically secure random string)
SECRET_KEY=<your-secure-random-secret-key-here>

# CRITICAL: Set a strong JWT secret key (different from SECRET_KEY)
JWT_SECRET_KEY=<your-secure-random-jwt-secret-key>

# Database connection string for production
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Set JWT cookie domain if deploying across subdomains
JWT_COOKIE_DOMAIN=.yourdomain.com
```

#### How Production Mode Affects JWT Settings

When `FLASK_ENV=production` or `PRODUCTION=true` is set, the application automatically configures:

| Setting | Development | Production | Purpose |
|---------|-------------|------------|---------|
| `JWT_COOKIE_SECURE` | `False` | `True` | Requires HTTPS for cookie transmission |
| `JWT_COOKIE_CSRF_PROTECT` | `False` | `True` | Enables CSRF token validation |
| `JWT_COOKIE_SAMESITE` | `Lax` | `Strict` | Maximum protection against CSRF attacks |

### 2. HTTPS Requirement

**Production deployments MUST use HTTPS.** The `JWT_COOKIE_SECURE=True` setting in production mode ensures cookies are only transmitted over encrypted connections.

- Configure your web server (nginx, Apache) or load balancer to handle SSL/TLS
- Obtain SSL certificates from Let's Encrypt or your certificate authority
- Ensure all HTTP traffic is redirected to HTTPS

### 3. CSRF Protection

With `JWT_COOKIE_CSRF_PROTECT=True` in production, the application will:

- Generate CSRF tokens and include them in cookies
- Require CSRF tokens in request headers for state-changing operations (POST, PUT, DELETE)
- Reject requests without valid CSRF tokens

**Frontend Integration Required:**

Your frontend must be updated to:

1. Read the CSRF token from the cookie
2. Include it in the `X-CSRF-TOKEN` header for non-GET requests

Example frontend code (React):

```typescript
// Get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_access_token=([^;]+)/);
  return match ? match[1] : null;
}

// Include in API requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': getCsrfToken() || ''
  },
  credentials: 'include',
  body: JSON.stringify(data)
});
```

## Environment Setup

### Generating Secret Keys

Use Python to generate cryptographically secure random keys:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run this command twice to generate both `SECRET_KEY` and `JWT_SECRET_KEY`.

### Example Production Configuration

```bash
# .env file for production (never commit this file!)
FLASK_ENV=production
SECRET_KEY=<generated-secret-key>
JWT_SECRET_KEY=<generated-jwt-secret-key>
DATABASE_URL=postgresql://peereval:password@db.example.com:5432/peerevaldb
JWT_COOKIE_DOMAIN=.example.com
```

## Deployment Checklist

- [ ] Set `FLASK_ENV=production` or `PRODUCTION=true`
- [ ] Set strong `SECRET_KEY` (32+ random characters)
- [ ] Set strong `JWT_SECRET_KEY` (32+ random characters, different from SECRET_KEY)
- [ ] Configure production database with `DATABASE_URL`
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Update frontend to handle CSRF tokens
- [ ] Test JWT authentication flow in production
- [ ] Configure CORS origins for production domains
- [ ] Set up proper logging and monitoring
- [ ] Configure backup strategy for database
- [ ] Review and restrict CORS allowed origins in `flask_backend/api/__init__.py`

## CORS Configuration

Update the CORS configuration in `flask_backend/api/__init__.py` to include your production domains:

```python
CORS(app, 
     origins=[
         'http://localhost:3000',      # Development
         'http://localhost:5173',       # Vite dev server
         'https://yourdomain.com',      # Production frontend
         'https://www.yourdomain.com'   # Production with www
     ],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-CSRF-TOKEN'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
```

## Security Best Practices

1. **Never commit secrets**: Use environment variables or secret management services
2. **Rotate keys regularly**: Plan for periodic rotation of `SECRET_KEY` and `JWT_SECRET_KEY`
3. **Use strong passwords**: Enforce password complexity for user accounts
4. **Monitor authentication failures**: Set up alerts for suspicious login attempts
5. **Keep dependencies updated**: Regularly update Python packages for security patches
6. **Enable database encryption**: Use encrypted connections to your database
7. **Implement rate limiting**: Protect against brute force attacks
8. **Regular security audits**: Review logs and conduct penetration testing

## Troubleshooting

### Cookie Not Being Set

- Verify HTTPS is enabled
- Check that `JWT_COOKIE_DOMAIN` matches your domain
- Ensure CORS is configured with `credentials: true`

### CSRF Token Validation Failing

- Verify frontend is reading and sending the CSRF token correctly
- Check that `X-CSRF-TOKEN` header is included in CORS `allow_headers`
- Ensure the token is being read from the correct cookie name

### Authentication Failing After Deployment

- Verify `SECRET_KEY` and `JWT_SECRET_KEY` are set
- Check that the database connection is working
- Review server logs for specific error messages

## Additional Resources

- [Flask-JWT-Extended Documentation](https://flask-jwt-extended.readthedocs.io/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/latest/security/)
