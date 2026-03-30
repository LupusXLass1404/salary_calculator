import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadSettings, saveSettings as saveSettingsUtil, exportData as exportDataUtil, importData as importDataUtil } from '@/utils/storage';

export const useSettingsStore = defineStore('count', () => {
    // State
    const settings = ref(loadSettings())
    const hourlyRate = ref(196)
    const globalBreakMinutes = ref(0)


    // Actions
    function onBatchSettingsChanged(newBatchDefaults: any) {
        settings.value.batchDefaults = {
            ...settings.value.batchDefaults,
            ...newBatchDefaults
        };
        saveSettings();
    }

    function saveSettings() {
        saveSettingsUtil(settings.value);
    }

    function exportData() {
        return exportDataUtil();
    }

    function importData(jsonData: string) {
        return importDataUtil(jsonData);
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