<script setup lang="ts">
interface Props {
    currentMonthFormatted: string;
}

interface Emits {
    (e: 'previous-month'): void;
    (e: 'next-month'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
    <div class="calendar-header">
        <button @click="emit('previous-month')" class="nav-button">&lt;</button>
        <h2>{{ currentMonthFormatted }}</h2>
        <button @click="emit('next-month')" class="nav-button">&gt;</button>
    </div>
</template>

<style scoped>
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
</style>