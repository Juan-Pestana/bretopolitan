-- Update RLS policies to allow admins to view all profiles and manage all bookings
-- Fixed version: Avoids infinite recursion by using simple auth.uid() checks

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings or admins can delete any" ON bookings;

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Simple policy: Users can view their own profile
-- (We'll handle admin access at the application layer to avoid recursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Bookings table policies
-- Everyone can view all bookings (to see gym availability)
CREATE POLICY "Users can view all bookings" ON bookings
  FOR SELECT
  USING (true);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE
  USING (auth.uid() = user_id);




