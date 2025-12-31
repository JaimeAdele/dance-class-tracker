'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PackageTypeManagement from '@/components/instructor/PackageTypeManagement';
import PackageManagement from '@/components/instructor/PackageManagement';
import StudentManagement from '@/components/instructor/StudentManagement';
import ClassTypeManagement from '@/components/instructor/ClassTypeManagement';
import RecurringScheduleManagement from '@/components/instructor/RecurringScheduleManagement';
import OneTimeClassManagement from '@/components/instructor/OneTimeClassManagement';
import AttendanceMarking from '@/components/instructor/AttendanceMarking';
import AttendanceHistory from '@/components/instructor/AttendanceHistory';

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

          {/* Attendance Marking */}
          <AttendanceMarking />

          {/* Package Type Management */}
          <PackageTypeManagement />

          {/* Package Management */}
          <PackageManagement />

          {/* Student Management */}
          <StudentManagement />

          {/* Class Type Management */}
          <ClassTypeManagement />

          {/* Recurring Schedule Management */}
          <RecurringScheduleManagement />

          {/* One-Time Class Management */}
          <OneTimeClassManagement />

          {/* Attendance History */}
          <AttendanceHistory />

          {/* Coming Soon Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-100">
                <h3 className="font-semibold text-lg mb-2 text-green-900">
                  Calendar View
                </h3>
                <p className="text-green-700 text-sm">
                  See all classes in a calendar format
                </p>
                <p className="text-xs text-gray-500 mt-2">Coming soon...</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-100">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">
                  Attendance History
                </h3>
                <p className="text-blue-700 text-sm">
                  View past attendance records
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
