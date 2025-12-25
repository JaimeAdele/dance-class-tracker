# Class Attendance & Payment Tracking System
## Software Specifications Document

**Version:** 1.0  
**Date:** November 4, 2025  
**Project Type:** Multi-tenant SaaS Application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision & Goals](#project-vision--goals)
3. [Core Functionality](#core-functionality)
4. [Technology Stack](#technology-stack)
5. [Data Model & Architecture](#data-model--architecture)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Phase 1: MVP (Weeks 1-2)](#phase-1-mvp-weeks-1-2)
8. [Phase 1.5: Private Lessons (Weeks 3-4)](#phase-15-private-lessons-weeks-3-4)
9. [Phase 2: Payment Integration (Weeks 5-8)](#phase-2-payment-integration-weeks-5-8)
10. [Phase 3: Multi-tenant Platform (Months 2-4)](#phase-3-multi-tenant-platform-months-2-4)
11. [Phase 4: Mobile Application (Months 4-6)](#phase-4-mobile-application-months-4-6)
12. [Phase 5: Growth & Scaling (Month 6+)](#phase-5-growth--scaling-month-6)
11. [Payment Integration](#payment-integration)
12. [Security & Compliance](#security--compliance)
13. [Future Considerations](#future-considerations)

---

## Executive Summary

This application is a class attendance and payment tracking system designed for dance instructors and studios. It replaces manual attendance tracking with a digital solution that automates attendance tracking, class package management, and payment processing. The system is built as a multi-tenant SaaS platform to support multiple independent businesses.

**Primary Users:**
- Dance instructors and studio owners
- Students attending classes

**Core Problem Solved:**
Manual attendance tracking with physical punch cards is inefficient and error-prone. This system automates tracking class packages (e.g., 5-class pass, 10-class pass) and deducts attendance automatically.

---

## Project Vision & Goals

### Primary Objectives
1. **Automate attendance tracking** - Replace physical punch cards with digital tracking
2. **Streamline payments** - Enable online package purchases with automated payment processing
3. **Multi-tenant architecture** - Support multiple independent businesses on one platform
4. **Mobile accessibility** - Provide native mobile apps for students and instructors

### Long-term Vision
- Build a scalable SaaS product serving dance studios and instructors
- Monetize through subscription fees and/or transaction percentages
- Provide white-labeled experience through dynamic branding within a single mobile application

---

## Core Functionality

### For Students
- View remaining class credits in active packages
- Purchase new class packages online
- View attendance history
- See upcoming class schedule
- Receive notifications for low balance and expiring packages

### For Instructors
- Quick attendance marking interface (primary workflow)
- View class rosters
- See all students and their package status
- Manually add packages (for cash/external payments)
- Generate basic reports

### For Business Owners (Studio Admins)
- All instructor capabilities
- Add/remove instructors
- Configure payment settings
- Manage package types and pricing
- Configure business branding (logo, colors, name)
- Access financial reports

---

## Technology Stack

### Frontend
- **Web Application:** Next.js (React framework)
- **Mobile Application:** React Native (iOS & Android)
- **Styling:** Tailwind CSS
- **State Management:** Zustand (lightweight state management library)

### Backend & Infrastructure
- **Backend-as-a-Service:** Supabase
  - PostgreSQL database
  - Authentication & authorization
  - Row-level security for multi-tenancy
  - Real-time subscriptions
  - Auto-generated REST API

### Payment Processing
- **Primary Option:** Stripe (online payments)
- **Alternative Option:** Square (if in-person card readers required)
- Decision to be made based on first client's needs

### Hosting & Deployment
- **Web App:** Vercel (Next.js optimized)
- **Mobile App:** Apple App Store & Google Play Store
- **Database & Auth:** Supabase Cloud

---

## Data Model & Architecture

### Multi-tenancy Strategy
All data is isolated by `business_id` using Supabase row-level security policies. Each business operates independently within the shared infrastructure.

### Core Entities

#### Businesses (Tenants)
```
businesses
- id (uuid, primary key)
- name (text)
- logo_url (text, nullable)
- primary_color (text, hex color)
- secondary_color (text, hex color)
- payment_provider (enum: 'stripe' | 'square' | 'paypal' | 'manual')
- stripe_account_id (text, nullable) // Stripe Connect account ID
- square_merchant_id (text, nullable) // Square OAuth merchant ID
- paypal_merchant_id (text, nullable) // PayPal partner merchant ID
- payment_provider_connected_at (timestamp, nullable) // when OAuth completed
- settings (jsonb)
  - expiration_reminder_days (default: 14)
  - low_balance_threshold (default: 2)
  - enforce_expiration (boolean, default: true)
  - platform_fee_percentage (decimal, nullable) // optional platform fee
- created_at (timestamp)
- updated_at (timestamp)
```

**Important Notes:**
- Uses OAuth/Connect flows - stores connected account IDs, not raw API keys
- Each business connects their own payment processor account
- Payments go directly to business's account
- Platform can optionally take fees via Stripe Connect, Square, or PayPal partner programs

#### Users (Instructors, Students, Owners)
```
users
- id (uuid, primary key, Supabase auth.users)
- email (text, unique)
- business_id (uuid, foreign key)
- role (enum: 'owner' | 'instructor' | 'student')
- first_name (text)
- last_name (text)
- phone (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Package Types (Templates)
```
package_types
- id (uuid, primary key)
- business_id (uuid, foreign key)
- name (text) e.g., "5-Class Pass", "2-Month 3x/Week Pass"
- package_structure (enum: 'fixed_count' | 'weekly_limit' | 'unlimited')
- class_count (integer, nullable) - for fixed_count packages
- classes_per_week (integer, nullable) - for weekly_limit packages
- duration_months (integer, nullable) - for weekly_limit packages
- price (decimal)
- expiration_days (integer, nullable) - null for no expiration
- description (text, nullable)
- valid_for_class_types (text[], nullable) - null means all classes
- is_active (boolean, default: true)
- created_at (timestamp)
```

**Package Structure Types:**
- `fixed_count`: Traditional class passes (5-class, 10-class, etc.) - decrements with each attendance
- `weekly_limit`: Classes per week with non-consecutive months (2-month 3x/week) - activates months on-demand
- `unlimited`: Unlimited classes during validity period (future feature)

#### Packages (Student's Purchased Passes)
```
packages
- id (uuid, primary key)
- student_id (uuid, foreign key → users)
- package_type_id (uuid, foreign key)
- business_id (uuid, foreign key)
- classes_remaining (integer, nullable) // for fixed_count packages
- total_classes (integer, nullable) // original count for fixed_count
- total_months (integer, nullable) // for weekly_limit packages
- months_remaining (integer, nullable) // for weekly_limit packages
- classes_per_week (integer, nullable) // for weekly_limit packages
- purchase_date (timestamp)
- expiration_date (timestamp, nullable)
- status (enum: 'active' | 'expired' | 'depleted')
- payment_method (enum: 'stripe' | 'square' | 'paypal' | 'cash' | 'venmo' | 'other')
- payment_id (text, nullable) - external payment reference
- amount_paid (decimal)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Package Month Activations
```
package_month_activations
- id (uuid, primary key)
- package_id (uuid, foreign key → packages)
- business_id (uuid, foreign key)
- month_number (integer) // 1, 2, 3... (which month of the package this represents)
- activated_at (timestamp) // when student first attended class for this month
- expires_at (date) // last day of the calendar month when activated
- status (enum: 'active' | 'expired')
- created_at (timestamp)
```

**Important Notes on Package Types:**
- Fixed-count packages use `classes_remaining` and `total_classes`
- Weekly-limit packages use `total_months`, `months_remaining`, and `classes_per_week`
- Month activations are created on-demand when student attends first class of a new month
- Months don't need to be used consecutively - next month activates whenever student returns

#### Class Types
```
class_types
- id (uuid, primary key)
- business_id (uuid, foreign key)
- name (text) e.g., "Beginner Ballet", "Advanced Hip Hop"
- description (text, nullable)
- is_active (boolean, default: true)
- created_at (timestamp)
```

#### Recurring Schedules
```
recurring_schedules
- id (uuid, primary key)
- business_id (uuid, foreign key)
- class_type_id (uuid, foreign key)
- instructor_id (uuid, foreign key → users)
- day_of_week (integer) // 0=Sunday, 1=Monday, 2=Tuesday, ... 6=Saturday
- start_time (time) // e.g., "19:00:00" for 7pm
- duration_minutes (integer)
- timezone (text) // e.g., "America/Los_Angeles"
- start_date (date) // when this recurring schedule begins
- end_date (date, nullable) // when it ends, null = ongoing indefinitely
- is_active (boolean, default: true)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Classes (Scheduled Sessions)
```
classes
- id (uuid, primary key)
- business_id (uuid, foreign key)
- class_type_id (uuid, foreign key)
- instructor_id (uuid, foreign key → users)
- recurring_schedule_id (uuid, foreign key, nullable) // null for one-time classes
- scheduled_at (timestamp with time zone) // specific date and time for this class instance
- duration_minutes (integer)
- notes (text, nullable)
- status (enum: 'scheduled' | 'completed' | 'cancelled')
- created_at (timestamp)
- updated_at (timestamp)
```

**Important Notes:**
- `classes` table stores individual class instances
- Classes can be one-time (recurring_schedule_id = null) or generated from a recurring schedule
- `scheduled_at` is a specific point in time (e.g., "2025-11-05T19:00:00-08:00" for a class on Nov 5 at 7pm Pacific)
- A scheduled function runs at the beginning of each month to generate class instances 2 months in advance from active recurring schedules
- The system checks for existing classes to avoid creating duplicates

#### Private Lessons
```
private_lessons
- id (uuid, primary key)
- business_id (uuid, foreign key)
- instructor_id (uuid, foreign key → users)
- student_ids (uuid[]) // array of student user IDs (1-5 students)
- scheduled_at (timestamp with time zone)
- duration_minutes (integer)
- lesson_type (text) // e.g., "Salsa Private", "Wedding Dance", "Technique Coaching"
- price (decimal, nullable) // lesson price if applicable
- payment_status (enum: 'unpaid' | 'paid' | 'waived')
- payment_method (text, nullable) // 'cash', 'venmo', 'stripe', 'square', 'paypal', etc.
- recurring_schedule_id (uuid, foreign key, nullable) // if part of recurring series
- notes (text, nullable) // instructor notes
- status (enum: 'scheduled' | 'completed' | 'cancelled')
- created_at (timestamp)
- updated_at (timestamp)
```

**Important Notes:**
- Private lessons are separate from group classes and don't deduct from class packages
- Can be solo (1 student), couple (2 students), or small group (3-5 students)
- Payment tracked separately from packages (manual tracking initially, automated in Phase 2)
- Can be one-time or recurring (uses same recurring logic as group classes)
- Future: Integration with packages (e.g., "10-class pass includes 1 private lesson")

#### Attendance Records
```
attendance
- id (uuid, primary key)
- class_id (uuid, foreign key)
- student_id (uuid, foreign key → users)
- package_id (uuid, foreign key) - which package was used
- business_id (uuid, foreign key)
- recorded_by (uuid, foreign key → users) - instructor who marked it
- recorded_at (timestamp)
- notes (text, nullable)
```

### Database Indexes
- `business_id` on all tables (for query performance)
- `student_id` on packages, attendance
- `package_id` on package_month_activations
- `class_id` on attendance
- `instructor_id` on private_lessons
- `scheduled_at` on classes, private_lessons
- `day_of_week` on recurring_schedules
- `status` on package_month_activations (for finding active months)
- `status` on private_lessons (for finding scheduled/completed lessons)
- Composite index on `(business_id, student_id)` for packages
- Composite index on `(business_id, scheduled_at)` for classes and private_lessons
- Composite index on `(business_id, is_active)` for recurring_schedules
- Composite index on `(package_id, status)` for package_month_activations
- GIN index on `student_ids` in private_lessons (for array queries)

**Note on indexes:** Indexes make queries faster by creating a quick lookup structure (like an index in a book). They're essential for fields that are frequently used in WHERE clauses or JOIN conditions. GIN indexes are specialized for array and JSON data types.

### Row-Level Security Policies
All tables must have RLS enabled with policies ensuring:
1. Users can only access data from their own `business_id`
2. Students can only see their own packages and attendance
3. Instructors can see all students in their business
4. Owners have full access to their business data

---

## User Roles & Permissions

### Owner (Business Admin)
**Can:**
- All instructor capabilities
- Add/remove instructors
- Configure payment integration
- Edit business settings and branding
- Create/edit/delete package types
- View financial reports
- Delete business data

**Cannot:**
- Access other businesses' data

### Instructor
**Can:**
- Mark attendance for any class they teach
- View all students in their business
- View student package balances
- Manually add packages for students (cash payments)
- View class schedules
- Add notes to attendance records

**Cannot:**
- Modify payment settings
- Add/remove other instructors
- Delete business data
- Access financial reports

### Student
**Can:**
- View their own packages and balances
- View their attendance history
- Purchase new packages (if payment enabled)
- View class schedule
- Update their own profile
- Mark themselves present for a class (self-check-in):
  - Available starting 1 hour before scheduled class time
  - Available until class ends
  - Cannot unmark themselves once checked in

**Cannot:**
- See other students' data
- Mark attendance for other students
- Unmark their own attendance
- Access business settings
- View financial information

---

## Phase 1: MVP (Weeks 1-2)

**Goal:** Build a working prototype for a single dance instructor to replace her physical punch card system.

### Scope
**Single tenant only** - Built specifically for the first instructor, multi-tenancy considerations in architecture but not implemented in UI.

### Features to Implement

#### Authentication
- [x] Supabase authentication setup
- [x] Instructor login (email/password)
- [x] Student login (email/password)
- [x] Password reset flow

#### Instructor Dashboard
- [x] Create student accounts (manual entry)
- [x] View list of all students with current package status
- [x] Quick attendance marking interface:
  - Select student
  - Confirm attendance
  - Deduct from active package automatically
- [x] Manually add packages for students
  - Student selector
  - Package type (5-class, 10-class, unlimited, custom)
  - Payment method (cash, Venmo, other)
  - Amount paid
- [x] Create recurring class schedules:
  - Day of week selector (Sunday-Saturday)
  - Time picker (e.g., 7:00 PM)
  - Duration (e.g., 60 minutes)
  - Class type (e.g., Beginner Ballet)
  - Start date (defaults to current date)
  - Optional end date (leave blank for ongoing)
  - Timezone support
- [x] View and edit recurring class schedules:
  - List all recurring schedules
  - Edit existing schedules (affects future classes only)
  - Deactivate/delete schedules
- [x] Create one-time classes:
  - Specific date and time
  - Class type
  - Duration
- [x] View class schedule/calendar:
  - See generated class instances
  - Filter by date range, class type
  - Cancel individual class instances if needed

#### Student Portal
- [x] View current package(s) and remaining classes
- [x] View attendance history (list of past classes attended)
- [x] Basic profile view (name, email, phone)
- [x] View upcoming class schedule
- [x] Self-check-in for classes:
  - Available starting 1 hour before class start time
  - Available until class ends
  - One-click check-in button
  - Visual confirmation after check-in
  - Cannot undo once checked in (must ask instructor to remove if mistake)

#### Package Management
- [x] Pre-defined package types (5-class, 10-class, unlimited monthly)
- [x] Packages have expiration dates (configurable per type)
- [x] System automatically marks packages as expired
- [x] Active package selection logic (uses oldest first, closest to expiration first)

#### Database Setup
- [x] All tables created per data model (including recurring_schedules)
- [x] Row-level security policies
- [x] Sample data for testing
- [x] Scheduled function/cron job to generate class instances:
  - Runs at the beginning of each month (e.g., 1st day at midnight)
  - Generates class instances for the next 2 months from all active recurring schedules
  - Checks for existing classes to avoid duplicates
  - Uses Supabase Edge Functions or pg_cron for automation

### Out of Scope for Phase 1
- ❌ Private lesson scheduling - this comes in Phase 1.5
- ❌ Payment integration (Stripe/Square) - this comes in Phase 2
- ❌ Email notifications
- ❌ Multi-tenant UI (onboarding, business signup) - this comes in Phase 3
- ❌ Native mobile application - this comes in Phase 4
- ❌ Advanced scheduling features (substitute instructors, class capacity limits, waitlists)
- ❌ Reporting/analytics

### Deliverables
1. Deployed web application (Vercel)
2. Supabase project configured
3. Instructor and student login credentials
4. Basic user documentation

### Success Criteria
- Instructor can mark attendance in under 10 seconds
- Students can self-check-in easily from their devices
- Students can view their balance accurately
- System correctly deducts classes and handles expiration
- Instructor can create recurring schedules easily
- Class instances generate automatically without manual intervention
- Generated classes appear correctly on schedule view
- Self-check-in time window enforced correctly (1 hour before to class end)
- Application is mobile-responsive (works on phones)

---

## Phase 1.5: Private Lessons (Weeks 3-4)

**Goal:** Add private lesson scheduling and tracking so instructors can manage both group classes and private lessons in one system.

### Scope
Still single tenant (your friend's business only). Private lessons are tracked separately from group classes and packages.

### Features to Implement

#### Instructor Features
- [x] Schedule one-time private lesson:
  - Select student(s) (1-5 students: solo, couple, or small group)
  - Date and time picker
  - Duration (default 60 minutes, customizable)
  - Lesson type (e.g., "Salsa Private", "Wedding Dance", "Technique Coaching")
  - Optional price
  - Payment tracking (cash, Venmo, or "paid" checkbox)
  - Optional notes
- [x] Schedule recurring private lesson:
  - Same fields as one-time
  - Recurrence pattern (weekly, biweekly, monthly)
  - Start date and optional end date
  - Generates private lesson instances automatically
- [x] View private lesson schedule:
  - Calendar view showing both group classes and private lessons
  - Filter by date range
  - See upcoming and past private lessons
- [x] Mark private lesson as completed:
  - Quick complete button
  - Add post-lesson notes
  - Track payment if not already marked paid
- [x] Cancel private lesson:
  - Cancel individual instances
  - Cancel entire recurring series
  - Optional cancellation reason/note
- [x] Edit private lesson details:
  - Reschedule date/time
  - Change students
  - Update notes or payment status

#### Student Features
- [x] View upcoming private lessons on dashboard:
  - Integrated with group class schedule
  - Show date, time, instructor, lesson type
  - Clear visual distinction from group classes
- [x] View past private lessons:
  - History of completed private lessons
  - See notes from instructor (if shared)
- [x] Unified schedule view:
  - See both group classes and private lessons
  - Chronological order
  - Color-coded by type

#### Database & Technical
- [x] `private_lessons` table created (see data model)
- [x] Recurring private lessons use `recurring_schedules` table with flag
- [x] GIN index on `student_ids` array for efficient queries
- [x] API endpoints for CRUD operations on private lessons
- [x] Validation: prevent double-booking instructors
- [x] Validation: prevent scheduling private lessons during group classes

### Out of Scope for Phase 1.5
- ❌ Automated payment processing (comes in Phase 2)
- ❌ Student-initiated private lesson requests
- ❌ Calendar sync (Google Calendar, iCal)
- ❌ Automatic reminders/notifications (comes with email system)
- ❌ Integration with packages (e.g., "includes 1 private lesson")

### Deliverables
1. Private lesson scheduling functional for instructors
2. Students can view their private lessons
3. Unified schedule showing both class types
4. Recurring private lessons generate automatically
5. Payment tracking (manual) works for private lessons

### Success Criteria
- Instructor can schedule private lesson in under 30 seconds
- Students can easily see their upcoming private lessons
- Recurring private lessons generate correctly
- No scheduling conflicts (instructor double-booked)
- Schedule view clearly distinguishes group classes from private lessons
- Your friend is using the system to track all her private lessons

---

## Phase 2: Payment Integration (Weeks 5-8)

**Goal:** Enable automated online payment processing so students can purchase packages directly through the app using Stripe Connect.

### Scope
Still single tenant (your friend's business only), but with full payment processing capabilities for packages and optionally for private lessons. Build with Stripe Connect architecture from the start to avoid migration issues when going multi-tenant.

### Payment Provider Strategy

**Recommended Implementation Order:**

1. **Stripe (Weeks 5-6)** - Implement first
   - Use Stripe Connect (OAuth flow)
   - Platform account for your app
   - Businesses connect their Stripe accounts
   - Most developer-friendly, best documentation
   
2. **PayPal (Week 7)** - Implement second (optional)
   - Use PayPal Partner/Commerce Platform
   - Alternative payment option
   - Good for PayPal-preferring users
   
3. **Square (Week 8)** - Implement third (optional)
   - Use Square OAuth
   - For businesses needing in-person card readers
   - Alternative payment option

**Note:** Start with Stripe only. Add PayPal and Square later if businesses request them or if your friend needs alternative options. All three use OAuth/Connect patterns to avoid storing raw API keys.

### Why OAuth/Connect from the Start

**Benefits of OAuth flows (Stripe Connect, Square OAuth, PayPal Partners):**
- ✅ More secure - never store raw API keys
- ✅ Professional onboarding - one-click account connection
- ✅ No migration needed when going multi-tenant in Phase 3
- ✅ Can charge platform fees later (optional)
- ✅ Businesses manage their own accounts and see transactions in their dashboards
- ✅ Less code to maintain (provider handles security)
- ✅ Automatic compliance with PCI-DSS

**Avoid Direct API Keys:**
- ❌ Would require encryption system
- ❌ Manual key management
- ❌ Security liability on you
- ❌ Requires painful migration to OAuth later
- ❌ More code to maintain

### Features to Implement

#### Stripe Connect Setup
- [x] Create Stripe Connect platform account
- [x] Configure OAuth redirect URLs
- [x] Implement OAuth callback endpoint
- [x] Create "Connect Stripe Account" button in business settings
- [x] Handle OAuth authorization flow
- [x] Store connected account ID with business
- [x] Test in Stripe test mode

#### Payment Provider Setup (Stripe Primary)
- [x] Implement Stripe Connect payment flow
- [x] Integrate Stripe SDK into Next.js app
- [x] Configure webhook endpoints for payment events
- [x] Set up test mode for development and testing
- [x] Handle connected account charges
- [x] Optional: Configure platform fees (if charging businesses)

#### Student Package Purchase Flow
- [x] Package browsing page:
  - Display all available package types
  - Show pricing, class count, expiration info
  - Clear descriptions
- [x] Checkout flow:
  - Select package
  - Secure payment form (Stripe Checkout or Square Payment Form)
  - Payment processing
  - Success/failure handling
- [x] Automatic package creation upon successful payment:
  - Webhook receives payment confirmation
  - Package record created in database
  - Student immediately sees new package in their account
- [x] Payment confirmation:
  - Success page after purchase
  - Email receipt
  - Package details displayed

#### Payment Management
- [x] Student payment history page:
  - List all purchases
  - Date, amount, package type
  - Payment method
  - Receipt download/view
- [x] Instructor/Owner payment tracking:
  - Manual package entry still available (for cash/Venmo)
  - View all payments received
  - Filter by date range, payment method
  - Basic revenue reporting (total by month)
- [x] Optional: Private lesson payment integration:
  - Students can pay for private lessons online
  - Or instructors can mark as paid manually
  - Track private lesson revenue separately from packages

#### Error Handling
- [x] Failed payment handling:
  - Clear error messages to students
  - Retry mechanism
  - Webhook retry logic (if webhook delivery fails)
- [x] Refund process (manual for now):
  - Owner can issue refund through payment provider dashboard
  - Manual package deactivation in app

#### Security
- [x] Payment credentials securely stored (environment variables)
- [x] HTTPS enforced on all payment pages
- [x] PCI compliance maintained by payment provider
- [x] No credit card data stored in database

### Out of Scope for Phase 2
- ❌ Multi-tenant architecture and onboarding (comes in Phase 3)
- ❌ Native mobile application (comes in Phase 4)
- ❌ Automated email notifications (beyond payment confirmation)
- ❌ Advanced analytics
- ❌ Subscription/recurring payments (monthly memberships)
- ❌ Package integration with private lessons

### Deliverables
1. Fully functional payment integration
2. Students can purchase packages online
3. Packages automatically created upon payment
4. Payment webhook handling tested and reliable
5. Payment history views for students and owner
6. Documentation on handling refunds and payment issues

### Success Criteria
- End-to-end Stripe Connect payment flow works smoothly
- Your friend can connect her Stripe account with one click
- Webhook reliability: 99%+ success rate
- Zero failed payments due to integration issues
- Students receive packages immediately after payment
- Your friend receives funds according to Stripe payout schedule
- Payment security audit passed (OAuth flow eliminates many vulnerabilities)
- Multi-tenant architecture ready (no migration needed for Phase 3)

---

---

## Phase 3: Multi-tenant Platform (Months 2-4)

**Goal:** Transform the single-tenant app into a true SaaS platform supporting multiple independent businesses.

### Context
At this point, your friend has been using the web app successfully with payments integrated. Now it's time to open the platform to other dance studios and instructors.

### Features to Implement

#### Business Onboarding
- [x] Public signup page for new businesses
- [x] Business profile setup wizard:
  - Business name
  - Logo upload
  - Color scheme picker (primary and secondary colors)
  - Contact information
- [x] Owner account creation during signup
- [x] Subdomain or path-based routing (e.g., `janes-dance.app.com` or `app.com/janes-dance`)
- [x] Onboarding checklist:
  - Complete business profile
  - Set up payment processing
  - Create package types
  - Invite first instructor (if not owner)
  - Add first students

#### Multi-tenant Web App Enhancements
- [x] Dynamic branding throughout application:
  - Business logo in header
  - Custom color scheme applied globally
  - Business name displayed prominently
- [x] Tenant routing and isolation:
  - Business-specific URLs
  - All data properly filtered by business_id
- [x] Thorough tenant isolation testing:
  - Verify no data leakage between businesses
  - Security audit of RLS policies
  - Penetration testing
- [x] Business switcher (if a user belongs to multiple businesses):
  - Rare but needed for consultants/multi-studio instructors

#### Enhanced Business Owner Features
- [x] Instructor management:
  - Invite instructors via email
  - Set permissions (all instructors have same permissions for now)
  - Deactivate instructors
  - View instructor activity log
- [x] Package type management (full CRUD):
  - Create custom package types
  - Edit pricing, class counts, expiration
  - Deactivate outdated packages
  - Set which class types each package is valid for
- [x] Class type management:
  - Create/edit class types (Beginner Ballet, etc.)
  - Specify if certain packages don't apply
- [x] Business settings page:
  - Edit branding (logo, colors)
  - Payment provider configuration
  - Notification preferences
  - Expiration rules (strict vs flexible)
  - Low balance threshold
- [x] Basic analytics dashboard:
  - Total revenue (month-to-date, last month, all time)
  - Active students count
  - Active packages count
  - Packages sold this month
  - Attendance trends (graph)
  - Most popular package types

#### Payment Integration Updates
- [x] Multi-tenant payment routing via OAuth/Connect:
  - Each business connects their own Stripe/Square/PayPal account via OAuth
  - Payments route to correct business automatically
  - Same OAuth architecture from Phase 2 - no changes needed
  - Platform optionally takes fees (configurable per business)
- [x] Payment onboarding wizard for new businesses:
  - Choose payment provider: Stripe (recommended), PayPal, or Square
  - One-click "Connect [Provider] Account" button
  - OAuth authorization flow redirects to provider
  - Business authorizes connection
  - Returns to app with connected account ID
  - Connection verified and saved
- [x] Per-business payment provider selection:
  - Each business can choose their preferred provider
  - Some use Stripe, some use PayPal, some use Square
  - App handles all three seamlessly

#### Notifications Expansion
- [x] Email notifications via Supabase/SendGrid:
  - Low balance warning (configurable threshold)
  - Package expiration reminder (configurable timing)
  - Payment confirmation
  - Attendance confirmation (opt-in)
  - Instructor invitation emails
  - Welcome emails for new students
- [x] Email templates with business branding
- [x] Notification preferences per user
- [x] Admin notification settings per business

#### Enhanced Instructor Features
- [x] Class roster view:
  - See attendance for past classes
  - Export attendance records
- [x] Bulk attendance marking:
  - Select multiple students at once
  - Quick checkbox interface
- [x] Advanced scheduling features:
  - Substitute instructor assignment
  - Class notes and announcements

#### Enhanced Student Features
- [x] Class schedule view:
  - See upcoming classes
  - Filter by class type
  - See which instructor is teaching
- [x] Package purchase history:
  - All past purchases with receipts
  - Refund status if applicable
- [x] Account verification:
  - Email verification
  - Phone verification (optional)

#### Technical Enhancements
- [x] Comprehensive error handling and user-friendly error messages
- [x] Logging and monitoring:
  - Error tracking (Sentry or similar)
  - Performance monitoring
  - Usage analytics
- [x] Database query optimization:
  - Proper indexing
  - Query performance testing under load
- [x] Automated testing:
  - Unit tests for critical business logic
  - Integration tests for key workflows
  - End-to-end tests for user journeys
- [x] Code documentation:
  - API documentation
  - Component documentation
  - Setup guide for new developers
- [x] CI/CD pipeline:
  - Automated testing on pull requests
  - Automated deployment to staging
  - Manual approval for production deployment
- [x] Scheduled class generation system:
  - Automated monthly job to generate classes 2 months ahead
  - Duplicate detection to avoid recreating existing classes
  - Logging and monitoring of generation process
  - Manual trigger option for testing/debugging

### Deliverables
1. Multi-tenant web application with self-service onboarding
2. Payment processing working for multiple businesses independently
3. Email notification system with business branding
4. Admin and developer documentation
5. 5-10 beta test businesses successfully onboarded
6. Marketing website explaining the platform

### Success Criteria
- Multiple businesses operating independently on the platform
- Zero data leakage between tenants (verified through testing)
- New businesses can onboard without developer assistance
- Payment routing works correctly for all businesses
- 95%+ uptime maintained
- Average onboarding time <30 minutes
- Customer satisfaction score 4+/5 from beta users
- Your friend continues using the platform successfully alongside new businesses

---

## Phase 4: Mobile Application (Months 4-6)

**Goal:** Launch native mobile apps (iOS & Android) with dynamic branding for all businesses on the platform.

### Context
At this point, multiple dance studios are using the web platform successfully. Now it's time to provide mobile apps that work for all of them with dynamic branding.

### Scope
Multi-tenant mobile app with dynamic branding. Each business's students and instructors see their own studio's branding when they log in.

### Features to Implement

#### React Native App
- [x] iOS and Android apps
- [x] Single app published to both app stores under your brand
- [x] Dynamic branding based on user's business:
  - Fetch business logo, colors, name from Supabase on login
  - Apply theme throughout app
  - Business name displayed prominently
- [x] Authentication:
  - Login with email/password
  - Password reset
  - Biometric authentication (Face ID, Touch ID, fingerprint)
  - Remember me / auto-login
- [x] Business selection on first login:
  - Enter business code (e.g., "janes-dance")
  - Or automatic detection based on email
  - Or search businesses (if enabled)

#### Student Mobile Features
- [x] Home screen showing:
  - Current package balance(s)
  - Upcoming classes
  - Recent attendance
- [x] View all packages (active, expired, depleted)
- [x] Purchase packages via mobile:
  - Same payment flow as web
  - Mobile-optimized checkout
- [x] Self-check-in for classes:
  - Available 1 hour before class starts
  - One-tap check-in
  - Cannot undo once checked in
  - Confirmation shown immediately
- [x] Attendance history with details
- [x] Class schedule view
- [x] Profile management
- [x] Push notifications:
  - Low balance alerts (2 classes remaining)
  - Package expiration warnings (2 weeks before)
  - Payment confirmations
  - Class reminders (optional)
  - Attendance confirmations (optional)

#### Instructor Mobile Features
- [x] Quick attendance marking:
  - Optimized for mobile (large touch targets)
  - Search students quickly
  - Bulk selection
  - See who has self-checked-in
  - Swipe actions for common tasks
- [x] Today's class view:
  - See who has enough credits
  - See who's close to running out
  - See who has self-checked-in
  - Quick stats
- [x] View all students:
  - Search and filter
  - See package balances
  - Contact information
- [x] Manually add packages (cash/Venmo payments)
- [x] Class schedule view
- [x] View and manage recurring schedules

#### Business Owner Mobile Features
- [x] All instructor features
- [x] View business analytics dashboard
- [x] Manage instructors (view only on mobile, full management on web)
- [x] Basic business settings access

#### Technical Implementation
- [x] React Native setup with Expo or bare workflow
- [x] Supabase React Native client
- [x] Offline support:
  - Cache data locally
  - View attendance history offline
  - Sync when back online
  - Queue actions (like self-check-in) if offline
- [x] Push notifications:
  - Firebase Cloud Messaging setup
  - Notification permission handling
  - Deep linking from notifications
- [x] Mobile-specific UX:
  - Bottom tab navigation
  - Pull to refresh
  - Haptic feedback
  - Loading states optimized for mobile
- [x] Dynamic branding system:
  - Cached branding for offline use
  - Smooth transitions when switching businesses (rare)
  - Fallback branding if business data unavailable

#### Testing
- [x] iOS testing on physical devices
- [x] Android testing on physical devices
- [x] Beta testing with multiple businesses and their students
- [x] Performance testing (load times, memory usage)
- [x] Branding verification across different businesses

#### App Store Deployment
- [x] Apple Developer account setup ($99/year)
- [x] Google Play Developer account setup ($25 one-time)
- [x] App icons and splash screens (your brand)
- [x] Screenshots for store listings showing multi-business capability
- [x] App descriptions and metadata
- [x] Privacy policy URL
- [x] Terms of service URL
- [x] Submit to both app stores
- [x] Navigate approval process

### Out of Scope for Phase 4
- ❌ True white-label apps (separate app per business)
- ❌ Advanced offline functionality (full CRUD operations offline)
- ❌ In-app video streaming

### Deliverables
1. iOS app on Apple App Store
2. Android app on Google Play Store
3. Push notification system functional for all businesses
4. Dynamic branding working correctly across businesses
5. Self-check-in feature tested and working
6. User guides for students, instructors, and owners
7. Beta test feedback from multiple businesses incorporated

### Success Criteria
- Apps approved and live in both stores
- Branding displays correctly for all businesses
- Core workflows work smoothly on mobile
- Self-check-in reduces instructor workload
- Push notifications deliver reliably
- 4+ star average rating from users
- <3 second launch time
- Positive feedback from at least 3 different businesses

---

## Phase 5: Growth & Scaling (Month 6+)

**Goal:** Optimize, add advanced features, and scale the business.

### Features to Consider

#### Advanced Package Types (Weekly-Limit Packages)
Support for non-consecutive monthly packages with weekly class limits:
- **Use case:** Multi-instructor studios that sell packages like "2-month 3x/week pass"
- **Key features:**
  - Student purchases X months of Y classes per week
  - Months activate on-demand (not consecutively)
  - First attendance of a month starts that month's period
  - Month expires at end of calendar month
  - Next month doesn't start until student attends again
  - Missed weeks/classes don't roll over
- **Database additions:**
  - `package_structure` field on package_types (fixed_count | weekly_limit | unlimited)
  - `package_month_activations` table to track when each month was used
  - Extended validation logic for weekly attendance limits
- **Business configuration:**
  - Allow businesses to choose which package structures they offer
  - Support mixed package types within same business
- **Student features:**
  - Clear display of "Month 1 of 2: 2/3 classes this week"
  - Show when current month expires
  - Show remaining months available
- **See Appendix for detailed implementation logic**

#### Level-Based Class Assignment
For dance studios with skill-based progression:
- Assign students to specific classes based on skill level
- Track progression through levels (beginner → intermediate → advanced)
- Instructor recommendations for level changes
- Per-dance-style level tracking (salsa level 2, bachata level 1, etc.)

#### Advanced Analytics
- Revenue reports (by month, quarter, year)
- Student retention metrics
- Package popularity analysis
- Attendance trends and patterns
- Instructor performance metrics
- Export to CSV/PDF

#### Advanced Student Features
- Class booking/reservation (if capacity limits needed)
- Waitlist functionality
- Referral program (invite friends, get discount)
- In-app messaging with instructors
- Review/rating system for classes

#### Advanced Instructor Features
- Automated class reminders to students
- Substitute instructor assignment
- Private lesson scheduling and tracking
- Progress notes for students

#### Business Features
- Multi-location support (for franchise or multiple studios)
- Staff roles (beyond owner/instructor, add front desk, manager)
- Gift card/voucher system
- Membership tiers beyond class packages
- Integration with other platforms (Google Calendar, Mailchimp, etc.)

#### Marketing Features
- Landing page builder for businesses
- Custom domain support per business
- Email marketing campaigns
- Promotional codes and discounts
- Social media integration (share attendance milestones)

#### Technical Enhancements
- Progressive Web App (PWA) for installable web app
- Advanced caching and performance optimization
- A/B testing framework
- Internationalization (multi-language support)
- Advanced security (2FA, audit logs)

### Monetization Strategy
- Tiered subscription model:
  - **Free tier:** 1 instructor, up to 50 students, basic features
  - **Pro tier ($50/month):** Up to 5 instructors, 200 students, analytics, email support
  - **Business tier ($150/month):** Unlimited instructors/students, all features, priority support, custom branding
- Transaction fee model: 1-2% of payments processed (alternative to subscriptions)
- Setup/onboarding fee for custom implementations

---

## Payment Integration

### Decision: Stripe vs. Square vs. PayPal

**Evaluate based on first client's needs:**

#### Choose Stripe if:
- Primary need is online package purchases via web/mobile app
- No immediate need for in-person card readers
- Want maximum API flexibility and best developer experience
- International expansion possible
- Best documentation and developer tools

**Stripe Setup:**
- Use Stripe Checkout for quick implementation
- Webhook handling for payment events
- Store Stripe customer ID with each student
- Store Stripe payment intent ID with each package

**Pricing:** 2.9% + $0.30 per online transaction, 2.7% + $0.05 for in-person (with card reader)

#### Choose Square if:
- Need in-person card reader immediately
- Want unified POS and online payments
- Simpler merchant dashboard preferred
- US-focused business
- Free card reader hardware

**Square Setup:**
- Use Square Payment API
- Square webhooks for payment events
- Store Square customer ID with each student
- Optional: Square Terminal API for card readers

**Pricing:** 2.9% + $0.30 per online transaction, 2.6% + $0.10 for in-person (with card reader)

#### Choose PayPal if:
- Students/parents prefer PayPal (very common)
- Want to accept both PayPal wallet and credit cards
- Good for businesses with international students
- Can also accept Venmo through same integration (PayPal owns Venmo)
- Trusted brand name many users already have accounts with

**PayPal Setup:**
- Use PayPal Commerce Platform API
- Webhook handling for payment events
- Store PayPal transaction ID with each package
- Supports guest checkout (credit card without PayPal account)

**Pricing:** 2.99% + $0.49 per online transaction, 2.29% + $0.09 for in-person (with card reader)

**Note:** All three providers support automated payment tracking via webhooks and can be integrated with the app. The choice depends on instructor/studio preferences and student demographics.

### Payment Provider Comparison Table

| Feature | Stripe | Square | PayPal |
|---------|--------|--------|--------|
| **Online Rate** | 2.9% + $0.30 | 2.9% + $0.30 | 2.99% + $0.49 |
| **In-Person Rate** | 2.7% + $0.05 | 2.6% + $0.10 | 2.29% + $0.09 |
| **Developer Experience** | Excellent | Good | Good |
| **Documentation** | Best-in-class | Good | Adequate |
| **Card Reader** | $59+ | Free | $29+ |
| **International** | Excellent | Limited | Excellent |
| **User Recognition** | High | High | Very High |
| **Guest Checkout** | Yes | Yes | Yes |
| **Mobile Wallet** | Apple/Google Pay | Apple/Google Pay | PayPal/Venmo |
| **Payout Speed** | 2-7 days | 1-2 days | 1-3 days |
| **Best For** | Online-first, developers | In-person + online | PayPal loyalists, international |

### Payment Flow

#### Online Purchase (Student):
1. Student browses package types in app
2. Selects package, clicks "Purchase"
3. Redirected to Stripe Checkout (or Square payment form)
4. Completes payment
5. Webhook received by backend
6. Package automatically created and assigned to student
7. Confirmation email sent

#### Manual Entry (Instructor/Owner):
1. Student pays via cash, Venmo, etc.
2. Instructor selects student in app
3. Clicks "Add Package"
4. Enters: package type, amount paid, payment method
5. Package created immediately
6. No external payment processor involved

### Security Considerations
- Never store credit card numbers in database
- Use Stripe/Square/PayPal tokenization
- PCI compliance maintained by payment processor
- Use OAuth/Connect flows - no raw API keys stored
- Connected account IDs are non-sensitive and can be stored in plain text
- All payment credentials managed by payment providers
- HTTPS required for all payment pages

**OAuth/Connect Security Benefits:**
- No need to encrypt payment credentials
- No key rotation management
- Reduced security liability
- Automatic compliance with payment provider security standards
- Businesses can revoke access at any time through their payment provider dashboard

---

## Security & Compliance

### Data Security
- All data encrypted at rest (Supabase default)
- All data encrypted in transit (HTTPS/TLS)
- Row-level security enforced on all tables
- Payment provider connected account IDs stored (non-sensitive)
- OAuth/Connect flows used for payment integration (no raw API keys)
- Regular security audits

### Authentication & Authorization
- Email/password authentication via Supabase Auth
- Password requirements: minimum 8 characters
- Password reset flow via email
- Session management (JWT tokens, auto-refresh)
- Role-based access control (RLS policies)

### Privacy & Compliance
- Privacy policy published and accessible
- Terms of service published and accessible
- GDPR considerations:
  - Data export capability for users
  - Account deletion capability
  - Data retention policies
- COPPA compliance (no users under 13 without parental consent)

### Data Backup & Recovery
- Automatic daily backups (Supabase)
- Point-in-time recovery capability
- Disaster recovery plan documented

### Monitoring & Logging
- Error logging (Sentry or similar)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (UptimeRobot or similar)
- Security incident response plan

---

## Future Considerations

### Potential Features (Not Committed)
- Video class integration (Zoom, Google Meet)
- Attendance via QR code scanning
- Biometric check-in (at physical studio)
- Integration with accounting software (QuickBooks, Xero)
- AI-powered scheduling optimization
- Student progress tracking and goals
- Certification/achievement badges
- Family/group accounts (parent pays for multiple children)
- Class recording storage and replay
- Inventory management (for studios selling merchandise)

### Scalability Considerations
- Database optimization as user base grows
- CDN for static assets and images
- Caching layer (Redis) if needed
- Microservices architecture if monolith becomes limiting
- Multi-region deployment for expansion

### Potential White-Label Evolution
If businesses specifically request fully branded apps:
- Custom app store listings per business
- Separate iOS/Android builds per business
- Requires significant infrastructure (CI/CD for multiple apps)
- Separate Apple/Google developer accounts per business
- Pricing model: $200+/month per business to justify complexity

**Recommendation:** Only pursue if 10+ businesses request and are willing to pay premium pricing.

---

## Technical Specifications Summary

### Development Environment
- Node.js 18+ (LTS)
- npm or yarn for package management
- Git for version control
- VS Code or similar IDE

### Required Accounts & Services
- **Supabase** (free tier for development, paid for production)
- **Vercel** (free tier for development, paid for production)
- **Stripe or Square** (business account)
- **Apple Developer Program** ($99/year) - for Phase 3
- **Google Play Developer** ($25 one-time) - for Phase 3
- **Email service** (SendGrid, Resend, or Supabase built-in)
- **Domain registrar** (for custom domain)

### Performance Requirements
- Page load time: <2 seconds
- API response time: <500ms (95th percentile)
- Mobile app launch time: <3 seconds
- Attendance marking: <10 seconds end-to-end

### Browser/Device Support
- **Web:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile:** iOS 14+, Android 10+
- Responsive design: 320px to 4K displays

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Minimum font size: 14px for body text

---

## Implementation Details: Advanced Package Types

### Weekly-Limit Package Logic

This section provides detailed implementation guidance for supporting non-consecutive monthly packages with weekly class limits.

#### Database Schema

Already included in main data model:
- `package_types.package_structure` field
- `packages` table with monthly tracking fields
- `package_month_activations` table

#### Attendance Validation Algorithm

**Pseudocode for determining if student can attend:**

```javascript
async function canAttend(student, package, classDate) {
  const packageType = package.package_type;
  
  // For weekly-limit packages
  if (packageType.package_structure === 'weekly_limit') {
    
    // Check if there's an active month
    const activeMonth = await getActiveMonthActivation(package, classDate);
    
    // If no active month, check if months remaining
    if (!activeMonth) {
      if (package.months_remaining === 0) {
        return { 
          allowed: false, 
          reason: 'No months remaining in package' 
        };
      }
      // Will auto-activate month on attendance
      return { 
        allowed: true, 
        willActivateMonth: true,
        message: 'This will activate your next month' 
      };
    }
    
    // Check if active month has expired
    if (classDate > activeMonth.expires_at) {
      return {
        allowed: false,
        reason: 'Current month expired. Attend any class to activate next month.'
      };
    }
    
    // Check weekly attendance within this active month
    const weekStart = getWeekStart(classDate);
    const weekEnd = getWeekEnd(classDate);
    const attendanceThisWeek = await countAttendanceInWeek(
      student, 
      package, 
      weekStart, 
      weekEnd,
      activeMonth
    );
    
    if (attendanceThisWeek >= package.classes_per_week) {
      return { 
        allowed: false, 
        reason: `Already attended ${attendanceThisWeek}/${package.classes_per_week} classes this week`
      };
    }
    
    return { 
      allowed: true,
      message: `${attendanceThisWeek + 1}/${package.classes_per_week} classes this week`
    };
  }
  
  // For fixed-count packages (traditional system)
  if (packageType.package_structure === 'fixed_count') {
    return { 
      allowed: package.classes_remaining > 0 && package.status === 'active',
      reason: package.classes_remaining === 0 ? 'No classes remaining' : null
    };
  }
  
  // For unlimited packages (future)
  if (packageType.package_structure === 'unlimited') {
    return {
      allowed: package.status === 'active' && !isExpired(package),
      reason: isExpired(package) ? 'Package expired' : null
    };
  }
}
```

#### Recording Attendance

**Pseudocode for marking attendance:**

```javascript
async function recordAttendance(student, package, classInstance, recordedBy) {
  const packageType = package.package_type;
  
  // Validate student can attend
  const validation = await canAttend(student, package, classInstance.scheduled_at);
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }
  
  // If weekly-limit package and no active month, activate one
  if (packageType.package_structure === 'weekly_limit') {
    const activeMonth = await getActiveMonthActivation(
      package, 
      classInstance.scheduled_at
    );
    
    if (!activeMonth) {
      await activateNextMonth(package, classInstance.scheduled_at);
    }
  }
  
  // Create attendance record
  const attendance = await createAttendanceRecord({
    class_id: classInstance.id,
    student_id: student.id,
    package_id: package.id,
    business_id: package.business_id,
    recorded_by: recordedBy.id,
    recorded_at: new Date()
  });
  
  // Deduct from package if fixed-count
  if (packageType.package_structure === 'fixed_count') {
    await decrementPackageClasses(package);
  }
  
  return attendance;
}
```

#### Month Activation

**Pseudocode for activating a new month:**

```javascript
async function activateNextMonth(package, attendanceDate) {
  // Calculate which month number this is
  const monthNumber = package.total_months - package.months_remaining + 1;
  
  // Get last day of the calendar month
  const lastDayOfMonth = new Date(
    attendanceDate.getFullYear(),
    attendanceDate.getMonth() + 1,
    0 // 0th day of next month = last day of current month
  );
  
  // Create month activation record
  const activation = await createMonthActivation({
    package_id: package.id,
    business_id: package.business_id,
    month_number: monthNumber,
    activated_at: attendanceDate,
    expires_at: lastDayOfMonth,
    status: 'active'
  });
  
  // Update package
  const newMonthsRemaining = package.months_remaining - 1;
  await updatePackage(package.id, {
    months_remaining: newMonthsRemaining,
    status: newMonthsRemaining === 0 ? 'depleted' : 'active'
  });
  
  return activation;
}
```

#### Helper Functions

```javascript
function getWeekStart(date) {
  // Assuming week starts on Sunday (adjust based on business preference)
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}

async function getActiveMonthActivation(package, date) {
  return await db.query(`
    SELECT * FROM package_month_activations
    WHERE package_id = $1
    AND status = 'active'
    AND expires_at >= $2
    LIMIT 1
  `, [package.id, date]);
}

async function countAttendanceInWeek(student, package, weekStart, weekEnd, activeMonth) {
  return await db.query(`
    SELECT COUNT(*) FROM attendance
    WHERE student_id = $1
    AND package_id = $2
    AND recorded_at >= $3
    AND recorded_at <= $4
  `, [student.id, package.id, weekStart, weekEnd]);
}
```

#### Scheduled Job: Expire Old Months

Run daily to mark expired month activations:

```javascript
async function expireOldMonths() {
  const today = new Date();
  
  await db.query(`
    UPDATE package_month_activations
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < $1
  `, [today]);
  
  // Log for monitoring
  console.log(`Expired months as of ${today}`);
}
```

#### UI Considerations

**For students viewing weekly-limit packages:**
```
Your Package: 2-Month 3x/Week Pass

Month 1 of 2: ACTIVE
├─ Started: Nov 15, 2025
├─ Expires: Nov 30, 2025
└─ This week: 2/3 classes used

Month 2 of 2: Not yet activated
└─ Will start when you attend after Month 1 expires
```

**When checking in:**
- Show clear message if activating new month
- Show weekly progress after check-in
- Warn if month is expiring soon

**For instructors marking attendance:**
- See student's weekly limit and usage
- Warning if student has reached weekly limit
- Ability to override in special cases (make-up class, etc.)

---

## Appendix

### Glossary
- **Tenant:** A business (dance studio, fitness center) using the platform
- **Package:** A class pass purchased by a student (e.g., 5-class pass)
- **Package Type:** A template defining what can be purchased (e.g., "10 classes for $100")
- **Attendance:** A record of a student attending a class
- **Class:** A scheduled session taught by an instructor
- **Class Type:** Category of class (e.g., "Beginner Ballet", "Advanced Hip Hop")

### Key Workflows

#### Workflow 1: Student Purchases Package Online
1. Student logs into web/mobile app
2. Navigates to "Buy Packages"
3. Selects desired package (e.g., "10-Class Pass - $100")
4. Clicks "Purchase"
5. Redirected to Stripe Checkout
6. Enters payment information and confirms
7. Stripe processes payment
8. Webhook sent to app backend
9. Backend creates package record in database
10. Student receives confirmation email
11. Package appears in student's account immediately

#### Workflow 2: Instructor Marks Attendance
1. Instructor logs into web/mobile app
2. Navigates to "Mark Attendance" or "Today's Class"
3. Sees list of students (optionally filtered by recent attendees)
4. Selects student(s) who attended
5. Confirms attendance
6. System:
   - Creates attendance record
   - Identifies student's active package
   - Deducts 1 class from package
   - Updates package status if depleted/expired
7. Confirmation message shown
8. Optional: Student receives confirmation notification

#### Workflow 3: Instructor Creates Recurring Class Schedule
1. Instructor logs into web app
2. Navigates to "Schedule" or "Create Class"
3. Selects "Recurring Class"
4. Fills out form:
   - Class type: "Beginner Ballet"
   - Day of week: Tuesday
   - Time: 7:00 PM
   - Duration: 60 minutes
   - Start date: Next Tuesday (or custom date)
   - End date: (leave blank for ongoing)
5. Confirms creation
6. System:
   - Creates recurring_schedule record
   - Immediately generates class instances for next 2 months
   - Displays confirmation with list of generated classes
7. Instructor can view all generated classes on schedule/calendar
8. At the beginning of each month, automated job:
   - Checks all active recurring schedules
   - Generates new class instances for 2 months ahead
   - Skips any classes that already exist

#### Workflow 4: Student Self-Check-In
1. Student logs into web app (mobile-responsive)
2. Navigates to "Classes" or home page shows upcoming classes
3. Sees "Beginner Ballet - Today at 7:00 PM" with "Check In" button
4. Button is enabled at 6:00 PM (1 hour before class)
5. Student clicks "Check In"
6. System:
   - Verifies student has active package with classes remaining
   - Verifies current time is within check-in window
   - Creates attendance record
   - Deducts 1 class from student's package
   - Updates package status if depleted/expired
7. Confirmation shown: "✓ You're checked in for Beginner Ballet!"
8. Check-in button changes to "Checked In" (disabled, cannot undo)
9. Instructor can see in their view that student checked in themselves
10. If student made a mistake, they must contact instructor to remove attendance

#### Workflow 5: Instructor Schedules Private Lesson
1. Instructor logs into web app
2. Navigates to "Schedule" → "Private Lessons" or clicks "New Private Lesson"
3. Fills out form:
   - Student(s): Selects "Sarah" (or searches and selects multiple)
   - Date: Nov 10, 2025
   - Time: 3:00 PM
   - Duration: 60 minutes
   - Lesson type: "Salsa Private Lesson"
   - Price: $75
   - Payment: Marks as "Cash - Paid"
   - Notes: "Focus on advanced turn technique"
4. Confirms creation
5. System:
   - Creates private_lesson record
   - Checks for conflicts (instructor availability, student conflicts)
   - Displays confirmation
6. Private lesson appears on:
   - Instructor's schedule for Nov 10
   - Sarah's schedule/dashboard
7. Instructor can optionally set as recurring (e.g., "Every Tuesday at 3 PM")

#### Workflow 6: Student Views Unified Schedule
1. Student logs into web app
2. Home dashboard shows upcoming schedule:
   ```
   Upcoming Schedule:
   ├─ Nov 5, 7:00 PM - Beginner Ballet (Group Class)
   ├─ Nov 7, 3:00 PM - Private Salsa Lesson with Jane
   ├─ Nov 10, 3:00 PM - Private Salsa Lesson with Jane
   ├─ Nov 12, 7:00 PM - Beginner Ballet (Group Class)
   └─ Nov 14, 3:00 PM - Private Salsa Lesson with Jane (Recurring)
   ```
3. Student can click on any item for details
4. Group classes show package deduction info
5. Private lessons show lesson type and any notes from instructor

#### Workflow 7: Business Connects Payment Provider (Phase 2+)
1. Business owner completes initial signup/settings
2. Navigates to "Payment Settings" in business admin panel
3. Sees options: Stripe (recommended), PayPal, Square
4. Clicks "Connect Stripe Account"
5. Redirected to Stripe OAuth authorization page
6. Logs into Stripe (or creates account if new)
7. Reviews permissions: "ClassTrack wants to process payments on your behalf"
8. Clicks "Connect"
9. Redirected back to app with success message
10. System stores Stripe connected account ID
11. Business can now accept online payments
12. Test payment button to verify connection
13. Done! (Takes ~2 minutes total)

**Behind the scenes:**
- No API keys entered manually
- Business maintains full control in their Stripe dashboard
- Can disconnect at any time through Stripe
- App can optionally charge platform fee

#### Workflow 8: New Business Onboarding (Phase 3+)
1. Business owner visits signup page
2. Enters email, password, business name
3. Confirms email via verification link
4. Completes business profile:
   - Upload logo
   - Choose color scheme
   - Add contact information
5. Sets up first package types
6. Connects payment processor (Stripe/Square)
7. Invites first instructor (if not owner)
8. Creates first students or shares signup link
9. Business is live and ready to use

---

## Contact & Support

**Project Owner:** [Your Name]  
**Email:** [Your Email]  
**Repository:** [GitHub URL]  
**Documentation:** [Notion/Wiki URL]

---

**End of Specifications Document**

*This document is a living document and will be updated as the project evolves. Version history will be maintained in the repository.*