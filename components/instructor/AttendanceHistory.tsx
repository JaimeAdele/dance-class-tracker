'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { format } from 'date-fns';
import type { Attendance, Class, ClassType, User, Package, PackageType } from '@/types';

interface AttendanceWithDetails extends Attendance {
  student?: User;
  class?: Class & {
    class_type?: ClassType;
    instructor?: User;
  };
  package?: Package & {
    package_type?: PackageType;
  };
  recorded_by_user?: User;
}

export default function AttendanceHistory() {
  const { userProfile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceWithDetails[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent'>('recent');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  const fetchData = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);

    // Fetch all students for filter
    const { data: studentsData } = await supabase
      .from('users')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .eq('role', 'student')
      .order('first_name', { ascending: true });

    setStudents(studentsData || []);

    // Determine date filter
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:users!attendance_student_id_fkey(*),
        class:classes(
          *,
          class_type:class_types(*),
          instructor:users!classes_instructor_id_fkey(*)
        ),
        package:packages(
          *,
          package_type:package_types(*)
        ),
        recorded_by_user:users!attendance_recorded_by_fkey(*)
      `)
      .eq('business_id', userProfile.business_id)
      .order('recorded_at', { ascending: false });

    // If recent, only show last 30 days
    if (filter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('recorded_at', thirtyDaysAgo.toISOString());
    }

    // Filter by student if selected
    if (selectedStudent !== 'all') {
      query = query.eq('student_id', selectedStudent);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      setAttendance(data as AttendanceWithDetails[] || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userProfile, filter, selectedStudent]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm a'),
      dayOfWeek: format(date, 'EEEE'),
    };
  };

  const getTotalClasses = () => attendance.length;

  const getUniqueStudents = () => {
    const studentIds = new Set(attendance.map(a => a.student_id));
    return studentIds.size;
  };

  const getClassesByType = () => {
    const counts: { [key: string]: number } = {};
    attendance.forEach((record) => {
      if (record.class?.class_type?.name) {
        const typeName = record.class.class_type.name;
        counts[typeName] = (counts[typeName] || 0) + 1;
      }
    });
    return counts;
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

  const classesByType = getClassesByType();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
        <p className="text-sm text-gray-600 mt-1">
          View all attendance records across your classes
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Time Filter */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'recent'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recent (30 days)
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Student Filter */}
        <div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="text-sm text-indigo-600 font-medium">Total Attendances</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{getTotalClasses()}</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Unique Students</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{getUniqueStudents()}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium">Most Popular Class</div>
          <div className="text-lg font-bold text-green-900 mt-1">
            {Object.entries(classesByType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {attendance.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {filter === 'recent'
              ? 'No attendance records in the last 30 days.'
              : 'No attendance records yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attendance.map((record) => {
            if (!record.class) return null;

            const { date, time, dayOfWeek } = formatDateTime(record.class.scheduled_at);
            const isSelfCheckIn = record.student_id === record.recorded_by;

            return (
              <div
                key={record.id}
                className="border rounded-lg p-4 bg-white border-gray-200 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.student?.first_name} {record.student?.last_name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Attended
                      </span>
                      {isSelfCheckIn && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Self Check-In
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Class:</span> {record.class.class_type?.name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {dayOfWeek}, {date}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {time}
                      </div>
                      <div>
                        <span className="font-medium">Instructor:</span>{' '}
                        {record.class.instructor?.first_name} {record.class.instructor?.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Package Used:</span>{' '}
                        {record.package?.package_type?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Recorded By:</span>{' '}
                        {isSelfCheckIn
                          ? 'Self'
                          : `${record.recorded_by_user?.first_name} ${record.recorded_by_user?.last_name}`}
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Note: {record.notes}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Recorded: {format(new Date(record.recorded_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      {attendance.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            Showing {attendance.length} attendance record{attendance.length === 1 ? '' : 's'}
            {selectedStudent !== 'all' && ' for selected student'}
          </p>
        </div>
      )}
    </div>
  );
}
