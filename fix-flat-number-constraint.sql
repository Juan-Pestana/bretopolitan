-- Fix for duplicate flat number constraint error
-- The profile creation trigger is trying to insert 'TBD' as flat_number
-- but this violates the unique constraint

-- First, let's check what flat numbers exist
SELECT flat_number, COUNT(*) as count
FROM profiles
GROUP BY flat_number
ORDER BY count DESC;

-- Update any 'TBD' flat numbers to unique values
UPDATE profiles
SET flat_number = 'TBD-' || id::text
WHERE flat_number = 'TBD';

-- Now let's fix the trigger to not insert 'TBD' by default
-- Instead, we'll make flat_number nullable temporarily or use a different approach

-- Option 1: Make flat_number nullable (recommended)
ALTER TABLE profiles ALTER COLUMN flat_number DROP NOT NULL;

-- Option 2: Update the trigger to use a unique default value
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, flat_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    'TBD-' || NEW.id::text, -- Use unique value based on user ID
    'neighbor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the fix by checking the trigger function
SELECT
  p.proname as function_name,
  p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'handle_new_user';
