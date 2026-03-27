const SETTINGS_KEY = 'salary_calculator_settings';
const MONTHLY_DATA_PREFIX = 'salary_calculator_month_';

export interface Settings {
  hourlyRate: number;
  globalBreakMinutes: number;
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...{ hourlyRate: 196, globalBreakMinutes: 60 }, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { hourlyRate: 196, globalBreakMinutes: 60 };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function loadMonthData(month: string): Record<string, any> {
  try {
    const stored = localStorage.getItem(MONTHLY_DATA_PREFIX + month);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading month data:', error);
    return {};
  }
}

export function saveMonthData(month: string, data: Record<string, any>): void {
  try {
    localStorage.setItem(MONTHLY_DATA_PREFIX + month, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving month data:', error);
  }
}

export function loadMonthlyData(): Record<string, Record<string, any>> {
  const allData: Record<string, Record<string, any>> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MONTHLY_DATA_PREFIX)) {
        const month = key.replace(MONTHLY_DATA_PREFIX, '');
        allData[month] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
  } catch (error) {
    console.error('Error loading all monthly data:', error);
  }

  return allData;
}

export function saveMonthlyData(allData: Record<string, Record<string, any>>): void {
  try {
    // Clear existing monthly data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MONTHLY_DATA_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Save new data
    for (const month in allData) {
      localStorage.setItem(MONTHLY_DATA_PREFIX + month, JSON.stringify(allData[month]));
    }
  } catch (error) {
    console.error('Error saving all monthly data:', error);
  }
}

export function exportData(): string {
  const data = {
    settings: loadSettings(),
    monthlyData: loadMonthlyData(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    if (data.settings) {
      saveSettings(data.settings);
    }

    if (data.monthlyData) {
      saveMonthlyData(data.monthlyData);
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}