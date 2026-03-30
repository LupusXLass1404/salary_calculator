import { format } from 'date-fns';

import { exportData as exportDataUtil, importData as importDataUtil } from '@/utils/storage';
import { useUiStore } from '@/store/ui'
import { useSalaryStore } from '@/store/salary'

const uiStore = useUiStore();
const salaryStore = useSalaryStore();

export function exportData() {
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

export function importData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target?.result as string;
                importDataUtil(jsonString);
                salaryStore.loadCurrentMonthData();
                uiStore.refreshCalendar++;
            } catch (error) {
                console.error('Import failed:', error);
            }
        };
        reader.readAsText(file);
    }
}
