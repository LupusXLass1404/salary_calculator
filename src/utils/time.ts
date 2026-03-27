import { differenceInMinutes, parse, format, isWeekend, isSameDay } from 'date-fns';

export interface WorkEntry {
  start: string;
  end: string;
  breakMinutes: number;
  hourlyRate?: number;
  calculatedHours?: number;
  regularPay?: number;
  overtimePay?: number;
  holidayPay?: number;
  totalPay?: number;
}

export function calculateWorkHours(startTime: string, endTime: string, breakMinutes: number): number {
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());

  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const totalMinutes = differenceInMinutes(end, start);
  const workMinutes = Math.max(0, totalMinutes - breakMinutes);

  return workMinutes / 60;
}

export function isHoliday(date: Date): boolean {
  // This is a simplified holiday check
  // In a real application, you might want to use a proper holiday API or database
  const holidays: Date[] = [
    // Example: New Year's Day, etc.
    // You can add more holidays here
  ];

  return holidays.some(holiday => isSameDay(date, holiday)) || isWeekend(date);
}

export function calculateRegularHours(totalHours: number): number {
  // First 8 hours are regular hours
  return Math.min(totalHours, 8);
}

export function calculateOvertimeHours(totalHours: number): number {
  // Hours beyond 8 are overtime
  return Math.max(0, totalHours - 8);
}

export function calculateHolidayHours(totalHours: number, isHoliday: boolean): number {
  // All hours on holidays are holiday pay
  return isHoliday ? totalHours : 0;
}