'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CalendarView, { CalendarEvent } from '@/components/CalendarView';
import moment from 'moment';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Generate sample events for demonstration
  useEffect(() => {
    if (user) {
      const sampleEvents: CalendarEvent[] = [
        // Sample own booking
        {
          id: '1',
          title: 'My Workout',
          start: moment().add(1, 'day').hour(9).minute(0).toDate(),
          end: moment().add(1, 'day').hour(10).minute(0).toDate(),
          resource: {
            type: 'own-booking',
            userId: user.id,
          },
        },
        // Sample booking by others
        {
          id: '2',
          title: 'Booked by Others',
          start: moment().add(2, 'day').hour(14).minute(0).toDate(),
          end: moment().add(2, 'day').hour(15).minute(30).toDate(),
          resource: {
            type: 'booked-by-others',
          },
        },
        // Sample trainer slot
        {
          id: '3',
          title: 'Trainer Session',
          start: moment().add(3, 'day').hour(18).minute(0).toDate(),
          end: moment().add(3, 'day').hour(19).minute(0).toDate(),
          resource: {
            type: 'trainer-slot',
            trainerId: 'trainer-1',
          },
        },
      ];
      setEvents(sampleEvents);
    }
  }, [user]);

  // Handle slot selection
  const handleSelectSlot = (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
  }) => {
    console.log('Selected slot:', slotInfo);
    // TODO: Open booking modal
  };

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    // TODO: Show event details or allow editing
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user.email}! You&apos;re logged in as a {user.role}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              My Profile
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and update your profile information
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Flat Number:</span>{' '}
                <span className="text-gray-900">{user.flat_number}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>{' '}
                <span className="text-gray-900">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              My Bookings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View and manage your gym reservations
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Bookings →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Book Gym
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Make a new reservation for the gym
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Book Now →
            </button>
          </div>

          {user.role === 'admin' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Admin Panel
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage users and trainer schedules
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Admin Panel →
              </button>
            </div>
          )}

          {user.role === 'trainer' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                My Schedule
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                View your recurring training schedule
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Schedule →
              </button>
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Gym Booking Calendar
          </h2>
          <p className="text-gray-700 mb-4">
            View available gym slots and book your sessions. Click on available
            slots to make a booking.
          </p>
          <CalendarView
            events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            userRole={user.role}
          />
        </div>
      </div>
    </div>
  );
}
