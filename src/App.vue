<script setup lang="ts">
import { useUiStore } from '@/store/ui';
import AppHeader from '@/components/AppHeader.vue';
import Calendar from '@/components/Calendar.vue';
import WorkEntryForm from '@/components/WorkEntryForm.vue';
import BatchWorkEntryForm from '@/components/BatchWorkEntryForm.vue';
import Summary from '@/components/Summary.vue';

const uiStore = useUiStore();
</script>

<template>
  <div id="app">
    <AppHeader />

    <main class="app-main">
      <div class="calendar-section">
        <Calendar />
      </div>
      <div class="summary-section">
        <Summary />
      </div>
    </main>

    <BatchWorkEntryForm />

    <WorkEntryForm v-if="uiStore.showForm" />
  </div>
</template>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #000000;
  color: #eeeeee;
  display: flex;
  flex-direction: column;
}

.app-main {
  width: 100%;
  display: flex;
  gap: 2rem;
}

.calendar-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  flex: 1;
}

.summary-section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.summary-section h2 {
  margin-top: 0;
  color: #eeeeee;
  border-bottom: 1px solid #555;
  padding-bottom: 0.5rem;
}

@media (max-width: 1200px) {
  .summary-section {
    margin-top: 1rem;
  }
}

@media (max-width: 768px) {
  .summary-section {
    padding: 0.75rem;
  }
}

@media (max-width: 1200px) {
  #app {
    padding: 0.75rem;
  }

  .app-main {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  #app {
    padding: 0.5rem;
  }

  .calendar-section {
    padding: 0.75rem;
  }
}
</style>
