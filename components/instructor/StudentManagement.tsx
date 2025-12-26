'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import StudentDialog from './StudentDialog';
import StudentList from './StudentList';
import type { User } from '@/types';

export default function StudentManagement() {
  const { userProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [studentToEdit, setStudentToEdit] = useState<User | null>(null);

  const handleAddStudent = () => {
    setStudentToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditStudent = (student: User) => {
    setStudentToEdit(student);
    setIsDialogOpen(true);
  };

  const handleDeleteStudent = async (student: User) => {
    if (!userProfile?.business_id) {
      alert('Unable to determine business context');
      return;
    }

    // Check if student has active packages
    const { data: activePackages, error: packagesError } = await supabase
      .from('packages')
      .select('id')
      .eq('student_id', student.id)
      .eq('status', 'active')
      .limit(1);

    if (packagesError) {
      console.error('Error checking packages:', packagesError);
      alert('Unable to verify student packages. Please try again.');
      return;
    }

    // Build confirmation message
    let confirmMessage = `Are you sure you want to delete ${student.first_name} ${student.last_name}?\n\n`;

    if (activePackages && activePackages.length > 0) {
      confirmMessage += `WARNING: This student has active packages. Deleting will also delete their packages and attendance records.\n\n`;
    }

    confirmMessage += `Email: ${student.email}\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Call API route to delete user (deletes from auth and database)
      const response = await fetch('/api/admin/delete-student', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          businessId: userProfile.business_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to delete student:', data.error);
        alert(`Failed to delete student: ${data.error}`);
        return;
      }

      // Refresh the list
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('An error occurred while deleting the student.');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setStudentToEdit(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage student accounts
          </p>
        </div>
        <button
          onClick={handleAddStudent}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Student</span>
        </button>
      </div>

      {/* Students List */}
      <StudentList
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        refreshTrigger={refreshTrigger}
      />

      {/* Add/Edit Student Dialog */}
      <StudentDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        studentToEdit={studentToEdit}
      />
    </div>
  );
}
