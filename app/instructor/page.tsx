'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PackageTypeManagement from '@/components/instructor/PackageTypeManagement';

export default function InstructorDashboard() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain the user shouldn't be here
    if (!loading && userProfile) {
      if (userProfile.role === 'student') {
        router.push('/student');
      }
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, userProfile, loading, router]);

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
                {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
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
              Instructor Dashboard
            </h2>
            <p className="text-gray-600">
              Welcome back, {userProfile.first_name}!
            </p>
          </div>

          {/* Package Type Management */}
          <PackageTypeManagement />

          {/* Coming Soon Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-100">
                <h3 className="font-semibold text-lg mb-2 text-indigo-900">
                  Student Management
                </h3>
                <p className="text-indigo-700 text-sm">
                  Create and manage student accounts
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-100">
                <h3 className="font-semibold text-lg mb-2 text-purple-900">
                  Mark Attendance
                </h3>
                <p className="text-purple-700 text-sm">
                  Quick attendance marking interface
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-100">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">
                  Class Scheduling
                </h3>
                <p className="text-blue-700 text-sm">
                  Create recurring and one-time classes
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-100">
                <h3 className="font-semibold text-lg mb-2 text-green-900">
                  View Schedule
                </h3>
                <p className="text-green-700 text-sm">
                  See upcoming classes and attendance
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-100">
                <h3 className="font-semibold text-lg mb-2 text-yellow-900">
                  Student List
                </h3>
                <p className="text-yellow-700 text-sm">
                  View all students and package status
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
