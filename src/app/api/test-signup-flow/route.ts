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
      action: string;
      success?: boolean;
      error?: string;
      data?: unknown;
    }> = [];

    // Step 1: Sign up with Supabase Auth
    debugInfo.push({ step: 1, action: 'Signing up with Supabase Auth' });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      debugInfo.push({
        step: 1,
        action: 'Auth signup failed',
        error: authError.message,
      });
      return NextResponse.json({
        success: false,
        error: 'Auth signup failed',
        debug: debugInfo,
      });
    }

    if (!authData.user) {
      debugInfo.push({
        step: 1,
        action: 'No user returned',
        error: 'No user in response',
      });
      return NextResponse.json({
        success: false,
        error: 'No user returned',
        debug: debugInfo,
      });
    }

    debugInfo.push({
      step: 1,
      action: 'Auth signup successful',
      success: true,
      data: { userId: authData.user.id, email: authData.user.email },
    });

    // Step 2: Wait for trigger
    debugInfo.push({
      step: 2,
      action: 'Waiting for trigger to create profile',
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Check if profile exists
    debugInfo.push({ step: 3, action: 'Checking if profile exists' });

    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      debugInfo.push({
        step: 3,
        action: 'Profile not found, creating manually',
        error: profileError.message,
      });

      // Step 4: Create profile manually
      debugInfo.push({ step: 4, action: 'Creating profile manually' });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          flat_number: flat_number,
          role: 'neighbor',
        })
        .select()
        .single();

      if (createError) {
        debugInfo.push({
          step: 4,
          action: 'Manual profile creation failed',
          error: createError.message,
        });
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile manually',
          debug: debugInfo,
        });
      }

      debugInfo.push({
        step: 4,
        action: 'Manual profile creation successful',
        success: true,
        data: newProfile,
      });

      return NextResponse.json({
        success: true,
        message: 'Signup completed with manual profile creation',
        user: authData.user,
        profile: newProfile,
        debug: debugInfo,
      });
    }

    debugInfo.push({
      step: 3,
      action: 'Profile found, updating flat number',
      success: true,
      data: existingProfile,
    });

    // Step 4: Update profile
    debugInfo.push({ step: 4, action: 'Updating profile with flat number' });

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ flat_number })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      debugInfo.push({
        step: 4,
        action: 'Profile update failed',
        error: updateError.message,
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
        debug: debugInfo,
      });
    }

    debugInfo.push({
      step: 4,
      action: 'Profile update successful',
      success: true,
      data: updatedProfile,
    });

    return NextResponse.json({
      success: true,
      message: 'Signup completed successfully',
      user: authData.user,
      profile: updatedProfile,
      debug: debugInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error during signup test',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
