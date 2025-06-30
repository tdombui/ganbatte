# Authentication System Documentation

## Overview

This application implements a comprehensive authentication system using Supabase Auth with persistent sessions, role-based access control (RBAC), and proper session management for a PWA (Progressive Web App).

## Key Features

### 🔐 Persistent Authentication
- **Session Persistence**: Sessions are automatically persisted across browser sessions using localStorage
- **Auto-refresh**: Sessions are automatically refreshed every 10 minutes to maintain validity
- **Cross-tab Sync**: Authentication state is synchronized across all browser tabs
- **Offline Support**: Basic authentication state is maintained even when offline

### 👥 Role-Based Access Control (RBAC)
The system supports three user roles:

1. **Customer** (`customer`)
   - Can access: `/chat`, `/profile`, `/job/[slug]`
   - Can request deliveries and view their own jobs
   - Has customer-specific profile fields (billing address, preferences)

2. **Staff** (`staff`)
   - Can access: All customer routes + `/staff/jobs`, `/staff/job/[slug]`
   - Can manage and view all jobs
   - Has staff-specific profile fields (employee ID, department, permissions)

3. **Admin** (`admin`)
   - Can access: All staff routes + `/admin/staff`
   - Can manage staff accounts and system settings
   - Has full system access

### 🛡️ Route Protection
- **Middleware Protection**: Server-side route protection using Next.js middleware
- **Client-side Guards**: Additional client-side authentication checks
- **Automatic Redirects**: Users are redirected to login with return URL preservation

## Architecture

### Authentication Flow

```
1. User visits protected route
2. Middleware checks authentication
3. If not authenticated → redirect to /auth?redirectTo=<original-url>
4. User logs in successfully
5. Redirect to original destination
6. Session persists across browser sessions
```

### Session Management

The session management uses a multi-layered approach:

1. **Supabase Auth**: Handles JWT tokens and session validation
2. **localStorage**: Stores session data for persistence
3. **AuthProvider**: React context for global state management
4. **useAuth Hook**: Component-level authentication state
5. **Middleware**: Server-side route protection

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   └── page.tsx              # Login/Register page
│   ├── profile/
│   │   └── page.tsx              # User profile management
│   ├── components/
│   │   └── nav/
│   │       └── Navbar.tsx        # Navigation with auth-aware UI
│   ├── providers.tsx             # AuthProvider context
│   └── layout.tsx                # Root layout with AuthProvider
├── hooks/
│   └── useAuth.ts                # Authentication hook
├── lib/
│   └── auth.ts                   # Supabase auth utilities
└── middleware.ts                 # Route protection middleware
```

## Implementation Details

### Session Persistence Configuration

```typescript
// src/lib/auth.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // Auto-refresh sessions
    persistSession: true,          // Persist across sessions
    detectSessionInUrl: true,      // Handle auth callbacks
    storage: window.localStorage,  // Use localStorage
    storageKey: 'ganbatte-auth-token',
    flowType: 'pkce',             // Secure auth flow
  },
})
```

### Role-Based Navigation

The navbar automatically adapts based on user role:

```typescript
// src/app/components/nav/Navbar.tsx
const { user, loading, logout, isAuthenticated } = useAuth()
const isStaffUser = user?.role === 'staff' || user?.role === 'admin'
const isAdminUser = user?.role === 'admin'

// Conditional rendering based on role
{!loading && isStaffUser && (
  <Link href="/staff/jobs">Jobs</Link>
)}
{!loading && isAdminUser && (
  <Link href="/admin/staff">Staff Management</Link>
)}
```

### Middleware Route Protection

```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  // Check role-based access
  if (isStaffRoute && profile?.role !== 'staff' && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isAdminRoute && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
```

## Usage Examples

### Checking Authentication Status

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, isAuthenticated, isCustomer, isStaff, isAdmin } = useAuth()

  if (loading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      Welcome, {user?.full_name}!
      {isCustomer && <CustomerDashboard />}
      {isStaff && <StaffDashboard />}
      {isAdmin && <AdminDashboard />}
    </div>
  )
}
```

### Protected Routes

```typescript
// Automatically protected by middleware
// src/app/staff/jobs/page.tsx
export default function StaffJobsPage() {
  const { isStaff } = useAuth()
  
  if (!isStaff) {
    return <div>Access denied</div>
  }

  return <StaffJobsList />
}
```

### Profile Management

```typescript
// src/app/profile/page.tsx
export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirectTo=/profile')
    }
  }, [isAuthenticated])

  return <ProfileForm user={user} />
}
```

## Security Features

### Session Security
- **JWT Tokens**: Secure token-based authentication
- **PKCE Flow**: Prevents authorization code interception
- **Auto-refresh**: Tokens are automatically refreshed
- **Secure Storage**: Tokens stored in localStorage with proper security headers

### Route Security
- **Server-side Protection**: Middleware validates every request
- **Role Validation**: Database-level role checks
- **Redirect Protection**: Prevents unauthorized access to protected routes

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **User Isolation**: Users can only access their own data
- **Role-based Queries**: Database queries respect user roles

## Best Practices

### For Developers

1. **Always check authentication state** before rendering protected content
2. **Use the useAuth hook** for consistent authentication state
3. **Implement proper loading states** while authentication is being determined
4. **Handle authentication errors** gracefully
5. **Use middleware** for server-side route protection

### For Users

1. **Sessions persist** across browser sessions - no need to log in repeatedly
2. **Automatic redirects** to intended destination after login
3. **Role-based access** - users only see features they have permission for
4. **Profile management** - users can update their information
5. **Secure logout** - properly clears all session data

## Troubleshooting

### Common Issues

1. **Session not persisting**
   - Check if localStorage is enabled
   - Verify Supabase configuration
   - Check browser console for errors

2. **Role-based access not working**
   - Verify user has correct role in database
   - Check middleware configuration
   - Ensure proper role checks in components

3. **Redirect loops**
   - Check middleware matcher configuration
   - Verify redirect URL handling
   - Check authentication state consistency

### Debug Mode

Enable debug logging by checking browser console for messages prefixed with `🔍`:

```
🔍 AuthProvider: Starting auth check...
🔍 Middleware: Processing path: /staff/jobs User authenticated: true
🔍 useAuth: Auth state changed: SIGNED_IN user-id
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

The authentication system relies on these database tables:

- `profiles`: User profile information and roles
- `customers`: Customer-specific data
- `staff`: Staff-specific data
- `jobs`: Job data with user associations

See `supabase/types.ts` for complete type definitions. 