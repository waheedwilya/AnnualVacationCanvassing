# Vacation Request Management System - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design 3 adapted for mobile productivity
- **Rationale**: Utility-focused application requiring efficiency, accessibility, and mobile-first design for factory floor workers
- **References**: Linear (clean data tables), Notion (status indicators), Google Calendar (date selection)
- **Principle**: Clarity and speed over visual decoration - workers need to complete tasks quickly

## Core Design Elements

### Color Palette
**Light Mode (Primary):**
- Primary: 220 90% 50% (Trust blue for actions)
- Surface: 0 0% 98% (Clean backgrounds)
- Success: 142 70% 45% (Approved status)
- Warning: 38 92% 50% (Pending status)
- Error: 0 70% 50% (Rejected/conflicts)
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 50%

**Dark Mode (Optional for night shifts):**
- Primary: 220 90% 60%
- Surface: 220 15% 12%
- Success/Warning/Error: Same hues, adjusted lightness to 55-60%

### Typography
- **Font Family**: Inter (via Google Fonts) for clarity and readability
- **Headings**: 
  - H1: 28px/700 (Mobile), 32px/700 (Desktop)
  - H2: 22px/600 (Mobile), 24px/600 (Desktop)
- **Body**: 16px/400 (larger for factory floor readability)
- **Labels**: 14px/500 (form labels, status badges)
- **Small**: 12px/400 (helper text only)

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Touch targets: Minimum h-12 (48px) for buttons and form inputs
- Cards: p-6 with rounded-lg

**Grid System**:
- Mobile: Single column (base)
- Tablet: 2 columns for supervisor dashboard (md:grid-cols-2)
- Desktop: Up to 3 columns for request cards (lg:grid-cols-3)

## Application Structure

### Worker Mobile App
**Primary Screens:**
1. **Dashboard**: Remaining days counter (large, prominent), quick stats, calendar preview
2. **Request Form**: Date range picker, department auto-filled, large submit button
3. **My Requests**: Chronological list with color-coded status badges
4. **Calendar View**: Month view showing requested/approved dates

### Supervisor App
**Primary Screens:**
1. **Pending Requests Dashboard**: Filterable by department/date, conflict indicators
2. **Request Detail**: Worker info (name, joining date/seniority), date range, conflict warnings, approve/reject buttons
3. **Auto-Allocate Interface**: Department selector, date range, conflict resolution preview, execute button
4. **Department Overview**: Staffing calendar, minimum requirements tracker

## Component Library

### Navigation
- **Worker App**: Bottom navigation bar (4 tabs: Dashboard, Request, My Requests, Calendar)
- **Supervisor App**: Top tab bar with sidebar on desktop (Pending, Calendar, Reports, Settings)

### Forms
- **Date Pickers**: Native mobile date inputs with calendar overlay
- **Dropdowns**: Large touch-friendly selects for departments
- **Input Fields**: 
  - Height: h-12
  - Border: border-2 with focus:ring-2
  - Rounded: rounded-lg
  - Background: Light gray (surface color)

### Data Display
- **Request Cards**:
  - Border-left accent (4px) indicating status color
  - Worker name + joining date display
  - Date range prominently shown
  - Status badge (top-right corner)
  - Padding: p-6
  
- **Status Badges**:
  - Pending: Yellow background, dark text
  - Approved: Green background, white text
  - Rejected: Red background, white text
  - Conflict: Orange background with warning icon

### Buttons
- **Primary Action**: Filled, h-12, rounded-lg, w-full on mobile
- **Secondary**: Outline variant with border-2
- **Destructive**: Red variant for rejections
- **Auto-Allocate**: Special accent color (purple: 270 70% 50%) to distinguish from manual actions

### Calendar Components
- **Month View**: Grid layout with date cells showing request indicators (dots)
- **Conflict Indicators**: Multiple colored dots when overlap exists
- **Legend**: Color key for different request statuses

### Tables (Supervisor Dashboard)
- **Responsive**: Stack to cards on mobile
- **Columns**: Worker Name, Joining Date, Requested Dates, Status, Actions
- **Row Actions**: Inline approve/reject buttons
- **Sorting**: By seniority (joining date) as default

## Special Features

### Auto-Allocation Interface
- **Preview Mode**: Shows algorithm results before applying
- **Seniority Indicator**: Visual ranking (1st, 2nd, 3rd) next to names
- **Conflict Resolution View**: Side-by-side comparison of conflicting requests
- **Undo Capability**: Revert auto-allocation if needed

### Conflict Warnings
- **Alert Banner**: Top of screen when conflicts exist
- **Inline Warnings**: On request cards showing conflicting dates
- **Department Capacity**: Progress bar showing staffing levels

## Accessibility
- Minimum touch target: 44px × 44px
- High contrast ratios (4.5:1 minimum)
- Form labels always visible
- Error messages descriptive and actionable
- Focus indicators prominent (ring-2)

## Images
**No hero images needed** - utility-focused app prioritizes functionality
- **User Avatars**: Circular, 40px × 40px with initials fallback
- **Empty States**: Simple illustrations for "no requests" states
- **Icons**: Material Icons via CDN for consistency

## Animations
**Minimal and purposeful:**
- Slide transitions between mobile screens (200ms)
- Status badge color transitions (150ms ease)
- Loading spinners for auto-allocation (indeterminate progress)
- Success/error toast notifications (slide-in from top)