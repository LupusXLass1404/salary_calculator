import { calculateWorkHours, calculateRegularHours, calculateOvertimeHours, calculateHolidayHours, isHoliday } from './time';
import { parse } from 'date-fns';

export interface SalaryCalculation {
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  totalPay: number;
}

export interface MonthlyTotal {
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  totalPay: number;
}

export function calculateSalary(entry: any, hourlyRate: number): SalaryCalculation {
  if (!entry.start || !entry.end) {
    return {
      totalHours: 0,
      regularPay: 0,
      overtimePay: 0,
      holidayPay: 0,
      totalPay: 0
    };
  }

  const totalHours = calculateWorkHours(entry.start, entry.end, entry.breakMinutes);

  // Check if it's a holiday (simplified - you might want to enhance this)
  const workDate = entry.date ? parse(entry.date, 'yyyy-MM-dd', new Date()) : new Date();
  const isWorkHoliday = isHoliday(workDate);

  const regularHours = calculateRegularHours(totalHours);
  const overtimeHours = calculateOvertimeHours(totalHours);
  const holidayHours = calculateHolidayHours(totalHours, isWorkHoliday);

  // Taiwan labor law: overtime pay is 1.33x regular rate for first 2 hours, 1.66x for hours beyond
  const regularPay = regularHours * hourlyRate;
  const overtimePay1 = Math.min(overtimeHours, 2) * hourlyRate * 1.33;
  const overtimePay2 = Math.max(0, overtimeHours - 2) * hourlyRate * 1.66;
  const overtimePay = overtimePay1 + overtimePay2;

  // Holiday pay is 2x regular rate
  const holidayPay = holidayHours * hourlyRate * 2;

  const totalPay = regularPay + overtimePay + holidayPay;

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    holidayPay: Math.round(holidayPay),
    totalPay: Math.round(totalPay)
  };
}

export function calculateMonthlyTotal(monthlyData: Record<string, any>, hourlyRate: number): MonthlyTotal {
  let totalHours = 0;
  let regularPay = 0;
  let overtimePay = 0;
  let holidayPay = 0;
  let totalPay = 0;

  for (const date in monthlyData) {
    const entry = monthlyData[date];
    if (entry.calculatedHours !== undefined) {
      // Use pre-calculated values if available
      totalHours += entry.calculatedHours;
      regularPay += entry.regularPay || 0;
      overtimePay += entry.overtimePay || 0;
      holidayPay += entry.holidayPay || 0;
      totalPay += entry.totalPay || 0;
    } else {
      // Fallback to calculation
      const calculation = calculateSalary(entry, hourlyRate);
      totalHours += calculation.totalHours;
      regularPay += calculation.regularPay;
      overtimePay += calculation.overtimePay;
      holidayPay += calculation.holidayPay;
      totalPay += calculation.totalPay;
    }
  }

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    holidayPay: Math.round(holidayPay),
    totalPay: Math.round(totalPay)
  };
}