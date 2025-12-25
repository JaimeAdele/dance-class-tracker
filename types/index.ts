// Application-level types
import type { Database } from './database';

// Convenience type aliases
export type Business = Database['public']['Tables']['businesses']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type PackageType = Database['public']['Tables']['package_types']['Row'];
export type Package = Database['public']['Tables']['packages']['Row'];
export type ClassType = Database['public']['Tables']['class_types']['Row'];
export type RecurringSchedule = Database['public']['Tables']['recurring_schedules']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];

// User roles
export type UserRole = 'owner' | 'instructor' | 'student';

// Package status
export type PackageStatus = 'active' | 'expired' | 'depleted';

// Class status
export type ClassStatus = 'scheduled' | 'completed' | 'cancelled';

// Payment methods
export type PaymentMethod = 'stripe' | 'square' | 'paypal' | 'cash' | 'venmo' | 'other';

// Extended types with relationships
export interface UserWithBusiness extends User {
  business?: Business;
}

export interface PackageWithType extends Package {
  package_type?: PackageType;
  student?: User;
}

export interface ClassWithDetails extends Class {
  class_type?: ClassType;
  instructor?: User;
  recurring_schedule?: RecurringSchedule;
}

export interface AttendanceWithDetails extends Attendance {
  student?: User;
  class?: ClassWithDetails;
  package?: PackageWithType;
  recorded_by_user?: User;
}

// Form types
export interface CreateStudentForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface CreatePackageForm {
  student_id: string;
  package_type_id: string;
  payment_method: PaymentMethod;
  amount_paid: number;
  payment_id?: string;
}

export interface CreateClassForm {
  class_type_id: string;
  instructor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
}

export interface CreateRecurringScheduleForm {
  class_type_id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface MarkAttendanceForm {
  class_id: string;
  student_id: string;
  package_id: string;
  notes?: string;
}

// Constants
export const BUSINESS_ID = '00000000-0000-0000-0000-000000000001'; // Prisma Dance Studio ID for Phase 1

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const PACKAGE_STRUCTURES = {
  fixed_count: 'Fixed Count',
  weekly_limit: 'Weekly Limit',
  unlimited: 'Unlimited',
} as const;
