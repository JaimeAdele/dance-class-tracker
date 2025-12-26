'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { User, PackageWithType } from '@/types';

interface StudentWithPackages extends User {
  packages: PackageWithType[];
}

interface StudentListProps {
  onEdit: (student: User) => void;
  onDelete: (student: User) => void;
  refreshTrigger?: number;
}

export default function StudentList({
  onEdit,
  onDelete,
  refreshTrigger,
}: StudentListProps) {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<StudentWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name');

  useEffect(() => {
    fetchStudents();
  }, [userProfile, refreshTrigger]);

  const fetchStudents = async () => {
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
        phone,
        created_at,
        packages (
          id,
          classes_remaining,
          status,
          package_type:package_types (
            name,
            package_structure
          )
        )
      `
      )
      .eq('business_id', userProfile.business_id)
      .eq('role', 'student')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents((data as any) || []);
    }

    setLoading(false);
  };

  const getActivePackagesCount = (student: StudentWithPackages) => {
    return student.packages?.filter((pkg) => pkg.status === 'active').length || 0;
  };

  const getTotalClassesRemaining = (student: StudentWithPackages) => {
    const activePackages = student.packages?.filter((pkg) => pkg.status === 'active') || [];

    // Check for unlimited packages
    const hasUnlimited = activePackages.some(
      (pkg) => pkg.package_type?.package_structure === 'unlimited'
    );

    if (hasUnlimited) {
      return 'Unlimited';
    }

    const total = activePackages.reduce((sum, pkg) => sum + (pkg.classes_remaining || 0), 0);
    return total.toString();
  };

  const filteredStudents = students.filter((student) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const reverseName = `${student.last_name} ${student.first_name}`.toLowerCase();
    const email = student.email?.toLowerCase() || '';

    return (
      fullName.includes(search) ||
      reverseName.includes(search) ||
      email.includes(search)
    );
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort */}
        <div className="sm:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'created')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Sort by Name</option>
            <option value="created">Sort by Date Added</option>
          </select>
        </div>
      </div>

      {/* Students Count */}
      <div className="text-sm text-gray-600">
        {sortedStudents.length === students.length ? (
          <span>
            {students.length} {students.length === 1 ? 'student' : 'students'}
          </span>
        ) : (
          <span>
            Showing {sortedStudents.length} of {students.length}{' '}
            {students.length === 1 ? 'student' : 'students'}
          </span>
        )}
      </div>

      {/* Students Table */}
      {sortedStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            {searchTerm.trim()
              ? 'No students match your search.'
              : 'No students found. Create your first student account above.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student) => {
                const activePackagesCount = getActivePackagesCount(student);
                const classesRemaining = getTotalClassesRemaining(student);

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.last_name}, {student.first_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {student.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activePackagesCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          classesRemaining === 'Unlimited'
                            ? 'text-purple-600'
                            : parseInt(classesRemaining) === 0
                            ? 'text-gray-400'
                            : parseInt(classesRemaining) <= 2
                            ? 'text-red-600'
                            : parseInt(classesRemaining) <= 5
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {classesRemaining}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => onEdit(student)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => onDelete(student)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
