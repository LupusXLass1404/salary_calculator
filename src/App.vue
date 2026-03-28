<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import Calendar from './components/Calendar.vue';
import WorkEntryForm from './components/WorkEntryForm.vue';
import BatchWorkEntryForm from './components/BatchWorkEntryForm.vue';
import { loadSettings, saveSettings as saveSettingsUtil, loadMonthData, saveMonthData, exportData as exportDataUtil, importData as importDataUtil, loadMonthlyData, saveMonthlyData } from './utils/storage';
import { calculateSalary, calculateMonthlyTotal } from './utils/calculations';

const currentMonth = ref(format(new Date(), 'yyyy-MM'));
const selectedDate = ref<string | null>(null);
const selectedEntry = ref<any>(null);
const showForm = ref(false);
const isEditingMode = ref(false);

const settings = ref(loadSettings());

const refreshCalendar = ref(0);
const monthlyData = ref<Record<string, any>>({});

const currentMonthFormatted = computed(() => {
  const [year, month] = currentMonth.value.split('-');
  return `${year}年${month}月`;
});

const monthlyTotal = computed(() => {
  return calculateMonthlyTotal(monthlyData.value);
});

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
    refreshCalendar.value++; // 立即通知 Calendar 重載
    closeForm();
  }
}

function onDeleteEntry() {
  if (selectedDate.value) {
    delete monthlyData.value[selectedDate.value];
    saveMonthData(currentMonth.value, monthlyData.value);
    refreshCalendar.value++; // 立即通知 Calendar 重載
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getExportFilename(): string {
  const now = new Date();
  return `salary-data-${format(now, 'yyyy-MM-dd-HHmm')}.json`;
}

function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content && importDataUtil(content)) {
      // Reload settings and current month data
      settings.value = loadSettings();
      loadCurrentMonthData();

      // Clean up old calculated fields from imported data
      cleanUpCalculatedFields();

      alert('資料匯入成功！');
    } else {
      alert('資料匯入失敗，請檢查檔案格式。');
    }
  };
  reader.readAsText(file);
}

function cleanUpCalculatedFields() {
  const allData = loadMonthlyData();
  let hasChanges = false;

  for (const month in allData) {
    for (const date in allData[month]) {
      const entry = allData[month][date];

      // Remove old calculated fields
      if (entry.calculatedHours !== undefined) {
        delete entry.calculatedHours;
        hasChanges = true;
      }
      if (entry.regularPay !== undefined) {
        delete entry.regularPay;
        hasChanges = true;
      }
      if (entry.overtimePay !== undefined) {
        delete entry.overtimePay;
        hasChanges = true;
      }
      if (entry.holidayPay !== undefined) {
        delete entry.holidayPay;
        hasChanges = true;
      }
      if (entry.totalPay !== undefined) {
        delete entry.totalPay;
        hasChanges = true;
      }
      // Remove old isHoliday field since we now use automatic detection
      if (entry.isHoliday !== undefined) {
        delete entry.isHoliday;
        hasChanges = true;
      }

      // Ensure required fields exist
      if (entry.start && entry.hourlyRate === undefined) {
        entry.hourlyRate = 196; // Default hourly rate
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    saveMonthlyData(allData);
    loadCurrentMonthData(); // Refresh current month data
  }
}

function onApplyBatchEntry(data: { dates: string[], startTime: string, endTime: string, breakMinutes: number, hourlyRate: number }) {
  let addedCount = 0;

  data.dates.forEach((dateStr) => {
    // 檢查該日期是否已有記錄
    if (!monthlyData.value[dateStr]) {
      const entry: any = {
        start: data.startTime,
        end: data.endTime,
        breakMinutes: data.breakMinutes,
        hourlyRate: data.hourlyRate,
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

onMounted(() => {
  cleanUpCalculatedFields(); // Clean up old data on startup
  loadCurrentMonthData();
});
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>薪水計算器</h1>
      <div class="settings-bar">
        <div class="action-buttons">
          <button @click="isEditingMode = !isEditingMode" class="edit-mode-button" :class="{ active: isEditingMode }">
            <span class="button-icon">{{ isEditingMode ? '✓' : '✏️' }}</span>
            {{ isEditingMode ? '完成編輯' : '編輯時間' }}
          </button>
          <button @click="exportData" class="export-button">
            <span class="button-icon">📤</span>
            匯出資料
          </button>
          <label for="importFile" class="import-button">
            <span class="button-icon">📥</span>
            匯入資料
            <input id="importFile" type="file" accept=".json" @change="importData" style="display: none;" />
          </label>
        </div>
      </div>
    </header>

    <main class="app-main">
      <BatchWorkEntryForm :default-break-minutes="settings.globalBreakMinutes" :batch-defaults="settings.batchDefaults"
        @apply-batch="(data) => onApplyBatchEntry(data)" @settings-changed="onBatchSettingsChanged" />

      <div class="calendar-section">
        <Calendar :current-month="currentMonth" :hourly-rate="settings.hourlyRate" :is-editing-mode="isEditingMode"
          :refresh-key="refreshCalendar" @date-selected="onDateSelected" @month-changed="onMonthChanged"
          @entry-updated="onEntryUpdated" @entry-deleted="onEntryDeleted" />
      </div>

      <div class="summary-section">
        <h2>{{ currentMonthFormatted }} 總計</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">總工時:</span>
            <span class="value">{{ isNaN(monthlyTotal.totalHours) ? '0.0' : monthlyTotal.totalHours.toFixed(1) }}
              小時</span>
          </div>
          <div class="summary-item">
            <span class="label">正常工資:</span>
            <span class="value">${{ isNaN(monthlyTotal.regularPay) ? '0' : monthlyTotal.regularPay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item">
            <span class="label">加班工資:</span>
            <span class="value">${{ isNaN(monthlyTotal.overtimePay) ? '0' : monthlyTotal.overtimePay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item">
            <span class="label">假日工資:</span>
            <span class="value">${{ isNaN(monthlyTotal.holidayPay) ? '0' : monthlyTotal.holidayPay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">總薪資:</span>
            <span class="value">${{ isNaN(monthlyTotal.totalPay) ? '0' : monthlyTotal.totalPay.toLocaleString()
              }}</span>
          </div>
        </div>
      </div>
    </main>

    <WorkEntryForm v-if="showForm" :entry="selectedEntry" :date="selectedDate"
      :default-break-minutes="settings.globalBreakMinutes" @save="onSaveEntry" @delete="onDeleteEntry"
      @close="closeForm" />
  </div>
</template>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #000000;
  color: #eeeeee;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.app-header h1 {
  margin: 0;
  color: #eeeeee;
}

.settings-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid #444;
  margin-bottom: 2rem;
}

.global-settings {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #e0e0e0;
  font-size: 0.9rem;
}

.setting-icon {
  font-size: 1.1rem;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-input {
  padding: 0.6rem 0.8rem;
  border: 2px solid #555;
  border-radius: 6px;
  width: 100px;
  background: #2a2a2a;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.setting-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
  background: #333333;
}

.unit {
  color: #aaa;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.edit-mode-button,
.export-button,
.import-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
}

.edit-mode-button {
  background: #555555;
  color: #ffffff;
}

.edit-mode-button:hover {
  background: #666666;
  transform: translateY(-1px);
}

.edit-mode-button.active {
  background: #ff9800;
  color: #000000;
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.4);
}

.export-button {
  background: #28a745;
  color: #ffffff;
}

.export-button:hover {
  background: #218838;
  transform: translateY(-1px);
}

.import-button {
  background: #007bff;
  color: #ffffff;
  cursor: pointer;
}

.import-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.button-icon {
  font-size: 1rem;
}

.app-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.calendar-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.summary-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.summary-section h2 {
  margin-top: 0;
  color: #eeeeee;
  border-bottom: 1px solid #555;
  padding-bottom: 0.5rem;
}

.summary-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #333333;
  border-radius: 4px;
}

.summary-item.total {
  background: #1e3a5f;
  font-weight: bold;
  border: 2px solid #0066cc;
  grid-column: 1 / -1;
}

.label {
  color: #aaaaaa;
  font-size: 0.9rem;
}

.value {
  font-weight: bold;
  color: #eeeeee;
  font-size: 1.2rem;
}

@media (max-width: 1200px) {
  #app {
    padding: 0.75rem;
  }

  .app-main {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .app-header {
    flex-wrap: wrap;
    flex-direction: column;
    align-items: stretch;
  }

  .app-header h1 {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .settings-bar {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .global-settings {
    justify-content: center;
  }

  .summary-section {
    margin-top: 1rem;
  }
}

@media (max-width: 768px) {
  #app {
    padding: 0.5rem;
  }

  .app-header {
    padding-bottom: 0.5rem;
  }

  .setting-group {
    flex: 1 0 calc(50% - 0.5rem);
  }

  .action-buttons {
    flex: 1 100%;
    justify-content: flex-start;
  }

  .calendar-section {
    padding: 0.75rem;
  }

  .summary-section {
    padding: 0.75rem;
  }
}
</style>
