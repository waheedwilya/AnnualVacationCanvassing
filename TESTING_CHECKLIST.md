# Testing Checklist for www.wilya.space

## ⚠️ CRITICAL: Database Migration Must Run First!

**Before testing the app, you MUST run the database migration:**
- Location: `migrations/migrate-to-priority-weeks-only.sql`
- Run this SQL script on your Azure PostgreSQL database via DBeaver or Azure Portal
- This migration:
  1. Migrates existing data from `first_choice_weeks` + `second_choice_weeks` to `prioritized_weeks`
  2. Drops the legacy columns
  3. Makes `prioritized_weeks` NOT NULL

**If you skip this step, the app will fail with database errors!**

## Pre-Deployment Checks

- [ ] Database migration SQL has been run successfully
- [ ] All code changes are committed to `main` branch
- [ ] GitHub Actions deployment workflow has completed successfully
- [ ] Check Azure Web App logs for any startup errors

## Testing Steps

### 1. Health Check
- [ ] Visit `https://www.wilya.space/health`
- [ ] Should return: `{"status":"healthy","timestamp":"..."}`

### 2. Login as Worker
- [ ] Visit `https://www.wilya.space/login`
- [ ] Login with test phone number (e.g., `5513759096`)
- [ ] Should successfully redirect to worker dashboard

### 3. Submit Vacation Request (Priority Weeks)
- [ ] Click "Submit Vacation Request" or navigate to request form
- [ ] Verify form shows: "Select up to X priority weeks" (where X = 2× entitlement)
- [ ] Select multiple weeks (up to 2× entitlement)
- [ ] Reorder weeks using ↑↓ buttons
- [ ] Submit the request
- [ ] Should see success message and redirect to "My Requests"

### 4. Verify Priority Weeks Display
- [ ] Go to "My Requests" page
- [ ] Verify submitted request shows priority weeks with numbers (#1, #2, etc.)
- [ ] Verify weeks are displayed in priority order

### 5. Test Warnings (if applicable)
- [ ] Select a week that a senior worker has already selected (same department)
- [ ] Should show yellow warning for senior conflict
- [ ] Select a week where department limit is reached
- [ ] Should show red warning for department limit

### 6. Supervisor Portal
- [ ] Visit `https://www.wilya.space/supervisor`
- [ ] Verify requests are grouped by department
- [ ] Verify priority weeks are displayed with numbers
- [ ] Verify conflict highlighting (yellow borders) for clashing weeks
- [ ] Test individual week approval/denial (✓, ✗, × buttons)

### 7. Auto-Allocate Feature
- [ ] Click "Auto-Allocate" button
- [ ] Verify weeks are allocated based on seniority and priority
- [ ] Verify department limits are respected

### 8. Error Handling
- [ ] Try submitting without selecting any weeks → Should show validation error
- [ ] Try submitting more than 2× entitlement weeks → Should show validation error
- [ ] Try submitting duplicate weeks → Should show validation error

## Common Issues and Fixes

### Issue: "null value in column first_choice_weeks violates not-null constraint"
**Solution:** Database migration hasn't been run. Run `migrations/migrate-to-priority-weeks-only.sql`

### Issue: "prioritized_weeks must have at least one week"
**Solution:** This is expected validation. Make sure you select at least 1 week before submitting.

### Issue: Build fails in GitHub Actions
**Solution:** Check the Actions tab in GitHub for specific error messages. Common issues:
- TypeScript compilation errors
- Missing dependencies
- Schema validation errors

### Issue: App loads but API calls fail (400/500 errors)
**Solution:** 
- Check Azure Web App logs (Log Stream in Azure Portal)
- Verify `DATABASE_URL` environment variable is set correctly
- Verify database migration was successful

## Rollback Plan

If something goes wrong:

1. **Database Rollback:** 
   - Restore from backup (if available)
   - Or manually add back `first_choice_weeks` and `second_choice_weeks` columns

2. **Code Rollback:**
   - Revert to previous commit: `git revert HEAD`
   - Or checkout stable branch: `git checkout stable`
   - Push and let Azure redeploy

3. **Quick Fix:**
   - Make legacy columns nullable temporarily
   - Redeploy
   - Then run full migration properly
