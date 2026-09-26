-- ==============================================================================
-- FACULTY EVALUATION MANAGEMENT SYSTEM - PRODUCTION DATABASE SCHEMA
-- Migration: 20260913000001_create_faculty_evaluation_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FACULTY & ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'faculty' CHECK (role IN ('faculty', 'admin')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. MONTH LOCK STATUS TABLE
CREATE TABLE IF NOT EXISTS public.month_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_month_locks_year_month UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_month_locks_year_month ON public.month_locks(year, month);

-- 4. MONTHLY EVALUATIONS
CREATE TABLE IF NOT EXISTS public.monthly_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT NOT NULL REFERENCES public.profiles(faculty_id) ON UPDATE CASCADE ON DELETE CASCADE,
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    submitted_at TIMESTAMPTZ,
    total_marks NUMERIC(6,2) DEFAULT 0 CHECK (total_marks >= 0 AND total_marks <= 80),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_faculty_year_month UNIQUE (faculty_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_faculty_id ON public.monthly_evaluations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON public.monthly_evaluations(year, month);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.monthly_evaluations(status);

-- 5. EVALUATION HEAD MARKS & REFERENCE DOCUMENT METADATA (HEADS 1 TO 8)
CREATE TABLE IF NOT EXISTS public.evaluation_head_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.monthly_evaluations(id) ON DELETE CASCADE,
    head_number INT NOT NULL CHECK (head_number BETWEEN 1 AND 8),
    marks NUMERIC(6,2) DEFAULT NULL CHECK (marks IS NULL OR (marks >= 0 AND marks <= 10)),
    file_path TEXT DEFAULT '',           -- Supabase storage path: e.g. "F001/2026/September/head_2.pdf"
    file_name TEXT DEFAULT '',           -- Original uploaded document name
    file_size BIGINT DEFAULT 0,          -- File size in bytes
    file_type TEXT DEFAULT '',           -- MIME type e.g. "application/pdf"
    file_url TEXT DEFAULT '',            -- Storage download / signed access URL
    reference_info TEXT DEFAULT '',      -- Admin remarks on Head 1 if applicable
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_evaluation_head UNIQUE (evaluation_id, head_number)
);

CREATE INDEX IF NOT EXISTS idx_head_marks_eval_id ON public.evaluation_head_marks(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_head_marks_head_no ON public.evaluation_head_marks(head_number);

-- 6. AUTOMATED TOTAL MARKS RECALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.recalculate_evaluation_total()
RETURNS TRIGGER AS $$
DECLARE
    target_eval_id UUID;
    calc_total NUMERIC(6,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_eval_id := OLD.evaluation_id;
    ELSE
        target_eval_id := NEW.evaluation_id;
    END IF;

    SELECT COALESCE(SUM(COALESCE(marks, 0)), 0)
    INTO calc_total
    FROM public.evaluation_head_marks
    WHERE evaluation_id = target_eval_id;

    UPDATE public.monthly_evaluations
    SET total_marks = calc_total,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = target_eval_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_total ON public.evaluation_head_marks;
CREATE TRIGGER trg_recalculate_total
AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_head_marks
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_evaluation_total();

-- 7. SECURITY & ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_head_marks ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if auth user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper Function: Get current authenticated faculty_id
CREATE OR REPLACE FUNCTION public.get_auth_faculty_id()
RETURNS TEXT AS $$
    SELECT faculty_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper Function: Check if a month is locked
CREATE OR REPLACE FUNCTION public.is_month_locked(p_year INT, p_month TEXT)
RETURNS BOOLEAN AS $$
    SELECT COALESCE((
        SELECT is_locked FROM public.month_locks
        WHERE year = p_year AND month = p_month
        LIMIT 1
    ), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "View profiles" ON public.profiles;
CREATE POLICY "View profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Update profiles" ON public.profiles;
CREATE POLICY "Update profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
CREATE POLICY "Insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- MONTH LOCKS POLICIES
DROP POLICY IF EXISTS "Read month locks" ON public.month_locks;
CREATE POLICY "Read month locks" ON public.month_locks
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admin manage month locks" ON public.month_locks;
CREATE POLICY "Admin manage month locks" ON public.month_locks
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- MONTHLY EVALUATIONS POLICIES
DROP POLICY IF EXISTS "View monthly evaluations" ON public.monthly_evaluations;
CREATE POLICY "View monthly evaluations" ON public.monthly_evaluations
    FOR SELECT TO authenticated
    USING (faculty_id = public.get_auth_faculty_id() OR public.is_admin());

DROP POLICY IF EXISTS "Insert monthly evaluations" ON public.monthly_evaluations;
CREATE POLICY "Insert monthly evaluations" ON public.monthly_evaluations
    FOR INSERT TO authenticated
    WITH CHECK (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month))
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Update monthly evaluations" ON public.monthly_evaluations;
CREATE POLICY "Update monthly evaluations" ON public.monthly_evaluations
    FOR UPDATE TO authenticated
    USING (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month) AND status = 'draft')
        OR public.is_admin()
    )
    WITH CHECK (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month))
        OR public.is_admin()
    );

-- EVALUATION HEAD MARKS POLICIES
DROP POLICY IF EXISTS "View head marks" ON public.evaluation_head_marks;
CREATE POLICY "View head marks" ON public.evaluation_head_marks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.monthly_evaluations e
            WHERE e.id = evaluation_id
              AND (e.faculty_id = public.get_auth_faculty_id() OR public.is_admin())
        )
    );

-- Faculty can modify Heads 2 to 8 only on their own unlocked draft evaluation
-- Head 1 is strictly restricted: Faculty CANNOT modify Head 1, only Admin can
DROP POLICY IF EXISTS "Faculty modify Heads 2 to 8" ON public.evaluation_head_marks;
CREATE POLICY "Faculty modify Heads 2 to 8" ON public.evaluation_head_marks
    FOR ALL TO authenticated
    USING (
        (
            head_number BETWEEN 2 AND 8
            AND EXISTS (
                SELECT 1 FROM public.monthly_evaluations e
                WHERE e.id = evaluation_id
                  AND e.faculty_id = public.get_auth_faculty_id()
                  AND e.status = 'draft'
                  AND NOT public.is_month_locked(e.year, e.month)
            )
        )
        OR public.is_admin()
    )
    WITH CHECK (
        (
            head_number BETWEEN 2 AND 8
            AND EXISTS (
                SELECT 1 FROM public.monthly_evaluations e
                WHERE e.id = evaluation_id
                  AND e.faculty_id = public.get_auth_faculty_id()
                  AND e.status = 'draft'
                  AND NOT public.is_month_locked(e.year, e.month)
            )
        )
        OR public.is_admin()
    );

-- 8. SUPABASE STORAGE BUCKET & POLICIES (PRIVATE BUCKET: faculty-reference-documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('faculty-reference-documents', 'faculty-reference-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "Authenticated users view reference documents" ON storage.objects;
CREATE POLICY "Authenticated users view reference documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'faculty-reference-documents'
        AND (
            (storage.foldername(name))[1] = public.get_auth_faculty_id()
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "Faculty upload reference documents" ON storage.objects;
CREATE POLICY "Faculty upload reference documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'faculty-reference-documents'
        AND (storage.foldername(name))[1] = public.get_auth_faculty_id()
    );

-- 9. VIEW FOR EXPORT & SUMMARY REPORTING
CREATE OR REPLACE VIEW public.vw_faculty_evaluation_summary AS
SELECT 
    p.faculty_id,
    p.name AS faculty_name,
    p.department,
    p.designation,
    e.year,
    e.month,
    e.status,
    e.submitted_at,
    e.total_marks,
    MAX(CASE WHEN h.head_number = 1 THEN h.marks ELSE NULL END) AS head_1_marks,
    MAX(CASE WHEN h.head_number = 2 THEN h.marks ELSE NULL END) AS head_2_marks,
    MAX(CASE WHEN h.head_number = 3 THEN h.marks ELSE NULL END) AS head_3_marks,
    MAX(CASE WHEN h.head_number = 4 THEN h.marks ELSE NULL END) AS head_4_marks,
    MAX(CASE WHEN h.head_number = 5 THEN h.marks ELSE NULL END) AS head_5_marks,
    MAX(CASE WHEN h.head_number = 6 THEN h.marks ELSE NULL END) AS head_6_marks,
    MAX(CASE WHEN h.head_number = 7 THEN h.marks ELSE NULL END) AS head_7_marks,
    MAX(CASE WHEN h.head_number = 8 THEN h.marks ELSE NULL END) AS head_8_marks
FROM public.profiles p
LEFT JOIN public.monthly_evaluations e ON p.faculty_id = e.faculty_id
LEFT JOIN public.evaluation_head_marks h ON e.id = h.evaluation_id
WHERE p.role = 'faculty'
GROUP BY 
    p.faculty_id, p.name, p.department, p.designation,
    e.year, e.month, e.status, e.submitted_at, e.total_marks;
