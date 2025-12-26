'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { PackageType } from '@/types';

interface PackageTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageType?: PackageType | null;
}

export default function PackageTypeDialog({
  isOpen,
  onClose,
  onSuccess,
  packageType,
}: PackageTypeDialogProps) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    package_structure: 'fixed_count' as 'fixed_count' | 'weekly_limit' | 'unlimited',
    class_count: '',
    classes_per_week: '',
    duration_months: '',
    price: '',
    expiration_days: '',
    description: '',
    is_active: true,
  });

  // Load package type data when editing
  useEffect(() => {
    if (packageType) {
      setFormData({
        name: packageType.name,
        package_structure: packageType.package_structure as any,
        class_count: packageType.class_count?.toString() || '',
        classes_per_week: packageType.classes_per_week?.toString() || '',
        duration_months: packageType.duration_months?.toString() || '',
        price: packageType.price.toString(),
        expiration_days: packageType.expiration_days?.toString() || '',
        description: packageType.description || '',
        is_active: packageType.is_active,
      });
    } else {
      // Reset form for new package type
      setFormData({
        name: '',
        package_structure: 'fixed_count',
        class_count: '',
        classes_per_week: '',
        duration_months: '',
        price: '',
        expiration_days: '',
        description: '',
        is_active: true,
      });
    }
    setError('');
  }, [packageType, isOpen]);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (formData.name.length > 100) {
      setError('Name must be 100 characters or less');
      return false;
    }
    if (!formData.package_structure) {
      setError('Package structure is required');
      return false;
    }
    if (formData.package_structure === 'fixed_count' && !formData.class_count) {
      setError('Class count is required for fixed count packages');
      return false;
    }
    if (formData.package_structure === 'fixed_count' && parseInt(formData.class_count) <= 0) {
      setError('Class count must be greater than 0');
      return false;
    }
    if (!formData.price) {
      setError('Price is required');
      return false;
    }
    if (parseFloat(formData.price) < 0) {
      setError('Price must be 0 or greater');
      return false;
    }
    if (formData.expiration_days && parseInt(formData.expiration_days) <= 0) {
      setError('Expiration days must be greater than 0');
      return false;
    }
    if (formData.package_structure === 'weekly_limit') {
      if (!formData.classes_per_week || !formData.duration_months) {
        setError('Classes per week and duration months are required for weekly limit packages');
        return false;
      }
      if (parseInt(formData.classes_per_week) <= 0 || parseInt(formData.duration_months) <= 0) {
        setError('Classes per week and duration months must be greater than 0');
        return false;
      }
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

    const basePackageData = {
      name: formData.name.trim(),
      package_structure: formData.package_structure,
      class_count: formData.package_structure === 'fixed_count' ? parseInt(formData.class_count) : null,
      classes_per_week: formData.package_structure === 'weekly_limit' ? parseInt(formData.classes_per_week) : null,
      duration_months: formData.package_structure === 'weekly_limit' ? parseInt(formData.duration_months) : null,
      price: parseFloat(formData.price),
      expiration_days: formData.expiration_days ? parseInt(formData.expiration_days) : null,
      description: formData.description.trim() || null,
      is_active: formData.is_active,
    };

    try {
      if (packageType) {
        // Update existing package type (no business_id in update data)
        const { error: updateError } = await (supabase
          .from('package_types') as any)
          .update(basePackageData)
          .eq('id', packageType.id)
          .eq('business_id', userProfile.business_id);

        if (updateError) throw updateError;
      } else {
        // Create new package type (include business_id for insert)
        const { error: insertError } = await (supabase
          .from('package_types') as any)
          .insert({
            ...basePackageData,
            business_id: userProfile.business_id,
          });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving package type:', err);
      setError(err.message || 'Failed to save package type');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {packageType ? 'Edit Package Type' : 'Create Package Type'}
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="e.g., 10-Class Pass"
                maxLength={100}
              />
            </div>

            {/* Package Structure */}
            <div>
              <label htmlFor="package_structure" className="block text-sm font-medium text-gray-700 mb-1">
                Package Structure *
              </label>
              <select
                id="package_structure"
                value={formData.package_structure}
                onChange={(e) => setFormData({ ...formData, package_structure: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="fixed_count">Fixed Count (traditional class passes)</option>
                <option value="unlimited">Unlimited (unlimited classes during validity)</option>
                <option value="weekly_limit" disabled>Weekly Limit (future feature)</option>
              </select>
            </div>

            {/* Class Count (for fixed_count) */}
            {formData.package_structure === 'fixed_count' && (
              <div>
                <label htmlFor="class_count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Classes *
                </label>
                <input
                  type="number"
                  id="class_count"
                  value={formData.class_count}
                  onChange={(e) => setFormData({ ...formData, class_count: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="e.g., 10"
                  min="1"
                />
              </div>
            )}

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Expiration Days */}
            <div>
              <label htmlFor="expiration_days" className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Days
              </label>
              <input
                type="number"
                id="expiration_days"
                value={formData.expiration_days}
                onChange={(e) => setFormData({ ...formData, expiration_days: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Leave empty for non-expiring packages"
                min="1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of days until the package expires after purchase. Leave empty for non-expiring packages.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Optional description shown to students"
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (can be assigned to students)
              </label>
            </div>

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
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : packageType ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
