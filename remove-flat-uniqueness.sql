-- Remove unique constraint on flat_number to allow multiple users with same flat
-- This simplifies the signup flow and removes the constraint violation errors

-- Drop the unique constraint on flat_number
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_flat_number_key;

-- Also drop the unique index if it exists
DROP INDEX IF EXISTS idx_profiles_flat_number;

-- Verify the constraint is removed
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname LIKE '%flat_number%';

-- Show current table structure
\d profiles;
