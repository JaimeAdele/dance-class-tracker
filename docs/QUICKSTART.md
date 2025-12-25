# Quick Start Checklist

Follow these steps to get Prisma Dance Studio up and running.

## ✅ Supabase Setup (Do This First!)

### Step 1: Create Supabase Project
- [ ] Go to [https://supabase.com](https://supabase.com) and sign up
- [ ] Create a new project named "prisma-dance-studio"
- [ ] Choose a strong database password and save it
- [ ] Select a region close to you
- [ ] Wait for project provisioning (2-3 minutes)

### Step 2: Get API Credentials
- [ ] Go to Project Settings → API
- [ ] Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
- [ ] Copy your **anon/public key** (long string starting with `eyJ`)

### Step 3: Configure Local Environment
- [ ] Create `.env.local` file in project root:
```bash
cp .env.local.example .env.local
```
- [ ] Open `.env.local` and paste your Supabase URL and anon key
- [ ] Save the file

### Step 4: Run Database Schema
- [ ] In Supabase Dashboard, click **SQL Editor** in sidebar
- [ ] Click **New query**
- [ ] Open `docs/database-schema.sql` in your code editor
- [ ] Copy ALL the SQL code
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run** (bottom right)
- [ ] Verify no errors appear (you should see "Success" message)

### Step 5: Verify Tables Created
- [ ] In Supabase Dashboard, click **Table Editor**
- [ ] Confirm you see these tables:
  - businesses
  - users
  - package_types
  - packages
  - class_types
  - recurring_schedules
  - classes
  - attendance

### Step 6: Add Sample Data
- [ ] Back in SQL Editor, click **New query**
- [ ] Open `docs/sample-data.sql`
- [ ] Copy and paste the SQL
- [ ] Click **Run**
- [ ] Verify "Sample data inserted successfully!" message

### Step 7: Test Connection
- [ ] In terminal, run: `npm run dev`
- [ ] Open [http://localhost:3000](http://localhost:3000)
- [ ] Verify the page loads without Supabase errors
- [ ] Check terminal for any error messages

## ✅ Create First Users

You'll create these through the app once authentication is built:

### Instructor Account
- Email: `instructor@prismadance.com`
- Password: (your choice - save it!)
- Role: Instructor
- Name: Jane Smith

### Test Student Accounts
1. `student1@example.com` - Sarah Johnson
2. `student2@example.com` - Michael Chen

## 🎯 Success!

If all checkboxes are complete, you're ready to:
- ✅ Use the authentication system
- ✅ Create students and packages
- ✅ Mark attendance
- ✅ Schedule classes

## 🆘 Having Issues?

See `docs/supabase-setup.md` for detailed troubleshooting.

Common issues:
- **"Invalid API key"**: Make sure you copied the entire anon key (it's very long!)
- **Can't connect**: Restart dev server after changing `.env.local`
- **Tables missing**: Re-run the database-schema.sql script
