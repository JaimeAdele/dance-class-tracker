'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';
import type { PackageType, User, PaymentMethod, PackageWithType } from '@/types';

interface AddPackageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageToEdit?: PackageWithType | null;
}

export default function AddPackageDialog({
  isOpen,
  onClose,
  onSuccess,
  packageToEdit,
}: AddPackageDialogProps) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [students, setStudents] = useState<User[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    student_id: '',
    package_type_id: '',
    payment_method: 'cash' as PaymentMethod,
    amount_paid: '',
    payment_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    classes_remaining: '',
    expiration_date: '',
  });

  // Fetch students and package types
  useEffect(() => {
    if (isOpen && userProfile?.business_id) {
      fetchData();
    }
  }, [isOpen, userProfile]);

  const fetchData = async () => {
    if (!userProfile?.business_id) return;

    setLoadingData(true);

    // Fetch students
    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('business_id', userProfile.business_id)
      .eq('role', 'student')
      .order('last_name', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      setStudents(studentsData || []);
    }

    // Fetch active package types
    const { data: packageTypesData, error: packageTypesError } = await supabase
      .from('package_types')
      .select('*')
      .eq('business_id', userProfile.business_id)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (packageTypesError) {
      console.error('Error fetching package types:', packageTypesError);
    } else {
      setPackageTypes(packageTypesData || []);
    }

    setLoadingData(false);
  };

  // Load package data when editing
  useEffect(() => {
    if (packageToEdit) {
      setFormData({
        student_id: packageToEdit.student_id,
        package_type_id: packageToEdit.package_type_id,
        payment_method: packageToEdit.payment_method,
        amount_paid: packageToEdit.amount_paid.toString(),
        payment_id: packageToEdit.payment_id || '',
        purchase_date: packageToEdit.purchase_date.split('T')[0],
        classes_remaining: packageToEdit.classes_remaining?.toString() || '',
        expiration_date: packageToEdit.expiration_date
          ? packageToEdit.expiration_date.split('T')[0]
          : '',
      });
    } else {
      // Reset form for new package
      setFormData({
        student_id: '',
        package_type_id: '',
        payment_method: 'cash',
        amount_paid: '',
        payment_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        classes_remaining: '',
        expiration_date: '',
      });
    }
    setError('');
  }, [packageToEdit, isOpen]);

  // Auto-fill amount when package type is selected (only for new packages)
  useEffect(() => {
    if (!packageToEdit && formData.package_type_id) {
      const selectedPackage = packageTypes.find(
        (pt) => pt.id === formData.package_type_id
      );
      if (selectedPackage) {
        setFormData((prev) => ({
          ...prev,
          amount_paid: selectedPackage.price.toString(),
        }));
      }
    }
  }, [formData.package_type_id, packageTypes, packageToEdit]);

  const validateForm = (): boolean => {
    if (!formData.student_id) {
      setError('Please select a student');
      return false;
    }
    if (!formData.package_type_id) {
      setError('Please select a package type');
      return false;
    }
    if (!formData.payment_method) {
      setError('Please select a payment method');
      return false;
    }
    if (!formData.amount_paid || parseFloat(formData.amount_paid) < 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!formData.purchase_date) {
      setError('Please enter a purchase date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!userProfile?.business_id) {
      setError('Unable to determine business context');
      return;
    }

    setLoading(true);

    try {
      if (packageToEdit) {
        // Update existing package
        const updateData: any = {
          payment_method: formData.payment_method,
          amount_paid: parseFloat(formData.amount_paid),
          payment_id: formData.payment_id.trim() || null,
          purchase_date: new Date(formData.purchase_date).toISOString(),
        };

        // Only update classes_remaining if it was provided
        if (formData.classes_remaining) {
          updateData.classes_remaining = parseInt(formData.classes_remaining);
        }

        // Only update expiration_date if it was provided
        if (formData.expiration_date) {
          updateData.expiration_date = new Date(formData.expiration_date).toISOString();
        }

        const { error: updateError } = await (supabase.from('packages') as any)
          .update(updateData)
          .eq('id', packageToEdit.id)
          .eq('business_id', userProfile.business_id);

        if (updateError) throw updateError;
      } else {
        // Create new package
        const packageType = packageTypes.find((pt) => pt.id === formData.package_type_id);
        if (!packageType) {
          throw new Error('Package type not found');
        }

        // Calculate expiration date
        const purchaseDate = new Date(formData.purchase_date);
        const expirationDate = packageType.expiration_days
          ? new Date(
              purchaseDate.getTime() + packageType.expiration_days * 24 * 60 * 60 * 1000
            )
          : null;

        // Create package record
        const { error: insertError } = await (supabase.from('packages') as any).insert({
          student_id: formData.student_id,
          package_type_id: formData.package_type_id,
          business_id: userProfile.business_id,
          classes_remaining: packageType.class_count,
          total_classes: packageType.class_count,
          purchase_date: purchaseDate.toISOString(),
          expiration_date: expirationDate?.toISOString() || null,
          status: 'active',
          payment_method: formData.payment_method,
          amount_paid: parseFloat(formData.amount_paid),
          payment_id: formData.payment_id.trim() || null,
        });

        if (insertError) throw insertError;
      }

      // Reset form
      setFormData({
        student_id: '',
        package_type_id: '',
        payment_method: 'cash',
        amount_paid: '',
        payment_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        classes_remaining: '',
        expiration_date: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving package:', err);
      setError(err.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPackageType = packageTypes.find(
    (pt) => pt.id === formData.package_type_id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {packageToEdit ? 'Edit Package' : 'Assign Package to Student'}
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Selector or Display */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Student *
                </label>
                {packageToEdit ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {packageToEdit.student?.first_name} {packageToEdit.student?.last_name}
                    {packageToEdit.student?.email && ` (${packageToEdit.student.email})`}
                  </div>
                ) : (
                  <>
                    <select
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e) =>
                        setFormData({ ...formData, student_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="">Select a student...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.last_name}, {student.first_name} ({student.email})
                        </option>
                      ))}
                    </select>
                    {students.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No students found. Create student accounts first.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Package Type Selector or Display */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Package Type *
                </label>
                {packageToEdit ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {packageToEdit.package_type?.name}
                  </div>
                ) : (
                  <>
                    <select
                      id="package_type_id"
                      value={formData.package_type_id}
                      onChange={(e) =>
                        setFormData({ ...formData, package_type_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="">Select a package type...</option>
                      {packageTypes.map((packageType) => (
                        <option key={packageType.id} value={packageType.id}>
                          {packageType.name} - {formatCurrency(packageType.price)}
                          {packageType.class_count && ` (${packageType.class_count} classes)`}
                        </option>
                      ))}
                    </select>
                    {packageTypes.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No active package types found. Create package types first.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Package Type Details */}
              {selectedPackageType && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Package Details
                  </h3>
                  <div className="space-y-1 text-sm text-indigo-800">
                    <p>
                      <span className="font-medium">Price:</span>{' '}
                      {formatCurrency(selectedPackageType.price)}
                    </p>
                    {selectedPackageType.class_count && (
                      <p>
                        <span className="font-medium">Classes:</span>{' '}
                        {selectedPackageType.class_count}
                      </p>
                    )}
                    {selectedPackageType.package_structure === 'unlimited' && (
                      <p>
                        <span className="font-medium">Structure:</span> Unlimited
                        classes
                      </p>
                    )}
                    {selectedPackageType.expiration_days && (
                      <p>
                        <span className="font-medium">Validity:</span>{' '}
                        {selectedPackageType.expiration_days} days
                      </p>
                    )}
                    {selectedPackageType.description && (
                      <p className="italic mt-2">{selectedPackageType.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label
                  htmlFor="payment_method"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Payment Method *
                </label>
                <select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="cash">Cash</option>
                  <option value="venmo">Venmo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Amount Paid */}
              <div>
                <label
                  htmlFor="amount_paid"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Amount Paid *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="amount_paid"
                    value={formData.amount_paid}
                    onChange={(e) =>
                      setFormData({ ...formData, amount_paid: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Payment ID/Reference */}
              <div>
                <label
                  htmlFor="payment_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Payment ID/Reference (Optional)
                </label>
                <input
                  type="text"
                  id="payment_id"
                  value={formData.payment_id}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="e.g., Venmo username or transaction ID"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label
                  htmlFor="purchase_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purchase Date *
                </label>
                <input
                  type="date"
                  id="purchase_date"
                  value={formData.purchase_date}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              {/* Edit-only fields */}
              {packageToEdit && (
                <>
                  {/* Classes Remaining */}
                  <div>
                    <label
                      htmlFor="classes_remaining"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Classes Remaining
                    </label>
                    <input
                      type="number"
                      id="classes_remaining"
                      value={formData.classes_remaining}
                      onChange={(e) =>
                        setFormData({ ...formData, classes_remaining: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      placeholder="Leave empty to keep current value"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Adjust classes remaining for this package
                    </p>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label
                      htmlFor="expiration_date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      id="expiration_date"
                      value={formData.expiration_date}
                      onChange={(e) =>
                        setFormData({ ...formData, expiration_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to keep current expiration date
                    </p>
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (!packageToEdit && (students.length === 0 || packageTypes.length === 0))}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? packageToEdit
                      ? 'Updating...'
                      : 'Assigning...'
                    : packageToEdit
                    ? 'Update Package'
                    : 'Assign Package'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
