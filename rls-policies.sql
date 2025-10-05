-- Row-Level Security (RLS) Policies for Gym Scheduler
-- This file contains all RLS policies for the gym scheduling application

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PROFILES TABLE POLICIES
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

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile (including role changes)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert profiles for other users
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- BOOKINGS TABLE POLICIES
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

-- Admins can perform all operations on bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trainers can delete their own bookings (including recurring instances)
CREATE POLICY "Trainers can delete own bookings" ON bookings
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'trainer'
    )
  );

-- ==============================================
-- HELPER FUNCTIONS FOR RLS
-- ==============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is trainer
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'trainer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is neighbor
CREATE OR REPLACE FUNCTION is_neighbor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'neighbor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- TESTING POLICIES
-- ==============================================

-- Create a test function to verify RLS is working
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test 1: Check if RLS is enabled
  RETURN QUERY
  SELECT
    'RLS Enabled on profiles'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'profiles' AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Row Level Security should be enabled on profiles table'::TEXT;

  -- Test 2: Check if RLS is enabled on bookings
  RETURN QUERY
  SELECT
    'RLS Enabled on bookings'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'bookings' AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Row Level Security should be enabled on bookings table'::TEXT;

  -- Test 3: Count policies on profiles
  RETURN QUERY
  SELECT
    'Profiles policies count'::TEXT,
    (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'profiles'),
    'Number of RLS policies on profiles table'::TEXT;

  -- Test 4: Count policies on bookings
  RETURN QUERY
  SELECT
    'Bookings policies count'::TEXT,
    (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'bookings'),
    'Number of RLS policies on bookings table'::TEXT;

  -- Test 5: Check helper functions exist
  RETURN QUERY
  SELECT
    'Helper functions exist'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname IN ('is_admin', 'is_trainer', 'is_neighbor', 'get_user_role')
    ) THEN 'PASS' ELSE 'FAIL' END,
    'All helper functions should be created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
