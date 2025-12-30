'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import ClassTypeDialog from './ClassTypeDialog';
import ClassTypeList from './ClassTypeList';
import type { ClassType } from '@/types';

export default function ClassTypeManagement() {
  const { userProfile } = useAuth();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);

  const fetchClassTypes = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('class_types')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching class types:', error);
    } else {
      setClassTypes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClassTypes();
  }, [userProfile]);

  const handleCreateNew = () => {
    setSelectedClassType(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (classType: ClassType) => {
    setSelectedClassType(classType);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClassType(null);
  };

  const handleSuccess = () => {
    fetchClassTypes();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage the types of classes you offer
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create Class Type</span>
        </button>
      </div>

      {/* Class Types List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ClassTypeList
          classTypes={classTypes}
          onEdit={handleEdit}
          onRefresh={fetchClassTypes}
        />
      )}

      {/* Dialog */}
      <ClassTypeDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        classType={selectedClassType}
      />
    </div>
  );
}
