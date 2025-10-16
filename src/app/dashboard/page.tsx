'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CalendarView, { CalendarEvent } from '@/components/CalendarView';
import BookingModal from '@/components/BookingModal';
import moment from 'moment';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_parent_id: string | null;
  created_at: string;
  client_reference?: string | null;
  profiles?: {
    role: 'neighbor' | 'trainer' | 'admin';
  };
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // Fetch all bookings from the API
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return response.json();
    },
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Convert bookings to calendar events
  const events: CalendarEvent[] =
    bookingsData?.bookings?.map((booking: Booking) => {
      const isOwnBooking = booking.user_id === user?.id;
      const isTrainerBooking = booking.profiles?.role === 'trainer';

      // Determine event type and title
      let eventType: 'own-booking' | 'trainer-slot' | 'booked-by-others';
      let title: string;

      if (isOwnBooking) {
        eventType = 'own-booking';
        title = 'Mi Entrenamiento';
      } else if (isTrainerBooking) {
        eventType = 'trainer-slot';
        title = 'Sesión de Entrenador';
      } else {
        eventType = 'booked-by-others';
        title = 'Reservado';
      }

      return {
        id: booking.id,
        title,
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        resource: {
          type: eventType,
          userId: booking.user_id,
        },
      };
    }) || [];

  // Get user's upcoming bookings (sorted chronologically)
  const myUpcomingBookings =
    bookingsData?.bookings
      ?.filter((booking: Booking) => {
        return (
          booking.user_id === user?.id &&
          moment(booking.start_time).isAfter(moment())
        );
      })
      .sort(
        (a: Booking, b: Booking) =>
          moment(a.start_time).valueOf() - moment(b.start_time).valueOf()
      ) || [];

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      // Refetch bookings to update the UI
      refetchBookings();
      setBookingToCancel(null);
    },
    onError: (error: Error) => {
      console.error('Error cancelling booking:', error);
      alert(`Error al cancelar la reserva: ${error.message}`);
    },
  });

  // Handle cancel button click
  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    if (bookingToCancel) {
      cancelMutation.mutate(bookingToCancel.id);
    }
  };

  // Handle slot selection
  const handleSelectSlot = (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
  }) => {
    console.log('Selected slot:', slotInfo);
    setSelectedStartTime(slotInfo.start);
    setIsBookingModalOpen(true);
  };

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    // TODO: Show event details or allow editing
  };

  // Handle booking confirmation
  const handleBookingConfirm = async (booking: {
    start: Date;
    end: Date;
    duration: number;
  }) => {
    console.log('Booking confirmed:', booking);
    // Refetch bookings to update the calendar and "My Bookings" list
    await refetchBookings();
  };

  // Redirect to login if no user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi calendario</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido de nuevo, {user.name}! Has iniciado sesión como{' '}
            {user.role}.
          </p>
        </div>

        {/* Calendar Section - Moved to top */}
        <div className="mb-8 bg-white shadow overflow-hidden rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Calendario de Reservas del Gimnasio
          </h2>
          <p className="text-gray-700 mb-4">
            Ver horarios disponibles del gimnasio y reservar tus sesiones. Haz
            clic en los horarios disponibles para hacer una reserva.
          </p>
          <CalendarView
            events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            userRole={user.role}
          />
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mi Perfil
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Ver y actualizar tu información de perfil
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>{' '}
                <span className="text-gray-900">{user.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Correo:</span>{' '}
                <span className="text-gray-900">{user.email}</span>
              </div>
              {user.flat_number && (
                <div>
                  <span className="font-medium text-gray-700">
                    Número de Apartamento:
                  </span>{' '}
                  <span className="text-gray-900">{user.flat_number}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Rol:</span>{' '}
                <span className="text-gray-900">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mis Reservas
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Tus próximas reservas del gimnasio
            </p>

            {bookingsLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : myUpcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                No hay reservas próximas. Haz clic en el calendario para hacer
                una reserva.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {myUpcomingBookings.slice(0, 5).map((booking: Booking) => {
                  const startMoment = moment(booking.start_time);
                  const endMoment = moment(booking.end_time);
                  const duration = endMoment.diff(startMoment, 'minutes');

                  return (
                    <div
                      key={booking.id}
                      className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {startMoment.format('ddd, MMM D')}
                        </div>
                        <div className="text-sm text-gray-700">
                          {startMoment.format('h:mm A')} -{' '}
                          {endMoment.format('h:mm A')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {duration} minutos
                        </div>
                        {booking.client_reference && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Cliente: {booking.client_reference}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelClick(booking)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        disabled={cancelMutation.isPending}
                      >
                        Cancelar
                      </Button>
                    </div>
                  );
                })}
                {myUpcomingBookings.length > 5 && (
                  <p className="text-xs text-gray-500 italic">
                    +{myUpcomingBookings.length - 5} reserva(s) más
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reservar Gimnasio
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Hacer una nueva reserva para el gimnasio
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Reservar Ahora →
            </button>
          </div>

          {user.role === 'admin' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Panel de Admin
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Gestionar usuarios y horarios de entrenadores
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Panel de Admin →
              </button>
            </div>
          )}

          {user.role === 'trainer' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mi Horario
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Ver tu horario de entrenamiento recurrente
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver Horario →
              </button>
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          startTime={selectedStartTime}
          userRole={user.role}
          onConfirm={handleBookingConfirm}
        />

        {/* Cancel Booking Confirmation Dialog */}
        <AlertDialog
          open={!!bookingToCancel}
          onOpenChange={(open) => !open && setBookingToCancel(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>¿Estás seguro de que quieres cancelar esta reserva?</p>
                  {bookingToCancel && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-red-500">
                      <div className="text-sm font-medium text-gray-900">
                        {moment(bookingToCancel.start_time).format(
                          'ddd, MMM D'
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {moment(bookingToCancel.start_time).format('h:mm A')} -{' '}
                        {moment(bookingToCancel.end_time).format('h:mm A')}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-sm">
                    Esta acción no se puede deshacer. El horario quedará
                    disponible para que otros lo reserven.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelMutation.isPending}>
                Mantener Reserva
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending
                  ? 'Cancelando...'
                  : 'Cancelar Reserva'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
