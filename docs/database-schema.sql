-- Prisma Dance Studio - Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Businesses (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  payment_provider TEXT DEFAULT 'manual' CHECK (payment_provider IN ('stripe', 'square', 'paypal', 'manual')),
  stripe_account_id TEXT,
  square_merchant_id TEXT,
  paypal_merchant_id TEXT,
  payment_provider_connected_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{
    "expiration_reminder_days": 14,
    "low_balance_threshold": 2,
    "enforce_expiration": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Instructors, Students, Owners)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'instructor', 'student')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package Types (Templates)
CREATE TABLE IF NOT EXISTS package_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  package_structure TEXT DEFAULT 'fixed_count' CHECK (package_structure IN ('fixed_count', 'weekly_limit', 'unlimited')),
  class_count INTEGER,
  classes_per_week INTEGER,
  duration_months INTEGER,
  price DECIMAL(10, 2) NOT NULL,
  expiration_days INTEGER,
  description TEXT,
  valid_for_class_types UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages (Student's Purchased Passes)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_type_id UUID REFERENCES package_types(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  classes_remaining INTEGER,
  total_classes INTEGER,
  total_months INTEGER,
  months_remaining INTEGER,
  classes_per_week INTEGER,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  payment_method TEXT DEFAULT 'other' CHECK (payment_method IN ('stripe', 'square', 'paypal', 'cash', 'venmo', 'other')),
  payment_id TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package Month Activations (for weekly_limit packages)
CREATE TABLE IF NOT EXISTS package_month_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL,
  expires_at DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Types
CREATE TABLE IF NOT EXISTS class_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Schedules
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes (Scheduled Sessions)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- INDEXES
-- ============================================

-- Business ID indexes (for multi-tenancy performance)
CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_package_types_business_id ON package_types(business_id);
CREATE INDEX IF NOT EXISTS idx_packages_business_id ON packages(business_id);
CREATE INDEX IF NOT EXISTS idx_class_types_business_id ON class_types(business_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_business_id ON recurring_schedules(business_id);
CREATE INDEX IF NOT EXISTS idx_classes_business_id ON classes(business_id);
CREATE INDEX IF NOT EXISTS idx_attendance_business_id ON attendance(business_id);

-- Student and package specific indexes
CREATE INDEX IF NOT EXISTS idx_packages_student_id ON packages(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_package_month_activations_package_id ON package_month_activations(package_id);

-- Scheduling indexes
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_at ON classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_day_of_week ON recurring_schedules(day_of_week);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_packages_business_student ON packages(business_id, student_id);
CREATE INDEX IF NOT EXISTS idx_classes_business_scheduled ON classes(business_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_business_active ON recurring_schedules(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_package_month_activations_package_status ON package_month_activations(package_id, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_month_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only see their own business
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (id IN (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners can update their business"
  ON businesses FOR UPDATE
  USING (id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role = 'owner'));

-- Users: Can view users in their business, students can only see themselves
CREATE POLICY "Users can view users in their business"
  ON users FOR SELECT
  USING (
    business_id IN (SELECT business_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Owners and instructors can insert users"
  ON users FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users
      WHERE id = auth.uid() AND role IN ('owner', 'instructor')
    )
  );

CREATE POLICY "Owners and instructors can update users"
  ON users FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users
      WHERE id = auth.uid() AND role IN ('owner', 'instructor')
    )
  );

-- Package Types: All users in business can view, only owners can modify
CREATE POLICY "Users can view package types in their business"
  ON package_types FOR SELECT
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners can manage package types"
  ON package_types FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role = 'owner'));

-- Packages: Students see their own, instructors/owners see all in business
CREATE POLICY "Students can view their own packages"
  ON packages FOR SELECT
  USING (
    student_id = auth.uid() OR
    business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor'))
  );

CREATE POLICY "Instructors and owners can manage packages"
  ON packages FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor')));

-- Package Month Activations: Same as packages
CREATE POLICY "Users can view package month activations"
  ON package_month_activations FOR SELECT
  USING (
    package_id IN (SELECT id FROM packages WHERE student_id = auth.uid()) OR
    business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor'))
  );

CREATE POLICY "System can manage package month activations"
  ON package_month_activations FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

-- Class Types: All users can view, owners can modify
CREATE POLICY "Users can view class types in their business"
  ON class_types FOR SELECT
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owners can manage class types"
  ON class_types FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role = 'owner'));

-- Recurring Schedules: All users can view, instructors/owners can modify
CREATE POLICY "Users can view recurring schedules in their business"
  ON recurring_schedules FOR SELECT
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Instructors and owners can manage recurring schedules"
  ON recurring_schedules FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor')));

-- Classes: All users can view, instructors/owners can modify
CREATE POLICY "Users can view classes in their business"
  ON classes FOR SELECT
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Instructors and owners can manage classes"
  ON classes FOR ALL
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor')));

-- Attendance: Students see their own, instructors/owners see all
CREATE POLICY "Students can view their own attendance"
  ON attendance FOR SELECT
  USING (
    student_id = auth.uid() OR
    business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor'))
  );

CREATE POLICY "Instructors and owners can manage attendance"
  ON attendance FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'instructor')));

CREATE POLICY "Students can mark their own attendance (self check-in)"
  ON attendance FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_schedules_updated_at BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically mark packages as expired or depleted
CREATE OR REPLACE FUNCTION check_package_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as depleted if no classes remaining
  IF NEW.classes_remaining IS NOT NULL AND NEW.classes_remaining <= 0 THEN
    NEW.status = 'depleted';
  -- Mark as expired if past expiration date
  ELSIF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_package_status_trigger BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION check_package_status();

-- ============================================
-- COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Next step: Run the sample-data.sql script to populate initial data.';
END $$;
