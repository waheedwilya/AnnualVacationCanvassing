# Vacation Request Management System

## Overview

This project is a vacation request and approval system for factory workers, featuring seniority-based allocation. It includes a mobile-first "Worker App" for submitting and tracking requests and a "Supervisor App" for review, approval, and auto-allocation. The system aims for efficiency and accessibility, designed for use on a factory floor with large touch targets and clear status indicators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite. Routing is handled by Wouter, and state management utilizes TanStack Query for server state and React's local state for UI. The UI is designed with Shadcn UI (Radix UI primitives) and Tailwind CSS, following a mobile-first approach inspired by Material Design 3. Key UI patterns include card-based layouts, semantic status badges, calendar-based date selection, and responsive grids.

### Backend Architecture

The backend uses Node.js with Express.js. It features a RESTful API with a `/api` prefix. The server structure includes `index.ts` for main application setup, `routes.ts` for HTTP server and route registration, and `storage.ts` for the storage abstraction layer. Middleware handles JSON and URL-encoded body parsing, request logging, and error handling. Session management is planned using `connect-pg-simple`.

### Data Storage Solutions

The primary database is Azure Database for PostgreSQL, accessed via the `node-postgres` driver and Drizzle ORM for type-safe queries. The schema (`shared/schema.ts`) defines `workers` and `vacation_requests` tables, including `first_choice_weeks` and `second_choice_weeks` as text arrays. A flexible storage layer (`IStorage`) allows automatic switching between `PgStorage` (PostgreSQL with Drizzle) and `MemStorage` (in-memory fallback) based on the `DATABASE_URL` environment variable. Vacation entitlement is dynamically calculated based on a worker's joining date using `calculateVacationWeeks()` from `shared/utils.ts`, enforcing seniority-based limits.

### Authentication and Authorization

Basic user schemas are defined, but authentication is not yet implemented. The planned approach includes session-based authentication with `connect-pg-simple`, password hashing, and role-based access control for workers and supervisors.

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