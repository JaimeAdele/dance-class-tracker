'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';
import type { User, PackageWithType } from '@/types';

interface StudentWithPackages extends User {
  packages: PackageWithType[];
}

interface StudentPackageListProps {
  onAddPackage: (studentId?: string) => void;
  onEditPackage: (pkg: PackageWithType) => void;
  onDeletePackage: (pkg: PackageWithType) => void;
  refreshTrigger?: number;
}

export default function StudentPackageList({
  onAddPackage,
  onEditPackage,
  onDeletePackage,
  refreshTrigger,
}: StudentPackageListProps) {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<StudentWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'low' | 'expiring'>('all');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentsWithPackages();
  }, [userProfile, refreshTrigger]);

  const fetchStudentsWithPackages = async () => {
    if (!userProfile?.business_id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        packages (
          id,
          classes_remaining,
          total_classes,
          expiration_date,
          status,
          purchase_date,
          amount_paid,
          payment_method,
          package_type:package_types (
            id,
            name,
            package_structure,
            price
          )
        )
      `
      )
      .eq('business_id', userProfile.business_id)
      .eq('role', 'student')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching students with packages:', error);
    } else {
      setStudents((data as any) || []);
    }

    setLoading(false);
  };

  const getPackageStatus = (pkg: PackageWithType) => {
    if (pkg.classes_remaining !== null && pkg.classes_remaining <= 0) {
      return 'depleted';
    }
    if (pkg.expiration_date && new Date() > new Date(pkg.expiration_date)) {
      return 'expired';
    }
    return 'active';
  };

  const getStatusColor = (student: StudentWithPackages) => {
    const activePackages = student.packages.filter(
      (pkg) => getPackageStatus(pkg) === 'active'
    );

    if (activePackages.length === 0) {
      return 'text-gray-500'; // No active packages
    }

    // Check for low balance or expiring soon
    const hasLowBalance = activePackages.some(
      (pkg) => pkg.classes_remaining !== null && pkg.classes_remaining <= 1
    );

    const hasExpiringSoon = activePackages.some((pkg) => {
      if (!pkg.expiration_date) return false;
      const daysUntilExpiry =
        (new Date(pkg.expiration_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });

    if (hasLowBalance || hasExpiringSoon) {
      return 'text-red-600';
    }

    const hasModerateBalance = activePackages.some(
      (pkg) =>
        pkg.classes_remaining !== null &&
        pkg.classes_remaining >= 2 &&
        pkg.classes_remaining <= 4
    );

    if (hasModerateBalance) {
      return 'text-yellow-600';
    }

    return 'text-green-600';
  };

  const getTotalClassesRemaining = (student: StudentWithPackages) => {
    const activePackages = student.packages.filter(
      (pkg) => getPackageStatus(pkg) === 'active'
    );

    // If any package is unlimited, return "Unlimited"
    const hasUnlimited = activePackages.some(
      (pkg) => pkg.package_type?.package_structure === 'unlimited'
    );

    if (hasUnlimited) {
      return 'Unlimited';
    }

    const total = activePackages.reduce(
      (sum, pkg) => sum + (pkg.classes_remaining || 0),
      0
    );

    return total.toString();
  };

  const getExpirationStatus = (student: StudentWithPackages) => {
    const activePackages = student.packages.filter(
      (pkg) => getPackageStatus(pkg) === 'active'
    );

    if (activePackages.length === 0) return 'No active packages';

    // Find soonest expiring package
    const expiringPackages = activePackages
      .filter((pkg) => pkg.expiration_date)
      .sort(
        (a, b) =>
          new Date(a.expiration_date!).getTime() -
          new Date(b.expiration_date!).getTime()
      );

    if (expiringPackages.length === 0) return 'Non-expiring';

    const soonest = expiringPackages[0];
    const daysUntilExpiry = Math.ceil(
      (new Date(soonest.expiration_date!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry === 0) return 'Expires today';
    if (daysUntilExpiry === 1) return 'Expires tomorrow';
    if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;

    return `Expires ${new Date(soonest.expiration_date!).toLocaleDateString()}`;
  };

  const filteredStudents = students.filter((student) => {
    if (filter === 'all') return true;

    const activePackages = student.packages.filter(
      (pkg) => getPackageStatus(pkg) === 'active'
    );

    if (filter === 'active') {
      return activePackages.length > 0;
    }

    if (filter === 'low') {
      return activePackages.some(
        (pkg) => pkg.classes_remaining !== null && pkg.classes_remaining <= 4
      );
    }

    if (filter === 'expiring') {
      return activePackages.some((pkg) => {
        if (!pkg.expiration_date) return false;
        const daysUntilExpiry =
          (new Date(pkg.expiration_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 14 && daysUntilExpiry > 0;
      });
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-lg ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Students
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 text-sm rounded-lg ${
            filter === 'active'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          With Active Packages
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1 text-sm rounded-lg ${
            filter === 'low'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Low Balance
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-3 py-1 text-sm rounded-lg ${
            filter === 'expiring'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expiring Soon
        </button>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {filter === 'all'
              ? 'No students found.'
              : `No students match the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const activePackagesCount = student.packages.filter(
                  (pkg) => getPackageStatus(pkg) === 'active'
                ).length;
                const isExpanded = expandedStudent === student.id;

                return (
                  <React.Fragment key={student.id}>
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setExpandedStudent(isExpanded ? null : student.id)
                            }
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {activePackagesCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getStatusColor(student)}`}>
                          {getTotalClassesRemaining(student)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getExpirationStatus(student)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => onAddPackage(student.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Add Package
                        </button>
                      </td>
                    </tr>
                    {isExpanded && student.packages.length > 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              All Packages
                            </h4>
                            {student.packages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {pkg.package_type?.name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {pkg.classes_remaining !== null && (
                                      <span className="mr-4">
                                        {pkg.classes_remaining} of {pkg.total_classes}{' '}
                                        classes remaining
                                      </span>
                                    )}
                                    {pkg.package_type?.package_structure === 'unlimited' && (
                                      <span className="mr-4">Unlimited</span>
                                    )}
                                    {pkg.expiration_date && (
                                      <span>
                                        Expires:{' '}
                                        {new Date(pkg.expiration_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                      getPackageStatus(pkg) === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : getPackageStatus(pkg) === 'expired'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {getPackageStatus(pkg)}
                                  </span>
                                  <button
                                    onClick={() => onEditPackage({
                                      ...pkg,
                                      student: {
                                        id: student.id,
                                        first_name: student.first_name,
                                        last_name: student.last_name,
                                        email: student.email,
                                      } as any
                                    })}
                                    className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onDeletePackage({
                                      ...pkg,
                                      student: {
                                        id: student.id,
                                        first_name: student.first_name,
                                        last_name: student.last_name,
                                        email: student.email,
                                      } as any
                                    })}
                                    className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
