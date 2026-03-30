<script setup lang="ts">
import { computed } from 'vue';
import { useCalendar } from '@/composables/useCalendar';
import { useUiStore } from '@/store/ui';

interface Props {
    date: {
        dateStr: string;
        day: number;
        isCurrentMonth: boolean;
        isToday: boolean;
    };
    isEditing: boolean;
}

interface Emits {
    (e: 'date-click', dateStr: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const uiStore = useUiStore();
const {
    hasWorkEntry,
    getWorkHours,
    getStartTime,
    getEndTime,
    getHolidayNameForDate
} = useCalendar();

const isEditingMode = computed(() => uiStore.isEditingMode);

const hasEntry = computed(() => hasWorkEntry(props.date.dateStr));
const startTime = computed(() => getStartTime(props.date.dateStr));
const endTime = computed(() => getEndTime(props.date.dateStr));
const workHours = computed(() => getWorkHours(props.date.dateStr));
const holidayName = computed(() => getHolidayNameForDate(props.date.dateStr));

const dayClasses = computed(() => ({
    'today': props.date.isToday,
    'has-entry': hasEntry.value,
    'current-month': props.date.isCurrentMonth,
    'editing-mode': isEditingMode.value && hasEntry.value
}));
</script>

<template>
    <div class="calendar-day" :class="dayClasses" @click="emit('date-click', date.dateStr)">
        <div class="day-header">
            <span class="day-number">{{ date.day }}</span>
            <span v-if="holidayName" class="holiday-label">{{ holidayName }}</span>
        </div>

        <div v-if="hasEntry" class="entry-display">
            <div class="time-info">
                <span class="time-label">{{ startTime }}</span>
                <span class="time-separator">~</span>
                <span class="time-label">{{ endTime }}</span>
            </div>
            <div class="hours-badge">{{ workHours }}h</div>
        </div>
    </div>
</template>

<style scoped>
.calendar-day {
    min-height: 80px;
    padding: 0.5rem;
    border: 1px solid #333333;
    background: #1a1a1a;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.calendar-day:hover {
    background: #2a2a2a;
}

.calendar-day.today {
    border-color: #007acc;
    background: #1e3a5f;
}

.calendar-day.has-entry {
    background: #2a4a2a;
}

.calendar-day.current-month {
    opacity: 1;
}

.calendar-day:not(.current-month) {
    opacity: 0.5;
}

.calendar-day.editing-mode {
    border-color: #ff9800;
    box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
}

.day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.day-number {
    font-weight: bold;
    color: #eeeeee;
}

.holiday-label {
    font-size: 0.8rem;
    color: #ff6b6b;
    font-weight: bold;
}

.entry-display {
    margin-top: 0.25rem;
}

.time-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
}

.time-label {
    font-size: 0.8rem;
    color: #cccccc;
}

.time-separator {
    color: #666666;
}

.hours-badge {
    display: inline-block;
    background: #007acc;
    color: white;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
}
</style>