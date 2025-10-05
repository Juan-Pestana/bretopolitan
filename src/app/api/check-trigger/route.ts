import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if the trigger function exists
    const { data: functionData, error: functionError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
          SELECT
            p.proname as function_name,
            p.prosrc as function_source
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname = 'handle_new_user'
        `,
      }
    );

    if (functionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check trigger function',
          details: functionError.message,
        },
        { status: 500 }
      );
    }

    // Check if the trigger exists
    const { data: triggerData, error: triggerError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
          SELECT
            t.tgname as trigger_name,
            t.tgenabled as trigger_enabled,
            c.relname as table_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public'
          AND c.relname = 'users'
          AND t.tgname = 'on_auth_user_created'
        `,
      }
    );

    if (triggerError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check trigger',
          details: triggerError.message,
        },
        { status: 500 }
      );
    }

    // Check recent profiles to see if trigger is working
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check profiles',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trigger check completed',
      function: functionData,
      trigger: triggerData,
      recent_profiles: profilesData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error checking trigger',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
