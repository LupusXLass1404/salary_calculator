<script setup lang="ts">
import { useAppStore } from './store/app';
import Calendar from './components/Calendar.vue';
import WorkEntryForm from './components/WorkEntryForm.vue';
import BatchWorkEntryForm from './components/BatchWorkEntryForm.vue';

const appStore = useAppStore();
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>薪水計算器</h1>
      <div class="settings-bar">
        <div class="action-buttons">
          <button @click="appStore.isEditingMode = !appStore.isEditingMode" class="edit-mode-button"
            :class="{ active: appStore.isEditingMode }">
            <span class="button-icon">{{ appStore.isEditingMode ? '✓' : '✏️' }}</span>
            {{ appStore.isEditingMode ? '完成編輯' : '編輯時間' }}
          </button>
          <button @click="appStore.exportData" class="export-button">
            <span class="button-icon">📤</span>
            匯出資料
          </button>
          <label for="importFile" class="import-button">
            <span class="button-icon">📥</span>
            匯入資料
            <input id="importFile" type="file" accept=".json" @change="appStore.importData" style="display: none;" />
          </label>
        </div>
      </div>
    </header>

    <main class="app-main">
      <BatchWorkEntryForm :default-break-minutes="appStore.settings.globalBreakMinutes"
        :batch-defaults="appStore.settings.batchDefaults" @apply-batch="appStore.onApplyBatchEntry"
        @settings-changed="appStore.onBatchSettingsChanged" />

      <div class="calendar-section">
        <Calendar :current-month="appStore.currentMonth" :hourly-rate="appStore.settings.hourlyRate"
          :is-editing-mode="appStore.isEditingMode" :refresh-key="appStore.refreshCalendar"
          @date-selected="appStore.onDateSelected" @month-changed="appStore.onMonthChanged"
          @entry-updated="appStore.onEntryUpdated" @entry-deleted="appStore.onEntryDeleted" />
      </div>

      <div class="summary-section">
        <h2>{{ appStore.currentMonthFormatted }} 總計</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">總工時:</span>
            <span class="value">{{ isNaN(appStore.monthlyTotal.totalHours) ? '0.0' :
              appStore.monthlyTotal.totalHours.toFixed(1) }}
              小時</span>
          </div>
          <div class="summary-item">
            <span class="label">正常工資:</span>
            <span class="value">${{ isNaN(appStore.monthlyTotal.regularPay) ? '0' :
              appStore.monthlyTotal.regularPay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item">
            <span class="label">加班工資:</span>
            <span class="value">${{ isNaN(appStore.monthlyTotal.overtimePay) ? '0' :
              appStore.monthlyTotal.overtimePay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item">
            <span class="label">假日工資:</span>
            <span class="value">${{ isNaN(appStore.monthlyTotal.holidayPay) ? '0' :
              appStore.monthlyTotal.holidayPay.toLocaleString()
              }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">總薪資:</span>
            <span class="value">${{ isNaN(appStore.monthlyTotal.totalPay) ? '0' :
              appStore.monthlyTotal.totalPay.toLocaleString()
              }}</span>
          </div>
        </div>
      </div>
    </main>

    <WorkEntryForm v-if="appStore.showForm" :entry="appStore.selectedEntry" :date="appStore.selectedDate"
      :default-break-minutes="appStore.settings.globalBreakMinutes" @save="appStore.onSaveEntry"
      @delete="appStore.onDeleteEntry" @close="appStore.closeForm" />
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
