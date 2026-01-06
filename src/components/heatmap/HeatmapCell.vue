<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

interface Props {
  load: number
  status: 'green' | 'yellow' | 'red'
  date: Date
}

const props = defineProps<Props>()

const formattedDate = computed(() => format(props.date, 'MMM d, yyyy'))

const cellClasses = computed(() => {
  return {
    'cell-green': props.status === 'green',
    'cell-yellow': props.status === 'yellow',
    'cell-red': props.status === 'red',
    'cell-empty': props.load === 0
  }
})
</script>

<template>
  <div class="heatmap-cell" :class="cellClasses" :title="`${load}% effort on ${formattedDate}`">
    <span v-if="load > 0" class="cell-content">{{ load }}%</span>
    <span v-else class="cell-content empty">-</span>
  </div>
</template>

<style scoped>
.heatmap-cell {
  height: 48px; /* Fixed height for consistency */
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: default;
  position: relative;
}

.heatmap-cell:hover {
  z-index: 10;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border-radius: 4px; /* Pop out effect */
}

/* Status Colors */
.cell-green {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}
.cell-green:hover {
  background-color: rgba(16, 185, 129, 0.2);
}

.cell-yellow {
  background-color: rgba(245, 158, 11, 0.15); /* Warning */
  color: var(--color-warning);
}
.cell-yellow:hover {
  background-color: rgba(245, 158, 11, 0.25);
}

.cell-red {
  background-color: rgba(239, 68, 68, 0.2); /* Danger */
  color: var(--color-danger);
  animation: pulse-red 2s infinite;
}
.cell-red:hover {
  background-color: rgba(239, 68, 68, 0.3);
}

.cell-empty {
  color: var(--color-text-muted);
  opacity: 0.3;
}

@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>
