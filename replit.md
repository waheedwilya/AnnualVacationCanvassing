# Vacation Request Management System

## Overview

This is a factory worker vacation request and approval system with seniority-based allocation. The application provides two distinct interfaces:

1. **Worker App** - Mobile-first interface for factory workers to submit and track vacation requests
2. **Supervisor App** - Dashboard for supervisors to review, approve, and auto-allocate vacation requests based on seniority

The system is designed for efficiency and accessibility, particularly for use on the factory floor with large touch targets and clear status indicators.

## Recent Changes

### November 1, 2025 - PostgreSQL Integration
**Successfully integrated PostgreSQL for data persistence:**
- **Database**: Azure Database for PostgreSQL with Drizzle ORM
- **Driver**: Standard PostgreSQL driver (`drizzle-orm/node-postgres` with `pg`)
- **Storage Layer**: Created `PgStorage` class implementing `IStorage` interface
- **Automatic Switching**: Application uses PostgreSQL when `DATABASE_URL` is present, otherwise falls back to in-memory storage
- **Schema Management**: Database schema pushed using `npm run db:push`
- **Seeded Data**: 4 workers and 3 vacation requests with proper array data

**Implementation Details:**
- All CRUD operations migrated to use Drizzle typed queries with `eq()` helper
- Multi-week array data (`firstChoiceWeeks`, `secondChoiceWeeks`) stored as PostgreSQL text arrays
- Database defaults handle `status`, `year`, and `submittedAt` fields automatically
- Connection established using node-postgres Pool with SSL support for Azure compatibility
- End-to-end testing confirmed data persists correctly across requests

**Azure PostgreSQL Requirements:**
- SSL must be enabled: `ssl: { rejectUnauthorized: false }` in connection pool
- Connection string format: `postgresql://user:password@server:5432/db?sslmode=require`
- Firewall must allow Azure services (Network > "Allow access to Azure services")

**Key Files:**
- `server/storage.ts` - PgStorage implementation with conditional export
- `shared/schema.ts` - Drizzle schema with workers and vacation_requests tables
- `server/seed.ts` - Database seeding after server startup

### November 1, 2025 - Azure Deployment
**Successfully deployed to Azure App Service:**
- **Production URL**: https://annualvacationcanvasing-webapp-ayg0bneve3gea3cq.eastus-01.azurewebsites.net/
- **Health Check**: `/health` endpoint for monitoring
- **GitHub Actions**: Automated CI/CD pipeline on push to main branch

**Deployment Architecture:**
- Azure App Service (Node.js 18.20.8 runtime)
- GitHub Actions for build and deployment
- Production build uses esbuild for server bundling and Vite for client build
- Separate production and development node_modules (production excludes devDependencies)

**Key Deployment Fixes:**
1. **Vite Bundling Issue**: Prevented esbuild from bundling dev-only Vite package using opaque dynamic import pattern (`new Function('p', 'return import(p)')(path)`)
2. **Node 18 Compatibility**: Replaced `import.meta.dirname` with Node 18-compatible `fileURLToPath(import.meta.url)` approach
3. **Enhanced Logging**: Added detailed startup logging for easier Azure debugging
4. **Database Seeding**: Moved seeding to run after server starts to prevent startup crashes

**Deployment Package Structure:**
```
deploy-package/
├── dist/
│   ├── index.js (bundled server)
│   └── public/ (client assets)
├── node_modules/ (production only)
├── shared/ (shared types)
├── package.json
└── package-lock.json
```

**Important Notes:**
- `server/utils.ts` contains production-safe utilities (log, serveStatic) without Vite dependencies
- Dynamic import of `./vite.js` only occurs in development mode
- Production serves pre-built static files from `dist/public/`

### October 27, 2025 - Multi-Week Selection

**Multi-Week Selection Feature:**
- Migrated from date range format to array-based format for vacation requests
- Database schema updated:
  - Added `firstChoiceWeeks` and `secondChoiceWeeks` as text arrays
  - Removed legacy `firstChoiceStart/End` and `secondChoiceStart/End` columns
  - Week dates stored as Monday start dates in 'yyyy-MM-dd' format
- Created `MultiWeekPicker` component for selecting multiple non-contiguous weeks
- Workers can now select separate individual weeks (e.g., Week 2, Week 5, Week 10) instead of continuous ranges
- Updated conflict detection logic to use Set-based week overlap checking
- Auto-allocate function now tracks allocated weeks using a Set for efficient conflict prevention
- Updated display components (`MyRequestsList`, `RequestCard`) to show multiple selected weeks with date ranges
- Backend validation counts total weeks across all selections to enforce entitlement limits

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

**Database**: Azure Database for PostgreSQL accessed via node-postgres driver

**ORM**: Drizzle ORM for type-safe database queries
- Schema defined in `shared/schema.ts`
- Schema pushed using `npm run db:push` command
- Drizzle Kit for schema management

**Current Schema**:
- `workers` table with UUID primary keys, name, joining_date, department, weeks_entitled
- `vacation_requests` table with UUID primary keys, worker_id (foreign key), year, status, first_choice_weeks and second_choice_weeks (text arrays), allocated_choice, submitted_at
- Zod schemas for validation using drizzle-zod integration

**Storage Implementation**: 
- Interface-based design (`IStorage`) for flexibility
- `PgStorage` class using PostgreSQL with Drizzle ORM (production)
- `MemStorage` class for in-memory storage (development fallback)
- Conditional export based on `DATABASE_URL` environment variable

**Design Decision**: The storage layer uses an interface pattern allowing automatic switching between PostgreSQL (when DATABASE_URL is present) and in-memory storage (when DATABASE_URL is absent) without changing business logic. The `PgStorage` class uses Drizzle ORM with the standard node-postgres driver for reliable Azure PostgreSQL connectivity.

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