'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';
import type { PackageType } from '@/types';

interface PackageTypeListProps {
  packageTypes: PackageType[];
  onEdit: (packageType: PackageType) => void;
  onRefresh: () => void;
}

export default function PackageTypeList({
  packageTypes,
  onEdit,
  onRefresh,
}: PackageTypeListProps) {
  const { userProfile } = useAuth();
  const [showInactive, setShowInactive] = useState(false);

  const handleToggleActive = async (packageType: PackageType) => {
    if (!userProfile?.business_id) return;

    const newActiveStatus = !packageType.is_active;

    // If deactivating, check if it's in use
    if (!newActiveStatus) {
      const { data: packagesUsingType } = await supabase
        .from('packages')
        .select('id')
        .eq('package_type_id', packageType.id)
        .limit(1);

      if (packagesUsingType && packagesUsingType.length > 0) {
        const confirmed = window.confirm(
          'This package type is currently in use. Deactivating will prevent new assignments but preserve existing packages. Continue?'
        );
        if (!confirmed) return;
      }
    }

    const { error } = await (supabase
      .from('package_types') as any)
      .update({ is_active: newActiveStatus })
      .eq('id', packageType.id)
      .eq('business_id', userProfile.business_id);

    if (error) {
      console.error('Failed to update package type:', error);
      alert('Failed to update package type. Please try again.');
      return;
    }

    onRefresh();
  };

  const filteredPackageTypes = showInactive
    ? packageTypes
    : packageTypes.filter((pt) => pt.is_active);

  const getStructureLabel = (structure: string) => {
    switch (structure) {
      case 'fixed_count':
        return 'Fixed Count';
      case 'weekly_limit':
        return 'Weekly Limit';
      case 'unlimited':
        return 'Unlimited';
      default:
        return structure;
    }
  };

  const getStructureDetails = (packageType: PackageType) => {
    if (packageType.package_structure === 'fixed_count') {
      return `${packageType.class_count} classes`;
    }
    if (packageType.package_structure === 'weekly_limit') {
      return `${packageType.classes_per_week} classes/week for ${packageType.duration_months} months`;
    }
    if (packageType.package_structure === 'unlimited') {
      return 'Unlimited classes';
    }
    return '-';
  };

  return (
    <div>
      {/* Filter Toggle */}
      <div className="mb-4 flex items-center">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          {showInactive ? 'Show Active Only' : 'Show All'}
        </button>
      </div>

      {/* Package Types Grid */}
      {filteredPackageTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {showInactive
              ? 'No package types found.'
              : 'No active package types. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackageTypes.map((packageType) => (
            <div
              key={packageType.id}
              className={`border rounded-lg p-4 ${
                packageType.is_active
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-300 bg-gray-50 opacity-75'
              }`}
            >
              {/* Header with name and status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {packageType.name}
                  </h3>
                  <p className="text-sm text-gray-500">{getStructureLabel(packageType.package_structure)}</p>
                </div>
                {!packageType.is_active && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                    Inactive
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(packageType.price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Details:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {getStructureDetails(packageType)}
                  </span>
                </div>
                {packageType.expiration_days && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium text-gray-900">
                      {packageType.expiration_days} days
                    </span>
                  </div>
                )}
                {packageType.description && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    {packageType.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => onEdit(packageType)}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(packageType)}
                  className={`flex-1 px-3 py-2 text-sm rounded ${
                    packageType.is_active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {packageType.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
