<script setup lang="ts">
import { ref } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { useDateStore } from '../../stores/date'
import { format } from 'date-fns'
import HeatmapCell from './HeatmapCell.vue'
import { User, Plus, Edit, GripVertical, Upload } from 'lucide-vue-next'
import Modal from '../common/Modal.vue'
import ResourceEditor from '../editors/ResourceEditor.vue'

const store = useCapacityStore()
const dateStore = useDateStore()

const emit = defineEmits<{
  (e: 'import'): void
}>()

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

// Drag and Drop
const draggedResourceIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, index: number) {
    if (event.dataTransfer) {
        draggedResourceIndex.value = index
        event.dataTransfer.effectAllowed = 'move'
        // Set a transparent image or custom drag image if needed, but default is usually okay for rows
        // generic row styling might look weird, so let's stick to default for now
    }
}

function onDragOver(event: DragEvent) {
   event.preventDefault() // Necessary to allow dropping
   if (event.dataTransfer) {
       event.dataTransfer.dropEffect = 'move'
   }
}

function onDrop(_event: DragEvent, targetIndex: number) {
    if (draggedResourceIndex.value !== null && draggedResourceIndex.value !== targetIndex) {
        store.reorderResources(draggedResourceIndex.value, targetIndex)
    }
    draggedResourceIndex.value = null
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


    </div>

    <!-- The Grid -->
    <div class="grid-wrapper">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th class="resource-header-cell sticky-col">Resource</th>
            <th 
              v-for="date in dateStore.timelineDates" 
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
           <tr v-if="store.resources.length === 0">
             <td :colspan="1 + dateStore.timelineDates.length" class="empty-row">
                <div class="empty-state">
                    <p>Add new resource or import existing project</p>
                    <div class="empty-actions">
                        <button class="btn-primary" @click="openAddResource">
                            <Plus :size="16" /> Add Resource
                        </button>
                        <button class="btn-secondary" @click="emit('import')">
                            <Upload :size="16" /> Import Project
                        </button>
                    </div>
                </div>
             </td>
           </tr>
          
          <tr 
            v-else
            v-for="(resource, index) in store.resources" 
            :key="resource.id"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
            class="resource-row"
            :class="{ 'dragging': draggedResourceIndex === index }"
          >
            <!-- Resource Row Header - Clickable -->
            <td class="resource-cell sticky-col" @click="openEditResource(resource.id)">
              <div class="resource-info">
                <div class="drag-handle" @click.stop>
                    <GripVertical :size="16" />
                </div>
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
              v-for="date in dateStore.timelineDates" 
              :key="date.toString()"
              class="day-cell-wrapper"
              :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
            >
              <HeatmapCell
                v-if="store.getResourceLoad(resource.id, date) > 0"
                :date="date"
                :load="store.getResourceLoad(resource.id, date)"
                :status="store.getLoadStatus(store.getResourceLoad(resource.id, date), resource.capacity)"
              />
              <div v-else class="empty-cell"></div>
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

.empty-cell {
  height: 48px;
  border-right: 1px solid rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.drag-handle {
    cursor: grab;
    color: var(--color-text-muted);
    opacity: 0.5;
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
}
.drag-handle:hover {
    opacity: 1;
}

.resource-row.dragging {
    opacity: 0.5;
    background: rgba(255, 255, 255, 0.05);
}

.empty-row {
   height: 200px; /* Minimum height for empty state */
   vertical-align: middle;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 1rem;
  gap: 1rem;
}
.empty-state p {
  opacity: 0.7;
}
.empty-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}
</style>
