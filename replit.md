# Vacation Request Management System

## Overview

This project is a vacation request and approval system for factory workers, featuring seniority-based allocation. It includes a mobile-first "Worker App" for submitting and tracking requests and a "Supervisor App" for review, approval, and auto-allocation. The system aims for efficiency and accessibility, designed for use on a factory floor with large touch targets and clear status indicators.

## Recent Updates (November 2025)

### Auto-Allocation Fairness Enhancement
- Implemented two-phase fairness mechanism for vacation allocation
- Phase 1: Process all first choice requests by seniority order
- Phase 2: Workers who didn't get full first choice get priority for second choice over those who did
- This ensures fairness: if you lose your first choice to higher seniority, you get compensated with priority on second choice

### Conflict Highlighting for Workers
- Workers can now see which weeks conflict with higher seniority workers
- Conflicting weeks are highlighted with yellow border in worker's request view
- Warning banner displays when conflicts are detected
- Only shows conflicts with higher seniority workers (earlier joining date)

### Supervisor Approval Management
- Added revert buttons next to approved/denied weeks for granular control
- "Reset All Approvals" button to revert all requests back to pending status
- Individual week approvals can be undone without affecting other weeks
- Confirmation dialog prevents accidental full resets

### Phone Number Authentication
- Workers login using phone numbers (no validation required)
- Three seeded workers: Maria Rodriguez (5513759096), James Thompson (2272185752), Linda Martinez (2813527628)
- Phone number stored in localStorage for session persistence
- Protected routing with automatic redirect to login for unauthenticated users

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite. Routing is handled by Wouter, and state management utilizes TanStack Query for server state and React's local state for UI. The UI is designed with Shadcn UI (Radix UI primitives) and Tailwind CSS, following a mobile-first approach inspired by Material Design 3. Key UI patterns include card-based layouts, semantic status badges, calendar-based date selection, and responsive grids.

### Backend Architecture

The backend uses Node.js with Express.js. It features a RESTful API with a `/api` prefix. The server structure includes `index.ts` for main application setup, `routes.ts` for HTTP server and route registration, and `storage.ts` for the storage abstraction layer. Middleware handles JSON and URL-encoded body parsing, request logging, and error handling.

Key API Endpoints:
- `POST /api/vacation-requests/auto-allocate` - Auto-allocate with fairness mechanism
- `POST /api/vacation-requests/:id/revert-week` - Revert individual week approval/denial
- `POST /api/vacation-requests/reset-all` - Reset all approvals to pending
- `GET /api/vacation-requests/worker-conflicts/:workerId` - Get conflicting weeks for a worker
- `POST /api/auth/login` - Phone number authentication

### Data Storage Solutions

The primary database is Azure Database for PostgreSQL, accessed via the `node-postgres` driver and Drizzle ORM for type-safe queries. The schema (`shared/schema.ts`) defines `workers` and `vacation_requests` tables, including `first_choice_weeks` and `second_choice_weeks` as text arrays. A flexible storage layer (`IStorage`) allows automatic switching between `PgStorage` (PostgreSQL with Drizzle) and `MemStorage` (in-memory fallback) based on the `DATABASE_URL` environment variable. Vacation entitlement is dynamically calculated based on a worker's joining date using `calculateVacationWeeks()` from `shared/utils.ts`, enforcing seniority-based limits.

### Authentication and Authorization

Phone number-based authentication implemented for workers. Workers login at `/login` using their phone number (no password required). Session data is stored in localStorage. The supervisor page at `/supervisor` is accessible without authentication.

### Code Organization

The project uses a monorepo structure with `/client` (React frontend), `/server` (Express backend), and `/shared` (shared types, schemas, and utilities). It leverages full TypeScript coverage with strict mode, Zod for runtime validation, and Drizzle ORM for database type safety.

## External Dependencies

### Third-Party Services

- **Database**: Azure Database for PostgreSQL.

### APIs and Libraries

- **UI Components**: Radix UI primitives, Lucide React (icons), date-fns (date manipulation).
- **Forms and Validation**: React Hook Form, @hookform/resolvers, Zod.
- **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge.
- **Development Tools**: TypeScript, PostCSS with Autoprefixer.