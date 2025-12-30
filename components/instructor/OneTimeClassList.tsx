'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { Class, ClassType, User } from '@/types';

interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
}

interface OneTimeClassListProps {
  classes: ClassWithDetails[];
  onEdit: (classItem: ClassWithDetails) => void;
  onRefresh: () => void;
}

export default function OneTimeClassList({ classes, onEdit, onRefresh }: OneTimeClassListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (classItem: ClassWithDetails) => {
    if (!confirm(`Are you sure you want to cancel this ${classItem.class_type?.name} class?`)) {
      return;
    }

    setCancellingId(classItem.id);
    const { error } = await supabase
      .from('classes')
      .update({ status: 'cancelled' })
      .eq('id', classItem.id);

    if (error) {
      console.error('Error cancelling class:', error);
      alert('Failed to cancel class');
    } else {
      onRefresh();
    }
    setCancellingId(null);
  };

  const handleDelete = async (classItem: ClassWithDetails) => {
    const className = `${classItem.class_type?.name} on ${format(new Date(classItem.scheduled_at), 'MMM d, yyyy')}`;
    if (!confirm(`Are you sure you want to delete "${className}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(classItem.id);
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classItem.id);

    if (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. It may have attendance records.');
    } else {
      onRefresh();
    }
    setDeletingId(null);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm a'),
      dayOfWeek: format(date, 'EEEE'),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No one-time classes yet. Create your first class to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((classItem) => {
        const { date, time, dayOfWeek } = formatDateTime(classItem.scheduled_at);
        const isPast = new Date(classItem.scheduled_at) < new Date();

        return (
          <div
            key={classItem.id}
            className={`border rounded-lg p-4 ${
              classItem.status === 'cancelled' ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {classItem.class_type?.name || 'Unknown Class'}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(classItem.status)}`}>
                    {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                  </span>
                  {isPast && classItem.status === 'scheduled' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Past
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

                {classItem.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">{classItem.notes}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {classItem.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => onEdit(classItem)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancel(classItem)}
                      disabled={cancellingId === classItem.id}
                      className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                    >
                      {cancellingId === classItem.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(classItem)}
                  disabled={deletingId === classItem.id}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  {deletingId === classItem.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
