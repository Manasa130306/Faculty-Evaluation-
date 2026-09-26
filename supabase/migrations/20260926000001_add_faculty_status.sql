-- Add soft delete/deactivation fields for faculty and profiles
ALTER TABLE public.faculty
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS removed_by TEXT,
ADD COLUMN IF NOT EXISTS inactive_from_year INT,
ADD COLUMN IF NOT EXISTS inactive_from_month TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS removed_by UUID,
ADD COLUMN IF NOT EXISTS inactive_from_year INT,
ADD COLUMN IF NOT EXISTS inactive_from_month TEXT;

CREATE INDEX IF NOT EXISTS idx_faculty_is_active ON public.faculty(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
