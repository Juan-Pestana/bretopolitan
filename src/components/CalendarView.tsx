'use client';

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { useState, useEffect } from 'react';
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
  userRole?: 'neighbor' | 'trainer' | 'admin';
}

export default function CalendarView({
  events = [],
  onSelectSlot,
  onSelectEvent,
  userRole = 'neighbor',
}: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<
    (typeof Views)[keyof typeof Views]
  >(Views.WEEK);
  const [isMobile, setIsMobile] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Detect screen size and set appropriate view
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      setCurrentView(mobile ? Views.DAY : Views.WEEK);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
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

  // Calculate date restrictions based on user role
  const today = moment().startOf('day');
  const maxDate =
    userRole === 'neighbor'
      ? today.clone().add(7, 'days').endOf('day') // 7 days for neighbors
      : userRole === 'trainer'
        ? today.clone().add(28, 'days').endOf('day') // 4 weeks (28 days) for trainers
        : today.clone().add(365, 'days').endOf('day'); // 1 year for admins

  // Handle slot selection with date validation
  const handleSelectSlot = (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
  }) => {
    const slotDate = moment(slotInfo.start);

    // Check if slot is within allowed date range
    if (slotDate.isAfter(maxDate)) {
      const message =
        userRole === 'neighbor'
          ? 'Solo puedes reservar horarios del gimnasio hasta con 7 días de anticipación.'
          : userRole === 'trainer'
            ? 'Solo puedes reservar horarios del gimnasio hasta con 4 semanas de anticipación.'
            : 'Rango de fechas inválido.';
      alert(message);
      return;
    }

    if (slotDate.isBefore(today)) {
      alert('No puedes reservar horarios en el pasado.');
      return;
    }

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

  // Handle calendar navigation
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <div className="w-full">
      {/* Legend - moved to top */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700">Tu Reserva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-gray-700">Reservado por Otros</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-gray-700">Horario de Entrenador</span>
        </div>
      </div>

      <div className={`w-full ${isMobile ? 'h-[500px]' : 'h-[600px]'}`}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.DAY, Views.WEEK]}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={handleNavigate}
          step={30} // 30-minute intervals
          timeslots={2} // 2 slots per hour (30 minutes each)
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          slotPropGetter={slotStyleGetter}
          style={{ height: '100%' }}
          className="rbc-calendar"
          // Time-of-day window (6:00 AM to 10:00 PM)
          min={moment().startOf('day').hour(6).toDate()}
          max={moment().startOf('day').hour(22).toDate()}
          // Default scroll target to 6:00 AM
          scrollToTime={moment().startOf('day').hour(6).toDate()}
          // Date restrictions
          // NOTE: date range is enforced in selection handler and toolbar; not via min/max props
          // Customize the appearance
          components={{
            toolbar: (props) => {
              const currentDate = moment(props.date);
              const isDayView = props.view === Views.DAY;
              const navigationUnit = isDayView ? 'day' : 'week';
              const canNavigateNext = currentDate
                .clone()
                .add(1, navigationUnit)
                .isSameOrBefore(maxDate);

              return (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 bg-white border-b gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isDayView
                      ? currentDate.format('dddd, MMMM Do, YYYY')
                      : currentDate.format('MMMM YYYY')}
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* View switcher - only show on larger screens */}
                    {!isMobile && (
                      <div className="flex bg-gray-100 rounded p-1">
                        <button
                          onClick={() => props.onView(Views.DAY)}
                          className={`px-3 py-1 text-xs rounded ${
                            props.view === Views.DAY
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Día
                        </button>
                        <button
                          onClick={() => props.onView(Views.WEEK)}
                          className={`px-3 py-1 text-xs rounded ${
                            props.view === Views.WEEK
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Semana
                        </button>
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => props.onNavigate('PREV')}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                      >
                        {isDayView ? '←' : 'Anterior'}
                      </button>
                      <button
                        onClick={() => props.onNavigate('TODAY')}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        Hoy
                      </button>
                      <button
                        onClick={() => props.onNavigate('NEXT')}
                        disabled={!canNavigateNext}
                        className={`px-3 py-1 text-sm rounded text-gray-700 ${
                          canNavigateNext
                            ? 'bg-gray-100 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isDayView ? '→' : 'Siguiente'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            },
          }}
        />
      </div>
    </div>
  );
}
