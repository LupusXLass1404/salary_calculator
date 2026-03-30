import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadSettings, saveSettings as saveSettingsUtil, exportData as exportDataUtil, importData as importDataUtil } from '@/utils/storage';

export const useSettingsStore = defineStore('count', () => {
    // State
    const settings = ref(loadSettings())
    const hourlyRate = ref(196)
    const globalBreakMinutes = ref(0)


    // Actions
    /**
     * 當批量設定改變時處理
     */
    function onBatchSettingsChanged(newBatchDefaults: any) {
        settings.value.batchDefaults = {
            ...settings.value.batchDefaults,
            ...newBatchDefaults
        }
        saveSettings()
    }

    /**
     * 保存設定
     */
    function saveSettings() {
        saveSettingsUtil(settings.value)
    }

    /**
     * 匯出數據
     */
    function exportData() {
        return exportDataUtil()
    }

    /**
     * 匯入數據
     */
    function importData(jsonData: string) {
        return importDataUtil(jsonData)
    }


    return {
        settings,
        hourlyRate,
        globalBreakMinutes,
        onBatchSettingsChanged,
        saveSettings,
        exportData,
        importData
    }
});