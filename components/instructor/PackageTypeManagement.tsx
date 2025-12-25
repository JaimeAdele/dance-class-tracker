'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import PackageTypeDialog from './PackageTypeDialog';
import PackageTypeList from './PackageTypeList';
import type { PackageType } from '@/types';

export default function PackageTypeManagement() {
  const { userProfile } = useAuth();
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPackageType, setSelectedPackageType] = useState<PackageType | null>(null);

  const fetchPackageTypes = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('package_types')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .order('is_active', { ascending: false })
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching package types:', error);
    } else {
      setPackageTypes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackageTypes();
  }, [userProfile]);

  const handleCreateNew = () => {
    setSelectedPackageType(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (packageType: PackageType) => {
    setSelectedPackageType(packageType);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedPackageType(null);
  };

  const handleSuccess = () => {
    fetchPackageTypes();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Package Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage the package types you offer to students
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create Package Type</span>
        </button>
      </div>

      {/* Package Types List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <PackageTypeList
          packageTypes={packageTypes}
          onEdit={handleEdit}
          onRefresh={fetchPackageTypes}
        />
      )}

      {/* Dialog */}
      <PackageTypeDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        packageType={selectedPackageType}
      />
    </div>
  );
}
