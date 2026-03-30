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

/**
 * 計算工作時數
 */
export function calculateWorkHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = parse(startTime, 'HH:mm', new Date())
  const end = parse(endTime, 'HH:mm', new Date())

  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1)
  }

  const totalMinutes = differenceInMinutes(end, start)
  const workMinutes = Math.max(0, totalMinutes - (breakMinutes || 0))

  return workMinutes / 60
}

/**
 * 檢查是否為假日
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  // 國定假日列表
  const holidays = [
    // 元旦
    new Date(year, 0, 1),
    // 228和平紀念日
    new Date(year, 1, 28),
    // 清明節 (通常在4月4日或5日，簡化為4月5日)
    new Date(year, 3, 5),
    // 端午節 (農曆5月5日，簡化為6月)
    new Date(year, 5, 22), // 2024年端午節，之後需要動態計算
    // 中秋節 (農曆8月15日，簡化為9月)
    new Date(year, 8, 17), // 2024年中秋節，之後需要動態計算
    // 國慶日
    new Date(year, 9, 10),
    // 春節 (農曆新年，簡化為1月底)
    new Date(year, 1, 10), // 2024年春節，之後需要動態計算
    new Date(year, 1, 11),
    new Date(year, 1, 12)
  ]

  // 檢查是否為國定假日
  const isNationalHoliday = holidays.some(holiday =>
    holiday.getFullYear() === year &&
    holiday.getMonth() === month &&
    holiday.getDate() === day
  )

  return isNationalHoliday || isWeekend(date)
}

/**
 * 獲取假日名稱
 */
export function getHolidayName(date: Date): string | null {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  // 國定假日映射
  const holidayMap: { [key: string]: string } = {
    '0-1': '元旦',
    '1-28': '228',
    '3-5': '清明',
    '5-22': '端午',
    '8-17': '中秋',
    '9-10': '國慶',
    '1-10': '春節',
    '1-11': '春節',
    '1-12': '春節'
  };

  const key = `${month}-${day}`
  return holidayMap[key] || null
}

/**
 * 計算正常工作時數
 */
export function calculateRegularHours(totalHours: number): number {
  // First 8 hours are regular hours
  return Math.min(totalHours, 8)
}

/**
 * 計算加班時數
 */
export function calculateOvertimeHours(totalHours: number): number {
  // Hours beyond 8 are overtime
  return Math.max(0, totalHours - 8)
}

/**
 * 計算假日時數
 */
export function calculateHolidayHours(totalHours: number, isHoliday: boolean): number {
  // All hours on holidays are holiday pay
  return isHoliday ? totalHours : 0
}