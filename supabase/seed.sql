-- ==============================================================================
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
    ('25TS040053', 'P. Sateesh Kumar', 'ASST. PROF.', 'ECE', '23-06-2025', NULL),
    ('24TS040031', 'D. Soma Sekhar', 'ASST. PROF.', 'ECE', '13-06-2024', NULL),
    ('24TS040028', 'Hema Sundari', 'ASST. PROF.', 'ECE', '30-05-2024', NULL),
    ('24TS040040', 'Kala Priya', 'ASST. PROF.', 'ECE', '25-11-2024', NULL),
    ('24TS040045', 'Jhansi Rani', 'ASST. PROF.', 'ECE', '09-12-2024', NULL),
    ('25TS040051', 'V. Satyavathi', 'ASST. PROF.', 'ECE', '06-06-2025', NULL),
    ('25TS040052', 'G. Siva Kumari', 'ASST. PROF.', 'ECE', '18-06-2025', NULL),
    ('25TS040065', 'P. Kasturi', 'ASST. PROF.', 'ECE', '03-11-2025', NULL),
    ('SAR_ECE_09', 'R. K. A. Nageswari', 'ASST. PROF.', 'ECE', '01-06-2023', NULL),
    ('SAR_ECE_10', 'U. pradeep Kumar', 'ASST. PROF.', 'ECE', '01-06-2023', NULL),
    ('SAR_ECE_11', 'R. Mahesh', 'ASST. PROF.', 'ECE', '01-06-2023', NULL),
    ('SAR_ECE_12', 'V. Sindhu Bhargavi', 'ASST. PROF.', 'ECE', '01-06-2023', NULL),
    ('24TS020027', 'A. Prasada Rao', 'ASSOC. PROF. & HOD', 'EEE', '14-02-2024', NULL),
    ('23TS020019', 'R. Srujana sri', 'ASST. PROF.', 'EEE', '04-10-2023', NULL),
    ('24TS020033', 'P. L. Chandini', 'ASST. PROF.', 'EEE', '01-07-2024', NULL),
    ('24TS020044', 'U. Sirisha', 'ASST. PROF.', 'EEE', '06-12-2024', NULL),
    ('SAR_EEE_17', 'R. Anuradha', 'ASST. PROF.', 'EEE', '01-06-2023', NULL),
    ('23TS030023', 'Ramanjaneyulu', 'ASSOC. PROF.', 'MECH', '27-11-2023', NULL),
    ('24TS030041', 'Dr. Ravi Teja', 'ASST. PROF.', 'MECH', '28-11-2024', NULL),
    ('23TS030018', 'Suresh Babu', 'ASST. PROF.', 'MECH', '25-09-2023', NULL),
    ('26TS030066', 'Padmaja', 'ASST. PROF.', 'MECH', '19-01-2026', NULL),
    ('26TS030072', 'Sri Devi', 'ASST. PROF.', 'MECH', '18-05-2026', NULL),
    ('23TS510002', 'Anhijit', 'ASST. PROF. (ENGLISH)', 'MBA', '26-05-2023', NULL),
    ('23TS520012', 'Sowjanya', 'ASST. PROF.', 'MBA', '05-06-2023', '08-07-2025'),
    ('23TS520008', 'Srinivas', 'ASST. PROF.', 'MBA', '01-06-2023', NULL),
    ('23TS050009', 'Adibabu', 'ASST. PROF. & HOD', 'CSE', '03-06-2023', NULL),
    ('24TS050032', 'M. Asha', 'ASST. PROF.', 'CSE', '24-06-2024', NULL),
    ('24TS050035', 'Uma Maheswara Rao', 'ASST. PROF.', 'CSE', '18-07-2024', NULL),
    ('24TS050037', 'Deva Raj', 'ASST. PROF.', 'CSE', '19-08-2024', NULL),
    ('25TS050047', 'Venkateswara Rao', 'ASST. PROF.', 'CSE', '02-06-2025', NULL),
    ('25TS050048', 'Diwakar', 'ASST. PROF.', 'CSE', '02-06-2025', NULL),
    ('25TS050049', 'Phani Sekhar', 'ASST. PROF.', 'CSE', '02-06-2025', NULL),
    ('25TS050063', 'Sravanti', 'ASST. PROF.', 'CSE', '31-10-2025', NULL),
    ('26TS050067', 'Dr. Harihara Santosh', 'PROFESSOR', 'CSE', '05-05-2026', NULL),
    ('26TS050068', 'P. Chandra Sekhar', 'ASST. PROF.', 'CSE', '06-05-2026', NULL),
    ('26TS050070', 'K. Shiva', 'ASST. PROF.', 'CSE', '15-05-2026', NULL),
    ('26TS050071', 'M. Sai Jyothi', 'ASST. PROF.', 'CSE', '15-05-2026', NULL),
    ('26TS030073', 'P. Unnati Aditya', 'ASST. PROF.', 'CSE', '19-05-2026', NULL),
    ('SAR_CSE_39', 'S. V. Meena', 'ASST. PROF.', 'CSE', '01-06-2023', NULL),
    ('SAR_CSE_40', 'I. Siva Santosh', 'ASST. PROF.', 'CSE', '01-06-2023', NULL),
    ('SAR_CSE_41', 'Shaik Nagur Vali', 'ASST. PROF.', 'CSE', '01-06-2023', NULL),
    ('SAR_CSE_42', 'P. Prashanth', 'ASST. PROF.', 'CSE', '01-06-2023', NULL),
    ('25TS050064', 'Rukmini', 'ASST. PROF.', 'CSE', '01-11-2025', NULL),
    ('24TS510030', 'Pavani', 'ASST. PROF. (MATHEMATICS)', 'CSE', '07-06-2024', NULL),
    ('25TS050059', 'Prasad', 'ASST. PROF.', 'CSE', '09-09-2025', NULL),
    ('23TS510007', 'Nagamani Naidu', 'ASST. PROF. (CHEMISTRY) & HOD', 'BS&H', '01-06-2023', NULL),
    ('23TS510015', 'MMK Raju', 'ASST. PROF. (MATHEMATICS)', 'BS&H', '01-07-2023', NULL),
    ('24TS510036', 'Neelima', 'ASST. PROF. (MATHEMATICS)', 'BS&H', '05-08-2024', NULL),
    ('25TS510046', 'Dhana Lakshni', 'ASST. PROF. (PHYSICS)', 'BS&H', '29-05-2025', NULL),
    ('23TS510003', 'Hariprasad', 'ASST. PROF. (MATHEMATICS)', 'BS&H', '26-05-2023', NULL),
    ('SAR_BSH_51', 'P.V.Ramana', 'ASST. PROF.', 'BS&H', '01-06-2023', NULL),
    ('26TS510069', 'Sai Sruthi', 'ASST. PROF. (PHYSICS)', 'BS&H', '11-05-2026', NULL),
    ('25TS510057', 'Y Sharavan', 'ASST. PROF. (ENGLISH)', 'BS&H', '16-07-2025', NULL),
    ('SAR_BSH_54', 'Dr. Krishna', 'ASST. PROF.', 'BS&H', '01-06-2023', NULL),
    ('23TS510004', 'D. Appa Rao', 'ASST. PROF. & PD', 'BS&H', '26-05-2023', NULL),
    ('23TS510010', 'S. Govinda', 'ASST. PROF. (CHEMISTRY)', 'BS&H', '03-06-2023', NULL)
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
    ('P. Sateesh Kumar', 'ECE', '25TS040053', 'verified', 'Matched to Mr POTUNURU SATEESH KUMAR (25TS040053)'),
    ('D. Soma Sekhar', 'ECE', '24TS040031', 'verified', 'Matched to DASARI SOMASEKHAR (24TS040031)'),
    ('Hema Sundari', 'ECE', '24TS040028', 'verified', 'Matched to TAMMINA HEMA SUNDARI (24TS040028)'),
    ('Kala Priya', 'ECE', '24TS040040', 'verified', 'Matched to KOSTI KALA PRIYA (24TS040040)'),
    ('Jhansi Rani', 'ECE', '24TS040045', 'verified', 'Matched to KADIYALA JHANSI RANI (24TS040045)'),
    ('V. Satyavathi', 'ECE', '25TS040051', 'verified', 'Matched to VALLY SATYAVATHI (25TS040051)'),
    ('G. Siva Kumari', 'ECE', '25TS040052', 'verified', 'Matched to Mrs GORLI SIVA KUMARI (25TS040052)'),
    ('P. Kasturi', 'ECE', '25TS040065', 'verified', 'Matched to Mrs PENTAPALLI KASTURI (25TS040065)'),
    ('R. K. A. Nageswari', 'ECE', NULL, 'unmatched', 'Not in Service Register'),
    ('U. pradeep Kumar', 'ECE', NULL, 'unmatched', 'Not in Service Register'),
    ('R. Mahesh', 'ECE', NULL, 'unmatched', 'Not in Service Register'),
    ('V. Sindhu Bhargavi', 'ECE', NULL, 'unmatched', 'Not in Service Register'),
    ('A. Prasada Rao', 'EEE', '24TS020027', 'verified', 'Matched to Mr AKULA PRASADA RAO (24TS020027)'),
    ('R. Srujana sri', 'EEE', '23TS020019', 'verified', 'Matched to Mrs REDDI SUJANA SRI (23TS020019)'),
    ('P. L. Chandini', 'EEE', '24TS020033', 'verified', 'Matched to Mrs PATTI LAKSHMI CHANDINI (24TS020033)'),
    ('U. Sirisha', 'EEE', '24TS020044', 'verified', 'Matched to Mrs SHIRISHA UNDRAJAVARAPU (24TS020044)'),
    ('R. Anuradha', 'EEE', NULL, 'unmatched', 'Not in Service Register'),
    ('Ramanjaneyulu', 'MECH', '23TS030023', 'verified', 'Matched to BEELA RAMANJANEYULU (23TS030023)'),
    ('Dr. Ravi Teja', 'MECH', '24TS030041', 'verified', 'Matched to Dr TANKALA  RAVITEJA (24TS030041)'),
    ('Suresh Babu', 'MECH', '23TS030018', 'verified', 'Matched to Mr SURESH BABU TALLAPUDI (23TS030018)'),
    ('Padmaja', 'MECH', '26TS030066', 'verified', 'Matched to PADMAJA ANDAVARAPU (26TS030066)'),
    ('Sri Devi', 'MECH', '26TS030072', 'verified', 'Matched to KALDARI SRIDEVI (26TS030072)'),
    ('Anhijit', 'MBA', '23TS510002', 'verified', 'SAR MBA, SR BS&H English'),
    ('Sowjanya', 'MBA', '23TS520012', 'verified', 'Mrs N Soujanya (MBA)'),
    ('Srinivas', 'MBA', '23TS520008', 'verified', 'Mr Sekhara Mahanthi Madhusudana Rao (MBA)'),
    ('Adibabu', 'CSE', '23TS050009', 'verified', 'Matched to Mr ADIBABU RIPARAGIRI (23TS050009)'),
    ('M. Asha', 'CSE', '24TS050032', 'verified', 'Matched to Mrs MUDADLA ASHA (24TS050032)'),
    ('Uma Maheswara Rao', 'CSE', '24TS050035', 'verified', 'Matched to Mr UMAMAHESWARARAO GOTTAPU (24TS050035)'),
    ('Deva Raj', 'CSE', '24TS050037', 'verified', 'Matched to Mr DEVARAJU HANUMANTHU (24TS050037)'),
    ('Venkateswara Rao', 'CSE', '25TS050047', 'verified', 'Matched to Mr GORLE VENKATESWARA RAO (25TS050047)'),
    ('Diwakar', 'CSE', '25TS050048', 'verified', 'Matched to Mr SUSARAPU DIVAKAR (25TS050048)'),
    ('Phani Sekhar', 'CSE', '25TS050049', 'verified', 'Matched to Mr KOPPALA KASI VENKATA PHANI SEKHAR (25TS050049)'),
    ('Sravanti', 'CSE', '25TS050063', 'verified', 'Matched to Mrs CHIPURAPALLI SRAVANTHI (25TS050063)'),
    ('Dr. Harihara Santosh', 'CSE', '26TS050067', 'verified', 'Matched to Dr HARIHARA SANTOSH DADI (26TS050067)'),
    ('P. Chandra Sekhar', 'CSE', '26TS050068', 'verified', 'Matched to CHANDRASEKHARARAO PAKKI (26TS050068)'),
    ('K. Shiva', 'CSE', '26TS050070', 'verified', 'Matched to KONA SIVA (26TS050070)'),
    ('M. Sai Jyothi', 'CSE', '26TS050071', 'verified', 'Matched to MELETI SAI JYOTHI (26TS050071)'),
    ('P. Unnati Aditya', 'CSE', '26TS030073', 'verified', 'Matched to PASUPULETI UNNATHI ADITHJYA (26TS030073)'),
    ('S. V. Meena', 'CSE', NULL, 'unmatched', 'Not in Service Register'),
    ('I. Siva Santosh', 'CSE', NULL, 'unmatched', 'Not in Service Register'),
    ('Shaik Nagur Vali', 'CSE', NULL, 'unmatched', 'Not in Service Register'),
    ('P. Prashanth', 'CSE', NULL, 'unmatched', 'Not in Service Register'),
    ('Rukmini', 'CSE', '25TS050064', 'verified', 'Matched to Mrs KOLLURI RUKMINI (25TS050064)'),
    ('Pavani', 'CSE', '24TS510030', 'verified', 'Mrs Ambati Pavani (BS&H/CSE)'),
    ('Prasad', 'CSE', '25TS050059', 'verified', 'Matched to Mr AMARA PRASAD (25TS050059)'),
    ('Nagamani Naidu', 'BS&H', '23TS510007', 'verified', 'Matched to Dr NAGAMANINAIDU BONNADA (23TS510007)'),
    ('MMK Raju', 'BS&H', '23TS510015', 'verified', 'Matched to M KRISHNA RAJU MUDUNURU (23TS510015)'),
    ('Neelima', 'BS&H', '24TS510036', 'verified', 'Matched to Mrs DANTHUMSETTY NEELIMA (24TS510036)'),
    ('Dhana Lakshni', 'BS&H', '25TS510046', 'verified', 'Matched to Mrs KORADA DHANALAKSHMI (25TS510046)'),
    ('Hariprasad', 'BS&H', '23TS510003', 'verified', 'Matched to REGULAVALASA HARI PRASAD (23TS510003)'),
    ('P.V.Ramana', 'BS&H', NULL, 'unmatched', 'Not in Service Register'),
    ('Sai Sruthi', 'BS&H', '26TS510069', 'verified', 'Matched to MULLU SAISRUTHI (26TS510069)'),
    ('Y Sharavan', 'BS&H', '25TS510057', 'verified', 'Matched to Mr SRAVAN KUMAR YALLA (25TS510057)'),
    ('Dr. Krishna', 'BS&H', NULL, 'unmatched', 'Not in Service Register'),
    ('D. Appa Rao', 'BS&H', '23TS510004', 'verified', 'Matched to Mr GUNTU APPA RAO (23TS510004)'),
    ('S. Govinda', 'BS&H', '23TS510010', 'verified', 'Matched to Mr SARIKA GOVIND (23TS510010)')
ON CONFLICT DO NOTHING;
