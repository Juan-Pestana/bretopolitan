'use client';

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set moment locale
moment.locale('en');

const localizer = momentLocalizer(moment);

// Define event types for color coding
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: 'available' | 'own-booking' | 'booked-by-others' | 'trainer-slot';
    userId?: string;
    trainerId?: string;
  };
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export default function CalendarView({
  events = [],
  onSelectSlot,
  onSelectEvent,
}: CalendarViewProps) {
  // Custom event style function for color coding
  const eventStyleGetter = (event: CalendarEvent) => {
    const eventType = event.resource?.type || 'available';

    let backgroundColor = '#10b981'; // Green - Available (default)
    let borderColor = '#059669';

    switch (eventType) {
      case 'own-booking':
        backgroundColor = '#3b82f6'; // Blue - Own booking
        borderColor = '#2563eb';
        break;
      case 'booked-by-others':
        backgroundColor = '#6b7280'; // Gray - Booked by others
        borderColor = '#4b5563';
        break;
      case 'trainer-slot':
        backgroundColor = '#f59e0b'; // Orange - Trainer slots
        borderColor = '#d97706';
        break;
      default:
        backgroundColor = '#10b981'; // Green - Available
        borderColor = '#059669';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  // Custom slot style for available slots
  const slotStyleGetter = (date: Date) => {
    // Check if this slot is available (no events)
    const hasEvent = events.some((event) =>
      moment(date).isBetween(event.start, event.end, 'minute', '[]')
    );

    if (!hasEvent) {
      return {
        style: {
          backgroundColor: '#f0fdf4', // Light green for available slots
          border: '1px solid #dcfce7',
        },
      };
    }

    return {};
  };

  // Handle slot selection
  const handleSelectSlot = (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
  }) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  };

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  };

  return (
    <div className="h-[600px] w-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.WEEK]}
        view={Views.WEEK}
        step={30} // 30-minute intervals
        timeslots={2} // 2 slots per hour (30 minutes each)
        min={new Date(2024, 0, 1, 6, 0)} // 6:00 AM
        max={new Date(2024, 0, 1, 22, 0)} // 10:00 PM
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        slotPropGetter={slotStyleGetter}
        style={{ height: '100%' }}
        className="rbc-calendar"
        // Customize the appearance
        components={{
          toolbar: (props) => (
            <div className="flex justify-between items-center mb-4 p-4 bg-white border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {moment(props.date).format('MMMM YYYY')}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => props.onNavigate('PREV')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Previous
                </button>
                <button
                  onClick={() => props.onNavigate('TODAY')}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => props.onNavigate('NEXT')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Next
                </button>
              </div>
            </div>
          ),
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Your Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Booked by Others</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Trainer Slot</span>
        </div>
      </div>
    </div>
  );
}
