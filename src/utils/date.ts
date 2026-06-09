import { Shift } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function toISODate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));
}

export function formatDateLabel(date: Date, locale: string = 'it-IT'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit' }).format(date);
}

export function formatWeekRange(weekStart: Date, locale: string = 'it-IT'): string {
  const fmt: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' };
  const start = new Intl.DateTimeFormat(locale, fmt).format(weekStart);
  const endDate = addDays(weekStart, 6);
  const end = new Intl.DateTimeFormat(locale, { ...fmt, year: 'numeric' }).format(endDate);
  return `${start} - ${end}`;
}

export function timeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateShiftHours(shift: Shift): number {
  const start = timeToMinutes(shift.startTime);
  let end = timeToMinutes(shift.endTime);
  if (end < start) end += 24 * 60;
  const breakMinutes = Number(shift.breakMinutes || 0);
  return Math.max(0, (end - start - breakMinutes) / 60);
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return `${String(rounded).replace('.', ',')}h`;
}

export function hasShiftConflict(candidate: Shift, shifts: Shift[]): boolean {
  const candidateStart = timeToMinutes(candidate.startTime);
  const candidateEnd = timeToMinutes(candidate.endTime);

  return shifts.some((shift) => {
    if (shift.id === candidate.id) return false;
    if (shift.employeeId !== candidate.employeeId) return false;
    if (shift.date !== candidate.date) return false;

    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);
    return candidateStart < shiftEnd && candidateEnd > shiftStart;
  });
}
