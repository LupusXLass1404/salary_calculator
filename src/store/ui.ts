import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
    // State
    const showForm = ref(false)
    const isEditingMode = ref(false)
    const refreshCalendar = ref(0)

    // Actions
    /**
     * 關閉表單
     */
    async function closeForm() {
        showForm.value = false
        // 通知 salary store 重置選擇
        const { useSalaryStore } = await import('@/store/salary')
        const salaryStore = useSalaryStore()
        salaryStore.selectedDate = null
        salaryStore.selectedEntry = null
    }

    /**
     * 當日期被選擇時處理
     */
    async function onDateSelected(date: string) {
        // 設置選擇的日期和條目
        const { useSalaryStore } = await import('@/store/salary')
        const salaryStore = useSalaryStore()
        salaryStore.selectedDate = date
        salaryStore.selectedEntry = salaryStore.monthlyData[date] || null
        showForm.value = true
    }

    return {
        // State
        showForm,
        isEditingMode,
        refreshCalendar,
        // Actions
        onDateSelected,
        closeForm,
    }
})