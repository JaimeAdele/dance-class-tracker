'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';
import type { PackageWithType, PackageStatus } from '@/types';

export default function PackageList() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPackages();
    }
  }, [user]);

  const fetchPackages = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('packages')
      .select(
        `
        *,
        package_type:package_types (
          id,
          name,
          package_structure,
          description,
          class_count,
          price
        )
      `
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packages:', error);
    } else {
      setPackages((data as any) || []);
    }

    setLoading(false);
  };

  const getPackageStatus = (pkg: PackageWithType): PackageStatus => {
    if (pkg.classes_remaining !== null && pkg.classes_remaining <= 0) {
      return 'depleted';
    }
    if (pkg.expiration_date && new Date() > new Date(pkg.expiration_date)) {
      return 'expired';
    }
    return 'active';
  };

  const getStatusColor = (status: PackageStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'depleted':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (pkg: PackageWithType) => {
    if (!pkg.total_classes || pkg.package_type?.package_structure === 'unlimited') {
      return 100;
    }
    const used = pkg.total_classes - (pkg.classes_remaining || 0);
    return (used / pkg.total_classes) * 100;
  };

  const getDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return null;

    const days = Math.ceil(
      (new Date(expirationDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return days;
  };

  const formatExpirationDate = (expirationDate: string | null) => {
    if (!expirationDate) return 'Non-expiring';

    const daysRemaining = getDaysRemaining(expirationDate);

    if (daysRemaining === null) return 'Non-expiring';
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Expires today';
    if (daysRemaining === 1) return 'Expires tomorrow';
    if (daysRemaining <= 7)
      return `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;

    return `Expires ${new Date(expirationDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  const getExpirationColor = (expirationDate: string | null) => {
    if (!expirationDate) return 'text-gray-600';

    const daysRemaining = getDaysRemaining(expirationDate);

    if (daysRemaining === null) return 'text-gray-600';
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 7) return 'text-red-600';
    if (daysRemaining <= 14) return 'text-yellow-600';

    return 'text-gray-600';
  };

  const activePackages = packages.filter(
    (pkg) => getPackageStatus(pkg) === 'active'
  );
  const pastPackages = packages.filter(
    (pkg) => getPackageStatus(pkg) !== 'active'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Packages */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Packages
        </h3>

        {activePackages.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              You don't have any active packages at the moment.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact your instructor to purchase a package.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePackages.map((pkg) => {
              const status = getPackageStatus(pkg);
              const isUnlimited =
                pkg.package_type?.package_structure === 'unlimited';

              return (
                <div
                  key={pkg.id}
                  className="bg-white border-2 border-indigo-200 rounded-lg p-6 shadow-sm"
                >
                  {/* Package Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {pkg.package_type?.name || 'Unknown Package'}
                      </h4>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 border ${getStatusColor(
                          status
                        )}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Classes Remaining */}
                  {!isUnlimited && (
                    <div className="mb-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-2xl font-bold text-indigo-600">
                          {pkg.classes_remaining || 0}
                        </span>
                        <span className="text-sm text-gray-600">
                          of {pkg.total_classes} classes remaining
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (pkg.classes_remaining || 0) <= 1
                              ? 'bg-red-500'
                              : (pkg.classes_remaining || 0) <= 4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${100 - getProgressPercentage(pkg)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {isUnlimited && (
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-indigo-600">Unlimited</p>
                      <p className="text-sm text-gray-600">
                        Attend as many classes as you like
                      </p>
                    </div>
                  )}

                  {/* Package Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchased:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(pkg.purchase_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiration:</span>
                      <span
                        className={`font-medium ${getExpirationColor(
                          pkg.expiration_date
                        )}`}
                      >
                        {formatExpirationDate(pkg.expiration_date)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(pkg.amount_paid)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {pkg.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {pkg.package_type?.description && (
                    <p className="text-sm text-gray-600 mt-4 italic border-t pt-3">
                      {pkg.package_type.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Packages */}
      {pastPackages.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            <span className="text-lg font-semibold">
              Past Packages ({pastPackages.length})
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${
                showPast ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showPast && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastPackages.map((pkg) => {
                const status = getPackageStatus(pkg);

                return (
                  <div
                    key={pkg.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {pkg.package_type?.name || 'Unknown Package'}
                      </h4>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                          status
                        )}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Purchased:{' '}
                        {new Date(pkg.purchase_date).toLocaleDateString()}
                      </p>
                      {pkg.expiration_date && (
                        <p>
                          Expired:{' '}
                          {new Date(pkg.expiration_date).toLocaleDateString()}
                        </p>
                      )}
                      <p>
                        Used: {(pkg.total_classes || 0) - (pkg.classes_remaining || 0)}{' '}
                        of {pkg.total_classes} classes
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
