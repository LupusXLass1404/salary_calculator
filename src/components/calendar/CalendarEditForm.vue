<script setup lang="ts">
import { useCalendar } from '@/composables/useCalendar';
import { useSalaryStore } from '@/store/salary';

interface Props {
    editForm: {
        start: string;
        end: string;
        breakMinutes: number;
    };
    editingDate: string;
}

interface Emits {
    (e: 'save-edit'): void;
    (e: 'cancel-edit'): void;
    (e: 'entry-deleted'): void;
    (e: 'update:edit-form', value: { start: string; end: string; breakMinutes: number }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { monthData } = useCalendar();
const salaryStore = useSalaryStore();

/**
 * 刪除條目
 */
function deleteEntry() {
    if (confirm(`確定要刪除 ${props.editingDate} 的工作記錄嗎？`)) {
        delete monthData.value[props.editingDate];
        salaryStore.onEntryDeleted(props.editingDate);
        emit('entry-deleted');
    }
}
</script>

<template>
    <div class="inline-edit-form" @click.stop>
        <div class="inline-edit-row">
            <input v-model="editForm.start" type="time" class="inline-time-input"
                @input="emit('update:edit-form', editForm)">
            <span>~</span>
            <input v-model="editForm.end" type="time" class="inline-time-input"
                @input="emit('update:edit-form', editForm)">
        </div>
        <div class="inline-edit-actions">
            <button @click.stop="emit('save-edit')" class="inline-save-btn">✓</button>
            <button @click.stop="emit('cancel-edit')" class="inline-cancel-btn">✕</button>
            <button @click.stop="deleteEntry" class="inline-delete-btn">🗑️</button>
        </div>
    </div>
</template>

<style scoped>
.inline-edit-form {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    border-radius: 4px;
}

.inline-edit-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.inline-time-input {
    padding: 0.25rem;
    border: 1px solid #666666;
    border-radius: 3px;
    background: #333333;
    color: #eeeeee;
    font-size: 0.8rem;
}

.inline-edit-actions {
    display: flex;
    gap: 0.25rem;
}

.inline-save-btn,
.inline-cancel-btn,
.inline-delete-btn {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: bold;
}

.inline-save-btn {
    background: #28a745;
    color: white;
}

.inline-save-btn:hover {
    background: #218838;
}

.inline-cancel-btn {
    background: #6c757d;
    color: white;
}

.inline-cancel-btn:hover {
    background: #5a6268;
}

.inline-delete-btn {
    background: #dc3545;
    color: white;
}

.inline-delete-btn:hover {
    background: #c82333;
}
</style>