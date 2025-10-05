import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';

export async function POST(request: NextRequest) {
  try {
    const { startTime, userRole } = await request.json();

    if (!startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }

    const bookingDate = moment(startTime);
    const today = moment().startOf('day');

    // Check if booking is in the past
    if (bookingDate.isBefore(today)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'You cannot book slots in the past',
        },
        { status: 400 }
      );
    }

    // Apply 7-day limit for neighbors
    if (userRole === 'neighbor') {
      const maxDate = today.clone().add(7, 'days').endOf('day');

      if (bookingDate.isAfter(maxDate)) {
        return NextResponse.json(
          {
            valid: false,
            error: 'You can only book gym slots up to 7 days in advance',
          },
          { status: 400 }
        );
      }
    }

    // Additional validation for all users
    const maxFutureDate = today.clone().add(365, 'days').endOf('day');
    if (bookingDate.isAfter(maxFutureDate)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Booking date is too far in the future',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Booking validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
