import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test RLS policies by calling the test function
    const { data, error } = await supabase.rpc('test_rls_policies');

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to test RLS policies',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies test completed',
      results: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error testing RLS policies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
