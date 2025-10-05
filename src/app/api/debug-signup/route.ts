import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, flat_number } = await request.json();

    if (!email || !password || !flat_number) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const debugInfo: Array<{
      step: number;
      action?: string;
      success?: boolean;
      error?: string;
      code?: string | number;
      userId?: string;
      email?: string;
      profile?: unknown;
    }> = [];

    // Step 1: Try to sign up the user
    debugInfo.push({ step: 1, action: 'Signing up user with Supabase Auth' });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      debugInfo.push({
        step: 1,
        error: authError.message,
        code: authError.status,
      });
      return NextResponse.json({
        success: false,
        error: 'Auth signup failed',
        debug: debugInfo,
      });
    }

    if (!authData.user) {
      debugInfo.push({ step: 1, error: 'No user returned from auth signup' });
      return NextResponse.json({
        success: false,
        error: 'No user returned from auth signup',
        debug: debugInfo,
      });
    }

    debugInfo.push({
      step: 1,
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
    });

    // Step 2: Check if profile was created automatically by trigger
    debugInfo.push({
      step: 2,
      action: 'Checking if profile was created by trigger',
    });

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      debugInfo.push({
        step: 2,
        error: profileError.message,
        code: profileError.code,
      });

      // Step 3: Try to create profile manually
      debugInfo.push({ step: 3, action: 'Creating profile manually' });

      const { data: newProfileData, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          flat_number: flat_number,
          role: 'neighbor',
        })
        .select()
        .single();

      if (newProfileError) {
        debugInfo.push({
          step: 3,
          error: newProfileError.message,
          code: newProfileError.code,
        });
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile manually',
          debug: debugInfo,
        });
      }

      debugInfo.push({ step: 3, success: true, profile: newProfileData });
    } else {
      debugInfo.push({ step: 2, success: true, profile: profileData });
    }

    // Step 4: Check if we can read the profile
    debugInfo.push({ step: 4, action: 'Verifying profile can be read' });

    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      debugInfo.push({
        step: 4,
        error: verifyError.message,
        code: verifyError.code,
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to verify profile',
        debug: debugInfo,
      });
    }

    debugInfo.push({ step: 4, success: true, profile: verifyProfile });

    return NextResponse.json({
      success: true,
      message: 'Signup debug completed successfully',
      user: authData.user,
      profile: verifyProfile,
      debug: debugInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error during signup debug',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
