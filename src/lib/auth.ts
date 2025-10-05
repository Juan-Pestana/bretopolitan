import { supabase } from './supabase';
import { User, SignUpData, LoginData, AuthError } from '@/types/auth';

export async function signUp({
  email,
  password,
  flat_number,
}: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: { message: authError.message } };
    }

    if (!authData.user) {
      return {
        user: null,
        error: { message: 'Failed to create user account' },
      };
    }

    // Update the profile with flat number
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ flat_number })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      return { user: null, error: { message: 'Failed to update profile' } };
    }

    return { user: profileData, error: null };
  } catch (error) {
    return {
      user: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    };
  }
}

export async function signIn({
  email,
  password,
}: LoginData): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    if (!data.user) {
      return { user: null, error: { message: 'Login failed' } };
    }

    // Get the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { user: null, error: { message: 'Failed to load user profile' } };
    }

    return { user: profileData, error: null };
  } catch (error) {
    return {
      user: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    };
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (error) {
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    };
  }
}

export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: null }; // Not authenticated, not an error
    }

    // Get the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      return { user: null, error: { message: 'Failed to load user profile' } };
    }

    return { user: profileData, error: null };
  } catch (error) {
    return {
      user: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    };
  }
}
