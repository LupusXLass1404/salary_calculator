<template>
    <div class="calendar">
        <div class="calendar-header">
            <button @click="previousMonth" class="nav-button">&lt;</button>
            <h2>{{ currentMonthFormatted }}</h2>
            <button @click="nextMonth" class="nav-button">&gt;</button>
        </div>

        <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="weekday-header">
                {{ day }}
            </div>

            <div v-for="date in calendarDates" :key="date.dateStr" class="calendar-day" :class="{
                'today': date.isToday,
                'has-entry': hasWorkEntry(date.dateStr),
                'current-month': date.isCurrentMonth,
                'editing-mode': isEditingMode && hasWorkEntry(date.dateStr)
            }" @click="handleDateClick(date.dateStr)">
                <span class="day-number">{{ date.day }}</span>

                <div v-if="hasWorkEntry(date.dateStr)" class="entry-display">
                    <div class="time-info">
                        <span class="time-label">{{ getStartTime(date.dateStr) }}</span>
                        <span class="time-separator">~</span>
                        <span class="time-label">{{ getEndTime(date.dateStr) }}</span>
                    </div>
                    <div class="hours-badge">{{ getWorkHours(date.dateStr) }}h</div>
                </div>

                <!-- Inline edit form when in edit mode -->
                <div v-if="isEditingMode && editingDate === date.dateStr" class="inline-edit-form" @click.stop>
                    <div class="inline-edit-row">
                        <input v-model="editForm.start" type="time" class="inline-time-input">
                        <span>~</span>
                        <input v-model="editForm.end" type="time" class="inline-time-input">
                    </div>
                    <div class="inline-edit-actions">
                        <button @click.stop="saveEdit" class="inline-save-btn">✓</button>
                        <button @click.stop="cancelEdit" class="inline-cancel-btn">✕</button>
                        <button @click.stop="deleteEntry" class="inline-delete-btn">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { loadMonthData } from '@/utils/storage';
import { calculateWorkHours } from '@/utils/time';
import { calculateSalary } from '@/utils/calculations';

interface Props {
    currentMonth: string; // YYYY-MM
    hourlyRate: number;
    isEditingMode?: boolean;
    refreshKey?: number;
}

interface Emits {
    (e: 'date-selected', date: string): void;
    (e: 'month-changed', month: string): void;
    (e: 'entry-updated', date: string, entry: any): void;
    (e: 'entry-deleted', date: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentDate = ref(new Date());

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const currentMonthFormatted = computed(() => {
    const [year, month] = props.currentMonth.split('-');
    return `${year}年${month}月`;
});

const calendarDates = computed(() => {
    const parts = props.currentMonth.split('-');
    if (parts.length !== 2) return [];
    const yearStr = parts[0];
    const monthStr = parts[1];
    if (!yearStr || !monthStr) return [];
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return [];

    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - getDay(monthStart)); // Start from Sunday

    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd))); // End on Saturday

    const dates = eachDayOfInterval({ start: startDate, end: endDate });

    return dates.map(date => ({
        dateStr: format(date, 'yyyy-MM-dd'),
        day: date.getDate(),
        isCurrentMonth: isSameMonth(date, monthStart),
        isToday: isToday(date)
    }));
});

const monthData = ref<Record<string, any>>({});

const editingDate = ref<string | null>(null);
const editForm = ref({
    start: '',
    end: '',
    breakMinutes: 60
});

function loadCurrentMonthData() {
    monthData.value = loadMonthData(props.currentMonth);
}

function hasWorkEntry(dateStr: string): boolean {
    return !!monthData.value[dateStr];
}

function getWorkHours(dateStr: string): number {
    const entry = monthData.value[dateStr];
    if (!entry) return 0;

    // Use pre-calculated hours if available
    if (entry.calculatedHours !== undefined) {
        return entry.calculatedHours;
    }

    // Fallback to calculation
    if (entry.start && entry.end) {
        return Math.round(calculateWorkHours(entry.start, entry.end, entry.breakMinutes) * 10) / 10;
    }

    return 0;
}

function getStartTime(dateStr: string): string {
    const entry = monthData.value[dateStr];
    return entry?.start || '--:--';
}

function getEndTime(dateStr: string): string {
    const entry = monthData.value[dateStr];
    return entry?.end || '--:--';
}

function handleDateClick(dateStr: string) {
    if (props.isEditingMode && hasWorkEntry(dateStr)) {
        editEntry(dateStr);
    } else if (!props.isEditingMode) {
        emit('date-selected', dateStr);
    }
}

function editEntry(dateStr: string) {
    const entry = monthData.value[dateStr];
    if (entry) {
        editingDate.value = dateStr;
        editForm.value = {
            start: entry.start || '',
            end: entry.end || '',
            breakMinutes: entry.breakMinutes || 60
        };
    }
}

function saveEdit() {
    if (!editingDate.value) return;

    const entry = {
        ...monthData.value[editingDate.value],
        start: editForm.value.start,
        end: editForm.value.end,
        breakMinutes: editForm.value.breakMinutes,
        date: editingDate.value  // 確保有日期屬性
    };

    // Recalculate salary
    const calculation = calculateSalary(entry, props.hourlyRate);
    entry.calculatedHours = calculation.totalHours;
    entry.regularPay = calculation.regularPay;
    entry.overtimePay = calculation.overtimePay;
    entry.holidayPay = calculation.holidayPay;
    entry.totalPay = calculation.totalPay;

    monthData.value[editingDate.value] = entry;
    emit('entry-updated', editingDate.value, entry);
    editingDate.value = null;
}

function cancelEdit() {
    editingDate.value = null;
}

function deleteEntry() {
    if (!editingDate.value) return;

    if (confirm(`確定要刪除 ${editingDate.value} 的工作記錄嗎？`)) {
        const dateToDelete = editingDate.value;
        delete monthData.value[dateToDelete];
        emit('entry-deleted', dateToDelete);
        editingDate.value = null;
    }
}

function previousMonth() {
    const parts = props.currentMonth.split('-');
    if (parts.length !== 2) return;
    const yearStr = parts[0];
    const monthStr = parts[1];
    if (!yearStr || !monthStr) return;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return;

    const newMonth = format(subMonths(new Date(year, month), 1), 'yyyy-MM');
    emit('month-changed', newMonth);
}

function nextMonth() {
    const parts = props.currentMonth.split('-');
    if (parts.length !== 2) return;
    const yearStr = parts[0];
    const monthStr = parts[1];
    if (!yearStr || !monthStr) return;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return;

    const newMonth = format(addMonths(new Date(year, month), 1), 'yyyy-MM');
    emit('month-changed', newMonth);
}

// Watch for month changes
watch(() => props.currentMonth, loadCurrentMonthData, { immediate: true });
// Watch for parent data updates and reload
watch(() => props.refreshKey, () => {
    loadCurrentMonthData();
}, { immediate: true });
</script>

<style scoped>
.calendar {
    max-width: 900px;
    margin: 0 auto;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.nav-button {
    background: #333333;
    border: 1px solid #666666;
    border-radius: 4px;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.2rem;
    color: #eeeeee;
}

.nav-button:hover {
    background: #555555;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    background: #555555;
    border: 1px solid #555555;
}

.weekday-header {
    background: #1a1a1a;
    padding: 0.5rem;
    text-align: center;
    font-weight: bold;
    color: #eeeeee;
}

.calendar-day {
    background: #333333;
    min-height: 80px;
    padding: 0.5rem;
    cursor: pointer;
    position: relative;
    border: 1px solid #555555;
    color: #eeeeee;
}

.calendar-day:hover {
    background: #555555;
}

.calendar-day.current-month {
    background: #333333;
}

.calendar-day:not(.current-month) {
    background: #1a1a1a;
    color: #888888;
}

.calendar-day.today {
    background: #003d66;
    border: 2px solid #0099ff;
}

.calendar-day.has-entry {
    background: #1a4d1a;
}

.day-number {
    font-weight: bold;
    display: block;
    margin-bottom: 0.25rem;
    color: #eeeeee;
}

.entry-indicator {
    position: absolute;
    bottom: 0.25rem;
    right: 0.25rem;
    background: #4CAF50;
    color: #000000;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.edit-button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0;
    opacity: 0.7;
}

.edit-button:hover {
    opacity: 1;
}

.entry-display {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
}

.time-info {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-weight: 500;
    color: #eeeeee;
}

.time-label {
    font-size: 0.8rem;
}

.time-separator {
    font-size: 0.7rem;
    color: #aaa;
    margin: 0 0.1rem;
}

.hours-badge {
    position: absolute;
    bottom: 0.25rem;
    right: 0.25rem;
    background: #4CAF50;
    color: #000000;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
}

.calendar-day.editing-mode {
    cursor: text;
}

.inline-edit-form {
    position: absolute;
    top: 1.2rem;
    left: -10px;
    right: -10px;
    width: calc(100% + 20px);
    background: rgba(0, 20, 40, 0.98);
    border-radius: 4px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    z-index: 100;
    min-height: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
}

.inline-edit-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;
}

.inline-time-input {
    flex: 1;
    background: #333333;
    border: 1px solid #555555;
    border-radius: 3px;
    color: #eeeeee;
    padding: 0.3rem;
    font-size: 0.75rem;
}

.inline-time-input:focus {
    outline: none;
    border-color: #0099ff;
    box-shadow: 0 0 4px rgba(0, 153, 255, 0.3);
}

.inline-edit-actions {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.inline-save-btn {
    background: #4CAF50;
    border: none;
    border-radius: 3px;
    color: #000000;
    cursor: pointer;
    padding: 0.3rem 0.6rem;
    font-size: 0.9rem;
    font-weight: bold;
    flex: 0 0 auto;
}

.inline-save-btn:hover {
    background: #66BB6A;
}

.inline-cancel-btn {
    background: #f44336;
    border: none;
    border-radius: 3px;
    color: white;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: bold;
}

.inline-cancel-btn:hover {
    background: #da190b;
}

.inline-delete-btn {
    background: #e91e63;
    border: 2px solid #e91e63;
    border-radius: 3px;
    color: white;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    font-size: 0.95rem;
    font-weight: bold;
    flex: 0 0 auto;
    min-width: 40px;
}

.inline-delete-btn:hover {
    background: #c2185b;
}

.hours {
    font-weight: bold;
}
</style>