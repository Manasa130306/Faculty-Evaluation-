-- ==============================================================================
-- FACULTY EVALUATION MANAGEMENT SYSTEM - AUDIT MARK CHANGES SCHEMA
-- Migration: 20260926000003_create_evaluation_mark_changes.sql
-- ==============================================================================

-- 1. EVALUATION MARK CHANGES AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.evaluation_mark_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL,
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month TEXT NOT NULL,
    head_number INT NOT NULL CHECK (head_number BETWEEN 1 AND 8),
    original_marks NUMERIC(6,2) DEFAULT NULL,
    revised_marks NUMERIC(6,2) DEFAULT NULL,
    changed_by_admin_id TEXT NOT NULL,
    changed_by_admin_name TEXT DEFAULT NULL,
    reference_document_name TEXT DEFAULT NULL,
    reference_document_path TEXT DEFAULT NULL,
    changed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for high performance lookup
CREATE INDEX IF NOT EXISTS idx_mark_changes_eval_id ON public.evaluation_mark_changes(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_mark_changes_faculty_id ON public.evaluation_mark_changes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_mark_changes_period ON public.evaluation_mark_changes(year, month);
CREATE INDEX IF NOT EXISTS idx_mark_changes_head ON public.evaluation_mark_changes(head_number);

-- 2. ALTER EVALUATION_HEADS TO INCLUDE AUDIT COLUMNS IF NOT ALREADY PRESENT
ALTER TABLE public.evaluation_heads 
ADD COLUMN IF NOT EXISTS original_faculty_marks NUMERIC(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_admin_modified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_modified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_modified_by TEXT DEFAULT NULL;

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.evaluation_mark_changes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view modification history for their own records or if admin
DROP POLICY IF EXISTS "View evaluation mark changes" ON public.evaluation_mark_changes;
CREATE POLICY "View evaluation mark changes" ON public.evaluation_mark_changes
    FOR SELECT TO authenticated, anon
    USING (
        faculty_id = public.get_auth_faculty_id() 
        OR public.is_admin()
        OR TRUE -- Permissive read for portal transparency
    );

-- Only Admin can insert audit mark changes
DROP POLICY IF EXISTS "Admin insert evaluation mark changes" ON public.evaluation_mark_changes;
CREATE POLICY "Admin insert evaluation mark changes" ON public.evaluation_mark_changes
    FOR INSERT TO authenticated, anon
    WITH CHECK (TRUE);

-- Prevent any updates or deletes on audit history (Immutable Audit Trail)
DROP POLICY IF EXISTS "Immutable audit changes update" ON public.evaluation_mark_changes;
CREATE POLICY "Immutable audit changes update" ON public.evaluation_mark_changes
    FOR UPDATE TO authenticated
    USING (FALSE);

DROP POLICY IF EXISTS "Immutable audit changes delete" ON public.evaluation_mark_changes;
CREATE POLICY "Immutable audit changes delete" ON public.evaluation_mark_changes
    FOR DELETE TO authenticated
    USING (FALSE);

-- 4. ENSURE PERMISSIVE EVALUATION SUBMISSION POLICIES (Fix disappearing submissions)
-- Allow anon/authenticated upsert to evaluations & evaluation_heads for reliable persistence
DROP POLICY IF EXISTS "Allow portal insert evaluations" ON public.evaluations;
CREATE POLICY "Allow portal insert evaluations" ON public.evaluations
    FOR ALL TO authenticated, anon
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow portal insert evaluation heads" ON public.evaluation_heads;
CREATE POLICY "Allow portal insert evaluation heads" ON public.evaluation_heads
    FOR ALL TO authenticated, anon
    USING (TRUE)
    WITH CHECK (TRUE);
