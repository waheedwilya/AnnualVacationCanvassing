# 👔 Supervisor User Guide
## Annual Vacation Canvassing System

---

## 🚀 Getting Started

### Step 1: Access Supervisor Portal

1. Open the app in your browser
2. Go to: `www.wilya.space/supervisor`
3. No login required (open access for supervisors)

```
┌─────────────────────────────────────────┐
│  👔 Supervisor Portal                   │
│  ─────────────────────────────────────  │
│                                         │
│  Manage vacation requests for 2026      │
│                                         │
│  [Switch to Worker View]                │
└─────────────────────────────────────────┘
```

---

## 📊 Dashboard Overview

You'll see the main dashboard with tabs:

```
┌─────────────────────────────────────────┐
│  [Pending] [Approved] [All Requests]    │
│  ─────────────────────────────────────  │
│                                         │
│  Department: [All ▼]                    │
│                                         │
│  Total Conflicts: 3                     │
│  Pending Requests: 12                   │
│                                         │
│  [Auto-Allocate] [Reset All]            │
└─────────────────────────────────────────┘
```

**Tabs:**
- **Pending** = Requests waiting for your review
- **Approved** = Already approved requests
- **All Requests** = Everything (pending + approved + denied)

---

## 👥 Viewing Requests by Department

Requests are **automatically grouped by department** for easy management:

```
┌─────────────────────────────────────────┐
│  📦 Assembly Department                 │
│  ─────────────────────────────────────  │
│                                         │
│  Maria Rodriguez                        │
│  Joined: 2020-04-12 (5 years)          │
│  Priority Weeks:                        │
│  #1: Jan 5-11    [✓ Approve] [✗ Deny]  │
│  #2: Feb 2-8     [✓ Approve] [✗ Deny]  │
│  #3: Mar 15-21   [✓ Approve] [✗ Deny]  │
│                                         │
│  Linda Martinez                         │
│  Joined: 2019-11-03 (6 years) ← More Senior
│  Priority Weeks:                        │
│  #1: Jan 5-11 ⚠️ CONFLICT [✓] [✗]     │
│  #2: Feb 2-8     [✓ Approve] [✗ Deny]  │
│                                         │
│  ⚠️ Warning: Conflict detected!         │
│  Maria and Linda both want Jan 5-11    │
│  Linda is more senior → priority        │
└─────────────────────────────────────────┘
```

**Key Information:**
- 👤 **Worker Name** and **Join Date** (shows seniority)
- 📅 **Priority Weeks** in order (#1 = most wanted)
- ⚠️ **Conflict Warnings** = Yellow border when multiple workers want the same week
- 🟡 **Seniority** = Earlier join date = higher priority

---

## ✅ Approving Individual Weeks

### Manual Approval Process

You can approve or deny **individual weeks** for each worker:

```
For each week, you have 3 options:

┌─────────────────────────────────┐
│  #1: Jan 5-11, 2026            │
│  [✓ Approve] [✗ Deny] [× Revert]│
└─────────────────────────────────┘
```

**Buttons:**
- ✅ **✓ Approve** = Approve this specific week
- ❌ **✗ Deny** = Deny this specific week  
- 🔄 **× Revert** = Undo your decision (back to pending)

**Approval Rules:**
1. **Department Limit**: Only 1 person per department per week
2. **Seniority**: More senior workers get priority
3. **Priority Order**: Worker's Week #1 > Week #2 > Week #3, etc.

### Example Decision Flow:

```
Request from Maria (5 years):
Week #1: Jan 5-11  → Check: Available? → ✅ Approve
Week #2: Feb 2-8   → Check: Available? → ✅ Approve  
Week #3: Mar 15-21 → Check: Limit reached? → ❌ Deny

Request from Linda (6 years):
Week #1: Jan 5-11  → Check: Maria wants it, but Linda is more senior → ✅ Approve (revoke Maria's)
Week #2: Feb 2-8   → Check: Available? → ✅ Approve
```

---

## 🤖 Auto-Allocate Feature

### Step 2: Let the System Decide

Instead of manually approving each week, you can use **Auto-Allocate**:

```
┌─────────────────────────────────────────┐
│  [Auto-Allocate] Button                 │
│  ─────────────────────────────────────  │
│                                         │
│  This will automatically:               │
│  ✅ Sort by seniority (most senior first)│
│  ✅ Allocate weeks based on priority     │
│  ✅ Respect department limits            │
│  ✅ Handle conflicts automatically       │
│                                         │
│  [Confirm Auto-Allocate]                │
└─────────────────────────────────────────┘
```

**How Auto-Allocate Works:**

1. **Sorts all requests** by seniority (oldest join date first)
2. **Processes each request** in seniority order
3. **Allocates Week #1** if available, then Week #2, etc.
4. **Respects department limits** (only 1 per department per week)
5. **Handles conflicts** by giving priority to more senior workers

**Example:**
```
Seniority Order (most senior first):
1. Linda (2019) → Gets Week #1, #2, #3, #4, #5
2. Maria (2020) → Gets Week #1, #2 (if not taken), etc.
3. James (2022) → Gets remaining available weeks
```

### Using Auto-Allocate:

1. Click **"Auto-Allocate"** button
2. Review the preview (optional - may show what will happen)
3. Confirm the allocation
4. All requests are updated automatically ✅

---

## 🔄 Reset and Undo

### Reset All Approvals

If you need to start over:

```
┌─────────────────────────────────────────┐
│  [Reset All Approvals]                  │
│  ─────────────────────────────────────  │
│                                         │
│  ⚠️ Warning: This will reset ALL        │
│  approved/denied weeks back to pending  │
│                                         │
│  [Cancel] [Confirm Reset]               │
└─────────────────────────────────────────┘
```

- Click **"Reset All"**
- Confirm the action
- All requests go back to "Pending" status

### Revert Individual Week

To undo a single decision:

1. Find the approved/denied week
2. Click **"× Revert"** button
3. Week goes back to "Pending"

---

## 🎯 Filtering Requests

### Filter by Department

Use the dropdown to filter requests:

```
┌─────────────────────────────────────────┐
│  Department: [All Departments ▼]        │
│    • All Departments                    │
│    • Assembly                           │
│    • Packaging                          │
│    • Shipping                           │
└─────────────────────────────────────────┘
```

**Benefits:**
- Focus on one department at a time
- Easier to see department-specific conflicts
- Better overview of staffing levels

---

## ⚠️ Understanding Conflicts

### Conflict Detection

The system automatically highlights conflicts:

```
┌─────────────────────────────────────────┐
│  ⚠️ CONFLICT DETECTED                   │
│  ─────────────────────────────────────  │
│                                         │
│  Week: Jan 5-11, 2026                   │
│  Department: Assembly                   │
│                                         │
│  👤 Maria Rodriguez (2020)              │
│  👤 Linda Martinez (2019) ← More Senior│
│                                         │
│  Recommendation:                        │
│  Approve Linda (more senior)            │
│  Deny Maria (or approve her Week #2)    │
└─────────────────────────────────────────┘
```

**Conflict Types:**
- **Same Week, Same Department** = Conflict (only 1 can be approved)
- **Same Week, Different Departments** = No conflict (both can be approved)

---

## 📋 Review Process Workflow

### Recommended Workflow:

```
┌─────────────────────────────────────────┐
│  1. Review All Requests                 │
│     → Check conflicts                   │
│     → Note seniority levels             │
│                                         │
│  2. Choose Your Method:                 │
│     Option A: Manual Review             │
│       → Approve/deny week by week       │
│       → Full control                    │
│                                         │
│     Option B: Auto-Allocate             │
│       → Let system decide automatically │
│       → Faster processing               │
│                                         │
│  3. Verify Results                      │
│     → Check approved requests           │
│     → Ensure fairness                   │
│                                         │
│  4. Make Adjustments (if needed)        │
│     → Use revert buttons                │
│     → Or reset all and start over       │
└─────────────────────────────────────────┘
```

---

## 📊 Understanding Status Badges

Each request shows its status:

```
┌─────────────────────────────────────────┐
│  ✅ Approved  = Week is confirmed       │
│  ❌ Denied    = Week cannot be granted  │
│  ⏳ Pending   = Awaiting your decision  │
│  ⚠️ Conflict  = Overlaps with others    │
└─────────────────────────────────────────┘
```

---

## 🎯 Best Practices

### Tips for Supervisors:

1. **Review by Department First**
   - Filter to one department at a time
   - Focus on department-specific conflicts

2. **Consider Seniority**
   - More senior workers (earlier join date) have priority
   - Fair allocation respects years of service

3. **Check Priority Order**
   - Workers put their most wanted weeks first (#1)
   - Try to honor Week #1 when possible

4. **Use Auto-Allocate for Fairness**
   - Ensures consistent, fair allocation
   - Respects all rules automatically
   - Faster than manual review

5. **Verify Department Limits**
   - Only 1 person per department per week
   - Check calendar view for overlapping weeks

---

## ❓ Frequently Asked Questions

### Q: What happens if two workers from different departments want the same week?
**A:** Both can be approved! Department limits only apply within the same department.

### Q: Can I approve more than the worker's entitlement?
**A:** No. The system enforces entitlement limits. A worker entitled to 5 weeks can only get 5 weeks approved.

### Q: What if I make a mistake?
**A:** Use the **"× Revert"** button for individual weeks, or **"Reset All"** to start over.

### Q: How does Auto-Allocate decide?
**A:** It processes by seniority (oldest first), respects priority order (#1 before #2), and enforces department limits.

### Q: Can I approve some weeks manually and use Auto-Allocate for the rest?
**A:** Yes! Auto-Allocate will work around your existing approvals.

---

## 🆘 Troubleshooting

### Issue: Can't see any requests
- **Solution:** Check the department filter - might be set to a department with no requests

### Issue: Conflict won't resolve
- **Solution:** Remember department limits - only 1 per department per week. Different departments can overlap.

### Issue: Auto-Allocate didn't work as expected
- **Solution:** Check seniority levels (join dates). More senior workers get priority.

---

## 📱 Quick Reference

```
┌─────────────────────────────────────────┐
│  Supervisor Actions                     │
│  ─────────────────────────────────────  │
│                                         │
│  ✓ Approve Week                         │
│  ✗ Deny Week                            │
│  × Revert Decision                      │
│                                         │
│  [Auto-Allocate] = Automated decisions  │
│  [Reset All] = Start over               │
│  [Filter] = View by department          │
└─────────────────────────────────────────┘
```

---

**Remember:** The goal is fair allocation based on seniority and priority, while respecting department staffing limits! 🎯
