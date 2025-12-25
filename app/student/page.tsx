'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentDashboard() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'student')) {
      router.push(userProfile?.role ? '/instructor' : '/login');
    }
  }, [userProfile, loading, router]);

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                Prisma Dance Studio
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {userProfile.first_name} {userProfile.last_name}
              </span>
              <span className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
                Student
              </span>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {userProfile.first_name}!
            </h2>
            <p className="text-gray-600 mb-6">
              Your student portal is being built. Soon you&apos;ll be able to view your packages, attendance history, and check in to classes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-100">
                <h3 className="font-semibold text-lg mb-2 text-indigo-900">
                  My Packages
                </h3>
                <p className="text-indigo-700 text-sm">
                  View your active class packages and remaining credits
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-100">
                <h3 className="font-semibold text-lg mb-2 text-purple-900">
                  Attendance History
                </h3>
                <p className="text-purple-700 text-sm">
                  See all the classes you&apos;ve attended
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-pink-50 p-6 rounded-lg border-2 border-pink-100">
                <h3 className="font-semibold text-lg mb-2 text-pink-900">
                  Upcoming Classes
                </h3>
                <p className="text-pink-700 text-sm">
                  View the class schedule and check in
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-100">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">
                  Self Check-In
                </h3>
                <p className="text-blue-700 text-sm">
                  Check yourself in starting 1 hour before class
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
