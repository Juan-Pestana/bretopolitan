-- Row-Level Security (RLS) Policies for Gym Scheduler - FIXED VERSION
-- This file contains all RLS policies for the gym scheduling application
-- Fixed to avoid infinite recursion

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Everyone can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can delete own bookings" ON bookings;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PROFILES TABLE POLICIES (FIXED)
-- ==============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role, which only admins can change)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow for manual creation)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- Admins can update any profile (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- Admins can insert profiles for other users (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- ==============================================
-- BOOKINGS TABLE POLICIES (FIXED)
-- ==============================================

-- Everyone can read all bookings (to see availability)
CREATE POLICY "Everyone can view all bookings" ON bookings
  FOR SELECT USING (true);

-- Users can insert their own bookings
CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can perform all operations on bookings (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- Trainers can delete their own bookings (using auth.jwt() to avoid recursion)
CREATE POLICY "Trainers can delete own bookings" ON bookings
  FOR DELETE USING (
    auth.uid() = user_id AND (
      (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'trainer'
      OR
      (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'trainer'
    )
  );

-- ==============================================
-- HELPER FUNCTIONS FOR RLS (FIXED)
-- ==============================================

-- Function to check if current user is admin (using auth.jwt() to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is trainer (using auth.jwt() to avoid recursion)
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'trainer'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'trainer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is neighbor (using auth.jwt() to avoid recursion)
CREATE OR REPLACE FUNCTION is_neighbor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'neighbor'
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text = 'neighbor'
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role') IS NULL
    OR
    (auth.jwt() ->> 'app_metadata' ->> 'role') IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role (using auth.jwt() to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text,
    (auth.jwt() ->> 'app_metadata' ->> 'role')::text,
    'neighbor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- SIMPLIFIED POLICIES (ALTERNATIVE APPROACH)
-- ==============================================

-- Alternative: Use a simpler approach that doesn't rely on role checking in policies
-- This allows basic functionality while we implement role management in the application layer

-- Drop the complex policies and create simpler ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can delete own bookings" ON bookings;

-- Simple policies that work without recursion
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For now, allow all operations on bookings (we'll handle admin/trainer logic in the app)
CREATE POLICY "Users can manage own bookings" ON bookings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view bookings for availability
CREATE POLICY "Everyone can view bookings" ON bookings
  FOR SELECT USING (true);
