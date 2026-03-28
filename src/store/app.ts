import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { loadSettings, saveSettings as saveSettingsUtil, loadMonthData, saveMonthData, exportData as exportDataUtil, importData as importDataUtil } from '../utils/storage';
import { calculateMonthlyTotal } from '../utils/calculations';

export const useAppStore = defineStore('app', () => {
  // State
  const currentMonth = ref(format(new Date(), 'yyyy-MM'));
  const selectedDate = ref<string | null>(null);
  const selectedEntry = ref<any>(null);
  const showForm = ref(false);
  const isEditingMode = ref(false);
  const settings = ref(loadSettings());
  const refreshCalendar = ref(0);
  const monthlyData = ref<Record<string, any>>({});

  // Computed
  const currentMonthFormatted = computed(() => {
    const [year, month] = currentMonth.value.split('-');
    return `${year}年${month}月`;
  });

  const monthlyTotal = computed(() => {
    return calculateMonthlyTotal(monthlyData.value);
  });

  // Actions
  function loadCurrentMonthData() {
    monthlyData.value = loadMonthData(currentMonth.value);
  }

  function onBatchSettingsChanged(newBatchDefaults: any) {
    settings.value.batchDefaults = {
      ...settings.value.batchDefaults,
      ...newBatchDefaults
    };
    saveSettings();
  }

  function onDateSelected(date: string) {
    selectedDate.value = date;
    selectedEntry.value = monthlyData.value[date] || null;
    showForm.value = true;
  }

  function onMonthChanged(month: string) {
    currentMonth.value = month;
    loadCurrentMonthData();
  }

  function onEntryUpdated(date: string, entry: any) {
    if (selectedDate.value === date) {
      selectedEntry.value = entry;
    }
    monthlyData.value[date] = entry;
    saveMonthData(currentMonth.value, monthlyData.value);
  }

  function onEntryDeleted(date: string) {
    delete monthlyData.value[date];
    saveMonthData(currentMonth.value, monthlyData.value);
  }

  function onSaveEntry(entry: any) {
    if (selectedDate.value) {
      monthlyData.value[selectedDate.value] = entry;
      saveMonthData(currentMonth.value, monthlyData.value);
      refreshCalendar.value++;
      closeForm();
    }
  }

  function onDeleteEntry() {
    if (selectedDate.value) {
      delete monthlyData.value[selectedDate.value];
      saveMonthData(currentMonth.value, monthlyData.value);
      refreshCalendar.value++;
      closeForm();
    }
  }

  function closeForm() {
    showForm.value = false;
    selectedDate.value = null;
    selectedEntry.value = null;
  }

  function saveSettings() {
    saveSettingsUtil(settings.value);
  }

  function exportData() {
    const data = exportDataUtil();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExportFilename();
    a.click();
    URL.revokeObjectURL(url);
  }

  function getExportFilename() {
    const now = new Date();
    return `salary_data_${format(now, 'yyyy-MM-dd_HH-mm-ss')}.json`;
  }

  function importData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          importDataUtil(data);
          loadCurrentMonthData();
          refreshCalendar.value++;
        } catch (error) {
          console.error('Import failed:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  function onApplyBatchEntry(data: { dates: string[], startTime: string, endTime: string, breakMinutes: number }) {
    let addedCount = 0;

    data.dates.forEach((dateStr) => {
      // 檢查該日期是否已有記錄
      if (!monthlyData.value[dateStr]) {
        const entry: any = {
          start: data.startTime,
          end: data.endTime,
          breakMinutes: data.breakMinutes,
          hourlyRate: settings.value.hourlyRate,
          date: dateStr  // 添加日期屬性供計算使用
        };

        monthlyData.value[dateStr] = entry;
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveMonthData(currentMonth.value, monthlyData.value);
      refreshCalendar.value++; // 立即通知 Calendar 重載
      loadCurrentMonthData(); // 刷新日曆顯示
    }
  }

  return {
    // State
    currentMonth,
    selectedDate,
    selectedEntry,
    showForm,
    isEditingMode,
    settings,
    refreshCalendar,
    monthlyData,
    // Computed
    currentMonthFormatted,
    monthlyTotal,
    // Actions
    loadCurrentMonthData,
    onBatchSettingsChanged,
    onDateSelected,
    onMonthChanged,
    onEntryUpdated,
    onEntryDeleted,
    onSaveEntry,
    onDeleteEntry,
    closeForm,
    saveSettings,
    exportData,
    importData,
    onApplyBatchEntry
  };
});