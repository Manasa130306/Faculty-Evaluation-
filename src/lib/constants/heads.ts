import { PERFORMANCE_HEADS } from './framework';
import { HeadConfig } from '../types';

export * from './framework';

// Default static heads for generic fallback
export const EVALUATION_HEADS: HeadConfig[] = PERFORMANCE_HEADS.map((h) => ({
  number: h.number,
  title: `Head ${h.number}: ${h.name}`,
  shortTitle: `Head ${h.number} (${h.name.split(' ')[0]})`,
  description: `Head ${h.number} Annual Target: ${h.annualMax} Marks.`,
  guidelines: h.isAdminOnly
    ? 'Marks for Head 1 are exclusively assigned by the IQAC / Admin.'
    : 'Provide your self-appraisal marks and attach valid proof.',
  maxMarks: h.annualMax,
  isAdminOnly: h.isAdminOnly,
  requiresDocument: !h.isAdminOnly,
}));

export const MONTHS = [
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
];

export const DESIGNATIONS = [
  'ASST. PROF.',
  'ASSOC. PROF.',
  'PROFESSOR',
  'PROF. & HOD',
  'PROFESSOR & PRINCIPAL',
  'ASST. PROF. (ENGLISH)',
  'ASST. PROF. (MATHEMATICS)',
  'ASST. PROF. (PHYSICS)',
  'ASST. PROF. (CHEMISTRY)',
  'ASST. PROF. & PD',
  'ASST. PROF. (LIBRARIAN)',
  'ASST. PROF. (ASST. LIBRARIAN)',
  'ASST. PROF. (PD)',
  'PROF. (ENGLISH)',
  'ASST. PROF. (CHEMISTRY) & HOD',
  'ASSOC. PROF. & HOD',
];

import { getCurrentAcademicMonth, getCurrentYear } from '../utils/date-utils';

export const CURRENT_DEFAULT_YEAR = getCurrentYear();
export const CURRENT_DEFAULT_MONTH = getCurrentAcademicMonth();
