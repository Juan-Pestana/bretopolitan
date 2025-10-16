import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';

export async function POST(request: NextRequest) {
  try {
    const { startTime, userRole } = await request.json();

    if (!startTime) {
      return NextResponse.json(
        { error: 'La hora de inicio es requerida' },
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
          error: 'No puedes reservar horarios en el pasado',
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
            error:
              'Solo puedes reservar horarios del gimnasio hasta con 7 días de anticipación',
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
          error: 'La fecha de la reserva está demasiado lejos en el futuro',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Booking validation error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
