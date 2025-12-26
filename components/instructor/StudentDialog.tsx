'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { User } from '@/types';

interface StudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentToEdit?: User | null;
}

export default function StudentDialog({
  isOpen,
  onClose,
  onSuccess,
  studentToEdit,
}: StudentDialogProps) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const isEditMode = !!studentToEdit;

  useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        // Populate form with student data for editing
        setFormData({
          firstName: studentToEdit.first_name || '',
          lastName: studentToEdit.last_name || '',
          email: studentToEdit.email || '',
          phone: studentToEdit.phone || '',
          password: '',
          confirmPassword: '',
        });
      } else {
        // Clear form for creating new student
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
        });
      }
      setError(null);
    }
  }, [isOpen, studentToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    // First name validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (formData.firstName.length > 50) {
      setError('First name must be 50 characters or less');
      return false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (formData.lastName.length > 50) {
      setError('Last name must be 50 characters or less');
      return false;
    }

    // Email validation (only for create mode)
    if (!isEditMode) {
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    // Phone validation (optional, but validate format if provided)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    // Password validation (only for create mode)
    if (!isEditMode) {
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    if (!userProfile?.business_id) {
      setError('Unable to determine business context');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API route to create user with admin privileges
      const response = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          businessId: userProfile.business_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error?.includes('already registered') || data.error?.includes('already exists')) {
          setError('A user with this email already exists');
        } else if (data.error?.includes('Password')) {
          setError('Password must be at least 8 characters long');
        } else {
          setError(data.error || 'Failed to create student');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating student:', err);
      setError('An error occurred while creating the student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!userProfile?.business_id || !studentToEdit) {
      setError('Unable to determine business context');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
        })
        .eq('id', studentToEdit.id)
        .eq('business_id', userProfile.business_id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating student:', err);
      setError('An error occurred while updating the student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {isEditMode ? 'Edit Student' : 'Create Student'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className='text-gray-400 hover:text-gray-600 disabled:opacity-50'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          {/* First Name */}
          <div>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              First Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={loading}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
              maxLength={50}
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor='lastName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Last Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={loading}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
              maxLength={50}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email <span className='text-red-500'>*</span>
            </label>
            {isEditMode ? (
              <div className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700'>
                {formData.email}
              </div>
            ) : (
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
                required
              />
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor='phone'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Phone <span className='text-gray-400'>(optional)</span>
            </label>
            <input
              type='tel'
              id='phone'
              name='phone'
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
              placeholder='555-123-4567'
            />
          </div>

          {/* Password (Create Mode Only) */}
          {!isEditMode && (
            <>
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Password <span className='text-red-500'>*</span>
                </label>
                <input
                  type='password'
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
                  minLength={8}
                  required
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Confirm Password <span className='text-red-500'>*</span>
                </label>
                <input
                  type='password'
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-700'
                  minLength={8}
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={handleClose}
              disabled={loading}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center'
            >
              {loading ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>{isEditMode ? 'Update' : 'Create'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
