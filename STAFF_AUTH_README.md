# Staff Authentication & Authorization System

## Overview

This system provides role-based access control for staff and admin users in the Ganbatte delivery app. It includes:

- **Middleware protection** for staff routes
- **Role-based authentication** (customer, staff, admin)
- **Admin interface** for staff management
- **Staff-specific hooks** and utilities

## Database Structure

### Tables

1. **profiles** - User profiles with roles
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `full_name` (TEXT)
   - `role` (TEXT: 'customer', 'staff', 'admin')
   - `created_at`, `updated_at`

2. **staff** - Staff-specific data
   - `id` (UUID, references profiles)
   - `employee_id` (TEXT)
   - `department` (TEXT)
   - `permissions` (JSONB)
   - `is_active` (BOOLEAN)
   - `hire_date` (DATE)

3. **customers** - Customer-specific data
   - `id` (UUID, references profiles)
   - `billing_address` (TEXT)
   - `preferred_payment_method` (TEXT)
   - `credit_limit` (DECIMAL)
   - `is_active` (BOOLEAN)

## Role Hierarchy

- **Customer** (default): Can create and view their own jobs
- **Staff**: Can view and manage all jobs, upload photos, update status
- **Admin**: All staff permissions + can manage staff accounts

## Key Components

### 1. Middleware (`src/middleware.ts`)
- Protects all `/staff/*` and `/api/staff/*` routes
- Checks authentication and staff role
- Redirects unauthorized users

### 2. Staff Auth Hook (`src/hooks/useStaffAuth.ts`)
```typescript
const { user, isStaff, isAdmin, loading, hasPermission } = useStaffAuth()
```

### 3. Admin Interface (`/admin/staff`)
- List all staff members
- Add new staff members
- Edit staff details
- Remove staff members

### 4. API Endpoints
- `GET /api/staff/check-permissions` - Check current user's staff status
- `GET /api/admin/staff` - List all staff (admin only)
- `POST /api/admin/staff` - Create new staff (admin only)
- `PUT /api/admin/staff/[id]` - Update staff (admin only)
- `DELETE /api/admin/staff/[id]` - Remove staff (admin only)

## Setting Up Staff Access

### 1. Create First Admin

Run the admin creation script:
```bash
node scripts/create-admin.js
```

This will:
- Create a new user account
- Set the role to 'admin'
- Create a staff record
- Allow access to admin panel

### 2. Create Additional Staff

1. Log in as admin
2. Go to `/admin/staff`
3. Click "Add Staff Member"
4. Fill in details (email, name, role, etc.)
5. Staff member receives temporary password
6. They can log in and change their password

### 3. Staff Account Management

**Adding Staff:**
- Admin creates account with temporary password
- Staff member logs in and changes password
- Account is automatically activated

**Removing Staff:**
- Admin can "remove" staff (sets role back to customer)
- Staff record is deleted
- User account remains but loses staff access

**Updating Staff:**
- Change role (staff/admin)
- Update employee details
- Activate/deactivate accounts

## Security Features

### Row Level Security (RLS)
- Users can only see their own data
- Staff can see all jobs and customers
- Admins can see all staff data

### Route Protection
- Middleware checks authentication
- Role-based access control
- Automatic redirects for unauthorized access

### API Security
- All staff/admin endpoints require authentication
- Role verification on each request
- Input validation and sanitization

## Usage Examples

### Protecting a Staff Page
```typescript
export default function StaffPage() {
  const { isStaff, loading } = useStaffAuth()
  
  if (loading) return <div>Loading...</div>
  if (!isStaff) return <div>Access denied</div>
  
  return <div>Staff content</div>
}
```

### Checking Permissions
```typescript
const { hasPermission } = useStaffAuth()

if (hasPermission('manage_jobs')) {
  // Show job management features
}
```

### Admin-Only Features
```typescript
const { isAdmin } = useStaffAuth()

{isAdmin && (
  <Link href="/admin/staff">Staff Management</Link>
)}
```

## Environment Variables

Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Future Enhancements

1. **Granular Permissions**: Use the `permissions` JSONB field for fine-grained access control
2. **Email Notifications**: Send welcome emails to new staff members
3. **Audit Logging**: Track staff actions and changes
4. **Department Management**: Organize staff by departments
5. **Shift Management**: Track staff availability and schedules
6. **Performance Metrics**: Track staff performance and job completion rates

## Troubleshooting

### Common Issues

1. **"Access denied" errors**
   - Check if user has correct role in profiles table
   - Verify staff record exists and is_active = true

2. **Middleware not working**
   - Ensure environment variables are set
   - Check that routes match the matcher pattern

3. **Admin creation fails**
   - Verify SUPABASE_SERVICE_ROLE_KEY is set
   - Check database permissions and RLS policies

4. **Staff can't access features**
   - Verify useStaffAuth hook is being used
   - Check API endpoint authentication logic 