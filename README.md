# Prisma Dance Studio - Class Attendance Tracker

A comprehensive class attendance and payment tracking system built for dance instructors and studios.

## Tech Stack

- **Frontend:** Next.js 15 with TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Row-Level Security)
- **State Management:** Zustand
- **Deployment:** Vercel (planned)

## Project Status

Currently implementing **Phase 1: MVP** - Single-tenant application for Prisma Dance Studio

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works for development)

### Installation

1. Clone the repository (already done)

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Supabase credentials (see setup guide below)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Setup

See `docs/supabase-setup.md` for detailed instructions on:
- Creating a Supabase project
- Setting up the database schema
- Configuring authentication
- Adding sample data

## Project Structure

```
├── app/                    # Next.js app directory (routes)
├── components/
│   ├── auth/              # Authentication components
│   ├── instructor/        # Instructor dashboard components
│   ├── student/           # Student portal components
│   └── shared/            # Shared/common components
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks
├── types/                 # TypeScript type definitions
└── docs/                  # Documentation
```

## Features (Phase 1)

- ✅ User authentication (instructors and students)
- 🚧 Instructor dashboard for managing students and attendance
- 🚧 Student portal for viewing packages and attendance
- 🚧 Recurring class scheduling
- 🚧 Self-check-in for students
- 🚧 Package management (5-class, 10-class, unlimited passes)

## Development Roadmap

- **Phase 1:** MVP (Current) - Core attendance tracking
- **Phase 1.5:** Private lesson scheduling
- **Phase 2:** Payment integration (Stripe)
- **Phase 3:** Multi-tenant platform
- **Phase 4:** Mobile applications
- **Phase 5:** Advanced features and scaling

## License

Proprietary - All rights reserved
