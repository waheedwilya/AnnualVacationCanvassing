# Vacation Request Management System

## Overview

This is a factory worker vacation request and approval system with seniority-based allocation. The application provides two distinct interfaces:

1. **Worker App** - Mobile-first interface for factory workers to submit and track vacation requests
2. **Supervisor App** - Dashboard for supervisors to review, approve, and auto-allocate vacation requests based on seniority

The system is designed for efficiency and accessibility, particularly for use on the factory floor with large touch targets and clear status indicators.

## Recent Changes (October 27, 2025)

**Seniority-Based Vacation Entitlement System:**
- Implemented dynamic vacation week calculation based on years of service
- Created shared utility function `calculateVacationWeeks()` in `shared/utils.ts`
- Seniority rules:
  - 0 weeks: Less than 1 year of service (not eligible)
  - 2 weeks: After 1 year of service
  - 3 weeks: After 3 years of service
  - 4 weeks: After 10 years of service
  - 5 weeks: After 25 years of service
  - 6 weeks: After 35 years of service
- Updated frontend (WorkerApp) to display calculated entitlement
- Updated backend validation to enforce seniority-based limits
- Added user-friendly messages explaining entitlement based on seniority
- **Note:** Legacy `weeksEntitled` database field still exists but is now ignored in favor of calculated values

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter, a lightweight React router alternative.

**State Management**: 
- TanStack Query (React Query) for server state management and data fetching
- Local React state for UI state management
- Query client configured with optimistic defaults (no automatic refetching, infinite stale time)

**UI Component Library**: Shadcn UI (Radix UI primitives) with Tailwind CSS for styling
- Design system based on Material Design 3 adapted for mobile productivity
- Custom color palette with support for light and dark modes
- Mobile-first responsive design with breakpoints for tablet and desktop

**Design System**:
- Primary color: Blue (220 90% 50%) for actions and trust
- Status colors: Success (green), Warning (orange), Error (red)
- Typography: Inter font family via Google Fonts
- Touch targets: Minimum 48px height for mobile usability
- Spacing: Tailwind units of 2, 4, 6, and 8 for consistency

**Key UI Patterns**:
- Card-based layouts for request display
- Status badges with semantic colors (pending, approved, denied, conflict)
- Date selection with calendar popover components
- Responsive grid layouts (1 column mobile, 2-3 columns desktop)

### Backend Architecture

**Runtime**: Node.js with Express.js web framework

**API Design**: RESTful endpoints with `/api` prefix (to be implemented)
- Currently using placeholder routes structure
- Designed for CRUD operations on vacation requests

**Server Structure**:
- `server/index.ts` - Main Express application with middleware setup
- `server/routes.ts` - Route registration and HTTP server creation
- `server/storage.ts` - Storage abstraction layer
- `server/vite.ts` - Vite development server integration

**Middleware Stack**:
- JSON body parsing with raw body preservation
- URL-encoded body parsing
- Request/response logging for API routes
- Error handling

**Session Management**: Placeholder for connect-pg-simple (PostgreSQL session store)

### Data Storage Solutions

**Database**: PostgreSQL accessed via Neon serverless driver

**ORM**: Drizzle ORM for type-safe database queries
- Schema defined in `shared/schema.ts`
- Migrations managed in `./migrations` directory
- Drizzle Kit for schema management and migrations

**Current Schema**:
- Users table with UUID primary keys, username, and password fields
- Zod schemas for validation using drizzle-zod integration

**Storage Abstraction**: 
- Interface-based design (`IStorage`) for flexibility
- In-memory implementation (`MemStorage`) for development
- Designed to be swapped for PostgreSQL implementation in production

**Design Decision**: The storage layer uses an interface pattern to allow easy switching between in-memory storage (development/testing) and PostgreSQL (production) without changing business logic.

**Seniority Calculation**: Vacation entitlement is calculated dynamically using `calculateVacationWeeks()` from `shared/utils.ts` based on the worker's joining date. This ensures consistent calculation between frontend display and backend validation. The legacy `weeksEntitled` field in the database is currently ignored but could be deprecated in a future update.

### Authentication and Authorization

**Current State**: Basic user schema defined but authentication not yet implemented

**Planned Approach**: 
- Session-based authentication using connect-pg-simple
- Password storage (will require hashing implementation)
- Role-based access control for worker vs supervisor interfaces

### Code Organization

**Monorepo Structure**:
- `/client` - React frontend application
- `/server` - Express backend application  
- `/shared` - Shared types, schemas, and utilities
- Path aliases configured: `@/` for client, `@shared/` for shared code

**Type Safety**: Full TypeScript coverage with strict mode enabled
- Shared types between frontend and backend
- Zod schemas for runtime validation
- Drizzle ORM for database type safety

**Build Process**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles to `dist/index.js`
- Development: tsx for TypeScript execution, Vite dev server with HMR

## External Dependencies

### Third-Party Services

**Database**: Neon Serverless PostgreSQL
- Accessed via `@neondatabase/serverless` driver
- Connection string via `DATABASE_URL` environment variable
- Serverless architecture for scalability

### APIs and Libraries

**UI Components**: 
- Radix UI primitives (@radix-ui/react-*) for accessible, unstyled components
- Lucide React for icons
- date-fns for date manipulation and formatting
- Embla Carousel for carousel functionality (if needed)

**Forms and Validation**:
- React Hook Form for form state management
- @hookform/resolvers for validation integration
- Zod for schema validation

**Styling**:
- Tailwind CSS for utility-first styling
- class-variance-authority for component variants
- clsx and tailwind-merge for conditional class names

**Development Tools**:
- Replit-specific plugins for development environment
- TypeScript for type checking
- PostCSS with Autoprefixer for CSS processing

### Configuration Requirements

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (required for Drizzle)
- `NODE_ENV` - Environment mode (development/production)

**Database Setup**: 
- Drizzle Kit push command: `npm run db:push` to sync schema to database
- Migrations stored in `./migrations` directory

**Font Loading**: Google Fonts loaded via CDN in HTML for Inter, Architects Daughter, DM Sans, Fira Code, and Geist Mono fonts