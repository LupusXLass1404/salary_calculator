<template>
    <div class="batch-form-container">
        <h3>批量填寫工作時間</h3>
        <div class="batch-form">
            <!-- 選擇周數 -->
            <div class="form-section">
                <label>選擇日期:</label>
                <div class="weekday-selector">
                    <button v-for="day in 7" :key="day" @click="toggleWeekday(day)"
                        :class="{ selected: selectedWeekdays.includes(day) }" class="weekday-btn">
                        {{ weekdayNames[day - 1] }}
                    </button>
                </div>
            </div>

            <!-- 時間輸入 -->
            <div class="form-section">
                <label>工作時間:</label>
                <div class="time-inputs">
                    <div class="time-group">
                        <label>開始時間:</label>
                        <input v-model="batchData.startTime" type="time" class="time-input" />
                    </div>
                    <span class="separator">~</span>
                    <div class="time-group">
                        <label>結束時間:</label>
                        <input v-model="batchData.endTime" type="time" class="time-input" />
                    </div>
                </div>
            </div>

            <!-- 休息時間設定 -->
            <div class="form-section">
                <label>休息時間:</label>
                <div class="break-input">
                    <input v-model.number="batchData.breakMinutes" type="number" min="0" max="480" step="5"
                        class="number-input" /> 分鐘
                </div>
            </div>

            <!-- 時薪設定 -->
            <div class="form-section">
                <label>時薪:</label>
                <div class="hourly-rate-input">
                    <input v-model.number="batchData.hourlyRate" type="number" min="0" step="1" class="number-input" />
                    元/小時
                </div>
            </div>

            <!-- 日期範圍選擇 -->
            <div class="form-section">
                <label>應用範圍:</label>
                <div class="date-range">
                    <div class="date-group">
                        <label>開始日期:</label>
                        <input v-model="batchData.startDate" type="date" class="date-input" />
                    </div>
                    <span class="separator">至</span>
                    <div class="date-group">
                        <label>結束日期:</label>
                        <input v-model="batchData.endDate" type="date" class="date-input" />
                    </div>
                </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="action-buttons">
                <button @click="applyBatchEntry" class="apply-btn">套用填寫</button>
                <button @click="resetForm" class="reset-btn">重置</button>
            </div>

            <!-- 預覽信息 -->
            <div v-if="previewInfo" class="preview-info">
                <p>{{ previewInfo }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { eachDayOfInterval, parseISO, format, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday } from 'date-fns';
import { useSettingsStore } from '@/store/settings';
import { useSalaryStore } from '@/store/salary';

const settingsStore = useSettingsStore();
const salaryStore = useSalaryStore();

const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const selectedWeekdays = ref<number[]>([...settingsStore.settings.batchDefaults.selectedWeekdays]);

const batchData = ref({
    startTime: settingsStore.settings.batchDefaults.startTime,
    endTime: settingsStore.settings.batchDefaults.endTime,
    breakMinutes: settingsStore.settings.batchDefaults.breakMinutes,
    hourlyRate: settingsStore.settings.batchDefaults.hourlyRate,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 預設加30天
});

const weekdayCheckers: Array<(date: Date) => boolean> = [
    isMonday,
    isTuesday,
    isWednesday,
    isThursday,
    isFriday,
    isSaturday,
    isSunday
];

/**
 * 切換工作日選擇
 */
function toggleWeekday(day: number) {
    const index = selectedWeekdays.value.indexOf(day)
    if (index > -1) {
        selectedWeekdays.value.splice(index, 1)
    } else {
        selectedWeekdays.value.push(day)
        selectedWeekdays.value.sort((a, b) => a - b)
    }
}

/**
 * 獲取匹配的日期列表
 */
function getMatchingDates(): string[] {
    const dates: string[] = []
    const start = parseISO(batchData.value.startDate)
    const end = parseISO(batchData.value.endDate)

    const allDays = eachDayOfInterval({ start, end })

    allDays.forEach((day) => {
        for (let i = 0; i < weekdayCheckers.length; i++) {
            const checker = weekdayCheckers[i]
            if (checker && selectedWeekdays.value.includes(i + 1) && checker(day)) {
                dates.push(format(day, 'yyyy-MM-dd'))
                break
            }
        }
    })

    return dates
}

const previewInfo = computed(() => {
    const dates = getMatchingDates();
    if (dates.length === 0) {
        return '沒有符合條件的日期';
    }
    return `將為 ${dates.length} 天填寫工作時間 (${batchData.value.startTime} ~ ${batchData.value.endTime}, 休息 ${batchData.value.breakMinutes} 分鐘, 時薪 $${batchData.value.hourlyRate})`;
});

/**
 * 應用批量條目
 */
function applyBatchEntry() {
    if (!batchData.value.startTime || !batchData.value.endTime) {
        alert('請填寫開始和結束時間')
        return
    }

    if (selectedWeekdays.value.length === 0) {
        alert('請選擇至少一個工作日')
        return
    }

    const dates = getMatchingDates()
    if (dates.length === 0) {
        alert('沒有符合條件的日期')
        return
    }

    salaryStore.onApplyBatchEntry({
        dates,
        startTime: batchData.value.startTime,
        endTime: batchData.value.endTime,
        breakMinutes: batchData.value.breakMinutes,
        hourlyRate: batchData.value.hourlyRate
    })

    alert(`成功將工作時間套用到 ${dates.length} 天`)
}

/**
 * 重置表單
 */
function resetForm() {
    selectedWeekdays.value = [...settingsStore.settings.batchDefaults.selectedWeekdays]
    batchData.value = {
        startTime: settingsStore.settings.batchDefaults.startTime,
        endTime: settingsStore.settings.batchDefaults.endTime,
        breakMinutes: settingsStore.settings.batchDefaults.breakMinutes,
        hourlyRate: settingsStore.settings.batchDefaults.hourlyRate,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    }
}

// Watch for settings changes and update store
watch(() => batchData.value.startTime, (newVal) => {
    settingsStore.onBatchSettingsChanged({
        startTime: newVal,
        endTime: batchData.value.endTime,
        breakMinutes: batchData.value.breakMinutes,
        hourlyRate: batchData.value.hourlyRate,
        selectedWeekdays: selectedWeekdays.value
    });
});

watch(() => batchData.value.endTime, (newVal) => {
    settingsStore.onBatchSettingsChanged({
        startTime: batchData.value.startTime,
        endTime: newVal,
        breakMinutes: batchData.value.breakMinutes,
        hourlyRate: batchData.value.hourlyRate,
        selectedWeekdays: selectedWeekdays.value
    });
});

watch(() => batchData.value.breakMinutes, (newVal) => {
    settingsStore.onBatchSettingsChanged({
        startTime: batchData.value.startTime,
        endTime: batchData.value.endTime,
        breakMinutes: newVal,
        hourlyRate: batchData.value.hourlyRate,
        selectedWeekdays: selectedWeekdays.value
    });
});

watch(() => batchData.value.hourlyRate, (newVal) => {
    settingsStore.onBatchSettingsChanged({
        startTime: batchData.value.startTime,
        endTime: batchData.value.endTime,
        breakMinutes: batchData.value.breakMinutes,
        hourlyRate: newVal,
        selectedWeekdays: selectedWeekdays.value
    });
});

watch(() => selectedWeekdays.value, (newVal) => {
    settingsStore.onBatchSettingsChanged({
        startTime: batchData.value.startTime,
        endTime: batchData.value.endTime,
        breakMinutes: batchData.value.breakMinutes,
        hourlyRate: batchData.value.hourlyRate,
        selectedWeekdays: [...newVal]
    });
}, { deep: true });
</script>

<style scoped>
.batch-form-container {
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.batch-form-container h3 {
    margin: 0 0 1rem 0;
    color: #eeeeee;
    font-size: 1.1rem;
}

.batch-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-section>label {
    color: #eeeeee;
    font-weight: bold;
    font-size: 0.95rem;
}

.weekday-selector {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.weekday-btn {
    background: #333333;
    border: 2px solid #555555;
    border-radius: 4px;
    color: #eeeeee;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    flex: 1;
    min-width: 60px;
}

.weekday-btn:hover {
    border-color: #0099ff;
    background: #404040;
}

.weekday-btn.selected {
    background: #0099ff;
    border-color: #0099ff;
    color: #000000;
    font-weight: bold;
}

.time-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.time-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
}

.time-group>label {
    color: #aaa;
    font-size: 0.85rem;
}

.time-input,
.date-input {
    background: #333333;
    border: 1px solid #555555;
    border-radius: 4px;
    color: #eeeeee;
    padding: 0.6rem;
    font-size: 0.95rem;
}

.time-input:focus,
.date-input:focus {
    outline: none;
    border-color: #0099ff;
    box-shadow: 0 0 4px rgba(0, 153, 255, 0.3);
}

.break-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.number-input {
    background: #333333;
    border: 1px solid #555555;
    border-radius: 4px;
    color: #eeeeee;
    padding: 0.6rem;
    font-size: 0.95rem;
    width: 80px;
}

.number-input:focus {
    outline: none;
    border-color: #0099ff;
    box-shadow: 0 0 4px rgba(0, 153, 255, 0.3);
}

.separator {
    color: #aaa;
    align-self: flex-end;
    margin-bottom: 0.25rem;
}

.date-range {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
}

.date-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
}

.date-group>label {
    color: #aaa;
    font-size: 0.85rem;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

.apply-btn,
.reset-btn {
    flex: 1;
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.apply-btn {
    background: #4CAF50;
    color: #000000;
}

.apply-btn:hover {
    background: #45a049;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.reset-btn {
    background: #666666;
    color: #eeeeee;
}

.reset-btn:hover {
    background: #777777;
}

.preview-info {
    background: #222222;
    border-left: 3px solid #0099ff;
    padding: 0.8rem;
    border-radius: 4px;
    color: #0099ff;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

@media (max-width: 768px) {
    .batch-form-container {
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .time-inputs,
    .date-range {
        flex-direction: column;
        align-items: stretch;
    }

    .separator {
        align-self: center;
        margin-bottom: 0;
    }
}
</style>
