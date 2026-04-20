import { useSettingsStore } from '@/store/settings';
import { useSalaryStore } from '@/store/salary';

export function useDataTransfer() {
    const settingsStore = useSettingsStore();
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

    /**
     * 處理數據匯出
     */
    function handleExport() {
        const jsonData = settingsStore.exportData()
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `salary-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
    }

    return {
        handleImport,
        handleExport
    }
}