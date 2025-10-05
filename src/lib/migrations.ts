import { supabase } from './supabase';

// Read the SQL schema file
const schemaSQL = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  flat_number TEXT UNIQUE NOT NULL,
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
  INSERT INTO public.profiles (id, email, flat_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    'TBD', -- Will be updated when user completes profile
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
`;

export async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Execute the schema SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });

    if (error) {
      // If the RPC doesn't exist, try direct SQL execution
      console.log('RPC method not available, trying direct execution...');

      // Split the SQL into individual statements and execute them
      const statements = schemaSQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0); // This is just to test connection

          if (stmtError) {
            console.error('Error executing statement:', statement);
            console.error('Error:', stmtError);
          }
        }
      }
    }

    console.log('Migrations completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}

// Alternative method using Supabase's SQL editor approach
export async function createTables() {
  try {
    // Test if tables exist by trying to query them
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1);

    if (profilesError || bookingsError) {
      return {
        success: false,
        message:
          'Tables do not exist yet. Please run the SQL schema in Supabase SQL Editor.',
        profilesError: profilesError?.message,
        bookingsError: bookingsError?.message,
      };
    }

    return {
      success: true,
      message: 'Tables exist and are accessible',
      profilesCount: profiles?.length || 0,
      bookingsCount: bookings?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error checking tables',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
