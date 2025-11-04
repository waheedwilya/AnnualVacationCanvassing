-- Migration: Migrate from first/second choice to prioritized_weeks only
-- This migration:
-- 1. Migrates existing data from first_choice_weeks + second_choice_weeks to prioritized_weeks
-- 2. Drops the legacy columns
-- 3. Makes prioritized_weeks NOT NULL

-- Step 1: Add prioritized_weeks column if it doesn't exist
ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS prioritized_weeks TEXT[];

-- Step 2: Migrate existing data from first_choice_weeks + second_choice_weeks to prioritized_weeks
-- For existing records, combine first_choice_weeks (as priority 0-N) and second_choice_weeks (as priority N+1-M)
UPDATE vacation_requests
SET prioritized_weeks = 
  CASE 
    WHEN first_choice_weeks IS NOT NULL AND second_choice_weeks IS NOT NULL THEN
      -- Combine first choice (higher priority) then second choice (lower priority)
      first_choice_weeks || second_choice_weeks
    WHEN first_choice_weeks IS NOT NULL THEN
      first_choice_weeks
    WHEN second_choice_weeks IS NOT NULL THEN
      second_choice_weeks
    ELSE
      NULL
  END
WHERE prioritized_weeks IS NULL 
  AND (first_choice_weeks IS NOT NULL OR second_choice_weeks IS NOT NULL);

-- Step 3: Add approved_weeks and denied_weeks columns if they don't exist
ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS approved_weeks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS denied_weeks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Step 4: Make prioritized_weeks NOT NULL (since it's now the only option)
-- First, handle any remaining NULL values (set empty array for records without weeks)
UPDATE vacation_requests
SET prioritized_weeks = ARRAY[]::TEXT[]
WHERE prioritized_weeks IS NULL;

ALTER TABLE vacation_requests 
ALTER COLUMN prioritized_weeks SET NOT NULL;

-- Step 5: Add constraint to ensure prioritized_weeks has at least one week
ALTER TABLE vacation_requests
DROP CONSTRAINT IF EXISTS vacation_requests_prioritized_weeks_check;

ALTER TABLE vacation_requests
ADD CONSTRAINT vacation_requests_prioritized_weeks_check 
CHECK (array_length(prioritized_weeks, 1) > 0);

-- Step 6: Drop the legacy columns
ALTER TABLE vacation_requests 
DROP COLUMN IF EXISTS first_choice_weeks;

ALTER TABLE vacation_requests 
DROP COLUMN IF EXISTS second_choice_weeks;

