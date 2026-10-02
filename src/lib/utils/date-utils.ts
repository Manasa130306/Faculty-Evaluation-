export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export type MonthName = typeof MONTHS[number];

/**
 * Returns current date and time in Asia/Kolkata timezone
 */
export function getISTDate(): Date {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000;
  return new Date(utc + istOffset);
}

export function getCurrentYear(): number {
  return getISTDate().getFullYear();
}

export function getCurrentMonthIndex(): number {
  return getISTDate().getMonth();
}

export function getCurrentAcademicMonth(): string {
  return MONTHS[getCurrentMonthIndex()];
}

export function getPreviousMonthName(): string {
  const currentIdx = getCurrentMonthIndex();
  const prevIdx = currentIdx === 0 ? 11 : currentIdx - 1;
  return MONTHS[prevIdx];
}

export function getPreviousMonthYear(): number {
  const currentIdx = getCurrentMonthIndex();
  return currentIdx === 0 ? getCurrentYear() - 1 : getCurrentYear();
}
