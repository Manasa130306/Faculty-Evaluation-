-- Drop the existing constraint
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;

-- Add the new constraint allowing Pending and Complete
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_status_check 
CHECK (status IN ('Draft', 'draft', 'Submitted', 'submitted', 'Pending', 'pending', 'Complete', 'complete'));
