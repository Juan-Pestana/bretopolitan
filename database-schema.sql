-- Gym Scheduler Database Schema
-- This file contains the complete database schema for the gym scheduling application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flat_number TEXT,
  role TEXT CHECK (role IN ('neighbor', 'trainer', 'admin')) DEFAULT 'neighbor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_parent_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_time_slots CHECK (
    EXTRACT(MINUTE FROM start_time) IN (0, 30) AND
    EXTRACT(MINUTE FROM end_time) IN (0, 30)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_parent ON bookings(recurring_parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_flat_number ON profiles(flat_number);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, flat_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    'TBD', -- Will be updated when user completes profile
    NULL,
    'neighbor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing (optional)
-- Note: This will only work after RLS is set up in Task 1.4

-- Sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO profiles (id, email, flat_number, role) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'ADMIN', 'admin');

-- Sample trainer user
-- INSERT INTO profiles (id, email, flat_number, role) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'trainer@example.com', '101', 'trainer');

-- Sample neighbor user
-- INSERT INTO profiles (id, email, flat_number, role) VALUES
-- ('00000000-0000-0000-0000-000000000003', 'neighbor@example.com', '102', 'neighbor');
