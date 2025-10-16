import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to create Supabase client with server-side cookies (for authentication)
async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Helper to create Supabase admin client (bypasses RLS using service role key)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado - Por favor inicia sesión' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get user profile for role checking
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prohibido - Se requiere acceso de administrador' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['neighbor', 'trainer', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser vecino, entrenador o admin' },
        { status: 400 }
      );
    }

    // Use admin client to update user role (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        {
          error: 'Error al actualizar el rol del usuario',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: updatedProfile,
        message: 'Rol del usuario actualizado exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
