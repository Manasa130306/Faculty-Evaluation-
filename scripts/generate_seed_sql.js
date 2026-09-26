const fs = require('fs');
const list = require('./faculty_56_full.json');

let seedSql = `-- ==============================================================================
-- NSRIET FACULTY EVALUATION MANAGEMENT SYSTEM - PRODUCTION SEED DATA
-- AUTHORITATIVE 56 FACULTY (SOURCE: NSRIET_FACULTY_SAR_TRACKER_MODIFIED.xlsx)
-- ==============================================================================

-- 1. ADMIN USER PROFILE
INSERT INTO public.profiles (id, faculty_id, name, department, designation, role, email)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'ADMIN01', 'Administrator', 'Administration', 'Principal / Dean', 'admin', 'admin@nsriet.edu.in')
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = 'admin';

-- 2. ALL 56 AUTHORITATIVE FACULTY FROM SAR TRACKER & SERVICE REGISTER
INSERT INTO public.faculty (faculty_id, name, designation, department, doj, dor)
VALUES
`;

const facultyValues = list.map(f => {
  const dojVal = f.doj ? `'${f.doj}'` : `'01-06-2023'`;
  const dorVal = f.dor ? `'${f.dor}'` : 'NULL';
  return `    ('${f.faculty_id}', '${f.name.replace(/'/g, "''")}', '${f.designation.replace(/'/g, "''")}', '${f.department}', ${dojVal}, ${dorVal})`;
});

seedSql += facultyValues.join(',\n');
seedSql += `
ON CONFLICT (faculty_id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    doj = EXCLUDED.doj,
    dor = EXCLUDED.dor;

-- 3. SEED INITIAL MONTH LOCKS (Academic Year 2026)
INSERT INTO public.month_locks (year, month, is_locked, locked_at)
VALUES
    (2026, 'July', TRUE, '2026-08-01 00:00:00+00'),
    (2026, 'August', TRUE, '2026-09-01 00:00:00+00'),
    (2026, 'September', FALSE, NULL),
    (2026, 'October', FALSE, NULL),
    (2026, 'November', FALSE, NULL),
    (2026, 'December', FALSE, NULL),
    (2026, 'January', FALSE, NULL),
    (2026, 'February', FALSE, NULL),
    (2026, 'March', FALSE, NULL),
    (2026, 'April', FALSE, NULL),
    (2026, 'May', FALSE, NULL),
    (2026, 'June', FALSE, NULL)
ON CONFLICT (year, month) DO UPDATE SET
    is_locked = EXCLUDED.is_locked,
    locked_at = EXCLUDED.locked_at;

-- 4. SEED SAR TRACKER AUDIT & MAPPING
INSERT INTO public.sar_tracker_audit (sar_name, sar_department, matched_faculty_id, match_status, notes)
VALUES
`;

const auditValues = list.map(f => {
  const matchedId = f.faculty_id.startsWith('SAR_') ? 'NULL' : `'${f.faculty_id}'`;
  return `    ('${f.name.replace(/'/g, "''")}', '${f.department}', ${matchedId}, '${f.matchStatus}', '${f.notes.replace(/'/g, "''")}')`;
});

seedSql += auditValues.join(',\n');
seedSql += `
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync('supabase/seed.sql', seedSql);
console.log('Updated supabase/seed.sql with 56 faculty records.');
