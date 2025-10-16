# Admin RLS Fix - Instructions

## Problem

The infinite recursion error occurred because RLS policies were querying the `profiles` table within the policy itself, creating a loop.

## Solution

We've implemented a two-part solution:

### 1. Simplified RLS Policies

Run the SQL script in `update-rls-for-admin.sql` in your Supabase SQL Editor to create simple RLS policies that avoid recursion.

### 2. Service Role Key for Admin Operations

Admin API routes now use the Supabase **Service Role Key** which bypasses RLS entirely.

## Setup Steps

### Step 1: Update RLS Policies

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `update-rls-for-admin.sql`
4. Click **Run**

### Step 2: Add Service Role Key to Environment

1. Go to your Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (⚠️ Keep this secret!)
3. Add it to your `.env.local` file:

```bash
# Your existing variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Add this new variable
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

4. Restart your development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 3: Test

1. Log in as an admin user
2. Navigate to `/admin`
3. You should now see all users and bookings

## What Changed

### RLS Policies

- **profiles**: Users can only view their own profile (simple, no recursion)
- **bookings**: Everyone can view all bookings (for calendar display)
- Admin operations bypass RLS using the service role key

### Admin API Routes

All admin API routes now use `createAdminClient()` which:

- Uses the service role key
- Bypasses all RLS policies
- Only accessible to authenticated admin users

Modified files:

- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/role/route.ts`
- `src/app/api/admin/bookings/route.ts`
- `src/app/api/admin/bookings/[id]/route.ts`

## Security Notes

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` must:

- Never be committed to version control
- Never be exposed to the client-side
- Only be used in server-side API routes
- Be kept secret at all times

This key has full database access and bypasses all security rules!

## Cleanup

After confirming everything works, you can delete these temporary files:

- `update-rls-for-admin.sql` (after running it in Supabase)
- `ADMIN_RLS_FIX.md` (this file)
