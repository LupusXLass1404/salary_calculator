<template>
    <div class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>{{ date }} 工作記錄</h3>
                <button @click="close" class="close-button">&times;</button>
            </div>

            <form @submit.prevent="save" class="work-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="startTime">開始時間:</label>
                        <input id="startTime" v-model="formData.start" type="time" required class="time-input" />
                    </div>

                    <div class="form-group">
                        <label for="endTime">結束時間:</label>
                        <input id="endTime" v-model="formData.end" type="time" required class="time-input" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="breakMinutes">休息時間 (分鐘):</label>
                        <input id="breakMinutes" v-model.number="formData.breakMinutes" type="number" min="0" max="480"
                            required class="number-input" />
                    </div>

                    <div class="form-group">
                        <label for="hourlyRate">時薪:</label>
                        <input id="hourlyRate" v-model.number="formData.hourlyRate" type="number" min="0" step="1"
                            required class="number-input" />
                    </div>
                </div>

                <div v-if="calculatedHours > 0" class="calculation-preview">
                    <h4>計算預覽</h4>
                    <div class="preview-grid">
                        <div class="preview-item">
                            <span class="label">總工時:</span>
                            <span class="value">{{ calculatedHours.toFixed(1) }} 小時</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">正常工資:</span>
                            <span class="value">${{ calculation.regularPay.toLocaleString() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">加班工資:</span>
                            <span class="value">${{ calculation.overtimePay.toLocaleString() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">假日工資:</span>
                            <span class="value">${{ calculation.holidayPay.toLocaleString() }}</span>
                        </div>
                        <div class="preview-item total">
                            <span class="label">總薪資:</span>
                            <span class="value">${{ calculation.totalPay.toLocaleString() }}</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button v-if="entry" type="button" @click="deleteEntry" class="delete-button">刪除</button>
                    <button type="button" @click="close" class="cancel-button">取消</button>
                    <button type="submit" class="save-button">儲存</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { calculateWorkHours } from '@/utils/time';
import { calculateSalary } from '@/utils/calculations';

interface Props {
    entry: any;
    date: string | null;
    defaultBreakMinutes: number;
}

interface Emits {
    (e: 'save', entry: any): void;
    (e: 'delete'): void;
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formData = ref({
    start: '',
    end: '',
    breakMinutes: 60,
    hourlyRate: 196
});

const calculatedHours = computed(() => {
    if (formData.value.start && formData.value.end) {
        return calculateWorkHours(formData.value.start, formData.value.end, formData.value.breakMinutes);
    }
    return 0;
});

const calculation = computed(() => {
    if (calculatedHours.value > 0) {
        return calculateSalary({
            start: formData.value.start,
            end: formData.value.end,
            breakMinutes: formData.value.breakMinutes,
            hourlyRate: formData.value.hourlyRate,
            date: props.date,
            // isHoliday will be automatically determined
        }, formData.value.hourlyRate);
    }
    return {
        totalHours: 0,
        regularPay: 0,
        overtimePay: 0,
        holidayPay: 0,
        totalPay: 0
    };
});

function save() {
    const entry = {
        ...formData.value,
        date: props.date
    };
    emit('save', entry);
}

function deleteEntry() {
    if (confirm('確定要刪除這筆記錄嗎？')) {
        emit('delete');
    }
}

function close() {
    emit('close');
}

function handleOverlayClick() {
    close();
}

// Watch for entry changes to populate form
watch(() => props.entry, (newEntry) => {
    if (newEntry) {
        formData.value = {
            start: newEntry.start || '',
            end: newEntry.end || '',
            breakMinutes: newEntry.breakMinutes !== undefined ? newEntry.breakMinutes : props.defaultBreakMinutes,
            hourlyRate: newEntry.hourlyRate || 196
        };
    } else {
        formData.value = {
            start: '',
            end: '',
            breakMinutes: props.defaultBreakMinutes,
            hourlyRate: 196
        };
    }
}, { immediate: true });
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #555;
}

.modal-header h3 {
    margin: 0;
    color: #eeeeee;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #aaaaaa;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.close-button:hover {
    background: #333333;
    color: #eeeeee;
}

.work-form {
    padding: 1rem;
}

.form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: bold;
    color: #eeeeee;
    font-size: 0.9rem;
}

.time-input,
.number-input {
    padding: 0.5rem;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    background: #333333;
    color: #eeeeee;
}

.number-input {
    width: 100%;
}

.calculation-preview {
    background: #333333;
    border-radius: 4px;
    padding: 1rem;
    margin: 1rem 0;
    border: 1px solid #555;
}

.calculation-preview h4 {
    margin: 0 0 0.5rem 0;
    color: #eeeeee;
    font-size: 1rem;
}

.preview-grid {
    display: grid;
    gap: 0.5rem;
}

.preview-item {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
}

.preview-item.total {
    border-top: 1px solid #555;
    padding-top: 0.5rem;
    font-weight: bold;
    color: #0099ff;
}

.label {
    color: #aaaaaa;
}

.value {
    font-weight: bold;
    color: #eeeeee;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #555;
}

.cancel-button,
.delete-button,
.save-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    flex: 1;
    min-width: 80px;
}

.cancel-button {
    background: #6c757d;
    color: white;
}

.cancel-button:hover {
    background: #5a6268;
}

.delete-button {
    background: #e91e63;
    color: white;
}

.delete-button:hover {
    background: #c2185b;
}

.save-button {
    background: #007acc;
    color: white;
}

.save-button:hover {
    background: #005aa3;
}

@media (max-width: 600px) {
    .form-row {
        flex-direction: column;
        gap: 0.5rem;
    }

    .modal-content {
        width: 95%;
        margin: 1rem;
    }
}
</style>