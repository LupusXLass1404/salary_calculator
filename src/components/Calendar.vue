<template>
    <div class="calendar">
        <CalendarHeader :current-month-formatted="currentMonthFormatted" @previous-month="previousMonth"
            @next-month="nextMonth" />

        <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="weekday-header">
                {{ day }}
            </div>

            <CalendarDay v-for="date in calendarDates" :key="date.dateStr" :date="date"
                :is-editing="editingDate === date.dateStr" @date-click="handleDateClick" />

            <!-- Inline edit form overlay -->
            <CalendarEditForm v-if="editingDate" :edit-form="editForm" :editing-date="editingDate"
                @update:edit-form="editForm = $event" @save-edit="saveEdit" @cancel-edit="cancelEdit"
                @entry-deleted="editingDate = null" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCalendar } from '@/composables/useCalendar';
import { useUiStore } from '@/store/ui';
import { useSalaryStore } from '@/store/salary';
import CalendarHeader from './calendar/CalendarHeader.vue';
import CalendarDay from './calendar/CalendarDay.vue';
import CalendarEditForm from './calendar/CalendarEditForm.vue';

const uiStore = useUiStore();
const salaryStore = useSalaryStore();

const {
    weekDays,
    currentMonthFormatted,
    calendarDates,
    monthData,
    hasWorkEntry,
    previousMonth,
    nextMonth
} = useCalendar();

const isEditingMode = computed(() => uiStore.isEditingMode);

const editingDate = ref<string | null>(null);
const editForm = ref({
    start: '',
    end: '',
    breakMinutes: 60
});

/**
 * 處理日期點擊事件
 */
function handleDateClick(dateStr: string) {
    if (isEditingMode.value && hasWorkEntry(dateStr)) {
        editEntry(dateStr);
    } else if (!isEditingMode.value) {
        uiStore.onDateSelected(dateStr);
    }
}

/**
 * 編輯指定日期的條目
 */
function editEntry(dateStr: string) {
    const entry = monthData.value[dateStr];
    if (entry) {
        editingDate.value = dateStr;
        editForm.value = {
            start: entry.start || '',
            end: entry.end || '',
            breakMinutes: entry.breakMinutes !== undefined ? entry.breakMinutes : 60
        };
    }
}

/**
 * 保存編輯的條目
 */
function saveEdit() {
    if (!editingDate.value) return;

    const entry = {
        ...monthData.value[editingDate.value],
        start: editForm.value.start,
        end: editForm.value.end,
        breakMinutes: editForm.value.breakMinutes,
        date: editingDate.value  // 確保有日期屬性
    };

    monthData.value[editingDate.value] = entry;
    salaryStore.onEntryUpdated(editingDate.value, entry);
    editingDate.value = null;
}

/**
 * 取消編輯
 */
function cancelEdit() {
    editingDate.value = null;
}
</script>

<style scoped>
.calendar {
    max-width: 900px;
    margin: 0 auto;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #333333;
    border: 1px solid #333333;
}

.weekday-header {
    background: #2a2a2a;
    padding: 0.75rem 0.5rem;
    text-align: center;
    font-weight: bold;
    color: #cccccc;
    font-size: 0.9rem;
}
</style>