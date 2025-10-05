import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Remove the unique constraint on flat_number
    const removeConstraintSQL = `
-- Drop the unique constraint on flat_number
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_flat_number_key;

-- Also drop the unique index if it exists
DROP INDEX IF EXISTS idx_profiles_flat_number;
`;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: removeConstraintSQL,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove flat number uniqueness constraint',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Verify the constraint is removed by checking current profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('flat_number, email')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify constraint removal',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Flat number uniqueness constraint removed successfully',
      profiles: profiles,
      note: 'Multiple users can now have the same flat number',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error removing flat number uniqueness constraint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
