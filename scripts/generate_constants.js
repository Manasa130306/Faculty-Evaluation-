const fs = require('fs');
const list = require('./faculty_56_full.json');

// 1. Generate facultyData.ts
let facultyDataCode = `import { FacultyRecord, SarAuditRecord } from '../types';

/**
 * Authoritative 56 Faculty List
 * SOURCE OF TRUTH: NSRIET_FACULTY_SAR_TRACKER_MODIFIED.xlsx
 * EMP ID Lookup: SERVICE REGISTER.xlsx
 * Rule: Exactly 56 faculty, authoritative SAR Tracker names and departments.
 */
export const SERVICE_REGISTER_FACULTY: FacultyRecord[] = [
`;

list.forEach(f => {
  facultyDataCode += `  { faculty_id: ${JSON.stringify(f.faculty_id)}, name: ${JSON.stringify(f.name)}, designation: ${JSON.stringify(f.designation)}, department: ${JSON.stringify(f.department)}, doj: ${JSON.stringify(f.doj)}, dor: ${JSON.stringify(f.dor)} },\n`;
});

facultyDataCode += `];

export const SAR_AUDIT_LOGS: SarAuditRecord[] = [
`;

list.forEach(f => {
  facultyDataCode += `  { id: ${JSON.stringify(String(f.sno))}, sar_name: ${JSON.stringify(f.name)}, sar_department: ${JSON.stringify(f.department)}, matched_faculty_id: ${JSON.stringify(f.faculty_id.startsWith('SAR_') ? null : f.faculty_id)}, match_status: ${JSON.stringify(f.matchStatus)}, notes: ${JSON.stringify(f.notes)} },\n`;
});

facultyDataCode += `];
`;

fs.writeFileSync('src/lib/constants/facultyData.ts', facultyDataCode);
console.log('Updated src/lib/constants/facultyData.ts with 56 authoritative records.');

// 2. Generate historicalData.ts
let histCode = `export interface HistoricalScoreRecord {
  faculty_id: string;
  year: number;
  month: string;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  h7: number;
  h8: number;
  total: number;
  status: 'submitted' | 'draft';
}

// Exact marks extracted directly from NSRIET_FACULTY_SAR_TRACKER_MODIFIED.xlsx (July & August 2026)
export const HISTORICAL_EVALUATIONS: HistoricalScoreRecord[] = [
  // JULY 2026 EVALUATIONS (56 Faculty)
`;

list.forEach(f => {
  histCode += `  { faculty_id: ${JSON.stringify(f.faculty_id)}, year: 2026, month: 'July', h1: ${f.july.h1}, h2: ${f.july.h2}, h3: ${f.july.h3}, h4: ${f.july.h4}, h5: ${f.july.h5}, h6: ${f.july.h6}, h7: ${f.july.h7}, h8: ${f.july.h8}, total: ${f.july.total}, status: 'submitted' },\n`;
});

histCode += `
  // AUGUST 2026 EVALUATIONS (56 Faculty)
`;

list.forEach(f => {
  histCode += `  { faculty_id: ${JSON.stringify(f.faculty_id)}, year: 2026, month: 'August', h1: ${f.august.h1}, h2: ${f.august.h2}, h3: ${f.august.h3}, h4: ${f.august.h4}, h5: ${f.august.h5}, h6: ${f.august.h6}, h7: ${f.august.h7}, h8: ${f.august.h8}, total: ${f.august.total}, status: 'submitted' },\n`;
});

histCode += `];
`;

fs.writeFileSync('src/lib/constants/historicalData.ts', histCode);
console.log('Updated src/lib/constants/historicalData.ts with 56 records for July & August.');
