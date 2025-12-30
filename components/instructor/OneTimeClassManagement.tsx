'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import OneTimeClassDialog from './OneTimeClassDialog';
import OneTimeClassList from './OneTimeClassList';
import type { Class, ClassType, User } from '@/types';

interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
}

export default function OneTimeClassManagement() {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);

  const fetchData = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);

    // Fetch one-time classes (where recurring_schedule_id is null)
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        class_type:class_types(*),
        instructor:users(*)
      `)
      .eq('business_id', userProfile.business_id)
      .is('recurring_schedule_id', null)
      .order('scheduled_at', { ascending: true });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
    } else {
      setClasses(classesData as ClassWithDetails[] || []);
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
    setSelectedClass(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (classItem: ClassWithDetails) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClass(null);
  };

  const handleSuccess = () => {
    fetchData();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">One-Time Classes</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create individual class sessions that don't repeat
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={classTypes.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span>
          <span>Create Class</span>
        </button>
      </div>

      {/* Warning if no class types */}
      {classTypes.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            You need to create at least one class type before creating classes.
          </p>
        </div>
      )}

      {/* Classes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <OneTimeClassList
          classes={classes}
          onEdit={handleEdit}
          onRefresh={fetchData}
        />
      )}

      {/* Dialog */}
      <OneTimeClassDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        classItem={selectedClass}
        classTypes={classTypes}
        instructors={instructors}
      />
    </div>
  );
}
