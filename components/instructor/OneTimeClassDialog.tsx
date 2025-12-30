'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { Class, ClassType, User } from '@/types';

interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
}

interface OneTimeClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classItem?: ClassWithDetails | null;
  classTypes: ClassType[];
  instructors: User[];
}

export default function OneTimeClassDialog({
  isOpen,
  onClose,
  onSuccess,
  classItem,
  classTypes,
  instructors,
}: OneTimeClassDialogProps) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    class_type_id: '',
    instructor_id: '',
    scheduled_date: '',
    scheduled_time: '19:00',
    duration_minutes: 60,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (classItem) {
      const scheduledAt = new Date(classItem.scheduled_at);
      const date = scheduledAt.toISOString().split('T')[0];
      const time = scheduledAt.toTimeString().substring(0, 5);

      setFormData({
        class_type_id: classItem.class_type_id,
        instructor_id: classItem.instructor_id,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: classItem.duration_minutes,
        notes: classItem.notes || '',
      });
    } else {
      // Set defaults for new class
      const defaultInstructor = instructors.find(i => i.id === userProfile?.id);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        class_type_id: classTypes[0]?.id || '',
        instructor_id: defaultInstructor?.id || instructors[0]?.id || '',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        scheduled_time: '19:00',
        duration_minutes: 60,
        notes: '',
      });
    }
  }, [classItem, isOpen, classTypes, instructors, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.business_id) return;

    setSubmitting(true);

    try {
      // Combine date and time into ISO timestamp
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00`).toISOString();

      const classData = {
        business_id: userProfile.business_id,
        class_type_id: formData.class_type_id,
        instructor_id: formData.instructor_id,
        scheduled_at: scheduledAt,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes.trim() || null,
        status: 'scheduled' as const,
        recurring_schedule_id: null,
      };

      if (classItem) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', classItem.id);

        if (error) throw error;
      } else {
        // Create new class
        const { error } = await supabase
          .from('classes')
          .insert(classData);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving class:', error);
      alert(`Failed to save class: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {classItem ? 'Edit One-Time Class' : 'Create One-Time Class'}
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

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  required
                />
              </div>

              <div>
                <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
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
                placeholder="Any special details about this class..."
                rows={2}
              />
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
                {submitting ? 'Saving...' : classItem ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
