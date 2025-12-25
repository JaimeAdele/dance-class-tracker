-- Prisma Dance Studio - Sample Data
-- Run this AFTER running database-schema.sql

-- ============================================
-- BUSINESS
-- ============================================

-- Insert Prisma Dance Studio business
INSERT INTO businesses (id, name, primary_color, secondary_color, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Prisma Dance Studio',
  '#6366f1',
  '#8b5cf6',
  '{
    "expiration_reminder_days": 14,
    "low_balance_threshold": 2,
    "enforce_expiration": true
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USERS
-- ============================================
-- Note: These users need to be created through Supabase Auth first
-- The following are placeholder IDs - you'll need to replace them with actual auth.users IDs
-- after creating the accounts through the signup flow

-- For now, we'll create a reference comment for what accounts to create:
--
-- INSTRUCTOR ACCOUNT:
-- Email: instructor@prismadance.com
-- Password: (choose a secure password)
-- Role: instructor
-- Name: Jane Smith
--
-- STUDENT ACCOUNTS:
-- 1. Email: student1@example.com, Name: Sarah Johnson
-- 2. Email: student2@example.com, Name: Michael Chen
-- 3. Email: student3@example.com, Name: Emily Rodriguez

-- Once you create these accounts via Supabase Auth, come back and run:
-- INSERT INTO users (id, email, business_id, role, first_name, last_name)
-- VALUES
--   ('[instructor-auth-id]', 'instructor@prismadance.com', '00000000-0000-0000-0000-000000000001', 'instructor', 'Jane', 'Smith'),
--   ('[student1-auth-id]', 'student1@example.com', '00000000-0000-0000-0000-000000000001', 'student', 'Sarah', 'Johnson'),
--   etc...

-- ============================================
-- CLASS TYPES
-- ============================================

INSERT INTO class_types (business_id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Beginner Ballet', 'Introduction to classical ballet technique and positions'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Intermediate Jazz', 'Jazz dance with focus on technique and choreography'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Contemporary', 'Modern contemporary dance incorporating various styles'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Hip Hop', 'Urban dance styles and hip hop choreography'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Salsa', 'Latin partner dance with Afro-Cuban origins')
ON CONFLICT DO NOTHING;

-- ============================================
-- PACKAGE TYPES
-- ============================================

INSERT INTO package_types (business_id, name, package_structure, class_count, price, expiration_days, description)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5-Class Pass',
    'fixed_count',
    5,
    75.00,
    90,
    'Perfect for trying out classes. Valid for 90 days.'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10-Class Pass',
    'fixed_count',
    10,
    140.00,
    120,
    'Best value! Valid for 120 days.'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '20-Class Pass',
    'fixed_count',
    20,
    260.00,
    180,
    'For dedicated dancers. Valid for 6 months.'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Single Class Drop-in',
    'fixed_count',
    1,
    18.00,
    30,
    'Try a single class. Valid for 30 days.'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Unlimited Monthly',
    'unlimited',
    NULL,
    180.00,
    30,
    'Unlimited classes for 30 days from purchase.'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create instructor and student accounts via Supabase Auth (or signup flow)';
  RAISE NOTICE '2. Note the auth.users IDs for those accounts';
  RAISE NOTICE '3. Insert records into the users table linking to those IDs';
  RAISE NOTICE '';
  RAISE NOTICE 'Business ID: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE 'Business Name: Prisma Dance Studio';
END $$;
