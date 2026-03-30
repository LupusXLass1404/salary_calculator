import { calculateWorkHours, calculateRegularHours, calculateOvertimeHours, isHoliday } from './time';
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

/**
 * 計算薪資
 */
export function calculateSalary(entry: any, hourlyRate: number): SalaryCalculation {
  if (!entry.start || !entry.end) {
    return {
      totalHours: 0,
      regularPay: 0,
      overtimePay: 0,
      holidayPay: 0,
      totalPay: 0
    }
  }

  const totalHours = calculateWorkHours(entry.start, entry.end, entry.breakMinutes)

  // Use automatic holiday detection
  const workDate = entry.date ? parse(entry.date, 'yyyy-MM-dd', new Date()) : new Date()
  const isWorkHoliday = isHoliday(workDate)

  let regularHours = 0
  let overtimeHours = 0
  let holidayHours = 0

  if (isWorkHoliday) {
    // On holidays, all hours are holiday pay
    holidayHours = totalHours
  } else {
    // On regular days, calculate regular and overtime hours
    regularHours = calculateRegularHours(totalHours)
    overtimeHours = calculateOvertimeHours(totalHours)
  }

  // Taiwan labor law: overtime pay is 1.33x regular rate for first 2 hours, 1.66x for hours beyond
  const regularPay = regularHours * hourlyRate
  const overtimePay1 = Math.min(overtimeHours, 2) * hourlyRate * 1.33
  const overtimePay2 = Math.max(0, overtimeHours - 2) * hourlyRate * 1.66
  const overtimePay = overtimePay1 + overtimePay2

  // Holiday pay is 2x regular rate
  const holidayPay = holidayHours * hourlyRate * 2

  const totalPay = regularPay + overtimePay + holidayPay

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    holidayPay: Math.round(holidayPay),
    totalPay: Math.round(totalPay)
  }
}

/**
 * 計算月總計
 */
export function calculateMonthlyTotal(monthlyData: Record<string, any>): MonthlyTotal {
  let totalHours = 0
  let regularPay = 0
  let overtimePay = 0
  let holidayPay = 0
  let totalPay = 0

  for (const date in monthlyData) {
    const entry = monthlyData[date]
    // Use entry's hourly rate (required field now)
    const hourlyRate = entry.hourlyRate
    const calculation = calculateSalary(entry, hourlyRate)
    totalHours += calculation.totalHours
    regularPay += calculation.regularPay
    overtimePay += calculation.overtimePay
    holidayPay += calculation.holidayPay
    totalPay += calculation.totalPay
  }

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    holidayPay: Math.round(holidayPay),
    totalPay: Math.round(totalPay)
  }
}