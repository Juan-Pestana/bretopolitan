-- Clear ALL RLS policies from both tables
-- Run this first, then run the rls-policies-fixed.sql

-- Disable RLS temporarily to drop all policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Now you can run the rls-policies-fixed.sql file
