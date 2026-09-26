-- ==============================================================================
-- NSRIET FACULTY EVALUATION MANAGEMENT SYSTEM - COMPLETE PRODUCTION SCHEMA
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'faculty' CHECK (role IN ('faculty', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. FACULTY MASTER TABLE (SERVICE REGISTER: 72 RECORDS)
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT UNIQUE NOT NULL, -- EMP. ID (NSRIET)
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    doj TEXT,
    dor TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faculty_faculty_id ON public.faculty(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON public.faculty(department);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public.faculty(user_id);

-- 4. MONTH LOCKS TABLE
CREATE TABLE IF NOT EXISTS public.month_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_month_locks_year_month UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_month_locks_year_month ON public.month_locks(year, month);

-- 5. MONTHLY EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT NOT NULL REFERENCES public.faculty(faculty_id) ON UPDATE CASCADE ON DELETE CASCADE,
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'Draft', 'Submitted')),
    submitted_at TIMESTAMPTZ,
    total_marks NUMERIC(6,2) DEFAULT 0 CHECK (total_marks >= 0 AND total_marks <= 110),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_evaluations_faculty_year_month UNIQUE (faculty_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_faculty_id ON public.evaluations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON public.evaluations(year, month);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.evaluations(status);

-- 6. EVALUATION HEAD MARKS TABLE (HEADS 1 TO 8)
CREATE TABLE IF NOT EXISTS public.evaluation_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
    head_number INT NOT NULL CHECK (head_number BETWEEN 1 AND 8),
    marks NUMERIC(6,2) DEFAULT NULL CHECK (marks IS NULL OR (marks >= 0 AND marks <= 45)),
    reference_document_path TEXT DEFAULT NULL,
    reference_document_name TEXT DEFAULT NULL,
    reference_document_size BIGINT DEFAULT NULL,
    reference_document_type TEXT DEFAULT NULL,
    reference_info TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_evaluation_heads_head UNIQUE (evaluation_id, head_number)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_heads_eval_id ON public.evaluation_heads(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_heads_head_no ON public.evaluation_heads(head_number);

-- 7. SAR TRACKER AUDIT & MAPPING REVIEW TABLE
CREATE TABLE IF NOT EXISTS public.sar_tracker_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sar_name TEXT NOT NULL,
    sar_department TEXT NOT NULL,
    matched_faculty_id TEXT REFERENCES public.faculty(faculty_id) ON UPDATE CASCADE ON DELETE SET NULL,
    match_status TEXT NOT NULL CHECK (match_status IN ('verified', 'ambiguous', 'unmatched')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. AUTOMATED TOTAL MARKS RECALCULATION TRIGGER
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
    FROM public.evaluation_heads
    WHERE evaluation_id = target_eval_id;

    UPDATE public.evaluations
    SET total_marks = calc_total,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = target_eval_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_evaluation_total ON public.evaluation_heads;
CREATE TRIGGER trg_recalculate_evaluation_total
AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_heads
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_evaluation_total();

-- 9. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_faculty_id()
RETURNS TEXT AS $$
    SELECT faculty_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_month_locked(p_year INT, p_month TEXT)
RETURNS BOOLEAN AS $$
    SELECT COALESCE((
        SELECT is_locked FROM public.month_locks
        WHERE year = p_year AND month = p_month
        LIMIT 1
    ), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sar_tracker_audit ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
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

-- Faculty Master Policies
DROP POLICY IF EXISTS "View faculty records" ON public.faculty;
CREATE POLICY "View faculty records" ON public.faculty
    FOR SELECT TO authenticated
    USING (faculty_id = public.get_auth_faculty_id() OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage faculty records" ON public.faculty;
CREATE POLICY "Admin manage faculty records" ON public.faculty
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Month Locks Policies
DROP POLICY IF EXISTS "Read month locks" ON public.month_locks;
CREATE POLICY "Read month locks" ON public.month_locks
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admin manage month locks" ON public.month_locks;
CREATE POLICY "Admin manage month locks" ON public.month_locks
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Evaluations Policies
DROP POLICY IF EXISTS "View evaluations" ON public.evaluations;
CREATE POLICY "View evaluations" ON public.evaluations
    FOR SELECT TO authenticated
    USING (faculty_id = public.get_auth_faculty_id() OR public.is_admin());

DROP POLICY IF EXISTS "Faculty insert evaluations" ON public.evaluations;
CREATE POLICY "Faculty insert evaluations" ON public.evaluations
    FOR INSERT TO authenticated
    WITH CHECK (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month))
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Faculty update evaluations" ON public.evaluations;
CREATE POLICY "Faculty update evaluations" ON public.evaluations
    FOR UPDATE TO authenticated
    USING (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month) AND LOWER(status) = 'draft')
        OR public.is_admin()
    )
    WITH CHECK (
        (faculty_id = public.get_auth_faculty_id() AND NOT public.is_month_locked(year, month))
        OR public.is_admin()
    );

-- Evaluation Heads Policies
DROP POLICY IF EXISTS "View evaluation heads" ON public.evaluation_heads;
CREATE POLICY "View evaluation heads" ON public.evaluation_heads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.evaluations e
            WHERE e.id = evaluation_id
              AND (e.faculty_id = public.get_auth_faculty_id() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Modify evaluation heads" ON public.evaluation_heads;
CREATE POLICY "Modify evaluation heads" ON public.evaluation_heads
    FOR ALL TO authenticated
    USING (
        (
            head_number BETWEEN 2 AND 8
            AND EXISTS (
                SELECT 1 FROM public.evaluations e
                WHERE e.id = evaluation_id
                  AND e.faculty_id = public.get_auth_faculty_id()
                  AND LOWER(e.status) = 'draft'
                  AND NOT public.is_month_locked(e.year, e.month)
            )
        )
        OR public.is_admin()
    )
    WITH CHECK (
        (
            head_number BETWEEN 2 AND 8
            AND EXISTS (
                SELECT 1 FROM public.evaluations e
                WHERE e.id = evaluation_id
                  AND e.faculty_id = public.get_auth_faculty_id()
                  AND LOWER(e.status) = 'draft'
                  AND NOT public.is_month_locked(e.year, e.month)
            )
        )
        OR public.is_admin()
    );

-- SAR Audit Table Policies
DROP POLICY IF EXISTS "Admin view SAR audit" ON public.sar_tracker_audit;
CREATE POLICY "Admin view SAR audit" ON public.sar_tracker_audit
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage SAR audit" ON public.sar_tracker_audit;
CREATE POLICY "Admin manage SAR audit" ON public.sar_tracker_audit
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 11. SUPABASE STORAGE BUCKET (faculty-reference-documents)
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

-- 12. REPORTING VIEW
CREATE OR REPLACE VIEW public.vw_faculty_evaluation_summary AS
SELECT 
    f.faculty_id,
    f.name AS faculty_name,
    f.department,
    f.designation,
    f.doj,
    f.dor,
    e.year,
    e.month,
    COALESCE(e.status, 'not_started') AS status,
    e.submitted_at,
    COALESCE(e.total_marks, 0) AS total_marks,
    MAX(CASE WHEN h.head_number = 1 THEN h.marks ELSE NULL END) AS head_1_marks,
    MAX(CASE WHEN h.head_number = 2 THEN h.marks ELSE NULL END) AS head_2_marks,
    MAX(CASE WHEN h.head_number = 3 THEN h.marks ELSE NULL END) AS head_3_marks,
    MAX(CASE WHEN h.head_number = 4 THEN h.marks ELSE NULL END) AS head_4_marks,
    MAX(CASE WHEN h.head_number = 5 THEN h.marks ELSE NULL END) AS head_5_marks,
    MAX(CASE WHEN h.head_number = 6 THEN h.marks ELSE NULL END) AS head_6_marks,
    MAX(CASE WHEN h.head_number = 7 THEN h.marks ELSE NULL END) AS head_7_marks,
    MAX(CASE WHEN h.head_number = 8 THEN h.marks ELSE NULL END) AS head_8_marks
FROM public.faculty f
LEFT JOIN public.evaluations e ON f.faculty_id = e.faculty_id
LEFT JOIN public.evaluation_heads h ON e.id = h.evaluation_id
GROUP BY 
    f.faculty_id, f.name, f.department, f.designation, f.doj, f.dor,
    e.year, e.month, e.status, e.submitted_at, e.total_marks;
