<script setup lang="ts">
import { useSettingsStore } from '@/store/settings';
import { useUiStore } from '@/store/ui';
import { useSalaryStore } from '@/store/salary';

const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const salaryStore = useSalaryStore();

/**
 * 處理文件匯入
 */
function handleImport(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            const jsonData = e.target?.result as string
            if (jsonData) {
                settingsStore.importData(jsonData)
                // Reload data after import
                salaryStore.loadCurrentMonthData()
            }
        }
        reader.readAsText(file)
    }
}
</script>

<template>
    <header class="app-header">
        <h1>薪水計算器</h1>
        <div class="settings-bar">
            <div class="action-buttons">
                <button @click="uiStore.isEditingMode = !uiStore.isEditingMode" class="edit-mode-button"
                    :class="{ active: uiStore.isEditingMode }">
                    <span class="button-icon">{{ uiStore.isEditingMode ? '✓' : '✏️' }}</span>
                    {{ uiStore.isEditingMode ? '完成編輯' : '編輯時間' }}
                </button>
                <button @click="settingsStore.exportData" class="export-button">
                    <span class="button-icon">📤</span>
                    匯出資料
                </button>
                <label for="importFile" class="import-button">
                    <span class="button-icon">📥</span>
                    匯入資料
                    <input id="importFile" type="file" accept=".json" @change="handleImport" style="display: none;" />
                </label>
            </div>
        </div>
    </header>
</template>

<style scoped>
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
    align-items: center;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.edit-mode-button,
.export-button,
.import-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #444444;
    border-radius: 4px;
    background: #2a2a2a;
    color: #eeeeee;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.edit-mode-button:hover,
.export-button:hover,
.import-button:hover {
    background: #3a3a3a;
    border-color: #555555;
}

.edit-mode-button.active {
    background: #4a4a4a;
    border-color: #666666;
}

.button-icon {
    font-size: 1rem;
}
</style>