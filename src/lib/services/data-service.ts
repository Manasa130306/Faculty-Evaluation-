import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  Profile,
  MonthlyEvaluation,
  EvaluationHeadMark,
  MonthLock,
  FacultySummaryRow,
  FacultyRecord,
  SarAuditRecord,
  EvaluationMarkChange,
} from '../types';
import { SERVICE_REGISTER_FACULTY, SAR_AUDIT_LOGS } from '../constants/facultyData';
import { HISTORICAL_EVALUATIONS } from '../constants/historicalData';

const STORAGE_KEYS = {
  PROFILES: 'nsriet_faculty_profiles_v3',
  FACULTY_MASTER: 'nsriet_faculty_master_v3',
  LOCKS: 'nsriet_month_locks_v3',
  EVALUATIONS: 'nsriet_evaluations_v3',
  FILES: 'nsriet_reference_files_cache_v3',
  SAR_AUDIT: 'nsriet_sar_audit_v3',
  MARK_CHANGES: 'nsriet_evaluation_mark_changes_v3',
};

import { uploadReferenceFileAction } from '@/app/actions/drive';

export const STORAGE_BUCKET_NAME = 'faculty-reference-documents';

function getLocalData<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

function initDefaultStorage(): void {
  if (typeof window === 'undefined') return;

  // Initialize Faculty Master (56 authoritative faculty)
  if (!localStorage.getItem(STORAGE_KEYS.FACULTY_MASTER)) {
    localStorage.setItem(STORAGE_KEYS.FACULTY_MASTER, JSON.stringify(SERVICE_REGISTER_FACULTY));
  }

  // Initialize Profiles (Admin + 56 faculty)
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    const defaultProfiles: Profile[] = [
      {
        id: 'admin-01',
        faculty_id: 'ADMIN01',
        name: 'Administrator (IQAC)',
        department: 'Administration',
        designation: 'Principal / Dean',
        role: 'admin',
        email: 'admin@nsriet.edu.in',
      },
      ...SERVICE_REGISTER_FACULTY.map((f) => ({
        id: `prof_${f.faculty_id}`,
        faculty_id: f.faculty_id,
        name: f.name,
        department: f.department,
        designation: f.designation,
        role: 'faculty' as const,
      })),
    ];
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultProfiles));
  }

  // Initialize Locks
  if (!localStorage.getItem(STORAGE_KEYS.LOCKS)) {
    const defaultLocks: MonthLock[] = [
      { id: 'l1', year: 2026, month: 'July', is_locked: true, locked_at: '2026-08-01T00:00:00Z' },
      { id: 'l2', year: 2026, month: 'August', is_locked: true, locked_at: '2026-09-01T00:00:00Z' },
      { id: 'l3', year: 2026, month: 'September', is_locked: false, locked_at: null },
      { id: 'l4', year: 2026, month: 'October', is_locked: false, locked_at: null },
      { id: 'l5', year: 2026, month: 'November', is_locked: false, locked_at: null },
      { id: 'l6', year: 2026, month: 'December', is_locked: false, locked_at: null },
      { id: 'l7', year: 2026, month: 'January', is_locked: false, locked_at: null },
      { id: 'l8', year: 2026, month: 'February', is_locked: false, locked_at: null },
      { id: 'l9', year: 2026, month: 'March', is_locked: false, locked_at: null },
      { id: 'l10', year: 2026, month: 'April', is_locked: false, locked_at: null },
      { id: 'l11', year: 2026, month: 'May', is_locked: false, locked_at: null },
      { id: 'l12', year: 2026, month: 'June', is_locked: false, locked_at: null },
    ];
    localStorage.setItem(STORAGE_KEYS.LOCKS, JSON.stringify(defaultLocks));
  }

  // Initialize Historical Evaluations (56 faculty for July and August)
  if (!localStorage.getItem(STORAGE_KEYS.EVALUATIONS)) {
    const evalMap: Record<string, MonthlyEvaluation> = {};
    HISTORICAL_EVALUATIONS.forEach((h) => {
      const key = `${h.faculty_id.toUpperCase()}_${h.year}_${h.month.toLowerCase()}`;
      evalMap[key] = {
        id: `hist_${h.faculty_id}_${h.year}_${h.month}`,
        faculty_id: h.faculty_id,
        year: h.year,
        month: h.month,
        status: h.status,
        submitted_at: '2026-08-15T00:00:00Z',
        total_marks: h.total,
        head_marks: {
          1: { head_number: 1, marks: h.h1, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          2: { head_number: 2, marks: h.h2, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          3: { head_number: 3, marks: h.h3, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          4: { head_number: 4, marks: h.h4, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          5: { head_number: 5, marks: h.h5, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          6: { head_number: 6, marks: h.h6, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          7: { head_number: 7, marks: h.h7, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
          8: { head_number: 8, marks: h.h8, file_name: '', reference_info: 'Imported from SAR Historical Tracker' },
        },
      };
    });
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evalMap));
  }

  // Initialize SAR Audit
  if (!localStorage.getItem(STORAGE_KEYS.SAR_AUDIT)) {
    localStorage.setItem(STORAGE_KEYS.SAR_AUDIT, JSON.stringify(SAR_AUDIT_LOGS));
  }
}

const PRODUCTION_FACULTY_ID_SET = new Set(
  SERVICE_REGISTER_FACULTY.map((f) => f.faculty_id.toUpperCase())
);

let cachedFaculty: FacultyRecord[] | null = null;
let cachedFacultyTime = 0;

export const DataService = {
  // 1. FACULTY MASTER & PROFILES
  async getAllFaculty(): Promise<FacultyRecord[]> {
    initDefaultStorage();

    if (cachedFaculty && Date.now() - cachedFacultyTime < 60000) {
      return cachedFaculty;
    }

    let facultyList: FacultyRecord[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('faculty')
          .select('*')
          .order('faculty_id', { ascending: true });

        if (!error && data && data.length > 0) {
          facultyList = data as FacultyRecord[];
          cachedFaculty = facultyList;
          cachedFacultyTime = Date.now();
          return facultyList;
        }
      } catch (err) {
        console.warn('Supabase fetch faculty error:', err);
      }
    }

    if (facultyList.length === 0) {
      facultyList = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    }
    
    cachedFaculty = facultyList;
    cachedFacultyTime = Date.now();
    return facultyList;
  },

  async getAllProfiles(): Promise<Profile[]> {
    initDefaultStorage();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('faculty')
          .select('*, profiles:user_id(role)')
          .order('faculty_id', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((f: any) => ({
            id: f.id,
            faculty_id: f.faculty_id,
            name: f.name,
            designation: f.designation,
            department: f.department,
            role: f.profiles?.role || 'faculty',
            created_at: f.created_at,
          })) as Profile[];
        }
      } catch (err) {
        console.warn('Supabase fetch faculty fallback:', err);
      }
    }
    return getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
  },

  async getProfileByFacultyId(facultyId: string): Promise<Profile | null> {
    initDefaultStorage();
    const cleanId = facultyId.trim().toUpperCase();

    if (cleanId === 'ADMIN' || cleanId === 'ADMIN01' || cleanId === 'ADMIN101' || cleanId === 'NSRE01') {
      return {
        id: `admin-${cleanId.toLowerCase()}`,
        faculty_id: cleanId,
        name: cleanId === 'NSRE01' ? 'Principal / Chief Evaluator' : cleanId === 'ADMIN101' ? 'Administrator (Demo)' : 'Administrator (IQAC)',
        department: 'Administration',
        designation: cleanId === 'NSRE01' ? 'Chief Administrator' : 'Evaluation Administrator',
        role: 'admin',
        email: `${cleanId.toLowerCase()}@nsriet.edu.in`,
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('faculty')
          .select('*, profiles:user_id(role)')
          .eq('faculty_id', cleanId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            faculty_id: data.faculty_id,
            name: data.name,
            designation: data.designation,
            department: data.department,
            role: data.profiles?.role || 'faculty',
            created_at: data.created_at,
          } as Profile;
        }
      } catch (err) {
        console.warn('Supabase get faculty profile error:', err);
      }
    }

    const profiles = await this.getAllProfiles();
    const found = profiles.find((p) => p.faculty_id.toUpperCase() === cleanId);
    if (found) return found;

    // Check directly in faculty master
    const facultyList = await this.getAllFaculty();
    const masterFound = facultyList.find((f) => f.faculty_id.toUpperCase() === cleanId);
    if (masterFound) {
      return {
        id: `prof_${masterFound.faculty_id}`,
        faculty_id: masterFound.faculty_id,
        name: masterFound.name,
        designation: masterFound.designation,
        department: masterFound.department,
        role: 'faculty',
      };
    }

    return null;
  },

  isFacultyActiveForMonth(faculty: FacultyRecord, year: number, monthName: string): boolean {
    if (faculty.is_active === false) {
      if (!faculty.inactive_from_year || !faculty.inactive_from_month) {
        return false;
      }
      const academicMonths = [
        'July', 'August', 'September', 'October', 'November', 'December',
        'January', 'February', 'March', 'April', 'May', 'June'
      ];
      const targetMonthIdx = academicMonths.findIndex(
        (m) => m.toLowerCase() === monthName.toLowerCase()
      );
      const inactiveMonthIdx = academicMonths.findIndex(
        (m) => m.toLowerCase() === faculty.inactive_from_month?.toLowerCase()
      );

      // If target year is earlier than inactive year -> active
      if (year < faculty.inactive_from_year) return true;
      // If target year is later than inactive year -> inactive
      if (year > faculty.inactive_from_year) return false;
      // If same year, compare month index in academic calendar
      if (targetMonthIdx >= 0 && inactiveMonthIdx >= 0) {
        return targetMonthIdx < inactiveMonthIdx;
      }
      return false;
    }
    return true;
  },

  async getActiveFacultyForMonth(year: number, monthName: string): Promise<FacultyRecord[]> {
    const all = await this.getAllFaculty();
    return all.filter((f) => this.isFacultyActiveForMonth(f, year, monthName));
  },

  async deactivateFaculty(
    facultyId: string,
    removedBy: string = 'admin',
    effectiveYear: number = 2026,
    effectiveMonth: string = 'October'
  ): Promise<boolean> {
    initDefaultStorage();
    const cleanId = facultyId.trim().toUpperCase();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty')
          .update({
            is_active: false,
            removed_at: now,
            removed_by: removedBy,
            inactive_from_year: effectiveYear,
            inactive_from_month: effectiveMonth,
            updated_at: now,
          })
          .eq('faculty_id', cleanId);

        await supabase
          .from('profiles')
          .update({
            is_active: false,
            removed_at: now,
            inactive_from_year: effectiveYear,
            inactive_from_month: effectiveMonth,
          })
          .eq('faculty_id', cleanId);
      } catch (err) {
        console.warn('Supabase deactivate faculty error:', err);
      }
    }

    // Update LocalStorage Master
    const facultyMaster = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    const updatedMaster = facultyMaster.map((f) => {
      if (f.faculty_id.toUpperCase() === cleanId) {
        return {
          ...f,
          is_active: false,
          removed_at: now,
          removed_by: removedBy,
          inactive_from_year: effectiveYear,
          inactive_from_month: effectiveMonth,
        };
      }
      return f;
    });
    setLocalData(STORAGE_KEYS.FACULTY_MASTER, updatedMaster);

    return true;
  },

  async reactivateFaculty(facultyId: string): Promise<boolean> {
    initDefaultStorage();
    const cleanId = facultyId.trim().toUpperCase();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty')
          .update({
            is_active: true,
            removed_at: null,
            removed_by: null,
            inactive_from_year: null,
            inactive_from_month: null,
            updated_at: now,
          })
          .eq('faculty_id', cleanId);

        await supabase
          .from('profiles')
          .update({
            is_active: true,
            removed_at: null,
            inactive_from_year: null,
            inactive_from_month: null,
          })
          .eq('faculty_id', cleanId);
      } catch (err) {
        console.warn('Supabase reactivate faculty error:', err);
      }
    }

    // Update LocalStorage Master
    const facultyMaster = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    const updatedMaster = facultyMaster.map((f) => {
      if (f.faculty_id.toUpperCase() === cleanId) {
        return {
          ...f,
          is_active: true,
          removed_at: null,
          removed_by: null,
          inactive_from_year: null,
          inactive_from_month: null,
        };
      }
      return f;
    });
    setLocalData(STORAGE_KEYS.FACULTY_MASTER, updatedMaster);

    return true;
  },

  async updateFacultyId(oldFacultyId: string, newFacultyId: string): Promise<boolean> {
    initDefaultStorage();
    const cleanOld = oldFacultyId.trim().toUpperCase();
    const cleanNew = newFacultyId.trim().toUpperCase();
    if (!cleanNew || cleanOld === cleanNew) return false;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty')
          .update({ faculty_id: cleanNew, updated_at: new Date().toISOString() })
          .eq('faculty_id', cleanOld);

        await supabase
          .from('profiles')
          .update({ faculty_id: cleanNew, updated_at: new Date().toISOString() })
          .eq('faculty_id', cleanOld);

        await supabase
          .from('evaluations')
          .update({ faculty_id: cleanNew, updated_at: new Date().toISOString() })
          .eq('faculty_id', cleanOld);
      } catch (err) {
        console.warn('Supabase updateFacultyId error:', err);
      }
    }

    // Update LocalStorage Master
    const facultyMaster = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    const updatedMaster = facultyMaster.map((f) => {
      if (f.faculty_id.toUpperCase() === cleanOld) {
        return {
          ...f,
          faculty_id: cleanNew,
          updated_at: new Date().toISOString(),
        };
      }
      return f;
    });
    setLocalData(STORAGE_KEYS.FACULTY_MASTER, updatedMaster);

    // Update Profiles in LocalStorage
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const updatedProfiles = profiles.map((p) => {
      if (p.faculty_id.toUpperCase() === cleanOld) {
        return {
          ...p,
          faculty_id: cleanNew,
        };
      }
      return p;
    });
    setLocalData(STORAGE_KEYS.PROFILES, updatedProfiles);

    cachedFaculty = null;
    cachedFacultyTime = 0;
    return true;
  },

  async createProfile(profileData: {
    faculty_id: string;
    name: string;
    department: string;
    designation: string;
    role: 'admin' | 'faculty';
    email?: string;
  }): Promise<Profile> {
    initDefaultStorage();
    const cleanId = profileData.faculty_id.trim().toUpperCase();
    const isDemo = !PRODUCTION_FACULTY_ID_SET.has(cleanId);
    const newProfile: Profile = {
      id: `prof_${cleanId}_${Date.now()}`,
      faculty_id: cleanId,
      name: profileData.name.trim(),
      department: profileData.department.trim(),
      designation: profileData.designation.trim(),
      role: profileData.role,
      email: profileData.email,
      is_demo: isDemo,
      created_at: new Date().toISOString(),
    };

    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const existingIdx = profiles.findIndex((p) => p.faculty_id.toUpperCase() === cleanId);
    if (existingIdx >= 0) {
      profiles[existingIdx] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    setLocalData(STORAGE_KEYS.PROFILES, profiles);

    // Also update faculty master list
    const facultyList = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    const fIdx = facultyList.findIndex((f) => f.faculty_id.toUpperCase() === cleanId);
    if (fIdx >= 0) {
      facultyList[fIdx] = {
        ...facultyList[fIdx],
        name: profileData.name.trim(),
        department: profileData.department.trim(),
        designation: profileData.designation.trim(),
        is_demo: isDemo,
      };
    } else {
      facultyList.push({
        faculty_id: cleanId,
        name: profileData.name.trim(),
        department: profileData.department.trim(),
        designation: profileData.designation.trim(),
        doj: new Date().toISOString().split('T')[0],
        dor: null,
        is_demo: isDemo,
      });
    }
    setLocalData(STORAGE_KEYS.FACULTY_MASTER, facultyList);

    return newProfile;
  },

  async updateFacultyProfile(
    facultyId: string,
    updates: { name: string; designation: string; department: string }
  ): Promise<Profile> {
    initDefaultStorage();
    const cleanId = facultyId.trim().toUpperCase();

    // 1. Supabase update if connected
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty')
          .update({
            name: updates.name.trim(),
            designation: updates.designation.trim(),
            department: updates.department.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('faculty_id', cleanId);

        await supabase
          .from('profiles')
          .update({
            name: updates.name.trim(),
            designation: updates.designation.trim(),
            department: updates.department.trim(),
          })
          .eq('faculty_id', cleanId);
      } catch (err) {
        console.warn('Supabase update profile error:', err);
      }
    }

    // 2. Local Storage update
    const profiles = getLocalData<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const pIdx = profiles.findIndex((p) => p.faculty_id.toUpperCase() === cleanId);
    let updatedProfile: Profile;

    if (pIdx >= 0) {
      updatedProfile = {
        ...profiles[pIdx],
        name: updates.name.trim(),
        designation: updates.designation.trim(),
        department: updates.department.trim(),
      };
      profiles[pIdx] = updatedProfile;
    } else {
      updatedProfile = {
        id: `prof_${cleanId}`,
        faculty_id: cleanId,
        name: updates.name.trim(),
        designation: updates.designation.trim(),
        department: updates.department.trim(),
        role: 'faculty',
      };
      profiles.push(updatedProfile);
    }
    setLocalData(STORAGE_KEYS.PROFILES, profiles);

    // Also update Faculty Master in local storage
    const facultyList = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, SERVICE_REGISTER_FACULTY);
    const fIdx = facultyList.findIndex((f) => f.faculty_id.toUpperCase() === cleanId);
    if (fIdx >= 0) {
      facultyList[fIdx] = {
        ...facultyList[fIdx],
        name: updates.name.trim(),
        designation: updates.designation.trim(),
        department: updates.department.trim(),
        updated_at: new Date().toISOString(),
      };
      setLocalData(STORAGE_KEYS.FACULTY_MASTER, facultyList);
    }

    return updatedProfile;
  },

  async getFacultyAnnualEvaluations(
    facultyId: string,
    year: number
  ): Promise<Record<string, MonthlyEvaluation>> {
    initDefaultStorage();
    const cleanId = facultyId.trim().toUpperCase();
    const resultMap: Record<string, MonthlyEvaluation> = {};

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*, evaluation_heads(*)')
          .eq('faculty_id', cleanId)
          .eq('year', year);

        if (!error && data) {
          data.forEach((e: any) => {
            const headMarksRecord: Record<number, EvaluationHeadMark> = {};
            if (Array.isArray(e.evaluation_heads)) {
              e.evaluation_heads.forEach((hm: any) => {
                headMarksRecord[hm.head_number] = {
                  id: hm.id,
                  evaluation_id: hm.evaluation_id,
                  head_number: hm.head_number,
                  marks: hm.marks,
                  original_faculty_marks: hm.original_faculty_marks ?? null,
                  is_admin_modified: hm.is_admin_modified ?? false,
                  admin_modified_at: hm.admin_modified_at ?? null,
                  admin_modified_by: hm.admin_modified_by ?? null,
                  file_path: hm.reference_document_path || '',
                  file_name: hm.reference_document_name || '',
                  file_size: hm.reference_document_size || 0,
                  file_type: hm.reference_document_type || '',
                  reference_info: hm.reference_info || '',
                };
              });
            }
            const key = this.getEvaluationKey(cleanId, year, e.month);
            resultMap[key] = {
              id: e.id,
              faculty_id: e.faculty_id,
              year: e.year,
              month: e.month,
              status: e.status?.toLowerCase() === 'complete' ? 'complete' : e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
              submitted_at: e.submitted_at,
              total_marks: e.total_marks || 0,
              head_marks: headMarksRecord,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase fetch annual evals error:', err);
      }
    }

    // Merge with local storage evaluations
    const localEvals = getLocalData<Record<string, MonthlyEvaluation>>(STORAGE_KEYS.EVALUATIONS, {});
    Object.values(localEvals).forEach((ev) => {
      if (ev.faculty_id.toUpperCase() === cleanId && ev.year === Number(year)) {
        const key = this.getEvaluationKey(cleanId, year, ev.month);
        if (!resultMap[key]) {
          resultMap[key] = ev;
        }
      }
    });

    return resultMap;
  },

  // 2. SAR AUDIT LOGS & MAPPING
  async getSarAuditLogs(): Promise<SarAuditRecord[]> {
    initDefaultStorage();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('sar_tracker_audit').select('*');
        if (!error && data && data.length > 0) return data as SarAuditRecord[];
      } catch (err) {
        console.warn('Supabase get SAR audit logs error:', err);
      }
    }
    return getLocalData<SarAuditRecord[]>(STORAGE_KEYS.SAR_AUDIT, SAR_AUDIT_LOGS);
  },

  // 3. MONTH LOCKS
  async getMonthLocks(): Promise<MonthLock[]> {
    initDefaultStorage();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('month_locks').select('*');
        if (!error && data && data.length > 0) return data as MonthLock[];
      } catch (err) {
        console.warn('Supabase fetch month locks error:', err);
      }
    }
    return getLocalData<MonthLock[]>(STORAGE_KEYS.LOCKS, []);
  },

  async isMonthLocked(year: number, month: string): Promise<boolean> {
    const locks = await this.getMonthLocks();
    const lock = locks.find(
      (l) => l.year === Number(year) && l.month.toLowerCase() === month.toLowerCase()
    );
    return lock?.is_locked ?? false;
  },

  async toggleMonthLock(year: number, month: string, lockStatus: boolean): Promise<MonthLock> {
    initDefaultStorage();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('month_locks')
          .upsert(
            {
              year: Number(year),
              month,
              is_locked: lockStatus,
              locked_at: lockStatus ? new Date().toISOString() : null,
            },
            { onConflict: 'year,month' }
          )
          .select()
          .single();
        if (!error && data) return data as MonthLock;
      } catch (err) {
        console.warn('Supabase toggle lock error:', err);
      }
    }

    const locks = getLocalData<MonthLock[]>(STORAGE_KEYS.LOCKS, []);
    const idx = locks.findIndex(
      (l) => l.year === Number(year) && l.month.toLowerCase() === month.toLowerCase()
    );
    const updatedLock: MonthLock = {
      id: idx >= 0 ? locks[idx].id : `lock_${Date.now()}`,
      year: Number(year),
      month,
      is_locked: lockStatus,
      locked_at: lockStatus ? new Date().toISOString() : null,
    };

    if (idx >= 0) {
      locks[idx] = updatedLock;
    } else {
      locks.push(updatedLock);
    }
    setLocalData(STORAGE_KEYS.LOCKS, locks);
    return updatedLock;
  },

  async getSignedDocumentUrl(filePath?: string): Promise<string | null> {
    if (!filePath) return null;

    const fileCache = getLocalData<Record<string, string>>(STORAGE_KEYS.FILES, {});
    if (fileCache[filePath]) {
      return fileCache[filePath];
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .createSignedUrl(filePath, 86400);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        console.warn('Signed URL generation error:', err);
      }
    }

    return null;
  },

  // 5. MONTHLY EVALUATIONS
  getEvaluationKey(facultyId: string, year: number, month: string): string {
    return `${facultyId.trim().toUpperCase()}_${year}_${month.trim().toLowerCase()}`;
  },

  async getEvaluation(
    facultyId: string,
    year: number,
    month: string
  ): Promise<MonthlyEvaluation> {
    initDefaultStorage();
    const cleanId = facultyId.toUpperCase();
    const normalizedKey = this.getEvaluationKey(cleanId, year, month);
    const fileCache = getLocalData<Record<string, string>>(STORAGE_KEYS.FILES, {});

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select(`*, evaluation_heads(*)`)
          .eq('faculty_id', cleanId)
          .eq('year', year)
          .ilike('month', month)
          .maybeSingle();

        if (!error && data) {
          const headMarksRecord: Record<number, EvaluationHeadMark> = {};
          if (Array.isArray(data.evaluation_heads)) {
            data.evaluation_heads.forEach((hm: any) => {
              const fPath = hm.reference_document_path || '';
              headMarksRecord[hm.head_number] = {
                id: hm.id,
                evaluation_id: hm.evaluation_id,
                head_number: hm.head_number,
                marks: hm.marks,
                original_faculty_marks: hm.original_faculty_marks ?? null,
                is_admin_modified: hm.is_admin_modified ?? false,
                admin_modified_at: hm.admin_modified_at ?? null,
                admin_modified_by: hm.admin_modified_by ?? null,
                file_path: fPath,
                file_name: hm.reference_document_name || '',
                file_size: hm.reference_document_size || 0,
                file_type: hm.reference_document_type || '',
                file_url: fileCache[fPath] || '',
                reference_info: hm.reference_info || '',
              };
            });
          }
          return {
            id: data.id,
            faculty_id: data.faculty_id,
            year: data.year,
            month: data.month,
            status: data.status?.toLowerCase() === 'complete' ? 'complete' : data.status?.toLowerCase() === 'pending' || data.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
            submitted_at: data.submitted_at,
            total_marks: data.total_marks || 0,
            head_marks: headMarksRecord,
          } as MonthlyEvaluation;
        }
      } catch (err) {
        console.warn('Supabase get evaluation error:', err);
      }
    }

    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );

    if (evals[normalizedKey]) {
      const existing = evals[normalizedKey];
      if (existing.head_marks) {
        Object.values(existing.head_marks).forEach((hm) => {
          if (hm.file_path && !hm.file_url) {
            hm.file_url = fileCache[hm.file_path] || '';
          }
        });
      }
      return existing;
    }

    const newEval: MonthlyEvaluation = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      faculty_id: cleanId,
      year,
      month,
      status: 'draft',
      submitted_at: null,
      total_marks: 0,
      head_marks: {
        1: { head_number: 1, marks: null, file_name: '', reference_info: '' },
        2: { head_number: 2, marks: null, file_name: '' },
        3: { head_number: 3, marks: null, file_name: '' },
        4: { head_number: 4, marks: null, file_name: '' },
        5: { head_number: 5, marks: null, file_name: '' },
        6: { head_number: 6, marks: null, file_name: '' },
        7: { head_number: 7, marks: null, file_name: '' },
        8: { head_number: 8, marks: null, file_name: '' },
      },
    };

    evals[normalizedKey] = newEval;
    setLocalData(STORAGE_KEYS.EVALUATIONS, evals);
    return newEval;
  },

  async uploadReferenceDocument(
    facultyId: string,
    year: number,
    month: string,
    headNumber: number,
    file: File
  ): Promise<{
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    file_url: string;
  }> {
    // 1. Strict 1 MB limit (1,048,576 bytes)
    if (file.size > 1024 * 1024) {
      throw new Error('File size must be 1 MB or less.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const profile = await this.getProfileByFacultyId(facultyId);
    const facultyName = profile?.name || 'FACULTY';

    const result = await uploadReferenceFileAction(formData, facultyId, facultyName, year, month, headNumber);
    if (!result.success || !result.fileId) {
      throw new Error(result.error || 'Failed to store document in Google Drive.');
    }

    return {
      file_name: result.fileName || file.name,
      file_path: result.fileId, // Store the Drive File ID in file_path
      file_size: result.fileSize || file.size,
      file_type: result.fileType || file.type || 'application/octet-stream',
      file_url: result.fileUrl || `/api/drive/file/${result.fileId}`,
    };
  },

  async saveHeadMark(
    facultyId: string,
    year: number,
    month: string,
    headNumber: number,
    marks: number | null,
    documentMetadata?: {
      file_path?: string;
      file_name?: string;
      file_size?: number;
      file_type?: string;
      file_url?: string;
    },
    referenceInfo: string = '',
    isAdminUpdate: boolean = false,
    skipExcelUpdate: boolean = false
  ): Promise<MonthlyEvaluation> {
    initDefaultStorage();
    const isLocked = await this.isMonthLocked(year, month);
    if (isLocked && !isAdminUpdate) {
      throw new Error('This evaluation month is locked and cannot be modified.');
    }

    const cleanId = facultyId.toUpperCase();
    const evaluation = await this.getEvaluation(cleanId, year, month);

    if (!isAdminUpdate && evaluation.status === 'pending') {
      throw new Error('This evaluation has already been submitted and cannot be edited.');
    }

    if (!isAdminUpdate && headNumber === 1) {
      throw new Error('Head 1 marks are assigned exclusively by IQAC Administration.');
    }

    const headMarks = evaluation.head_marks || {};
    const existing = headMarks[headNumber] || {};

    headMarks[headNumber] = {
      ...existing,
      head_number: headNumber,
      marks: marks !== null ? Number(marks) : null,
      file_path: documentMetadata?.file_path ?? existing.file_path ?? '',
      file_name: documentMetadata?.file_name ?? existing.file_name ?? '',
      file_size: documentMetadata?.file_size ?? existing.file_size ?? 0,
      file_type: documentMetadata?.file_type ?? existing.file_type ?? '',
      file_url: documentMetadata?.file_url ?? existing.file_url ?? '',
      reference_info: referenceInfo,
      updated_at: new Date().toISOString(),
    };

    let total = 0;
    for (let i = 1; i <= 8; i++) {
      if (headMarks[i] && headMarks[i].marks !== null && headMarks[i].marks !== undefined) {
        total += Number(headMarks[i].marks) || 0;
      }
    }

    evaluation.head_marks = headMarks;
    evaluation.total_marks = total;
    evaluation.updated_at = new Date().toISOString();

    // 1. Persist directly to Supabase via Server Action
    try {
      const { saveHeadMarkAction } = await import('@/app/actions/evaluation');
      await saveHeadMarkAction(
        cleanId,
        year,
        month,
        headNumber,
        marks,
        documentMetadata,
        referenceInfo,
        isAdminUpdate
      );
    } catch (actionErr) {
      console.warn('saveHeadMarkAction fallback:', actionErr);
    }

    // 2. Direct client fallback if connected
    if (isSupabaseConfigured()) {
      try {
        const { data: evalData } = await supabase
          .from('evaluations')
          .upsert(
            {
              faculty_id: cleanId,
              year,
              month,
              status: evaluation.status === 'pending' ? 'Submitted' : 'Draft',
              total_marks: total,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'faculty_id,year,month' }
          )
          .select()
          .single();

        const evaluationId = evalData?.id || evaluation.id;

        await supabase.from('evaluation_heads').upsert(
          {
            evaluation_id: evaluationId,
            head_number: headNumber,
            marks,
            reference_document_path: headMarks[headNumber].file_path || null,
            reference_document_name: headMarks[headNumber].file_name || null,
            reference_document_size: headMarks[headNumber].file_size || null,
            reference_document_type: headMarks[headNumber].file_type || null,
            reference_info: referenceInfo || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'evaluation_id,head_number' }
        );
      } catch (err) {
        console.warn('Supabase save head mark error:', err);
      }
    }

    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );
    const key = this.getEvaluationKey(cleanId, year, month);
    evals[key] = evaluation;
    setLocalData(STORAGE_KEYS.EVALUATIONS, evals);

    if (!skipExcelUpdate) {
      // Excel update is now deferred to Admin Final Submit
    }

    return evaluation;
  },

  async adminModifyHeadMark(params: {
    facultyId: string;
    facultyName?: string;
    year: number;
    month: string;
    headNumber: number;
    revisedMarks: number;
    adminId: string;
    adminName?: string;
  }): Promise<MonthlyEvaluation> {
    initDefaultStorage();
    const { facultyId, facultyName, year, month, headNumber, revisedMarks, adminId, adminName } = params;
    const cleanId = facultyId.toUpperCase();

    const evaluation = await this.getEvaluation(cleanId, year, month);
    const headMarks = evaluation.head_marks || {};
    const existing = headMarks[headNumber] || {};

    const originalFacultyMarks =
      existing.original_faculty_marks !== null && existing.original_faculty_marks !== undefined
        ? existing.original_faculty_marks
        : existing.marks ?? null;

    headMarks[headNumber] = {
      ...existing,
      head_number: headNumber,
      marks: Number(revisedMarks),
      original_faculty_marks: originalFacultyMarks,
      is_admin_modified: true,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: adminId,
      updated_at: new Date().toISOString(),
    };

    let total = 0;
    for (let i = 1; i <= 8; i++) {
      if (headMarks[i] && headMarks[i].marks !== null && headMarks[i].marks !== undefined) {
        total += Number(headMarks[i].marks) || 0;
      }
    }

    evaluation.head_marks = headMarks;
    evaluation.total_marks = total;
    evaluation.updated_at = new Date().toISOString();

    // 1. Server Action with audit logging
    try {
      const { adminModifyHeadMarkAction } = await import('@/app/actions/evaluation');
      await adminModifyHeadMarkAction({
        facultyId: cleanId,
        facultyName,
        year,
        month,
        headNumber,
        revisedMarks,
        adminId,
        adminName,
      });
    } catch (err) {
      console.warn('adminModifyHeadMarkAction error:', err);
    }

    // 2. Save audit entry locally
    const auditLogs = getLocalData<EvaluationMarkChange[]>(STORAGE_KEYS.MARK_CHANGES, []);
    auditLogs.unshift({
      id: `change_${Date.now()}`,
      evaluation_id: evaluation.id,
      faculty_id: cleanId,
      faculty_name: facultyName,
      year,
      month,
      head_number: headNumber,
      original_marks: originalFacultyMarks,
      revised_marks: revisedMarks,
      changed_by_admin_id: adminId,
      changed_by_admin_name: adminName || 'IQAC Administrator',
      reference_document_name: existing.file_name || null,
      reference_document_path: existing.file_path || null,
      changed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setLocalData(STORAGE_KEYS.MARK_CHANGES, auditLogs);

    // 3. Update evaluation in Local Storage
    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );
    const key = this.getEvaluationKey(cleanId, year, month);
    evals[key] = evaluation;
    setLocalData(STORAGE_KEYS.EVALUATIONS, evals);

    // Excel update is now deferred to Admin Final Submit

    return evaluation;
  },

  async getEvaluationMarkChanges(
    facultyId?: string,
    year?: number,
    month?: string
  ): Promise<EvaluationMarkChange[]> {
    initDefaultStorage();
    try {
      const { getEvaluationMarkChangesAction } = await import('@/app/actions/evaluation');
      const serverChanges = await getEvaluationMarkChangesAction(facultyId, year, month);
      if (serverChanges && serverChanges.length > 0) {
        return serverChanges;
      }
    } catch (err) {
      console.warn('getEvaluationMarkChangesAction error:', err);
    }

    const localChanges = getLocalData<EvaluationMarkChange[]>(STORAGE_KEYS.MARK_CHANGES, []);
    return localChanges.filter((c) => {
      if (facultyId && c.faculty_id.toUpperCase() !== facultyId.trim().toUpperCase()) return false;
      if (year && c.year !== Number(year)) return false;
      if (month && c.month.toLowerCase() !== month.trim().toLowerCase()) return false;
      return true;
    });
  },

  async triggerMonthlyExcelUpdate(year: number, monthName: string) {
    const activeFaculty = await this.getActiveFacultyForMonth(year, monthName);
    const evalsMap: Record<string, MonthlyEvaluation> = {};
    
    try {
      // Use getAllEvaluationsMap to avoid N+1 queries
      const allEvalsMap = await this.getAllEvaluationsMap(year);
      for (const f of activeFaculty) {
        if (f.faculty_id) {
          const key = this.getEvaluationKey(f.faculty_id, year, monthName);
          evalsMap[key] = allEvalsMap[key] || await this.getEvaluation(f.faculty_id, year, monthName);
        }
      }
    } catch (err) {
      // Fallback to one-by-one if the batch fetch fails
      for (const f of activeFaculty) {
        if (f.faculty_id) {
          evalsMap[this.getEvaluationKey(f.faculty_id, year, monthName)] = await this.getEvaluation(f.faculty_id, year, monthName);
        }
      }
    }
    
    const { updateMonthlyExcelAction } = await import('@/app/actions/drive');
    await updateMonthlyExcelAction(activeFaculty, year, monthName, evalsMap);
  },

  async submitEvaluation(
    facultyId: string,
    year: number,
    month: string
  ): Promise<MonthlyEvaluation> {
    initDefaultStorage();
    const isLocked = await this.isMonthLocked(year, month);
    if (isLocked) {
      throw new Error('Cannot submit evaluation for a locked month.');
    }

    const cleanId = facultyId.toUpperCase();
    const evaluation = await this.getEvaluation(cleanId, year, month);
    evaluation.status = 'pending';
    evaluation.submitted_at = new Date().toISOString();

    // 1. Persist directly to Supabase via Server Action
    try {
      const { submitEvaluationAction } = await import('@/app/actions/evaluation');
      await submitEvaluationAction(cleanId, year, month);
    } catch (actionErr) {
      console.warn('submitEvaluationAction fallback:', actionErr);
    }

    // 2. Direct client fallback
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('evaluations')
          .update({
            status: 'Submitted',
            submitted_at: evaluation.submitted_at,
            updated_at: new Date().toISOString(),
          })
          .eq('faculty_id', cleanId)
          .eq('year', year)
          .ilike('month', month);
      } catch (err) {
        console.warn('Supabase submit evaluation error:', err);
      }
    }

    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );
    const key = this.getEvaluationKey(cleanId, year, month);
    evals[key] = evaluation;
    setLocalData(STORAGE_KEYS.EVALUATIONS, evals);

    return evaluation;
  },

  async getFacultyMonthHistory(facultyId: string): Promise<MonthlyEvaluation[]> {
    initDefaultStorage();
    const cleanId = facultyId.toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*, evaluation_heads(*)')
          .eq('faculty_id', cleanId)
          .order('year', { ascending: false });

        if (!error && data) {
          return data.map((e: any) => ({
            id: e.id,
            faculty_id: e.faculty_id,
            year: e.year,
            month: e.month,
            status: e.status?.toLowerCase() === 'complete' ? 'complete' : e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
            submitted_at: e.submitted_at,
            total_marks: e.total_marks || 0,
          })) as MonthlyEvaluation[];
        }
      } catch (err) {
        console.warn('Supabase get history error:', err);
      }
    }

    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );

    const history = Object.values(evals).filter(
      (e) => e.faculty_id.toUpperCase() === cleanId
    );

    return history.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.month.localeCompare(b.month);
    });
  },

  // 6. SUMMARY FOR FACULTY MANAGEMENT & MONTH RECORDS
  async getFacultyEvaluationSummaries(
    year: number,
    month: string,
    departmentFilter?: string,
    searchTerm?: string
  ): Promise<FacultySummaryRow[]> {
    initDefaultStorage();
    const allFaculty = await this.getAllFaculty();
    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*, evaluation_heads(*)')
          .eq('year', year)
          .ilike('month', month);

        if (!error && data) {
          data.forEach((e: any) => {
            const headMarksRecord: Record<number, EvaluationHeadMark> = {};
            if (Array.isArray(e.evaluation_heads)) {
              e.evaluation_heads.forEach((hm: any) => {
                headMarksRecord[hm.head_number] = {
                  id: hm.id,
                  evaluation_id: hm.evaluation_id,
                  head_number: hm.head_number,
                  marks: hm.marks,
                  original_faculty_marks: hm.original_faculty_marks ?? null,
                  is_admin_modified: hm.is_admin_modified ?? false,
                  admin_modified_at: hm.admin_modified_at ?? null,
                  admin_modified_by: hm.admin_modified_by ?? null,
                  file_path: hm.reference_document_path || '',
                  file_name: hm.reference_document_name || '',
                  file_size: hm.reference_document_size || 0,
                  file_type: hm.reference_document_type || '',
                  reference_info: hm.reference_info || '',
                };
              });
            }
            const key = this.getEvaluationKey(e.faculty_id, year, month);
            evals[key] = {
              id: e.id,
              faculty_id: e.faculty_id,
              year: e.year,
              month: e.month,
              status: e.status?.toLowerCase() === 'complete' ? 'complete' : e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
              submitted_at: e.submitted_at,
              total_marks: e.total_marks || 0,
              head_marks: headMarksRecord,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase fetch summaries evaluations error:', err);
      }
    }

    const rows: FacultySummaryRow[] = [];

    for (const f of allFaculty) {
      const key = this.getEvaluationKey(f.faculty_id, year, month);
      const evalData = evals[key];

      // Check if faculty is active for this month OR has historical evaluation records for this month
      const isActiveForThisMonth = this.isFacultyActiveForMonth(f, year, month);
      const hasHistoricalData = !!evalData && (evalData.status === 'pending' || (evalData.total_marks !== null && evalData.total_marks > 0));

      if (!isActiveForThisMonth && !hasHistoricalData) {
        continue;
      }

      if (
        departmentFilter &&
        departmentFilter !== 'all' &&
        departmentFilter !== 'All Departments' &&
        f.department.toUpperCase() !== departmentFilter.toUpperCase()
      ) {
        continue;
      }

      if (searchTerm && searchTerm.trim()) {
        const queryStr = searchTerm.toLowerCase().trim();
        const matchesName = f.name.toLowerCase().includes(queryStr);
        const matchesId = f.faculty_id.toLowerCase().includes(queryStr);
        const matchesDept = f.department.toLowerCase().includes(queryStr);
        if (!matchesName && !matchesId && !matchesDept) {
          continue;
        }
      }

      let hasAdminMods = false;
      if (evalData?.head_marks) {
        hasAdminMods = Object.values(evalData.head_marks).some((h) => h.is_admin_modified);
      }

      const row: FacultySummaryRow = {
        faculty_id: f.faculty_id,
        name: f.name,
        department: f.department,
        designation: f.designation,
        doj: f.doj,
        dor: f.dor,
        status: evalData ? evalData.status : 'not_started',
        year,
        month,
        submitted_at: evalData?.submitted_at || null,
        head_1: evalData?.head_marks?.[1]?.marks ?? null,
        head_2: evalData?.head_marks?.[2]?.marks ?? null,
        head_3: evalData?.head_marks?.[3]?.marks ?? null,
        head_4: evalData?.head_marks?.[4]?.marks ?? null,
        head_5: evalData?.head_marks?.[5]?.marks ?? null,
        head_6: evalData?.head_marks?.[6]?.marks ?? null,
        head_7: evalData?.head_marks?.[7]?.marks ?? null,
        head_8: evalData?.head_marks?.[8]?.marks ?? null,
        total_marks: evalData?.total_marks ?? 0,
        has_admin_modifications: hasAdminMods,
      };

      rows.push(row);
    }

    return rows;
  },

  // 7. DASHBOARD METRICS
  async getDashboardMetrics(year: number, month: string) {
    const summaries = await this.getFacultyEvaluationSummaries(year, month);
    const totalFaculty = summaries.length;
    const submittedList = summaries.filter((s) => s.status === 'pending');
    const submittedCount = submittedList.length;
    const pendingList = summaries.filter((s) => s.status !== 'pending' && s.status !== 'complete');
    const pendingCount = pendingList.length;

    const departmentStats: Record<
      string,
      { total: number; submitted: number; pending: number; avgTotal: number; sumMarks: number }
    > = {};

    summaries.forEach((s) => {
      if (!departmentStats[s.department]) {
        departmentStats[s.department] = {
          total: 0,
          submitted: 0,
          pending: 0,
          avgTotal: 0,
          sumMarks: 0,
        };
      }
      departmentStats[s.department].total += 1;
      if (s.status === 'pending') {
        departmentStats[s.department].submitted += 1;
        departmentStats[s.department].sumMarks += s.total_marks;
      } else {
        departmentStats[s.department].pending += 1;
      }
    });

    Object.keys(departmentStats).forEach((dept) => {
      const stat = departmentStats[dept];
      stat.avgTotal = stat.submitted > 0 ? Number((stat.sumMarks / stat.submitted).toFixed(1)) : 0;
    });

    return {
      totalFaculty,
      submittedCount,
      pendingCount,
      pendingFaculty: pendingList.map((p) => ({
        faculty_id: p.faculty_id,
        name: p.name,
        department: p.department,
        status: p.status,
      })),
      submittedFaculty: submittedList.map((s, idx) => ({
        sNo: idx + 1,
        faculty_id: s.faculty_id,
        name: s.name,
        department: s.department,
        submitted_at: s.submitted_at,
      })),
      departmentStats,
    };
  },

  // 8. ANNUAL CONSOLIDATION (ALL 12 CALENDAR MONTHS MASTER SHEET)
  async getAnnualConsolidation(year: number) {
    initDefaultStorage();
    const allFaculty = await this.getAllFaculty();
    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*, evaluation_heads(*)')
          .eq('year', year);

        if (!error && data) {
          data.forEach((e: any) => {
            const headMarksRecord: Record<number, EvaluationHeadMark> = {};
            if (Array.isArray(e.evaluation_heads)) {
              e.evaluation_heads.forEach((hm: any) => {
                headMarksRecord[hm.head_number] = {
                  id: hm.id,
                  evaluation_id: hm.evaluation_id,
                  head_number: hm.head_number,
                  marks: hm.marks,
                  original_faculty_marks: hm.original_faculty_marks ?? null,
                  is_admin_modified: hm.is_admin_modified ?? false,
                  admin_modified_at: hm.admin_modified_at ?? null,
                  admin_modified_by: hm.admin_modified_by ?? null,
                  file_path: hm.reference_document_path || '',
                  file_name: hm.reference_document_name || '',
                  file_size: hm.reference_document_size || 0,
                  file_type: hm.reference_document_type || '',
                  reference_info: hm.reference_info || '',
                };
              });
            }
            const key = this.getEvaluationKey(e.faculty_id, year, e.month);
            evals[key] = {
              id: e.id,
              faculty_id: e.faculty_id,
              year: e.year,
              month: e.month,
              status: e.status?.toLowerCase() === 'complete' ? 'complete' : e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
              submitted_at: e.submitted_at,
              total_marks: e.total_marks || 0,
              head_marks: headMarksRecord,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase fetch annual consolidation error:', err);
      }
    }

    const all12Months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const consolidationRows = allFaculty.map((faculty, index) => {
      let annualTotal = 0;
      let submittedMonthsCount = 0;
      const monthlyScores: Record<string, number | null> = {};
      const monthlyStatuses: Record<string, string> = {};

      all12Months.forEach((m) => {
        const key = this.getEvaluationKey(faculty.faculty_id, year, m);
        const evalData = evals[key];
        if (evalData) {
          let calculatedTotal = 0;
          if (evalData.head_marks && Object.keys(evalData.head_marks).length > 0) {
            for (let h = 1; h <= 8; h++) {
              if (evalData.head_marks[h]?.marks !== null && evalData.head_marks[h]?.marks !== undefined) {
                calculatedTotal += Number(evalData.head_marks[h].marks) || 0;
              }
            }
          } else {
            calculatedTotal = Number(evalData.total_marks) || 0;
          }

          monthlyScores[m] = calculatedTotal;
          monthlyStatuses[m] = evalData.status || 'draft';
          annualTotal += calculatedTotal;
          if (evalData.status === 'pending') {
            submittedMonthsCount++;
          }
        } else {
          monthlyScores[m] = 0;
          monthlyStatuses[m] = 'not_started';
        }
      });

      const performanceStatus =
        annualTotal >= 750
          ? 'Outstanding'
          : annualTotal >= 500
          ? 'Commendable'
          : 'Deficient / Review Needed';

      return {
        s_no: index + 1,
        faculty_id: faculty.faculty_id,
        name: faculty.name,
        department: faculty.department,
        designation: faculty.designation,
        monthly_scores: monthlyScores,
        monthly_statuses: monthlyStatuses,
        annual_total: annualTotal,
        submitted_months_count: submittedMonthsCount,
        performance_status: performanceStatus,
      };
    });

    return consolidationRows;
  },

  async getAllEvaluationsMap(year?: number): Promise<Record<string, MonthlyEvaluation>> {
    initDefaultStorage();
    const evals = getLocalData<Record<string, MonthlyEvaluation>>(
      STORAGE_KEYS.EVALUATIONS,
      {}
    );

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('evaluations').select('*, evaluation_heads(*)');
        if (year) {
          query = query.eq('year', year);
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach((e: any) => {
            const headMarksRecord: Record<number, EvaluationHeadMark> = {};
            if (Array.isArray(e.evaluation_heads)) {
              e.evaluation_heads.forEach((hm: any) => {
                headMarksRecord[hm.head_number] = {
                  id: hm.id,
                  evaluation_id: hm.evaluation_id,
                  head_number: hm.head_number,
                  marks: hm.marks,
                  original_faculty_marks: hm.original_faculty_marks ?? null,
                  is_admin_modified: hm.is_admin_modified ?? false,
                  admin_modified_at: hm.admin_modified_at ?? null,
                  admin_modified_by: hm.admin_modified_by ?? null,
                  file_path: hm.reference_document_path || '',
                  file_name: hm.reference_document_name || '',
                  file_size: hm.reference_document_size || 0,
                  file_type: hm.reference_document_type || '',
                  reference_info: hm.reference_info || '',
                };
              });
            }
            const key = this.getEvaluationKey(e.faculty_id, e.year, e.month);
            evals[key] = {
              id: e.id,
              faculty_id: e.faculty_id,
              year: e.year,
              month: e.month,
              status: e.status?.toLowerCase() === 'complete' ? 'complete' : e.status?.toLowerCase() === 'pending' || e.status?.toLowerCase() === 'submitted' ? 'pending' : 'draft',
              submitted_at: e.submitted_at,
              total_marks: e.total_marks || 0,
              head_marks: headMarksRecord,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase fetch all evaluations map error:', err);
      }
    }

    return evals;
  },
};
