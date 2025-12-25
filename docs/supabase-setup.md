# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Prisma Dance Studio application.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. Once logged in, click "New Project"
2. Fill in the project details:
   - **Name:** `prisma-dance-studio` (or your preferred name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose the region closest to you
   - **Pricing Plan:** Free tier is fine for development
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

## Step 3: Get Your API Credentials

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key:** A long string starting with `eyJ...`
4. Copy these values - you'll need them in a moment

## Step 4: Configure Environment Variables

1. In your project root, copy the example file:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and add your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-long-key-here
```

## Step 5: Create Database Schema

Now we'll create all the necessary tables for the application.

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste the SQL schema from `docs/database-schema.sql`
4. Click **Run** to execute

### Option B: Using the provided script

1. Make sure you have the Supabase CLI installed:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

4. Run the migration (once we create it)

## Step 6: Verify Database Setup

1. In Supabase dashboard, click **Table Editor**
2. You should see these tables:
   - businesses
   - users
   - package_types
   - packages
   - class_types
   - recurring_schedules
   - classes
   - attendance

## Step 7: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled (it should be by default)
3. Configure email templates (optional for now):
   - Go to **Authentication** → **Email Templates**
   - Customize if desired

## Step 8: Add Sample Data

We'll add sample data for Prisma Dance Studio to get started:

1. Go back to **SQL Editor**
2. Copy and paste the sample data script from `docs/sample-data.sql`
3. Click **Run**

This will create:
- A business record for "Prisma Dance Studio"
- A sample instructor account
- A few sample student accounts
- Sample package types (5-class, 10-class, unlimited)
- Sample class types (Beginner Ballet, Intermediate Jazz, etc.)

## Step 9: Test the Connection

1. In your terminal, run:
```bash
npm run dev
```

2. The app should start without errors
3. If you see Supabase connection errors, double-check your `.env.local` file

## Troubleshooting

### "Invalid API key" error
- Make sure you copied the entire anon key (it's very long!)
- Make sure there are no extra spaces
- Restart your dev server after changing `.env.local`

### "Cannot connect to database"
- Check that your project URL is correct
- Make sure your project is not paused (free tier projects pause after inactivity)
- Wake it up by visiting the Supabase dashboard

### Tables not appearing
- Make sure you ran the entire schema script
- Check the SQL Editor output for any errors
- Try running each CREATE TABLE statement individually

## Next Steps

Once Supabase is set up, you can:
- Test authentication by logging in
- Create your first student account
- Mark attendance
- View the student portal

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
