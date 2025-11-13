# Quick Reference: HTTPOnly Cookie Authentication

## ✅ What Changed

**Before:** JWT tokens were sent in JSON response and stored in localStorage  
**After:** JWT tokens are sent in HTTPOnly cookies (more secure)

## 🔐 Security Improvement

- **HTTPOnly cookies** cannot be accessed by JavaScript
- Protects against XSS (Cross-Site Scripting) attacks
- Tokens are automatically included in requests by the browser

## 💻 Developer Impact

### Backend (Flask)
- Login endpoint returns user info only (no token in JSON)
- JWT is automatically set as an HTTPOnly cookie
- No changes needed to protected endpoints - they work the same way

### Frontend (React)
- No manual token management needed
- Add `credentials: 'include'` to all fetch requests
- Remove `Authorization: Bearer` headers
- Browser handles cookies automatically

### Testing
- Test client automatically manages cookies
- No need to manually pass tokens in tests
- All 11 tests passing ✅

## 🚀 Usage Examples

### Login (Frontend)
```typescript
// OLD WAY (don't use)
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ email, password })
});
const { access_token } = await response.json();
localStorage.setItem('token', access_token);

// NEW WAY (current)
const response = await fetch('/auth/login', {
  method: 'POST',
  credentials: 'include',  // Important!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { role, name, user_id } = await response.json();
// Token is automatically stored in cookie
```

### Protected Requests (Frontend)
```typescript
// OLD WAY (don't use)
fetch('/user/', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// NEW WAY (current)
fetch('/user/', {
  credentials: 'include'  // That's it!
});
```

### Tests (Backend)
```python
# OLD WAY (don't use)
login_response = test_client.post('/auth/login', ...)
token = login_response.json['access_token']
test_client.get('/user/', headers={'Authorization': f'Bearer {token}'})

# NEW WAY (current)
test_client.post('/auth/login', ...)  # Cookie set automatically
test_client.get('/user/')  # Cookie sent automatically
```

## 📋 Checklist for New Endpoints

When creating new protected endpoints:

- [ ] **Backend**: Use `@jwt_required()` decorator (no changes needed)
- [ ] **Frontend**: Include `credentials: 'include'` in fetch options
- [ ] **Frontend**: Remove any `Authorization` headers
- [ ] **Tests**: Don't manually pass tokens - test_client handles it

## ⚠️ Important Notes

1. **CORS must be configured** properly for cookies to work across origins
2. **credentials: 'include'** must be in every authenticated request
3. **Production**: Set `JWT_COOKIE_SECURE=True` to require HTTPS
4. **Users must re-login** after this update (old localStorage tokens won't work)

## 🔍 Debugging Tips

If auth isn't working:

1. Check browser DevTools → Network → Look for `Set-Cookie` header in login response
2. Verify `Cookie` header is sent in subsequent requests
3. Ensure `credentials: 'include'` is present in fetch options
4. Check CORS configuration allows credentials
5. Verify frontend and backend URLs match CORS whitelist

## 📚 More Info

See `docs/HTTPONLY_COOKIES_MIGRATION.md` for full technical details.
