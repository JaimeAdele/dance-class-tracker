'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import RecurringScheduleDialog from './RecurringScheduleDialog';
import RecurringScheduleList from './RecurringScheduleList';
import type { RecurringSchedule, ClassType, User } from '@/types';

interface RecurringScheduleWithDetails extends RecurringSchedule {
  class_type?: ClassType;
  instructor?: User;
}

export default function RecurringScheduleManagement() {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState<RecurringScheduleWithDetails[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RecurringScheduleWithDetails | null>(null);

  const fetchData = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);

    // Fetch recurring schedules with related data
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('recurring_schedules')
      .select(`
        *,
        class_type:class_types(*),
        instructor:users(*)
      `)
      .eq('business_id', userProfile.business_id)
      .order('is_active', { ascending: false })
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
    } else {
      setSchedules(schedulesData as RecurringScheduleWithDetails[] || []);
    }

    // Fetch class types for the dialog
    const { data: classTypesData, error: classTypesError } = await supabase
      .from('class_types')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (classTypesError) {
      console.error('Error fetching class types:', classTypesError);
    } else {
      setClassTypes(classTypesData || []);
    }

    // Fetch instructors for the dialog
    const { data: instructorsData, error: instructorsError } = await supabase
      .from('users')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .in('role', ['instructor', 'owner'])
      .order('first_name', { ascending: true });

    if (instructorsError) {
      console.error('Error fetching instructors:', instructorsError);
    } else {
      setInstructors(instructorsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const handleCreateNew = () => {
    setSelectedSchedule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (schedule: RecurringScheduleWithDetails) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSchedule(null);
  };

  const handleSuccess = () => {
    fetchData();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring Class Schedules</h2>
          <p className="text-sm text-gray-600 mt-1">
            Set up classes that repeat weekly (e.g., every Tuesday at 7:00 PM)
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={classTypes.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span>
          <span>Create Schedule</span>
        </button>
      </div>

      {/* Warning if no class types */}
      {classTypes.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            You need to create at least one class type before creating schedules.
          </p>
        </div>
      )}

      {/* Schedules List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <RecurringScheduleList
          schedules={schedules}
          onEdit={handleEdit}
          onRefresh={fetchData}
        />
      )}

      {/* Dialog */}
      <RecurringScheduleDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        schedule={selectedSchedule}
        classTypes={classTypes}
        instructors={instructors}
      />
    </div>
  );
}
