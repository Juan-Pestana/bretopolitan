import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Debug: Check cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log(
      'All cookies:',
      allCookies.map((c) => c.name)
    );

    // Get authenticated user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('session', session);
    console.log('sessionError', sessionError);

    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
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
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { start_time, end_time } = body;

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      );
    }

    const startMoment = moment(start_time);
    const endMoment = moment(end_time);
    const now = moment();

    // Validation 1: Times must be in the future
    if (startMoment.isBefore(now)) {
      return NextResponse.json(
        { error: 'Cannot book time slots in the past' },
        { status: 400 }
      );
    }

    // Validation 2: Start time must be before end time
    if (!startMoment.isBefore(endMoment)) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
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
            'Bookings must start and end on the hour (:00) or half-hour (:30)',
        },
        { status: 400 }
      );
    }

    // Validation 4: Duration must not exceed 90 minutes
    const durationMinutes = endMoment.diff(startMoment, 'minutes');
    if (durationMinutes > 90) {
      return NextResponse.json(
        { error: 'Booking duration cannot exceed 90 minutes' },
        { status: 400 }
      );
    }

    // Validation 5: Neighbors can only book up to 7 days in advance
    if (profile.role === 'neighbor') {
      const maxDate = now.clone().add(7, 'days');
      if (startMoment.isAfter(maxDate)) {
        return NextResponse.json(
          { error: 'Neighbors can only book up to 7 days in advance' },
          { status: 400 }
        );
      }
    }

    // Validation 6: Booking must be within gym hours (6:00 AM - 10:00 PM)
    const startHour = startMoment.hour();
    const endHour = endMoment.hour();
    const endMinute = endMoment.minute();

    if (startHour < 6 || endHour > 22 || (endHour === 22 && endMinute > 0)) {
      return NextResponse.json(
        { error: 'Gym is only open from 6:00 AM to 10:00 PM' },
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
        { error: 'Failed to check for booking conflicts' },
        { status: 500 }
      );
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Validation 8: Neighbors can only have one booking per calendar day
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
          { error: 'Failed to check existing bookings' },
          { status: 500 }
        );
      }

      if (existingBookings && existingBookings.length > 0) {
        return NextResponse.json(
          {
            error:
              'You already have a booking on this day. Neighbors can only book once per day.',
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
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating booking:', insertError);
      return NextResponse.json(
        { error: 'Failed to create booking', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        message: 'Booking created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in booking creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

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
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookings: bookings || [],
        user_id: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
