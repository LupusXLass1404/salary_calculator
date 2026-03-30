<template>
    <h2>{{ salaryStore.currentMonthFormatted }} 總計</h2>
    <div class="summary-grid">
        <div class="summary-item">
            <span class="label">總工時:</span>
            <span class="value">{{ isNaN(salaryStore.monthlyTotal.totalHours) ? '0.0' :
                salaryStore.monthlyTotal.totalHours.toFixed(1) }}
                小時</span>
        </div>
        <div class="summary-item">
            <span class="label">正常工資:</span>
            <span class="value">${{ isNaN(salaryStore.monthlyTotal.regularPay) ? '0' :
                salaryStore.monthlyTotal.regularPay.toLocaleString()
                }}</span>
        </div>
        <div class="summary-item">
            <span class="label">加班工資:</span>
            <span class="value">${{ isNaN(salaryStore.monthlyTotal.overtimePay) ? '0' :
                salaryStore.monthlyTotal.overtimePay.toLocaleString()
                }}</span>
        </div>
        <div class="summary-item">
            <span class="label">假日工資:</span>
            <span class="value">${{ isNaN(salaryStore.monthlyTotal.holidayPay) ? '0' :
                salaryStore.monthlyTotal.holidayPay.toLocaleString()
                }}</span>
        </div>
        <div class="summary-item total">
            <span class="label">總薪資:</span>
            <span class="value">${{ isNaN(salaryStore.monthlyTotal.totalPay) ? '0' :
                salaryStore.monthlyTotal.totalPay.toLocaleString()
                }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSalaryStore } from '@/store/salary'

const salaryStore = useSalaryStore()
</script>

<style>
.summary-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: #333333;
    border-radius: 4px;
}

.summary-item.total {
    background: #1e3a5f;
    font-weight: bold;
    border: 2px solid #0066cc;
    grid-column: 1 / -1;
}

.label {
    color: #aaaaaa;
    font-size: 0.9rem;
}

.value {
    font-weight: bold;
    color: #eeeeee;
    font-size: 1.2rem;
}
</style>