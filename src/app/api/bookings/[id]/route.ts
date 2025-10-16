import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import moment from 'moment';

// Helper to create Supabase client with server-side cookies
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

export async function DELETE(
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

    // Get the booking to verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes cancelar tus propias reservas' },
        { status: 403 }
      );
    }

    // Check if booking is in the past
    const bookingStart = moment(booking.start_time);
    if (bookingStart.isBefore(moment())) {
      return NextResponse.json(
        {
          error: 'No se pueden cancelar reservas que ya han comenzado o pasado',
        },
        { status: 400 }
      );
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json(
        { error: 'Error al cancelar la reserva', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Reserva cancelada exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
