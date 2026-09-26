export type UserRole = 'faculty' | 'admin';

export interface Profile {
  id: string;
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
  role: UserRole;
  email?: string;
  is_demo?: boolean;
  is_active?: boolean;
  removed_at?: string | null;
  removed_by?: string | null;
  inactive_from_year?: number | null;
  inactive_from_month?: string | null;
  created_at?: string;
}

export interface FacultyRecord {
  id?: string;
  faculty_id: string; // EMP. ID (NSRIET)
  name: string;
  designation: string;
  department: string;
  doj: string | null;
  dor: string | null;
  user_id?: string | null;
  is_demo?: boolean;
  is_active?: boolean;
  removed_at?: string | null;
  removed_by?: string | null;
  inactive_from_year?: number | null;
  inactive_from_month?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonthLock {
  id?: string;
  year: number;
  month: string;
  is_locked: boolean;
  locked_at?: string | null;
  locked_by?: string | null;
}

export type EvaluationStatus = 'draft' | 'submitted';

export interface EvaluationHeadMark {
  id?: string;
  evaluation_id?: string;
  head_number: number;
  marks: number | null;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  reference_info?: string;
  updated_at?: string;
}

export interface MonthlyEvaluation {
  id: string;
  faculty_id: string;
  year: number;
  month: string;
  status: EvaluationStatus;
  submitted_at: string | null;
  total_marks: number;
  created_at?: string;
  updated_at?: string;
  head_marks?: Record<number, EvaluationHeadMark>;
}

export interface HeadConfig {
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  guidelines: string;
  maxMarks: number;
  isAdminOnly: boolean;
  requiresDocument: boolean;
}

export interface FacultySummaryRow {
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
  doj?: string | null;
  dor?: string | null;
  status: EvaluationStatus | 'not_started';
  year: number;
  month: string;
  submitted_at: string | null;
  head_1: number | null;
  head_2: number | null;
  head_3: number | null;
  head_4: number | null;
  head_5: number | null;
  head_6: number | null;
  head_7: number | null;
  head_8: number | null;
  total_marks: number;
}

export interface SarAuditRecord {
  id: string;
  sar_name: string;
  sar_department: string;
  matched_faculty_id: string | null;
  match_status: 'verified' | 'ambiguous' | 'unmatched';
  notes?: string;
}
