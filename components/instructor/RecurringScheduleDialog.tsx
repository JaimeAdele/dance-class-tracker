'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { DAYS_OF_WEEK } from '@/types';
import type { RecurringSchedule, ClassType, User } from '@/types';

interface RecurringScheduleWithDetails extends RecurringSchedule {
  class_type?: ClassType;
  instructor?: User;
}

interface RecurringScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule?: RecurringScheduleWithDetails | null;
  classTypes: ClassType[];
  instructors: User[];
}

export default function RecurringScheduleDialog({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  classTypes,
  instructors,
}: RecurringScheduleDialogProps) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    class_type_id: '',
    instructor_id: '',
    day_of_week: 0,
    start_time: '19:00',
    duration_minutes: 60,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    timezone: 'America/Los_Angeles',
    notes: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFormData({
        class_type_id: schedule.class_type_id,
        instructor_id: schedule.instructor_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time.substring(0, 5), // Convert "19:00:00" to "19:00"
        duration_minutes: schedule.duration_minutes,
        start_date: schedule.start_date,
        end_date: schedule.end_date || '',
        timezone: schedule.timezone,
        notes: schedule.notes || '',
        is_active: schedule.is_active,
      });
    } else {
      // Set default instructor to current user if they're an instructor
      const defaultInstructor = instructors.find(i => i.id === userProfile?.id);
      setFormData({
        class_type_id: classTypes[0]?.id || '',
        instructor_id: defaultInstructor?.id || instructors[0]?.id || '',
        day_of_week: 0,
        start_time: '19:00',
        duration_minutes: 60,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        timezone: 'America/Los_Angeles',
        notes: '',
        is_active: true,
      });
    }
  }, [schedule, isOpen, classTypes, instructors, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.business_id) return;

    setSubmitting(true);

    try {
      const scheduleData = {
        business_id: userProfile.business_id,
        class_type_id: formData.class_type_id,
        instructor_id: formData.instructor_id,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time + ':00', // Add seconds
        duration_minutes: formData.duration_minutes,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        timezone: formData.timezone,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      };

      if (schedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('recurring_schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('recurring_schedules')
          .insert(scheduleData);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      alert(`Failed to save schedule: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {schedule ? 'Edit Recurring Schedule' : 'Create Recurring Schedule'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Class Type */}
            <div>
              <label htmlFor="class_type_id" className="block text-sm font-medium text-gray-700 mb-1">
                Class Type <span className="text-red-500">*</span>
              </label>
              <select
                id="class_type_id"
                value={formData.class_type_id}
                onChange={(e) => setFormData({ ...formData, class_type_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                required
              >
                {classTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructor */}
            <div>
              <label htmlFor="instructor_id" className="block text-sm font-medium text-gray-700 mb-1">
                Instructor <span className="text-red-500">*</span>
              </label>
              <select
                id="instructor_id"
                value={formData.instructor_id}
                onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                required
              >
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.first_name} {instructor.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Day and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week <span className="text-red-500">*</span>
                </label>
                <select
                  id="day_of_week"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  required
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration_minutes"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                min="15"
                step="15"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Common: 60 min (1 hour), 90 min (1.5 hours)</p>
            </div>

            {/* Start and End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  required
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank for ongoing</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                placeholder="Any additional details about this class..."
                rows={2}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active (class instances will be generated)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : schedule ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
