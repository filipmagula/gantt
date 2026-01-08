<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { addDays, format, startOfWeek } from 'date-fns'
import HeatmapCell from './HeatmapCell.vue'
import { ChevronLeft, ChevronRight, User, Plus, Edit, Calendar } from 'lucide-vue-next'
import Modal from '../common/Modal.vue'
import ResourceEditor from '../editors/ResourceEditor.vue'

const store = useCapacityStore()

// Timeline State
const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 })) // Start from current week (Monday)
const daysToShow = 21 // 3 weeks view by default

const timelineDates = computed(() => {
  const dates = []
  for (let i = 0; i < daysToShow; i++) {
    dates.push(addDays(startDate.value, i))
  }
  return dates
})

// Editor State
const isEditorOpen = ref(false)
const editingResourceId = ref('')

function openAddResource() {
    editingResourceId.value = ''
    isEditorOpen.value = true
}

function openEditResource(id: string) {
    editingResourceId.value = id
    isEditorOpen.value = true
}

function closeEditor() {
    isEditorOpen.value = false
    editingResourceId.value = ''
}

// Navigation
function nextWeek() {
  startDate.value = addDays(startDate.value, 7)
}
function prevWeek() {
  startDate.value = addDays(startDate.value, -7)
}
function scrollToToday() {
  startDate.value = startOfWeek(new Date(), { weekStartsOn: 1 })
}

</script>

<template>
  <div class="heatmap-container glass-panel">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-actions">
        <!-- New Button: Add Resource -->
        <button class="btn-primary btn-sm" @click="openAddResource">
            <Plus :size="16" /> Add Resource
        </button>
      </div>

      <div class="date-controls">
        <button class="control-btn" @click="prevWeek">
          <ChevronLeft :size="16" />
        </button>
        <button class="control-btn" @click="scrollToToday" title="Jump to Today">
          <Calendar :size="16" />
        </button>
        <span class="current-range">
          {{ format(timelineDates[0], 'MMM d') }} - {{ format(timelineDates[timelineDates.length-1], 'MMM d, yyyy') }}
        </span>
        <button class="control-btn" @click="nextWeek">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- The Grid -->
    <div class="grid-wrapper">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th class="resource-header-cell sticky-col">Resource</th>
            <th 
              v-for="date in timelineDates" 
              :key="date.toString()"
              class="sticky-header"
            >
              <div class="chart-header-cell" :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }">
                  <div class="day-name">{{ format(date, 'EEE') }}</div>
                  <div class="day-num">{{ format(date, 'd') }}</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resource in store.resources" :key="resource.id">
            <!-- Resource Row Header - Clickable -->
            <td class="resource-cell sticky-col" @click="openEditResource(resource.id)">
              <div class="resource-info">
                <div class="avatar-placeholder" :style="{ background: resource.color || 'linear-gradient(135deg, var(--color-primary), #818cf8)' }">
                  <User :size="16" />
                </div>
                <div class="resource-details">
                  <span class="resource-name">{{ resource.name }}</span>
                  <span class="capacity-badge">{{ resource.capacity }}% Cap</span>
                </div>
                <div class="edit-hint">
                    <Edit :size="14" />
                </div>
              </div>
            </td>

            <!-- Daily Cells -->
            <td 
              v-for="date in timelineDates" 
              :key="date.toString()"
              class="day-cell-wrapper"
              :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
            >
              <HeatmapCell
                :date="date"
                :load="store.getResourceLoad(resource.id, date)"
                :status="store.getLoadStatus(store.getResourceLoad(resource.id, date), resource.capacity)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <Modal :isOpen="isEditorOpen" :title="editingResourceId ? 'Edit Resource' : 'Add Resource'" @close="closeEditor">
        <ResourceEditor 
            v-if="isEditorOpen" 
            :resourceId="editingResourceId" 
            :isOpen="isEditorOpen" 
            @save="closeEditor" 
            @close="closeEditor"
        />
    </Modal>
  </div>
</template>

<style scoped>
.heatmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 1rem;
}

.toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
}

.toolbar-actions {
    display: flex;
    align-items: center;
}



.grid-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: rgba(0,0,0,0.1);
}

.heatmap-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  table-layout: fixed; /* Enforce equal or specified widths */
}

th, td {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

/* Headers */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 0;
  background: var(--color-bg-surface); /* Keep opaque background for sticky */
}

/* Local styles date-header-cell removed in favor of global .chart-header-cell */

/* Resource Column (Sticky Left) */
.sticky-col {
  position: sticky;
  left: 0;
  background: var(--color-bg-surface);
  z-index: 10;
  border-right: 2px solid var(--border-color);
  box-shadow: 2px 0 5px rgba(0,0,0,0.2);
  width: 260px; /* Fixed width for resource column */
  min-width: 260px;
}

.resource-header-cell {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  z-index: 20;
}

.resource-cell {
  background: var(--color-bg-surface);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}
.resource-cell:hover {
    background: rgba(30, 41, 59, 0.8); /* Slightly lighter on hover */
}

.resource-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.resource-details {
  display: flex;
  flex-direction: column;
}

.resource-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.capacity-badge {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  background: rgba(255,255,255,0.05);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  width: fit-content;
  margin-top: 2px;
}

.edit-hint {
    margin-left: auto;
    color: var(--color-text-muted);
    opacity: 0;
    transition: opacity 0.2s;
}
.resource-cell:hover .edit-hint {
    opacity: 1;
}
</style>
