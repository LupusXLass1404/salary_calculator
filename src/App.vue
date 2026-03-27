<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import Calendar from './components/Calendar.vue'
import WorkEntryForm from './components/WorkEntryForm.vue'
import BatchWorkEntryForm from './components/BatchWorkEntryForm.vue'
import { loadSettings, saveSettings as saveSettingsUtil, loadMonthData, saveMonthData, exportData as exportDataUtil, importData as importDataUtil, loadMonthlyData, saveMonthlyData } from './utils/storage'
import { calculateSalary, calculateMonthlyTotal } from './utils/calculations'
import { useSettingsStore } from '@/store/settings'

const currentMonth = ref(format(new Date(), 'yyyy-MM'))
const selectedDate = ref<string | null>(null)
const selectedEntry = ref<any>(null)
const showForm = ref(false)
const isEditingMode = ref(false)
const SettingsStore = useSettingsStore()

const refreshCalendar = ref(0);
const monthlyData = ref<Record<string, any>>({});

const currentMonthFormatted = computed(() => {
  const [year, month] = currentMonth.value.split('-');
  return `${year}年${month}月`;
});

const monthlyTotal = computed(() => {
  return calculateMonthlyTotal(monthlyData.value, SettingsStore.hourlyRate);
});

function loadCurrentMonthData() {
  monthlyData.value = loadMonthData(currentMonth.value);
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
    const calculation = calculateSalary(entry, SettingsStore.hourlyRate);

    entry.calculatedHours = calculation.totalHours;
    entry.regularPay = calculation.regularPay;
    entry.overtimePay = calculation.overtimePay;
    entry.holidayPay = calculation.holidayPay;
    entry.totalPay = calculation.totalPay;

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
  saveSettingsUtil(SettingsStore);
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
      SettingsStore.hourlyRate = loadSettings().hourlyRate;
      SettingsStore.globalBreakMinutes = loadSettings().globalBreakMinutes;
      loadCurrentMonthData();

      // Recalculate salary for all entries in case they don't have calculated fields
      recalculateAllSalaries();

      alert('資料匯入成功！');
    } else {
      alert('資料匯入失敗，請檢查檔案格式。');
    }
  };
  reader.readAsText(file);
}

function recalculateAllSalaries() {
  const allData = loadMonthlyData();
  let hasChanges = false;

  for (const month in allData) {
    for (const date in allData[month]) {
      const entry = allData[month][date];

      // Check if entry exists and needs recalculation
      if (entry && entry.start && entry.end && (entry.calculatedHours === undefined || entry.totalPay === undefined)) {
        const calculation = calculateSalary(entry, SettingsStore.hourlyRate);

        entry.calculatedHours = calculation.totalHours;
        entry.regularPay = calculation.regularPay;
        entry.overtimePay = calculation.overtimePay;
        entry.holidayPay = calculation.holidayPay;
        entry.totalPay = calculation.totalPay;

        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    saveMonthlyData(allData);
    loadCurrentMonthData(); // Refresh current month data
  }
}

function onApplyBatchEntry(data: { dates: string[], startTime: string, endTime: string }) {
  let addedCount = 0;

  data.dates.forEach((dateStr) => {
    // 檢查該日期是否已有記錄
    if (!monthlyData.value[dateStr]) {
      const entry: any = {
        start: data.startTime,
        end: data.endTime,
        isHoliday: false,
        date: dateStr  // 添加日期屬性供計算使用
      };

      // 計算薪資
      const calculation = calculateSalary(entry, SettingsStore.hourlyRate);
      entry.calculatedHours = calculation.totalHours;
      entry.regularPay = calculation.regularPay;
      entry.overtimePay = calculation.overtimePay;
      entry.holidayPay = calculation.holidayPay;
      entry.totalPay = calculation.totalPay;

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
  SettingsStore.hourlyRate = loadSettings().hourlyRate;
  SettingsStore.globalBreakMinutes = loadSettings().globalBreakMinutes;
  loadCurrentMonthData();
});
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>薪水計算器</h1>
      <div class="settings-bar">
        <div class="setting-group">
          <label for="hourlyRate">全域時薪:</label>
          <input id="hourlyRate" v-model.number="SettingsStore.hourlyRate" type="number" min="0" step="1"
            @blur="saveSettings" />
        </div>
        <div class="setting-group">
          <label for="globalBreak">全域休息時間 (分鐘):</label>
          <input id="globalBreak" v-model.number="SettingsStore.globalBreakMinutes" type="number" min="0"
            @blur="saveSettings" />
        </div>
        <div class="action-buttons">
          <button @click="isEditingMode = !isEditingMode" class="edit-mode-button" :class="{ active: isEditingMode }">
            {{ isEditingMode ? '完成編輯' : '編輯時間' }}
          </button>
          <button @click="exportData" class="export-button">匯出資料</button>
          <label for="importFile" class="import-button">
            匯入資料
            <input id="importFile" type="file" accept=".json" @change="importData" style="display: none;" />
          </label>
        </div>
      </div>
    </header>

    <main class="app-main">
      <BatchWorkEntryForm @apply-batch="(data) => onApplyBatchEntry(data)" />

      <div class="calendar-section">
        <Calendar :current-month="currentMonth" :hourly-rate="SettingsStore.hourlyRate" :is-editing-mode="isEditingMode"
          :refresh-key="refreshCalendar" @date-selected="onDateSelected" @month-changed="onMonthChanged"
          @entry-updated="onEntryUpdated" @entry-deleted="onEntryDeleted" />
      </div>

      <div class="summary-section">
        <h2>{{ currentMonthFormatted }} 總計</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">總工時:</span>
            <span class="value">{{ monthlyTotal.totalHours.toFixed(1) }} 小時</span>
          </div>
          <div class="summary-item">
            <span class="label">正常工資:</span>
            <span class="value">${{ monthlyTotal.regularPay.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">加班工資:</span>
            <span class="value">${{ monthlyTotal.overtimePay.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">假日工資:</span>
            <span class="value">${{ monthlyTotal.holidayPay.toLocaleString() }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">總薪資:</span>
            <span class="value">${{ monthlyTotal.totalPay.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </main>

    <WorkEntryForm v-if="showForm" :entry="selectedEntry" :date="selectedDate"
      :default-break-minutes="SettingsStore.globalBreakMinutes" @save="onSaveEntry" @delete="onDeleteEntry"
      @close="closeForm" />
  </div>
</template>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  background: #000000;
  color: #eeeeee;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #444;
  gap: 1rem;
}

.app-header h1 {
  margin: 0;
  color: #eeeeee;
}

.settings-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-group label {
  font-weight: bold;
  color: #eeeeee;
}

.setting-group input {
  padding: 0.5rem;
  border: 1px solid #555;
  border-radius: 4px;
  width: 80px;
  background: #333333;
  color: #eeeeee;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-mode-button {
  padding: 0.5rem 1rem;
  background: #555555;
  color: white;
  border: 1px solid #777777;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s;
}

.edit-mode-button:hover {
  background: #666666;
}

.edit-mode-button.active {
  background: #ff9800;
  border-color: #ffb74d;
  box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
}

.export-button,
.import-button {
  padding: 0.5rem 1rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.export-button:hover,
.import-button:hover {
  background: #005aa3;
}

.app-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  align-items: start;
}

.calendar-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.summary-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1rem;
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
    width: 100%;
    justify-content: flex-start;
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
