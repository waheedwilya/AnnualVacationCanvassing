-- Migration: Make legacy vacation request fields nullable and add new prioritized_weeks column
-- This allows the new priority-based system to work alongside legacy data

-- Step 1: Add prioritized_weeks column if it doesn't exist
ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS prioritized_weeks TEXT[];

-- Step 2: Add approved_weeks and denied_weeks columns if they don't exist
ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS approved_weeks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE vacation_requests 
ADD COLUMN IF NOT EXISTS denied_weeks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Step 3: Make first_choice_weeks and second_choice_weeks nullable
-- This allows requests to use only prioritized_weeks
ALTER TABLE vacation_requests 
ALTER COLUMN first_choice_weeks DROP NOT NULL;

ALTER TABLE vacation_requests 
ALTER COLUMN second_choice_weeks DROP NOT NULL;

-- Step 4: Add a check constraint to ensure at least one type of weeks is provided
-- This ensures data integrity: either prioritized_weeks OR (first_choice_weeks AND second_choice_weeks)
ALTER TABLE vacation_requests
DROP CONSTRAINT IF EXISTS vacation_requests_weeks_check;

ALTER TABLE vacation_requests
ADD CONSTRAINT vacation_requests_weeks_check 
CHECK (
  (prioritized_weeks IS NOT NULL AND array_length(prioritized_weeks, 1) > 0)
  OR 
  (
    first_choice_weeks IS NOT NULL AND array_length(first_choice_weeks, 1) > 0
    AND 
    second_choice_weeks IS NOT NULL AND array_length(second_choice_weeks, 1) > 0
  )
);

