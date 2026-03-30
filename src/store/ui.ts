import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSalaryStore } from '@/store/salary'

const salaryStore = useSalaryStore()

export const useUiStore = defineStore('ui', () => {
    // State
    const showForm = ref(false)
    const isEditingMode = ref(false)
    const refreshCalendar = ref(0)

    // Actions
    /**
     * 關閉表單
     */
    function closeForm() {
        showForm.value = false
        salaryStore.selectedDate = null
        salaryStore.selectedEntry = null
    }

    /**
     * 當日期被選擇時處理
     */
    function onDateSelected(date: string) {
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