# Test API Endpoints

This folder contains test and debugging API endpoints for development purposes.

## Test Endpoints

### Core Testing
- `test-parse/` - Basic echo test endpoint for API connectivity
- `test-auth/` - Authentication testing endpoint
- `test-auth-trigger/` - Test auth trigger functionality
- `test-job-access/` - Test job access permissions
- `test-jobs-table/` - Test database table access
- `test-rls/` - Test Row Level Security
- `test-tables/` - Test database table existence
- `test-user-creation/` - Test user creation flow

### Debugging
- `debug-all-jobs/` - Debug endpoint to list all jobs (bypasses RLS)
- `debug-env/` - Debug environment variables
- `debug-trigger/` - Debug database triggers

### Development Tools
- `parseJob-simple/` - Mock job parsing endpoint (no AI calls)
- `health/` - Health check endpoint
- `check-migration/` - Check database migration status
- `fix-rls/` - Fix Row Level Security issues

## Usage

These endpoints are for development and debugging only. They should not be used in production.

### Accessing Test Endpoints

Test endpoints are now accessible at:
- `/api/test/[endpoint-name]`

For example:
- `/api/test/health` (instead of `/api/health`)
- `/api/test/test-parse` (instead of `/api/test-parse`)

## Notes

- All endpoints maintain their original functionality
- URLs have been updated to include the `/test/` prefix
- These endpoints are useful for debugging and development testing 