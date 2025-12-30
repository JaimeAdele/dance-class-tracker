'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DAYS_OF_WEEK } from '@/types';
import type { RecurringSchedule, ClassType, User } from '@/types';

interface RecurringScheduleWithDetails extends RecurringSchedule {
  class_type?: ClassType;
  instructor?: User;
}

interface RecurringScheduleListProps {
  schedules: RecurringScheduleWithDetails[];
  onEdit: (schedule: RecurringScheduleWithDetails) => void;
  onRefresh: () => void;
}

export default function RecurringScheduleList({ schedules, onEdit, onRefresh }: RecurringScheduleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = async (schedule: RecurringScheduleWithDetails) => {
    const { error } = await supabase
      .from('recurring_schedules')
      .update({ is_active: !schedule.is_active })
      .eq('id', schedule.id);

    if (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule');
    } else {
      onRefresh();
    }
  };

  const handleDelete = async (schedule: RecurringScheduleWithDetails) => {
    const scheduleName = `${DAYS_OF_WEEK[schedule.day_of_week]} at ${schedule.start_time}`;
    if (!confirm(`Are you sure you want to delete the ${schedule.class_type?.name} class on ${scheduleName}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(schedule.id);
    const { error } = await supabase
      .from('recurring_schedules')
      .delete()
      .eq('id', schedule.id);

    if (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule.');
    } else {
      onRefresh();
    }
    setDeletingId(null);
  };

  const formatTime = (time: string) => {
    // Convert "19:00:00" to "7:00 PM"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Ongoing';
    return new Date(date).toLocaleDateString();
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No recurring schedules yet. Create your first schedule to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className={`border rounded-lg p-4 ${
            schedule.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {schedule.class_type?.name || 'Unknown Class'}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    schedule.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {schedule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Day:</span> {DAYS_OF_WEEK[schedule.day_of_week]}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {formatTime(schedule.start_time)}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {schedule.duration_minutes} minutes
                </div>
                <div>
                  <span className="font-medium">Instructor:</span>{' '}
                  {schedule.instructor?.first_name} {schedule.instructor?.last_name}
                </div>
                <div>
                  <span className="font-medium">Starts:</span> {formatDate(schedule.start_date)}
                </div>
                <div>
                  <span className="font-medium">Ends:</span> {formatDate(schedule.end_date)}
                </div>
              </div>

              {schedule.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">{schedule.notes}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onEdit(schedule)}
                className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(schedule)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                {schedule.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(schedule)}
                disabled={deletingId === schedule.id}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                {deletingId === schedule.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
