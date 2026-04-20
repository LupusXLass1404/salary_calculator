<script setup lang="ts">
import { useUiStore } from '@/store/ui'
import { useDataTransfer } from '@/composables/useDataTransfer'
const uiStore = useUiStore()
const { handleExport, handleImport } = useDataTransfer()


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
                <button @click="handleExport" class="export-button">
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
    background-color: #666666;
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