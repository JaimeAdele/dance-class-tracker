'use client';

import { useState } from 'react';
import AddPackageDialog from './AddPackageDialog';
import StudentPackageList from './StudentPackageList';

export default function PackageManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddPackage = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
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
        refreshTrigger={refreshTrigger}
      />

      {/* Add Package Dialog */}
      <AddPackageDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
