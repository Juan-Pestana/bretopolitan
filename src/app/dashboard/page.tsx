'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-medium">Flat Number:</span>{' '}
                {user.flat_number}
              </div>
              <div>
                <span className="font-medium">Role:</span> {user.role}
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

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Book Gym Session
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              View Calendar
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              My Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
