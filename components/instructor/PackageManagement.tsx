'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import AddPackageDialog from './AddPackageDialog';
import StudentPackageList from './StudentPackageList';
import type { PackageWithType } from '@/types';

export default function PackageManagement() {
  const { userProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [packageToEdit, setPackageToEdit] = useState<PackageWithType | null>(null);

  const handleAddPackage = () => {
    setPackageToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditPackage = (pkg: PackageWithType) => {
    setPackageToEdit(pkg);
    setIsDialogOpen(true);
  };

  const handleDeletePackage = async (pkg: PackageWithType) => {
    const confirmMessage = `Are you sure you want to delete this package?\n\n` +
      `Student: ${pkg.student?.first_name} ${pkg.student?.last_name}\n` +
      `Package: ${pkg.package_type?.name}\n` +
      `Classes Remaining: ${pkg.classes_remaining || 0}\n\n` +
      `This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (!userProfile?.business_id) {
      alert('Unable to determine business context');
      return;
    }

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', pkg.id)
        .eq('business_id', userProfile.business_id);

      if (error) {
        console.error('Failed to delete package:', error);
        alert('Failed to delete package. Please try again.');
        return;
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting package:', err);
      alert('An error occurred while deleting the package.');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setPackageToEdit(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Package Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign packages to students and track their balances
          </p>
        </div>
        <button
          onClick={handleAddPackage}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Assign Package</span>
        </button>
      </div>

      {/* Students List with Packages */}
      <StudentPackageList
        onAddPackage={handleAddPackage}
        onEditPackage={handleEditPackage}
        onDeletePackage={handleDeletePackage}
        refreshTrigger={refreshTrigger}
      />

      {/* Add/Edit Package Dialog */}
      <AddPackageDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        packageToEdit={packageToEdit}
      />
    </div>
  );
}
