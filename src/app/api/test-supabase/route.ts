import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test the connection by querying the auth.users table (this should work even without RLS)
    const { error } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);

    if (error) {
      // If the above fails, try a simpler connection test
      const { error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (testError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Connection failed',
            details: testError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
