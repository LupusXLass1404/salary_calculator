import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { loadMonthData, saveMonthData } from '@/utils/storage'
import { calculateMonthlyTotal } from '@/utils/calculations'
import { useSettingsStore } from '@/store/settings'
import { useUiStore } from '@/store/ui'

const settingsStore = useSettingsStore()
const uiStore = useUiStore()

export const useSalaryStore = defineStore('salary', () => {
    // State
    const currentMonth = ref(format(new Date(), 'yyyy-MM'))
    const monthlyData = ref<Record<string, any>>({})
    const selectedDate = ref<string | null>(null)
    const selectedEntry = ref<any>(null)

    // Computed
    const currentMonthFormatted = computed(() => {
        const [year, month] = currentMonth.value.split('-')
        return `${year}年${month}月`
    })

    const monthlyTotal = computed(() => {
        return calculateMonthlyTotal(monthlyData.value)
    })

    // Actions
    function loadCurrentMonthData() {
        monthlyData.value = loadMonthData(currentMonth.value)
    }

    function onSaveEntry(entry: any) {
        if (selectedDate.value) {
            monthlyData.value[selectedDate.value] = entry
            saveMonthData(currentMonth.value, monthlyData.value)
            uiStore.refreshCalendar
            uiStore.closeForm()
        }
    }

    function onDeleteEntry() {
        if (selectedDate.value) {
            delete monthlyData.value[selectedDate.value]
            saveMonthData(currentMonth.value, monthlyData.value)
            uiStore.refreshCalendar++
            uiStore.closeForm()
        }
    }

    function onApplyBatchEntry(data: { dates: string[], startTime: string, endTime: string, breakMinutes: number }) {
        let addedCount = 0

        data.dates.forEach((dateStr) => {
            // 檢查該日期是否已有記錄
            if (!monthlyData.value[dateStr]) {
                const entry: any = {
                    start: data.startTime,
                    end: data.endTime,
                    breakMinutes: data.breakMinutes,
                    hourlyRate: settingsStore.hourlyRate,
                    date: dateStr  // 添加日期屬性供計算使用
                }

                monthlyData.value[dateStr] = entry
                addedCount++
            }
        })

        if (addedCount > 0) {
            saveMonthData(currentMonth.value, monthlyData.value)
            uiStore.refreshCalendar++ // 立即通知 Calendar 重載
            loadCurrentMonthData() // 刷新日曆顯示
        }
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

    return {
        // State
        currentMonth,
        selectedDate,
        selectedEntry,
        monthlyData,
        // Computed
        currentMonthFormatted,
        monthlyTotal,
        // Actions
        loadCurrentMonthData,
        onSaveEntry,
        onDeleteEntry,
        onApplyBatchEntry,
        onMonthChanged,
        onEntryUpdated,
        onEntryDeleted
    }
});


