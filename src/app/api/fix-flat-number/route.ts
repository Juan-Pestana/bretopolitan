import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // First, check what flat numbers exist
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('flat_number, id')
      .order('created_at', { ascending: false });

    if (checkError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing profiles',
          details: checkError.message,
        },
        { status: 500 }
      );
    }

    // Check if there are any 'TBD' flat numbers
    const tbdProfiles =
      existingProfiles?.filter((p) => p.flat_number === 'TBD') || [];

    // Apply the fix
    const fixSQL = `
-- Update any 'TBD' flat numbers to unique values
UPDATE profiles
SET flat_number = 'TBD-' || id::text
WHERE flat_number = 'TBD';

-- Make flat_number nullable to avoid constraint issues
ALTER TABLE profiles ALTER COLUMN flat_number DROP NOT NULL;

-- Update the trigger to use a unique default value
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, flat_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    'TBD-' || NEW.id::text,
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
`;

    // Execute the fix
    const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixSQL });

    if (fixError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to apply flat number fix',
          details: fixError.message,
        },
        { status: 500 }
      );
    }

    // Verify the fix by checking the updated profiles
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('flat_number, id, email')
      .order('created_at', { ascending: false });

    if (verifyError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify fix',
          details: verifyError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Flat number constraint fix applied successfully',
      existing_profiles: existingProfiles,
      tbd_profiles_found: tbdProfiles.length,
      updated_profiles: updatedProfiles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error applying flat number fix',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
