import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

// Helper to create Supabase admin client (bypasses RLS using service role key)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Parse request body
    const body = await request.json();
    const { start_time, end_time, client_reference } = body;

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'La hora de inicio y la hora de fin son requeridas' },
        { status: 400 }
      );
    }

    const startMoment = moment(start_time);
    const endMoment = moment(end_time);
    const now = moment();

    // Validation 1: Times must be in the future
    if (startMoment.isBefore(now)) {
      return NextResponse.json(
        { error: 'No se pueden reservar horarios en el pasado' },
        { status: 400 }
      );
    }

    // Validation 2: Start time must be before end time
    if (!startMoment.isBefore(endMoment)) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser antes de la hora de fin' },
        { status: 400 }
      );
    }

    // Validation 3: Times must be on :00 or :30
    if (
      ![0, 30].includes(startMoment.minute()) ||
      ![0, 30].includes(endMoment.minute())
    ) {
      return NextResponse.json(
        {
          error:
            'Las reservas deben comenzar y terminar en punto (:00) o media hora (:30)',
        },
        { status: 400 }
      );
    }

    // Validation 4: Duration must not exceed 90 minutes
    const durationMinutes = endMoment.diff(startMoment, 'minutes');
    if (durationMinutes > 90) {
      return NextResponse.json(
        { error: 'La duración de la reserva no puede exceder 90 minutos' },
        { status: 400 }
      );
    }

    // Validation 5: Role-based booking time limits
    if (profile.role === 'neighbor') {
      // Neighbors can only book up to 7 days in advance
      const maxDate = now.clone().add(7, 'days');
      if (startMoment.isAfter(maxDate)) {
        return NextResponse.json(
          {
            error:
              'Los vecinos solo pueden reservar hasta con 7 días de anticipación',
          },
          { status: 400 }
        );
      }
    } else if (profile.role === 'trainer') {
      // Trainers can book up to 4 weeks (28 days) in advance
      const maxDate = now.clone().add(28, 'days');
      if (startMoment.isAfter(maxDate)) {
        return NextResponse.json(
          {
            error:
              'Los entrenadores solo pueden reservar hasta con 4 semanas de anticipación',
          },
          { status: 400 }
        );
      }
    }
    // Admins have no time limit restrictions

    // Validation 6: Booking must be within gym hours (6:00 AM - 10:00 PM)
    const startHour = startMoment.hour();
    const endHour = endMoment.hour();
    const endMinute = endMoment.minute();

    if (startHour < 6 || endHour > 22 || (endHour === 22 && endMinute > 0)) {
      return NextResponse.json(
        { error: 'El gimnasio solo está abierto de 6:00 AM a 10:00 PM' },
        { status: 400 }
      );
    }

    // Validation 7: Check for overlapping bookings (no one else has booked this time)
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .or(
        `and(start_time.lt.${endMoment.toISOString()},end_time.gt.${startMoment.toISOString()})`
      )
      .limit(1);

    if (overlapError) {
      console.error('Error checking overlaps:', overlapError);
      return NextResponse.json(
        { error: 'Error al verificar conflictos de reservas' },
        { status: 500 }
      );
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Este horario ya está reservado' },
        { status: 409 }
      );
    }

    // Validation 8: Neighbors can only have one booking per calendar day
    // Trainers and admins can have multiple bookings per day
    if (profile.role === 'neighbor') {
      const startOfDay = startMoment.clone().startOf('day').toISOString();
      const endOfDay = startMoment.clone().endOf('day').toISOString();

      const { data: existingBookings, error: existingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .limit(1);

      if (existingError) {
        console.error('Error checking existing bookings:', existingError);
        return NextResponse.json(
          { error: 'Error al verificar reservas existentes' },
          { status: 500 }
        );
      }

      if (existingBookings && existingBookings.length > 0) {
        return NextResponse.json(
          {
            error:
              'Ya tienes una reserva en este día. Los vecinos solo pueden reservar una vez por día.',
          },
          { status: 409 }
        );
      }
    }

    // All validations passed - create the booking
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        start_time: startMoment.toISOString(),
        end_time: endMoment.toISOString(),
        is_recurring: false,
        recurring_parent_id: null,
        client_reference: client_reference || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating booking:', insertError);
      return NextResponse.json(
        { error: 'Error al crear la reserva', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        message: 'Reserva creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in booking creation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all bookings (for calendar display)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Fetch all bookings
    let query = supabase.from('bookings').select('*');

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    // Order by start time
    query = query.order('start_time', { ascending: true });

    const { data: bookings, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener las reservas' },
        { status: 500 }
      );
    }

    // Get unique user IDs from bookings
    const userIds = [
      ...new Set(bookings?.map((booking) => booking.user_id) || []),
    ];

    // Fetch roles for all users using admin client (bypasses RLS)
    // We only fetch the role field which is non-sensitive public information needed for calendar display
    const adminClient = createAdminClient();
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without role information rather than failing completely
    }

    // Create a map of user_id -> role for quick lookup
    const roleMap = new Map(
      profiles?.map((profile) => [profile.id, profile.role]) || []
    );

    // Enrich bookings with role information
    const enrichedBookings = bookings?.map((booking) => ({
      ...booking,
      profiles: roleMap.has(booking.user_id)
        ? { role: roleMap.get(booking.user_id) }
        : undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        bookings: enrichedBookings || [],
        user_id: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
