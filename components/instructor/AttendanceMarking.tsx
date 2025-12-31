'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { format } from 'date-fns';
import type { Class, ClassType, User, Package, PackageType } from '@/types';

interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
}

interface StudentWithPackage extends User {
  active_packages?: (Package & { package_type?: PackageType })[];
}

export default function AttendanceMarking() {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
  const [students, setStudents] = useState<StudentWithPackage[]>([]);
  const [attendedStudentIds, setAttendedStudentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // Fetch today's and upcoming classes
  const fetchClasses = async () => {
    if (!userProfile?.business_id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_type:class_types(*),
        instructor:users(*)
      `)
      .eq('business_id', userProfile.business_id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching classes:', error);
    } else {
      setClasses(data as ClassWithDetails[] || []);
      setLoading(false);
    }
  };

  // Fetch students and their active packages
  const fetchStudents = async () => {
    if (!userProfile?.business_id) return;

    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .eq('role', 'student')
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }

    // Fetch active packages for each student
    const studentsWithPackages = await Promise.all(
      (studentsData || []).map(async (student) => {
        const { data: packages } = await supabase
          .from('packages')
          .select(`
            *,
            package_type:package_types(*)
          `)
          .eq('student_id', student.id)
          .eq('status', 'active')
          .gt('classes_remaining', 0)
          .order('expiration_date', { ascending: true });

        return {
          ...student,
          active_packages: packages || [],
        };
      })
    );

    setStudents(studentsWithPackages);
  };

  // Fetch existing attendance for selected class
  const fetchAttendance = async (classId: string) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('class_id', classId);

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      const studentIds = new Set(data.map(a => a.student_id));
      setAttendedStudentIds(studentIds);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [userProfile]);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance(selectedClass.id);
    }
  }, [selectedClass]);

  const handleClassSelect = (classItem: ClassWithDetails) => {
    setSelectedClass(classItem);
  };

  const handleMarkAttendance = async (student: StudentWithPackage) => {
    if (!selectedClass || !userProfile) return;

    // Check if student has active packages
    if (!student.active_packages || student.active_packages.length === 0) {
      alert(`${student.first_name} ${student.last_name} has no active packages with classes remaining.`);
      return;
    }

    // Use the first active package (oldest/closest to expiration)
    const packageToUse = student.active_packages[0];

    setMarking(true);

    try {
      // Create attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          class_id: selectedClass.id,
          student_id: student.id,
          package_id: packageToUse.id,
          business_id: userProfile.business_id,
          recorded_by: userProfile.id,
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
      setAttendedStudentIds(prev => new Set([...prev, student.id]));

      // Refresh students to update package counts
      fetchStudents();

      // Show success message
      const packageName = packageToUse.package_type?.name || 'Package';
      alert(`✓ Marked ${student.first_name} ${student.last_name} as present.\n\n${packageName}: ${newClassesRemaining} classes remaining`);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      alert(`Failed to mark attendance: ${error.message}`);
    } finally {
      setMarking(false);
    }
  };

  const handleRemoveAttendance = async (student: StudentWithPackage) => {
    if (!selectedClass || !confirm(`Remove attendance for ${student.first_name} ${student.last_name}?`)) {
      return;
    }

    setMarking(true);

    try {
      // Get the attendance record to find the package
      const { data: attendanceRecord, error: fetchError } = await supabase
        .from('attendance')
        .select('*, package:packages(*)')
        .eq('class_id', selectedClass.id)
        .eq('student_id', student.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete attendance record
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('id', attendanceRecord.id);

      if (deleteError) throw deleteError;

      // Add class back to package
      if (attendanceRecord.package) {
        const newClassesRemaining = (attendanceRecord.package.classes_remaining || 0) + 1;
        await supabase
          .from('packages')
          .update({
            classes_remaining: newClassesRemaining,
            status: 'active'
          })
          .eq('id', attendanceRecord.package_id);
      }

      // Update local state
      setAttendedStudentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });

      // Refresh students
      fetchStudents();

      alert(`✓ Removed attendance for ${student.first_name} ${student.last_name}`);
    } catch (error: any) {
      console.error('Error removing attendance:', error);
      alert(`Failed to remove attendance: ${error.message}`);
    } finally {
      setMarking(false);
    }
  };

  const formatClassDateTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return {
      date: format(date, 'EEE, MMM d'),
      time: format(date, 'h:mm a'),
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
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a class and mark students as present
        </p>
      </div>

      {/* Class Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class <span className="text-red-500">*</span>
        </label>
        {classes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No upcoming classes scheduled. Create a class first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((classItem) => {
              const { date, time } = formatClassDateTime(classItem.scheduled_at);
              const isSelected = selectedClass?.id === classItem.id;

              return (
                <button
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {classItem.class_type?.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {date} at {time}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Instructor: {classItem.instructor?.first_name} {classItem.instructor?.last_name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Student List */}
      {selectedClass && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Students ({attendedStudentIds.size} marked present)
          </h3>

          <div className="space-y-2">
            {students.map((student) => {
              const isPresent = attendedStudentIds.has(student.id);
              const hasActivePackage = student.active_packages && student.active_packages.length > 0;
              const packageInfo = hasActivePackage ? student.active_packages![0] : null;

              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isPresent ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {packageInfo ? (
                        <>
                          {packageInfo.package_type?.name}: {packageInfo.classes_remaining} classes remaining
                        </>
                      ) : (
                        <span className="text-red-600">No active packages</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isPresent ? (
                      <button
                        onClick={() => handleRemoveAttendance(student)}
                        disabled={marking}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAttendance(student)}
                        disabled={marking || !hasActivePackage}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark Present
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
