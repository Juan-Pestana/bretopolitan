-- Migration: Add name field to profiles table and make flat_number optional
-- Run this script in your Supabase SQL editor to update existing database

-- Step 1: Add name column (initially nullable)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 2: Update existing profiles with a default name
-- You may want to customize this query based on your existing data
UPDATE profiles
SET name = COALESCE(flat_number, 'User ' || substring(id::text, 1, 8))
WHERE name IS NULL;

-- Step 3: Make name column NOT NULL
ALTER TABLE profiles ALTER COLUMN name SET NOT NULL;

-- Step 4: Make flat_number column nullable (optional)
ALTER TABLE profiles ALTER COLUMN flat_number DROP NOT NULL;

-- Step 5: Drop unique constraint on flat_number (since it's now optional)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_flat_number_key;

-- Step 6: Update the trigger function to include name field
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

-- Migration complete!
-- Note: After running this migration, new signups will request name instead of flat_number.


