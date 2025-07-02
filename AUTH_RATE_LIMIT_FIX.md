# Authentication Rate Limiting Fix

## Problem
You were experiencing Supabase authentication rate limiting errors in development mode, causing repeated `AuthApiError: Request rate limit reached` and `Invalid Refresh Token: Refresh Token Not Found` errors.

## Root Cause
The middleware was calling `supabase.auth.getSession()` on every request, including static assets and non-protected routes, which quickly exceeded Supabase's rate limits.

## Fixes Applied

### 1. Updated Middleware (`src/middleware.ts`)
- **Selective Auth Checks**: Only check authentication for protected routes (`/staff`, `/admin`, `/chat`, `/jobs`, `/profile`) and the auth page
- **Rate Limiting Protection**: Added client-side rate limiting to prevent excessive requests
- **Better Error Handling**: Gracefully handle rate limit errors without redirecting
- **Skip Static Assets**: Don't run auth checks on static files and API routes

### 2. Created Cookie Clearing Script (`scripts/clear-auth-cookies.js`)
- Generates a web page to clear corrupted authentication cookies
- Helps resolve refresh token issues

### 3. Development Configuration (`src/lib/supabase/dev-config.ts`)
- Centralized configuration for rate limiting and retry logic
- Helper functions for exponential backoff and error handling

## How to Use the Fixes

### Immediate Steps
1. **Clear Corrupted Cookies**:
   ```bash
   node scripts/clear-auth-cookies.js
   ```
   Then visit `http://localhost:3000/clear-cookies.html` in your browser

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### If Issues Persist
1. **Clear Browser Cache**: Clear all browser data for localhost
2. **Check Supabase Settings**: Verify your Supabase project configuration
3. **Check Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

## Key Changes in Middleware

### Before
```typescript
// Checked auth on EVERY request
const { data: { session }, error } = await supabase.auth.getSession()
```

### After
```typescript
// Only check auth for protected routes
const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
const isAuthPage = pathname === '/auth'

if (!isProtectedRoute && !isAuthPage) {
  return response // Skip auth check
}
```

## Rate Limiting Strategy

The middleware now implements:
- **Client-side rate limiting**: Max 10 requests per minute per IP
- **Exponential backoff**: Retry failed requests with increasing delays
- **Graceful degradation**: Continue without auth check when rate limited

## Monitoring

The middleware logs will now show:
- `🔍 Middleware: Rate limited for IP: [ip]` - When rate limiting is active
- `🔍 Middleware: Rate limit detected, continuing without auth check` - When Supabase rate limits are hit
- `🔍 Middleware: Non-critical error, continuing without auth check` - When network errors occur

## Prevention

To prevent future rate limiting:
1. **Use the updated middleware** - It's more efficient
2. **Implement caching** - Cache user data where appropriate
3. **Monitor usage** - Watch for patterns that trigger rate limits
4. **Use development config** - The new config helps manage requests

## Testing

After applying fixes:
1. Visit your app at `http://localhost:3000`
2. Try accessing protected routes (should redirect to auth if not logged in)
3. Log in and verify you can access protected routes
4. Check the terminal - you should see fewer auth errors

The rate limiting errors should be significantly reduced or eliminated entirely. 