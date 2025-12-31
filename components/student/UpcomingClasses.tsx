'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { format, addHours, isPast, isFuture } from 'date-fns';
import type { Class, ClassType, User, Package, PackageType } from '@/types';

interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
}

interface StudentPackage extends Package {
  package_type?: PackageType;
}

export default function UpcomingClasses() {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [attendedClassIds, setAttendedClassIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = async () => {
    if (!userProfile?.business_id || !userProfile?.id) return;

    setLoading(true);

    // Fetch upcoming classes (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        class_type:class_types(*),
        instructor:users(*)
      `)
      .eq('business_id', userProfile.business_id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lte('scheduled_at', nextWeek.toISOString())
      .order('scheduled_at', { ascending: true });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
    } else {
      setClasses(classesData as ClassWithDetails[] || []);
    }

    // Fetch student's active packages
    const { data: packagesData, error: packagesError } = await supabase
      .from('packages')
      .select(`
        *,
        package_type:package_types(*)
      `)
      .eq('student_id', userProfile.id)
      .eq('status', 'active')
      .gt('classes_remaining', 0)
      .order('expiration_date', { ascending: true });

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    } else {
      setPackages(packagesData as StudentPackage[] || []);
    }

    // Fetch student's attendance for these classes
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('class_id')
      .eq('student_id', userProfile.id);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    } else {
      const classIds = new Set(attendanceData.map(a => a.class_id));
      setAttendedClassIds(classIds);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Refresh every minute to update check-in availability
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const canCheckIn = (classItem: ClassWithDetails) => {
    const scheduledAt = new Date(classItem.scheduled_at);
    const oneHourBefore = addHours(scheduledAt, -1);
    const classEnd = addHours(scheduledAt, classItem.duration_minutes / 60);
    const now = new Date();

    return now >= oneHourBefore && now <= classEnd;
  };

  const getCheckInStatus = (classItem: ClassWithDetails) => {
    if (attendedClassIds.has(classItem.id)) {
      return { canCheckIn: false, message: 'Checked In ✓', color: 'text-green-600' };
    }

    const scheduledAt = new Date(classItem.scheduled_at);
    const oneHourBefore = addHours(scheduledAt, -1);
    const classEnd = addHours(scheduledAt, classItem.duration_minutes / 60);
    const now = new Date();

    if (now < oneHourBefore) {
      const minutesUntil = Math.floor((oneHourBefore.getTime() - now.getTime()) / 60000);
      if (minutesUntil < 60) {
        return { canCheckIn: false, message: `Available in ${minutesUntil} min`, color: 'text-gray-600' };
      }
      return { canCheckIn: false, message: 'Not yet available', color: 'text-gray-600' };
    }

    if (now > classEnd) {
      return { canCheckIn: false, message: 'Class ended', color: 'text-gray-400' };
    }

    return { canCheckIn: true, message: 'Check In Available', color: 'text-indigo-600' };
  };

  const handleCheckIn = async (classItem: ClassWithDetails) => {
    if (!userProfile?.id || !userProfile?.business_id) return;

    // Check if student has active packages
    if (packages.length === 0) {
      alert('You have no active packages with classes remaining. Please purchase a package to check in.');
      return;
    }

    // Use the first active package (oldest/closest to expiration)
    const packageToUse = packages[0];

    setCheckingIn(true);

    try {
      // Create attendance record (self check-in)
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          class_id: classItem.id,
          student_id: userProfile.id,
          package_id: packageToUse.id,
          business_id: userProfile.business_id,
          recorded_by: userProfile.id, // Student records their own attendance
          recorded_at: new Date().toISOString(),
        });

      if (attendanceError) throw attendanceError;

      // Deduct from package
      const newClassesRemaining = (packageToUse.classes_remaining || 0) - 1;
      const { error: packageError } = await supabase
        .from('packages')
        .update({
          classes_remaining: newClassesRemaining,
          status: newClassesRemaining <= 0 ? 'depleted' : 'active'
        })
        .eq('id', packageToUse.id);

      if (packageError) throw packageError;

      // Update local state
      setAttendedClassIds(prev => new Set([...prev, classItem.id]));

      // Refresh packages to update count
      fetchData();

      // Show success message
      alert(`✓ You're checked in for ${classItem.class_type?.name}!\n\n${packageToUse.package_type?.name}: ${newClassesRemaining} classes remaining`);
    } catch (error: any) {
      console.error('Error checking in:', error);
      alert(`Failed to check in: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const formatClassDateTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return {
      date: format(date, 'EEE, MMM d'),
      time: format(date, 'h:mm a'),
      dayOfWeek: format(date, 'EEEE'),
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Classes</h2>
        <p className="text-sm text-gray-600 mt-1">
          Check in starting 1 hour before class
        </p>
      </div>

      {/* Active Packages Summary */}
      {packages.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-2">Your Active Packages</h3>
          <div className="space-y-1 text-sm text-indigo-800">
            {packages.map((pkg) => (
              <div key={pkg.id}>
                {pkg.package_type?.name}: {pkg.classes_remaining} classes remaining
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Active Packages Warning */}
      {packages.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            You have no active packages. Purchase a package to check in to classes.
          </p>
        </div>
      )}

      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No upcoming classes in the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((classItem) => {
            const { date, time, dayOfWeek } = formatClassDateTime(classItem.scheduled_at);
            const checkInStatus = getCheckInStatus(classItem);
            const isCheckedIn = attendedClassIds.has(classItem.id);

            return (
              <div
                key={classItem.id}
                className={`border rounded-lg p-4 ${
                  isCheckedIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {classItem.class_type?.name}
                      </h3>
                      {isCheckedIn && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Checked In
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Date:</span> {dayOfWeek}, {date}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {time}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {classItem.duration_minutes} minutes
                      </div>
                      <div>
                        <span className="font-medium">Instructor:</span>{' '}
                        {classItem.instructor?.first_name} {classItem.instructor?.last_name}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {checkInStatus.canCheckIn ? (
                      <button
                        onClick={() => handleCheckIn(classItem)}
                        disabled={checkingIn || packages.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Check In
                      </button>
                    ) : (
                      <div className={`text-sm font-medium ${checkInStatus.color} whitespace-nowrap`}>
                        {checkInStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Check-in is available starting 1 hour before class and remains open until the class ends.
          Once checked in, you cannot undo it. If you checked in by mistake, please contact your instructor.
        </p>
      </div>
    </div>
  );
}
