'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PackageList from '@/components/student/PackageList';
import UpcomingClasses from '@/components/student/UpcomingClasses';

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
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {userProfile.first_name}!
            </h2>
            <p className="text-gray-600">
              View your upcoming classes, check in, and manage your packages.
            </p>
          </div>

          {/* Upcoming Classes & Self Check-In */}
          <UpcomingClasses />

          {/* My Packages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Packages</h2>
            <PackageList />
          </div>

          {/* Coming Soon Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-100">
                <h3 className="font-semibold text-lg mb-2 text-purple-900">
                  Attendance History
                </h3>
                <p className="text-purple-700 text-sm">
                  See all the classes you&apos;ve attended
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-100">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">
                  Purchase Packages
                </h3>
                <p className="text-blue-700 text-sm">
                  Buy new class packages online
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming in Phase 2...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
