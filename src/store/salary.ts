import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { loadMonthData, saveMonthData } from '@/utils/storage'
import { calculateMonthlyTotal } from '@/utils/calculations'

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
    /**
     * 加載當前月份的數據
     */
    function loadCurrentMonthData() {
        monthlyData.value = loadMonthData(currentMonth.value)
    }

    /**
     * 保存工作條目
     */
    async function onSaveEntry(entry: any) {
        if (selectedDate.value) {
            // 提取日期的月份
            const entryMonth = selectedDate.value.substring(0, 7); // e.g., '2026-04'
            
            // 如果條目的月份不同於當前月份，需要保存到正確的月份
            if (entryMonth !== currentMonth.value) {
                const targetMonthData = loadMonthData(entryMonth);
                targetMonthData[selectedDate.value] = entry;
                saveMonthData(entryMonth, targetMonthData);
            } else {
                monthlyData.value[selectedDate.value] = entry;
                saveMonthData(currentMonth.value, monthlyData.value);
            }
            
            // 通知 UI store 刷新和關閉表單
            const { useUiStore } = await import('@/store/ui')
            const uiStore = useUiStore()
            uiStore.refreshCalendar++
            uiStore.closeForm()
        }
    }

    /**
     * 刪除工作條目
     */
    async function onDeleteEntry() {
        if (selectedDate.value) {
            // 提取日期的月份
            const entryMonth = selectedDate.value.substring(0, 7);
            
            // 如果條目的月份不同於當前月份，需要從正確的月份刪除
            if (entryMonth !== currentMonth.value) {
                const targetMonthData = loadMonthData(entryMonth);
                delete targetMonthData[selectedDate.value];
                saveMonthData(entryMonth, targetMonthData);
            } else {
                delete monthlyData.value[selectedDate.value];
                saveMonthData(currentMonth.value, monthlyData.value);
            }
            
            // 通知 UI store 刷新和關閉表單
            const { useUiStore } = await import('@/store/ui')
            const uiStore = useUiStore()
            uiStore.refreshCalendar++
            uiStore.closeForm()
        }
    }

    /**
     * 批量應用工作條目
     */
    async function onApplyBatchEntry(data: { dates: string[], startTime: string, endTime: string, breakMinutes: number, hourlyRate: number }) {
        let addedCount = 0;
        const monthGroups: Record<string, string[]> = {};

        // 按月份分組日期
        data.dates.forEach((dateStr) => {
            const month = dateStr.substring(0, 7);
            if (!monthGroups[month]) {
                monthGroups[month] = [];
            }
            monthGroups[month].push(dateStr);
        });

        // 對每個月份處理
        for (const [month, dates] of Object.entries(monthGroups)) {
            const targetMonthData = loadMonthData(month);
            let monthAdded = 0;

            dates.forEach((dateStr) => {
                // 檢查該日期是否已有記錄
                if (!targetMonthData[dateStr]) {
                    const entry: any = {
                        start: data.startTime,
                        end: data.endTime,
                        breakMinutes: data.breakMinutes,
                        hourlyRate: data.hourlyRate,
                        date: dateStr  // 添加日期屬性供計算使用
                    };

                    targetMonthData[dateStr] = entry;
                    monthAdded++;
                    addedCount++;
                }
            });

            if (monthAdded > 0) {
                saveMonthData(month, targetMonthData);
            }
        }

        if (addedCount > 0) {
            // 通知 UI store 刷新日曆
            const { useUiStore } = await import('@/store/ui')
            const uiStore = useUiStore()
            uiStore.refreshCalendar++ // 立即通知 Calendar 重載
            loadCurrentMonthData() // 刷新日曆顯示
        }
    }

    /**
     * 當月份改變時處理
     */
    function onMonthChanged(month: string) {
        currentMonth.value = month
        loadCurrentMonthData()
    }

    /**
     * 當條目更新時處理
     */
    function onEntryUpdated(date: string, entry: any) {
        // 提取日期的月份
        const entryMonth = date.substring(0, 7);
        
        if (selectedDate.value === date) {
            selectedEntry.value = entry;
        }
        
        // 如果條目的月份不同於當前月份，需要保存到正確的月份
        if (entryMonth !== currentMonth.value) {
            const targetMonthData = loadMonthData(entryMonth);
            targetMonthData[date] = entry;
            saveMonthData(entryMonth, targetMonthData);
        } else {
            monthlyData.value[date] = entry;
            saveMonthData(currentMonth.value, monthlyData.value);
        }
    }

    /**
     * 當條目刪除時處理
     */
    function onEntryDeleted(date: string) {
        // 提取日期的月份
        const entryMonth = date.substring(0, 7);
        
        // 如果條目的月份不同於當前月份，需要從正確的月份刪除
        if (entryMonth !== currentMonth.value) {
            const targetMonthData = loadMonthData(entryMonth);
            delete targetMonthData[date];
            saveMonthData(entryMonth, targetMonthData);
        } else {
            delete monthlyData.value[date];
            saveMonthData(currentMonth.value, monthlyData.value);
        }
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


