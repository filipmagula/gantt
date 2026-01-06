<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { addDays, format, startOfWeek, differenceInDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, AlertCircle, Calendar, Plus, Pencil } from 'lucide-vue-next'
import Modal from '../common/Modal.vue'
import TaskEditor from '../editors/TaskEditor.vue'
import EpicEditor from '../editors/EpicEditor.vue'

const store = useCapacityStore()

// Timeline Setup
const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))
const daysToShow = 21 // 3 weeks

const timelineDates = computed(() => {
  const dates = []
  for (let i = 0; i < daysToShow; i++) {
    dates.push(addDays(startDate.value, i))
  }
  return dates
})

// Editor State
const isTaskEditorOpen = ref(false)
const editingTaskId = ref('')
const parentEpicId = ref('') // For new task creation

const isEpicEditorOpen = ref(false)
const editingEpicId = ref('')

function openTaskEditor(taskId?: string, epicId?: string) {
    editingTaskId.value = taskId || ''
    parentEpicId.value = epicId || ''
    isTaskEditorOpen.value = true
}

function openEpicEditor(epicId?: string) {
    editingEpicId.value = epicId || ''
    isEpicEditorOpen.value = true
}

function closeEditors() {
    isTaskEditorOpen.value = false
    isEpicEditorOpen.value = false
    editingTaskId.value = ''
    parentEpicId.value = ''
    editingEpicId.value = ''
}

// Helpers
function getTaskGridStyle(task: any) {
  const start = parseISO(task.start)
  const end = parseISO(task.end)
  
  // Calculate relative days (0-based index)
  let startIdx = differenceInDays(start, startDate.value)
  let duration = differenceInDays(end, start) + 1
  
  // CSS Grid is 1-based
  let gridStart = startIdx + 1
  let gridEnd = gridStart + duration

  // Clamp values to the visible grid (lines 1 to 22) to avoid negative/implicit column issues
  // Line 1 is the start of the first column. Line 22 is the end of the 21st column.
  gridStart = Math.max(1, gridStart)
  gridEnd = Math.min(22, gridEnd)

  return {
    gridColumnStart: gridStart,
    gridColumnEnd: gridEnd
  }
}

function shouldRenderTask(task: any) {
    const start = parseISO(task.start)
    const end = parseISO(task.end)
    const viewStart = startDate.value
    const viewEnd = addDays(viewStart, daysToShow - 1)
    
    // Check overlap
    return start <= viewEnd && end >= viewStart
}

function getResourceName(id: string) {
  return store.resources.find(r => r.id === id)?.name.split(' ')[0] || id
}

function formatAssignments(assignments: any[]) {
  return assignments.map(a => `${getResourceName(a.resourceId)} (${a.effort}%)`).join(', ')
}

function nextWeek() { startDate.value = addDays(startDate.value, 7) }
function prevWeek() { startDate.value = addDays(startDate.value, -7) }
function scrollToToday() { startDate.value = startOfWeek(new Date(), { weekStartsOn: 1 }) }
</script>

<template>
  <div class="gantt-container glass-panel">
    <!-- Toolbar -->
    <div class="toolbar">
        <div class="toolbar-actions">
            <button class="btn-primary-sm" @click="openEpicEditor()">
                <Plus :size="16" /> Add Epic
            </button>
        </div>

      <div class="date-controls">
        <button class="control-btn" @click="prevWeek"><ChevronLeft :size="16" /></button>
        <button class="control-btn" @click="scrollToToday"><Calendar :size="16" /></button>
        <span class="current-range">
          {{ format(timelineDates[0], 'MMM d') }} - {{ format(timelineDates[timelineDates.length-1], 'MMM d, yyyy') }}
        </span>
        <button class="control-btn" @click="nextWeek"><ChevronRight :size="16" /></button>
      </div>
    </div>

    <!-- Scrollable Grid Container -->
    <div class="gantt-scroll-area">
      <!-- Header Row (Grid) -->
      <div class="timeline-header grid-row">
        <div 
          v-for="date in timelineDates" 
          :key="date.toString()"
          class="header-cell"
          :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
        >
          <div class="day-char">{{ format(date, 'EEEEE') }}</div>
          <div class="day-num">{{ format(date, 'd') }}</div>
        </div>
      </div>

      <!-- Epics & Tasks -->
      <div class="gantt-body">
        <template v-for="epic in store.epics" :key="epic.id">
            <!-- Epic Header Row -->
            <div class="epic-row">
                <div class="epic-info">
                  <div class="epic-label" :style="{ borderColor: epic.color }">{{ epic.title }}</div>
                  <button class="icon-btn-ghost" title="Edit Epic" @click="openEpicEditor(epic.id)">
                      <Pencil :size="12" />
                  </button>
                </div>
                <button class="icon-btn-sm" title="Add Task to Epic" @click="openTaskEditor(undefined, epic.id)">
                    <Plus :size="14" />
                </button>
            </div>

            <!-- Task Rows -->
            <div v-for="task in epic.tasks" :key="task.id" class="task-row">
                <!-- Grid Lines (Background) -->
                <div class="grid-lines grid-row">
                     <div 
                        v-for="date in timelineDates" 
                        :key="date.toString()"
                        class="grid-cell"
                        :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
                    ></div>
                </div>

                <!-- Task Bar (Overlaid Grid) -->
                 <div class="task-layer grid-row">
                    <div 
                        v-if="shouldRenderTask(task)"
                        class="task-bar"
                        :class="{ 'overloaded': store.isTaskOverloaded(task.id) }"
                        :style="{ ...getTaskGridStyle(task), backgroundColor: epic.color || '#6366f1' }"
                        :title="`${task.name}\n${formatAssignments(task.assignments)}`"
                        @click.stop="openTaskEditor(task.id)"
                    >
                        <div class="task-content">
                            <span class="task-name">{{ task.name }}</span>
                            <span class="task-assignments">{{ formatAssignments(task.assignments) }}</span>
                        </div>
                        <div v-if="store.isTaskOverloaded(task.id)" class="error-indicator">
                            <AlertCircle :size="14" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
      </div>
    </div>

    <!-- Modals -->
    <Modal :isOpen="isTaskEditorOpen" :title="editingTaskId ? 'Edit Task' : 'Add Task'" @close="closeEditors">
        <TaskEditor 
            v-if="isTaskEditorOpen" 
            :taskId="editingTaskId"
            :epicId="parentEpicId"
            :isOpen="isTaskEditorOpen" 
            @save="closeEditors" 
            @close="closeEditors"
        />
    </Modal>
    
    <Modal :isOpen="isEpicEditorOpen" title="New Epic" @close="closeEditors">
        <EpicEditor
            v-if="isEpicEditorOpen"
            :epicId="editingEpicId"
            :isOpen="isEpicEditorOpen"
            @save="closeEditors"
            @close="closeEditors"
        />
    </Modal>
  </div>
</template>

<style scoped>
/* Reuse existing styles + new ones */
.gantt-container { display: flex; flex-direction: column; height: 100%; padding: 1rem; overflow: hidden; }
.toolbar { margin-bottom: 1rem; display: flex; justify-content: space-between; }
.toolbar-actions { display: flex; align-items: center; gap: 1rem; }

.date-controls { display: flex; align-items: center; gap: 1rem; background: rgba(0,0,0,0.2); padding: 0 8px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); width: fit-content; height: 32px; box-sizing: border-box; }
.control-btn { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; }
.control-btn:hover { color: var(--color-text-main); }
.current-range { font-weight: 600; font-size: 0.9rem; min-width: 140px; text-align: center; line-height: 1; }

/* Grid System */
/* One column for each day (21 columns) */
.grid-row {
    display: grid;
    grid-template-columns: repeat(21, 1fr);
    width: 100%;
}

.gantt-scroll-area { 
    flex: 1; 
    overflow-y: auto; 
    overflow-x: hidden; /* Hide horizontal scrollbar */
    border: 1px solid var(--border-color); 
    border-radius: var(--radius-md); 
    background: rgba(0,0,0,0.1); 
    position: relative; 
}

.timeline-header { 
    position: sticky; top: 0; z-index: 20; 
    background: var(--color-bg-surface); 
    border-bottom: 1px solid var(--border-color); 
}

.header-cell { 
    height: 48px; 
    border-right: 1px solid var(--border-color); 
    display: flex; flex-direction: column; align-items: center; justify-content: center; 
}
.day-char { font-size: 0.7rem; color: var(--color-text-muted); }
.day-num { font-weight: 600; font-size: 0.9rem; }

.gantt-body { position: relative; }

.epic-row { 
    position: sticky; left: 0; 
    background: rgba(30, 41, 59, 0.95); 
    padding: 0.5rem 1rem; 
    border-bottom: 1px solid var(--border-color); 
    z-index: 10; 
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.epic-label { font-weight: 700; padding-left: 0.5rem; border-left: 3px solid; }

.task-row { position: relative; height: 40px; border-bottom: 1px solid rgba(255,255,255,0.02); }

.grid-lines { 
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
    z-index: 0;
}
.grid-cell { 
    height: 100%; 
    border-right: 1px solid rgba(255,255,255,0.03); 
}
.weekend { background: rgba(0,0,0,0.2); }

/* Task Layer */
.task-layer {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1;
    pointer-events: none; /* Let clicks pass through empty spaces if needed, but bars have events */
    padding: 6px 0; /* Vertical padding matching task-bar top/bottom logic */
}

.task-bar { 
    border-radius: 4px; 
    padding: 0 8px; 
    display: flex; align-items: center; justify-content: space-between; 
    color: white; font-size: 0.75rem; 
    white-space: nowrap; overflow: hidden; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    transition: all 0.2s; 
    cursor: pointer; 
    z-index: 5; 
    pointer-events: auto; /* Re-enable pointer events */
    height: 100%; /* Fill the padded row */
    min-width: 2px; /* Ensure visible even if tiny */
}
.task-bar:hover { filter: brightness(1.1); z-index: 15; min-width: fit-content; }
.task-content { display: flex; gap: 8px; overflow: hidden; text-overflow: ellipsis; }
.task-name { font-weight: 600; }
.task-assignments { opacity: 0.8; font-size: 0.7rem; }
.task-bar.overloaded { box-shadow: 0 0 10px 3px rgba(239, 68, 68, 0.7); border: 1px solid #ef4444; }
.error-indicator { color: #fff; background: #ef4444; border-radius: 50%; padding: 2px; display: flex; }

.btn-primary-sm {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-primary-sm:hover { background: var(--color-primary-hover); }

.icon-btn-sm {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--color-text-muted);
    width: 24px; height: 24px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}
.icon-btn-sm:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.epic-info { display: flex; align-items: center; gap: 0.5rem; }

.icon-btn-ghost {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0; 
    transition: all 0.2s;
}
.epic-row:hover .icon-btn-ghost { opacity: 1; }
.icon-btn-ghost:hover { color: var(--color-primary); background: rgba(255,255,255,0.05); }
</style>
