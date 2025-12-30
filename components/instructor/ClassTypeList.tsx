'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ClassType } from '@/types';

interface ClassTypeListProps {
  classTypes: ClassType[];
  onEdit: (classType: ClassType) => void;
  onRefresh: () => void;
}

export default function ClassTypeList({ classTypes, onEdit, onRefresh }: ClassTypeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = async (classType: ClassType) => {
    const { error } = await supabase
      .from('class_types')
      .update({ is_active: !classType.is_active })
      .eq('id', classType.id);

    if (error) {
      console.error('Error updating class type:', error);
      alert('Failed to update class type');
    } else {
      onRefresh();
    }
  };

  const handleDelete = async (classType: ClassType) => {
    if (!confirm(`Are you sure you want to delete "${classType.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(classType.id);
    const { error } = await supabase
      .from('class_types')
      .delete()
      .eq('id', classType.id);

    if (error) {
      console.error('Error deleting class type:', error);
      alert('Failed to delete class type. It may be in use by existing classes.');
    } else {
      onRefresh();
    }
    setDeletingId(null);
  };

  if (classTypes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No class types yet. Create your first class type to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classTypes.map((classType) => (
        <div
          key={classType.id}
          className={`border rounded-lg p-4 ${
            classType.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {classType.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    classType.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {classType.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {classType.description && (
                <p className="text-sm text-gray-600 mt-1">{classType.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onEdit(classType)}
                className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(classType)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                {classType.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(classType)}
                disabled={deletingId === classType.id}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                {deletingId === classType.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
