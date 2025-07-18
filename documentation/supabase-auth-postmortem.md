# SUPABASE AUTHENTICATION ISSUE - POST MORTEM

---

## PROBLEM SUMMARY

User was getting "Database error saving new user" and "No API key found in request" errors when trying to create accounts in a Next.js app with Supabase authentication.

---

## TIMELINE OF ISSUES & ERRORS

### 1. INITIAL ERROR: "supabaseKey is required"
- **Root Cause**: Environment variables not being loaded properly on client side
- **Attempted Fix**: Updated auth configuration to handle missing env vars gracefully
- **Result**: Partial success - server-side worked, client-side still had issues

### 2. ENVIRONMENT VARIABLE FORMAT ISSUE
- **Root Cause**: `.env.local` file had line breaks in the middle of API key values
- **Error**: Keys were truncated, causing "Invalid API key" errors
- **Attempted Fix**: Recreated `.env.local` file with proper formatting
- **Result**: Environment variables started loading correctly

### 3. MULTIPLE SUPABASE CLIENT CONFIGURATIONS
- **Root Cause**: Multiple files creating Supabase clients with different configurations
- **Files affected**: `src/lib/auth.ts`, `src/lib/supabase.ts`, `src/lib/supabaseClient.ts`
- **Attempted Fix**: Standardized all client configurations to use same pattern
- **Result**: Eliminated client-side API key issues

### 4. AUTH HELPERS PACKAGE CONFLICTS
- **Root Cause**: Some API routes using `@supabase/auth-helpers-nextjs` while others used direct client
- **Error**: "No API key found in request" from auth helpers
- **Attempted Fix**: Updated all API routes to use standard Supabase client with service role key
- **Result**: Server-side authentication started working

### 5. MISSING DATABASE MIGRATION
- **Root Cause**: Migration file existed but was never executed in Supabase
- **Error**: "ERROR: relation 'profiles' does not exist (SQLSTATE 42P01)"
- **Attempted Fix**: Ran the complete migration SQL in Supabase dashboard
- **Result**: Tables were created, but trigger still failed

### 6. TRIGGER FUNCTION SCHEMA ISSUE
- **Root Cause**: Trigger function running in auth schema couldn't find profiles table in public schema
- **Error**: "ERROR: relation 'profiles' does not exist" (even though table existed)
- **Attempted Fix**: Added explicit schema references (`public.profiles`, `public.customers`)
- **Result**: SUCCESS - Authentication finally worked

---

## DETAILED ERROR ANALYSIS

### PRIMARY ERROR: "ERROR: relation 'profiles' does not exist (SQLSTATE 42P01)"
- This error appeared in Supabase Auth logs during user signup
- The trigger function was trying to insert into profiles table but couldn't find it
- Even though the table existed, the function was looking in the wrong schema context

### SECONDARY ERRORS:
- "No API key found in request" - Caused by auth helpers package issues
- "Invalid API key" - Caused by truncated environment variables
- "supabaseKey is required" - Caused by missing environment variables

---

## ATTEMPTS THAT DIDN'T WORK

1. Updating environment variable handling with placeholder values
2. Fixing multiple Supabase client configurations
3. Updating API routes to use service role keys
4. Running the migration (tables were created but trigger still failed)
5. Checking RLS policies (they weren't the issue)
6. Various debugging routes to test database connectivity

---

## WHAT FINALLY WORKED

The final fix was simple but critical:

```sql
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with explicit schema references
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'customer');
    
    INSERT INTO public.customers (id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**KEY INSIGHT**: Adding `public.` before table names in the trigger function.

---

## ROOT CAUSE ANALYSIS

The fundamental issue was a **schema context problem**:
- The trigger function runs in the context of the `auth` schema
- The `profiles` and `customers` tables exist in the `public` schema
- Without explicit schema qualification, PostgreSQL couldn't find the tables
- This caused the "relation does not exist" error even though the tables were there

---

## LESSONS LEARNED

1. **Schema Context Matters**: Always use explicit schema references in database functions
2. **Environment Variables**: Check for line breaks and formatting issues
3. **Multiple Configurations**: Standardize on one approach across the codebase
4. **Migration Verification**: Don't assume migrations ran successfully
5. **Error Messages**: "relation does not exist" can mean schema issues, not missing tables
6. **Debugging Approach**: Start with the most basic tests and work up

---

## PREVENTION STRATEGIES

1. **Use explicit schema references** in all database functions
2. **Validate environment variables** on startup
3. **Standardize Supabase client usage** across the project
4. **Test migrations** immediately after running them
5. **Use comprehensive error logging** to catch issues early

---

## FINAL STATE

After all fixes:

✅ Environment variables load correctly  
✅ Supabase client configurations are standardized  
✅ API routes use proper authentication  
✅ Database tables exist with correct structure  
✅ Trigger function works with explicit schema references  
✅ User signup creates profiles and customers automatically  
✅ Authentication flow works end-to-end

The solution was ultimately simple (adding `public.` schema references) but required systematic debugging to identify the root cause among multiple potential issues. 