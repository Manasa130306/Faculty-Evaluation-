-- ==============================================================================
-- FACULTY MASTER LIST UPDATE
-- Migration: 20260929000001_update_faculty_list.sql
-- ==============================================================================

-- 1. Ensure N. SOWJANYA (23TS520012) is marked inactive in MBA (preserving historical evaluations)
UPDATE public.faculty
SET is_active = FALSE,
    dor = '08-07-2025',
    inactive_from_year = 2025,
    inactive_from_month = 'July',
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE faculty_id = '23TS520012';

UPDATE public.profiles
SET is_active = FALSE,
    inactive_from_year = 2025,
    inactive_from_month = 'July',
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE faculty_id = '23TS520012';

-- 2. ADD K. SOWJANYA to MBA (ID Pending)
INSERT INTO public.faculty (faculty_id, name, designation, department, is_active, doj, created_at, updated_at)
VALUES ('PENDING_MBA_KSOWJANYA', 'K. SOWJANYA', 'ASST. PROF.', 'MBA', TRUE, '01-07-2025', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW()))
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    is_active = TRUE;

-- 3. ADD GOLAGANI SRINU (26TS520088) to MBA
INSERT INTO public.faculty (faculty_id, name, designation, department, is_active, doj, created_at, updated_at)
VALUES ('26TS520088', 'GOLAGANI SRINU', 'ASST. PROF.', 'MBA', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW()))
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    is_active = TRUE;

-- 4. ADD Dr. PHANINDRA VARMA to BS&H (ID Pending)
INSERT INTO public.faculty (faculty_id, name, designation, department, is_active, doj, created_at, updated_at)
VALUES ('PENDING_BSH_PVARMA', 'Dr. PHANINDRA VARMA', 'Professor', 'BS&H', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW()))
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    is_active = TRUE;

-- 5. ADD NEW VERIFIED FACULTY
INSERT INTO public.faculty (faculty_id, name, designation, department, is_active, doj, created_at, updated_at)
VALUES 
('26TS510086', 'VENKATA RAMANA PUSARLA', 'ASST. PROF.', 'BS&H', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW())),
('26TS520087', 'ENDREDDI YERRAYYA REDDY', 'ASST. PROF.', 'MBA', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW())),
('26TS040089', 'VURUKUTI SINDHU BHARGAVI', 'ASST. PROF.', 'ECE', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW())),
('26TS050074', 'SIMHADRI VENKATA MEENA', 'ASST. PROF.', 'CSE', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW())),
('25TS520055', 'KAKARLAPUDI SOUJIANYA', 'ASST. PROF.', 'MBA', TRUE, '01-07-2025', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW())),
('26TS510085', 'SHAIK NAGUR VALI', 'ASST. PROF.', 'CSE', TRUE, '01-06-2023', TIMEZONE('utc'::text, NOW()), TIMEZONE('utc'::text, NOW()))
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    is_active = TRUE;
