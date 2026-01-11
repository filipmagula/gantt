<script setup lang="ts">
import { useDateStore } from '../../stores/date'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'

const store = useDateStore()
</script>

<template>
  <div class="date-controls">
    <div class="week-selector">
        <select :value="store.weeksToShow" @change="e => store.setWeeks(Number((e.target as HTMLSelectElement).value))">
            <option :value="2">2 Weeks</option>
            <option :value="3">3 Weeks</option>
            <option :value="4">4 Weeks</option>
            <option :value="5">5 Weeks</option>
        </select>
    </div>
    <div class="divider"></div>
    <button class="control-btn" @click="store.prevWeek">
      <ChevronLeft :size="18" />
    </button>
    <button class="control-btn" @click="store.scrollToToday" title="Jump to Today">
      <Calendar :size="18" />
    </button>
    <span class="current-range">
      {{ format(store.timelineDates[0], 'MMM d') }} - {{ format(store.timelineDates[store.timelineDates.length-1], 'MMM d, yyyy') }}
    </span>
    <button class="control-btn" @click="store.nextWeek">
      <ChevronRight :size="18" />
    </button>
  </div>
</template>

<style scoped>
.date-controls {
  height: 44px;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-md);
  padding: 0px; /* Reduced padding */
  border: 1px solid rgba(255,255,255,0.05);
  gap: 2px;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  width: 32px; /* Condensed width */
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255,255,255,0.1);
  color: var(--color-text-main);
}

.current-range {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-main);
  padding: 0 0rem;
  min-width: 150px;
  text-align: center;
}

.divider {
    width: 1px;
    height: 20px; /* Scaled up */
    background: rgba(255,255,255,0.1);
    margin: 0px;
}

.week-selector select {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    padding: 0 10px;
    cursor: pointer;
    outline: none;
    font-family: inherit;
    appearance: none;
    -webkit-appearance: none; /* Attempt to style nicely if possible, or build custom select later */
    height: 100%;
    display: flex;
    align-items: center;
    min-width: 80px;
}

.week-selector select:hover {
    color: var(--color-text-main);
}
.week-selector {
    position: relative;
    padding: 0 0.25rem; /* Reduced padding */
    height: 36px; /* Match button height */
    display: flex;
    align-items: center;
}
</style>
