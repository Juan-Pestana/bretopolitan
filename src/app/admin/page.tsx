'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import moment from 'moment';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name: string;
  flat_number: string | null;
  role: 'neighbor' | 'trainer' | 'admin';
  created_at: string;
}

interface Booking {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_parent_id: string | null;
  created_at: string;
  profiles?: {
    email: string;
    name: string;
    flat_number: string | null;
  };
}

type Section = 'users' | 'bookings' | 'trainers';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('users');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User['role'] | null>(null);

  // Bookings filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>(
    'upcoming'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch all users
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all bookings
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchBookings();
      setBookingToCancel(null);
    },
    onError: (error: Error) => {
      console.error('Error cancelling booking:', error);
      alert(`Error al cancelar la reserva: ${error.message}`);
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: User['role'];
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchUsers();
      setUserToEdit(null);
      setNewRole(null);
    },
    onError: (error: Error) => {
      console.error('Error updating user role:', error);
      alert(`Error al actualizar el rol del usuario: ${error.message}`);
    },
  });

  const handleCancelBooking = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  const handleCancelConfirm = () => {
    if (bookingToCancel) {
      cancelMutation.mutate(bookingToCancel.id);
    }
  };

  const handleEditRole = (user: User) => {
    setUserToEdit(user);
    setNewRole(user.role);
  };

  const handleRoleUpdate = () => {
    if (userToEdit && newRole) {
      updateRoleMutation.mutate({ userId: userToEdit.id, role: newRole });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const users: User[] = usersData?.users || [];
  const bookings: Booking[] = bookingsData?.bookings || [];

  // Filter and search bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Date filter
      const bookingTime = moment(booking.start_time);
      const now = moment();
      if (dateFilter === 'upcoming' && !bookingTime.isAfter(now)) return false;
      if (dateFilter === 'past' && !bookingTime.isBefore(now)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const email = booking.profiles?.email?.toLowerCase() || '';
        const name = booking.profiles?.name?.toLowerCase() || '';
        const flatNumber = booking.profiles?.flat_number?.toLowerCase() || '';
        return (
          email.includes(query) ||
          name.includes(query) ||
          flatNumber.includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by start time, newest first for 'past', oldest first for upcoming
      const diff =
        moment(a.start_time).valueOf() - moment(b.start_time).valueOf();
      return dateFilter === 'past' ? -diff : diff;
    });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="mt-2 text-gray-600">
            Gestionar usuarios, reservas y horarios de entrenadores
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('users')}
              className={`${
                activeSection === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Gestión de Usuarios
            </button>
            <button
              onClick={() => setActiveSection('bookings')}
              className={`${
                activeSection === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Todas las Reservas
            </button>
            <button
              onClick={() => setActiveSection('trainers')}
              className={`${
                activeSection === 'trainers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Gestionar Entrenadores
            </button>
          </nav>
        </div>

        {/* User Management Section */}
        {activeSection === 'users' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Gestión de Usuarios
            </h2>
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No se encontraron usuarios.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número Apto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.flat_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'trainer'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {moment(u.created_at).format('MMM D, YYYY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(u)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Cambiar Rol
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings Section */}
        {activeSection === 'bookings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Todas las Reservas
            </h2>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o número de apartamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Filter */}
              <div className="sm:w-48">
                <Select
                  value={dateFilter}
                  onValueChange={(value) =>
                    setDateFilter(value as 'all' | 'upcoming' | 'past')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Reservas</SelectItem>
                    <SelectItem value="upcoming">Próximas</SelectItem>
                    <SelectItem value="past">Pasadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              Mostrando {paginatedBookings.length} de {filteredBookings.length}{' '}
              reservas
            </div>

            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchQuery
                  ? 'No hay reservas que coincidan con tu búsqueda.'
                  : 'No se encontraron reservas.'}
              </p>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duración
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedBookings.map((booking) => {
                        const startMoment = moment(booking.start_time);
                        const endMoment = moment(booking.end_time);
                        const duration = endMoment.diff(startMoment, 'minutes');
                        const isPast = startMoment.isBefore(moment());

                        return (
                          <tr
                            key={booking.id}
                            className={isPast ? 'bg-gray-50' : ''}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {booking.profiles?.name || 'Desconocido'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.profiles?.email || 'Desconocido'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {startMoment.format('MMM D, YYYY')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {startMoment.format('h:mm A')} -{' '}
                              {endMoment.format('h:mm A')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {duration} min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.is_recurring
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {booking.is_recurring
                                  ? 'Recurrente'
                                  : 'Regular'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                disabled={cancelMutation.isPending || isPast}
                              >
                                {isPast ? 'Pasada' : 'Cancelar'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="disabled:opacity-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="disabled:opacity-50"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Trainers Section */}
        {activeSection === 'trainers' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Gestionar Entrenadores
            </h2>
            <p className="text-gray-600 mb-6">
              Gestión de horarios de entrenadores próximamente...
            </p>
            <div className="text-center py-8">
              <p className="text-gray-500 italic">
                Esta sección te permitirá crear y gestionar horarios semanales
                recurrentes para entrenadores.
              </p>
            </div>
          </div>
        )}

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
                          'ddd, MMM D, YYYY'
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {moment(bookingToCancel.start_time).format('h:mm A')} -{' '}
                        {moment(bookingToCancel.end_time).format('h:mm A')}
                      </div>
                      {bookingToCancel.profiles && (
                        <div className="text-xs text-gray-500 mt-1">
                          Usuario: {bookingToCancel.profiles.email}
                        </div>
                      )}
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

        {/* Change Role Dialog */}
        <AlertDialog
          open={!!userToEdit}
          onOpenChange={(open) => {
            if (!open) {
              setUserToEdit(null);
              setNewRole(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cambiar Rol de Usuario</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>Actualizar el rol de este usuario:</p>
                  {userToEdit && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-900">
                        {userToEdit.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userToEdit.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rol actual: {userToEdit.role}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuevo Rol
                    </label>
                    <Select
                      value={newRole || undefined}
                      onValueChange={(value) =>
                        setNewRole(value as User['role'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neighbor">Vecino</SelectItem>
                        <SelectItem value="trainer">Entrenador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updateRoleMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRoleUpdate}
                disabled={updateRoleMutation.isPending || !newRole}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateRoleMutation.isPending
                  ? 'Actualizando...'
                  : 'Actualizar Rol'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
