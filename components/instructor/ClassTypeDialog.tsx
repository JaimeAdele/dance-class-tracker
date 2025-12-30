'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { ClassType } from '@/types';

interface ClassTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classType?: ClassType | null;
}

export default function ClassTypeDialog({
  isOpen,
  onClose,
  onSuccess,
  classType,
}: ClassTypeDialogProps) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (classType) {
      setFormData({
        name: classType.name,
        description: classType.description || '',
        is_active: classType.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [classType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.business_id) return;

    setSubmitting(true);

    try {
      if (classType) {
        // Update existing class type
        const { error } = await supabase
          .from('class_types')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
          })
          .eq('id', classType.id);

        if (error) throw error;
      } else {
        // Create new class type
        const { error } = await supabase
          .from('class_types')
          .insert({
            business_id: userProfile.business_id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
          });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving class type:', error);
      alert(`Failed to save class type: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {classType ? 'Edit Class Type' : 'Create Class Type'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Beginner Ballet, Hip Hop, Salsa"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of this class type"
                rows={3}
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
                Active (available for scheduling)
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
                {submitting ? 'Saving...' : classType ? 'Save Changes' : 'Create Class Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
