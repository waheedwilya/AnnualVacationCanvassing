# UI Mockups - Priority Weeks Feature

This directory contains HTML mockups showing how the new priority-based vacation request system will look.

## Files

1. **worker-priority-form.html** - Worker's new vacation request form
   - Shows priority weeks picker with reordering capability
   - Displays selected weeks in priority order (1-10)
   - Calendar picker for selecting weeks
   - Submit button disabled until exactly 2× entitlement weeks selected

2. **supervisor-priority-view.html** - Supervisor's request management view
   - Table showing all requests with priority weeks in order
   - Visual indicators for approved/denied/pending weeks
   - Priority numbers (1-10) shown on each week
   - Status badges showing approval progress

3. **worker-my-requests.html** - Worker's "My Requests" view
   - Shows submitted requests with priority weeks
   - Visual indicators for approved/denied/pending weeks
   - Conflict warnings for weeks that may be denied
   - Summary of allocation results

## How to View

Simply open any HTML file in your web browser:

```bash
open ui-mockups/worker-priority-form.html
open ui-mockups/supervisor-priority-view.html
open ui-mockups/worker-my-requests.html
```

## Key Design Changes

### Worker Form
- **Single priority list** instead of "First Choice" and "Second Choice"
- **Reordering controls** (↑ ↓ buttons) to adjust priority
- **Visual priority numbers** (1, 2, 3...) on each selected week
- **Requires exactly 2× entitlement** weeks (e.g., 10 weeks if entitled to 5)

### Supervisor View
- **Single unified table** instead of separate "First Choice" and "Second Choice" tables
- **Priority numbers** displayed on each week badge
- **Sorted by seniority** (earlier joining date = higher priority)
- **Color coding**: Green = approved, Red = denied, Gray = pending

### My Requests View
- **Priority order preserved** in display
- **Conflict indicators** for weeks that conflict with higher seniority
- **Clear approval status** for each priority week
- **Summary showing** how many weeks were approved from the priority list

## Design Notes

- Priority numbers (1-10) are always visible to show order
- Weeks are color-coded: Green (approved), Red (denied), Gray (pending), Yellow (conflict warning)
- The order matters - allocation considers priority 1 before priority 2, etc.
- Workers can reorder weeks before submitting
- Supervisor can see exactly which priority weeks were approved/denied
