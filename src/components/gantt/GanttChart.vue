```
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { useDateStore } from '../../stores/date'
import { addDays, format, differenceInDays, parseISO } from 'date-fns'
import { AlertCircle, Plus, Pencil, GripVertical, Upload } from 'lucide-vue-next'
import Modal from '../common/Modal.vue'
import TaskEditor from '../editors/TaskEditor.vue'

const emit = defineEmits<{
  (e: 'import'): void
}>()
import EpicEditor from '../editors/EpicEditor.vue'
import MilestoneEditor from '../editors/MilestoneEditor.vue'
import { Flag } from 'lucide-vue-next'

const store = useCapacityStore()
const dateStore = useDateStore()

// Editor State
const isTaskEditorOpen = ref(false)
const editingTaskId = ref('')
const parentEpicId = ref('') // For new task creation

const isEpicEditorOpen = ref(false)
const editingEpicId = ref('')

const isMilestoneEditorOpen = ref(false)
const editingMilestoneId = ref('')



// Drag and Drop
const draggedEpicIndex = ref<number | null>(null)

function onEpicDragStart(event: DragEvent, index: number) {
    if (event.dataTransfer) {
        draggedEpicIndex.value = index
        event.dataTransfer.effectAllowed = 'move'
    }
}

function onEpicDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
    }
}

function onEpicDrop(_event: DragEvent, targetIndex: number) {
    if (draggedEpicIndex.value !== null && draggedEpicIndex.value !== targetIndex) {
        store.reorderEpics(draggedEpicIndex.value, targetIndex)
    }
    draggedEpicIndex.value = null
}

function openTaskEditor(taskId?: string, epicId?: string) {
    editingTaskId.value = taskId || ''
    parentEpicId.value = epicId || ''
    isTaskEditorOpen.value = true
}

function openEpicEditor(epicId?: string) {
    editingEpicId.value = epicId || ''
    isEpicEditorOpen.value = true
}

function openMilestoneEditor(milestoneId?: string) {
    editingMilestoneId.value = milestoneId || ''
    isMilestoneEditorOpen.value = true
}

function closeEditors() {
    isTaskEditorOpen.value = false
    isEpicEditorOpen.value = false
    editingTaskId.value = ''
    parentEpicId.value = ''
    editingEpicId.value = ''
    isMilestoneEditorOpen.value = false
    editingMilestoneId.value = ''
}

// Helpers
function getTaskGridStyle(task: any) {
  const start = parseISO(task.start)
  const end = parseISO(task.end)
  
  // Calculate relative days (0-based index)
  let startIdx = differenceInDays(start, dateStore.startDate)
  let duration = differenceInDays(end, start) + 1
  
  // CSS Grid is 1-based
  let gridStart = startIdx + 1
  let gridEnd = gridStart + duration

  // Clamp values to the visible grid
  gridStart = Math.max(1, gridStart)
  gridEnd = Math.min(dateStore.daysToShow + 1, gridEnd)

  return {
    gridColumnStart: gridStart,
    gridColumnEnd: gridEnd
  }
}



function shouldRenderTask(task: any) {
    const start = parseISO(task.start)
    const end = parseISO(task.end)
    const viewStart = dateStore.startDate
    const viewEnd = addDays(viewStart, dateStore.daysToShow - 1)
    
    // Check overlap
    return start <= viewEnd && end >= viewStart
}

function shouldRenderMilestone(milestone: any) {
    const date = parseISO(milestone.date)
    const diff = differenceInDays(date, dateStore.startDate)
    return diff >= 0 && diff < dateStore.daysToShow
}

function getResourceName(id: string) {
  return store.resources.find(r => r.id === id)?.name.split(' ')[0] || id
}

function getEpicDependencies(epic: any) {
    interface PathData { id: string; d: string; color: string }
    const paths: PathData[] = []
    // Helper to get X position (Grid Units 0-21) for a date
    const getX = (dateStr: string, isEnd: boolean = false) => {
        const date = parseISO(dateStr)
        const diff = differenceInDays(date, dateStore.startDate)
        // If isEnd, we want the end of that day, so +1 day worth of width
        const offset = isEnd ? 1 : 0
        return (diff + offset) // Return grid units, not percentage (ViewBox handles scaling)
    }

    // Map Tasks to their index (row number) for Y calculation
    // const visibleTasks = epic.tasks 
    const taskRowHeight = 48 // px (Matched to ResourceHeatmap)
    const rowCenter = 24 // px

    // Get layout for Y positioning
    const { taskRowIndex } = getEpicLayout(epic)

    epic.tasks.forEach((task: any) => {
        if (!task.dependencies || task.dependencies.length === 0) return

        task.dependencies.forEach((depId: string) => {
            const depTask = epic.tasks.find((t: any) => t.id === depId)
            
            if (depTask) {
                // Coordinates
                const x1 = getX(depTask.end, true) // Source Right
                const x2 = getX(task.start, false) // Target Left
                

                // Y coordinates based on packed row index
                const y1 = (taskRowIndex.get(depTask.id) ?? 0) * taskRowHeight + rowCenter
                const y2 = (taskRowIndex.get(task.id) ?? 0) * taskRowHeight + rowCenter

                // Path Logic (Sigmoid/Curved)
                // Use absolute coordinates if we can, but SVG is styled width:100% height:100%.
                // We use percentages for X and Pixels for Y? 
                // SVG `viewBox` is complicated if mixing.
                // EASIEST: SVG uses same coordinate system as HTML container?
                // No, SVG inside absolute div 100% width.
                // We can use vector-effect="non-scaling-stroke"?
                // Let's use % for X in 'd' attribute? standard SVG doesn't support % in path data easily without viewbox magic.
                // BETTER: Just use unitless coordinates in ViewBox 0 0 100 (height px).
                // BUT height is dynamic based on task count.
                // Solution: Inline style for SVG width/height. width=100%, height = tasks.length * 40.
                // VIEWBOX = "0 0 2100 (tasks.length * 40)". 
                // Then X ranges 0-2100 (if we map 1 day = 100 units). 
                
                // SIMPLER: Just use `vector-effect` or simply calculating distinct paths? 
                // Let's try CSS variables or calc?? No.
                
                // Let's assume standard ViewBox 0 0 100 100 isn't appropriate.
                // Let's use X as "Grid Units" (0 to 21). Y as Pixels.
                // ViewBox="0 0 21 [HeightPx]". preserveAspectRatio="none".
                // Then X1 = diff + 1. X2 = diff.
                
                // PATH: M x1 y1 C (x1+0.5) y1, (x2-0.5) y2, x2 y2
                const cpOffset = 0.8 // 0.5 grid column curvature
                
                paths.push({
                    id: `${depId}-${task.id}`,
                    d: `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`,
                    color: '#64748b' // Slate 500
                })
            }
        })
    })
    return paths
}

function formatAssignments(assignments: any[]) {
  return assignments.map(a => `${getResourceName(a.resourceId)} (${a.effort}%)`).join(', ')
}

function getEpicLayout(epic: any) {
    // Clone and sort to not mutate original if it was reactive in a way that matters
    const tasks = [...epic.tasks].sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    const lanes: any[][] = []
    const taskRowIndex = new Map<string, number>()

    tasks.forEach((task: any) => {
        let placed = false
        
        // Try to fit in existing lane
        for (let i = 0; i < lanes.length; i++) {
            const lane = lanes[i]!
            const lastTask = lane[lane.length - 1]
            
            // Gap Check: End of last < Start of current - 1 day
            const lastEnd = parseISO(lastTask.end)
            const currentStart = parseISO(task.start)
            
            const diff = differenceInDays(currentStart, lastEnd)
            
            if (diff > 1) { 
                lane.push(task)
                taskRowIndex.set(task.id, i)
                placed = true
                break
            }
        }
        
        if (!placed) {
            lanes.push([task])
            taskRowIndex.set(task.id, lanes.length - 1)
        }
    })
    
    return { lanes, taskRowIndex }
}

function handleWheel(event: WheelEvent) {
    // Check for horizontal scroll intent: Shift+Wheel OR Horizontal Delta
    if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault()
        
        const delta = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX
        
        if (Math.abs(delta) > 10) {
            const days = delta > 0 ? 1 : -1
            dateStore.shiftDays(days)
        }
    }
}

// Task Duplication
const hoveredTaskId = ref<string | null>(null)

function onKeyDown(e: KeyboardEvent) {
    // Ctrl+D or Cmd+D
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (hoveredTaskId.value) {
            e.preventDefault()
            store.duplicateTask(hoveredTaskId.value)
        }
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="gantt-container glass-panel">
    <!-- Toolbar -->
    <div class="toolbar">
        <div class="toolbar-actions">
            <button class="btn-primary btn-sm" @click="openEpicEditor()">
                <Plus :size="16" /> Add Epic
            </button>
            <button class="btn-secondary btn-sm" @click="openMilestoneEditor()">
                <Flag :size="16" /> Add Milestone
            </button>
        </div>


    </div>

    <!-- Scrollable Grid Container -->
    <div class="gantt-scroll-area" @wheel="handleWheel">
      <!-- Header Row (Grid) -->
      <div 
        class="timeline-header grid-row"
        :style="{ gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)` }"
      >
        <div 
          v-for="date in dateStore.timelineDates" 
          :key="date.toString()"
          class="chart-header-cell"
          :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
        >
          <div class="day-name">{{ format(date, 'EEE') }}</div>
          <div class="day-num">{{ format(date, 'd') }}</div>
        </div>

        <!-- Global Milestones Label Overlay (Only for milestones with NO epicId) -->
        <!-- We reuse the grid system to place labels. -->
        <div 
            class="milestone-labels-layer grid-row" 
            :style="{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none',
                gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)` 
            }"
        >
             <div 
                v-for="milestone in store.milestones.filter(m => !m.epicId && shouldRenderMilestone(m))" 
                :key="milestone.id"
                class="milestone-label-container"
                :style="{ 
                    gridColumnStart: differenceInDays(parseISO(milestone.date), dateStore.startDate) + 2,
                    gridColumnEnd: 'span 1' 
                }"
             >
                <div class="milestone-label global" 
                     :style="{ backgroundColor: milestone.color }"
                     @click.stop="openMilestoneEditor(milestone.id)"
                     style="pointer-events: auto; cursor: pointer;"
                >
                    <Flag :size="10" fill="currentColor" />
                    <span>{{ milestone.title }}</span>
                </div>
             </div>
        </div>
      </div>

            <!-- Epics & Tasks -->
            <div class="gantt-body">
                <div v-if="store.epics.length === 0" class="empty-state">
                    <p>Add new epic or import existing project</p>
                    <div class="empty-actions">
                        <button class="btn-primary" @click="openEpicEditor()">
                            <Plus :size="16" /> Add Epic
                        </button>
                        <button class="btn-secondary" @click="emit('import')">
                            <Upload :size="16" /> Import Project
                        </button>
                    </div>
                </div>
                
                <template v-else>
                    <!-- Milestones Overlay -->
                    <div 
                        class="milestone-overlay grid-row"
                        :style="{ gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)` }"
                    >
                        <!-- Global Lines (All Milestones get a line) -->
                        <div 
                            v-for="milestone in store.milestones" 
                            :key="milestone.id"
                            class="milestone-line"
                            v-show="shouldRenderMilestone(milestone)"
                            :style="{ 
                                gridColumnStart: differenceInDays(parseISO(milestone.date), dateStore.startDate) + 2, 
                                gridColumnEnd: 'span 1',
                                gridRow: '1 / -1', /* Force full height span */
                                borderColor: milestone.color
                            }"
                            :title="`${milestone.title} (${milestone.date})`"
                            @click="openMilestoneEditor(milestone.id)"
                        >
                            <!-- No Label Here anymore, labels are in headers -->
                        </div>
                    </div>

                    <template v-for="(epic, index) in store.epics" :key="epic.id">
                        <div 
                            class="epic-container"
                            draggable="true"
                            @dragstart="onEpicDragStart($event, index)"
                            @dragover="onEpicDragOver"
                            @drop="onEpicDrop($event, index)"
                            :class="{ 'dragging': draggedEpicIndex === index }"
                        >
                        <!-- Epic Header Row -->
                        <div class="epic-row">
                            <div class="epic-info">
                            <div class="drag-handle" @click.stop title="Drag to reorder">
                                <GripVertical :size="16" />
                            </div>
                            <div class="epic-label" :style="{ borderColor: epic.color }">{{ epic.title }}</div>
                            <button class="icon-btn-ghost" title="Edit Epic" @click="openEpicEditor(epic.id)">
                                <Pencil :size="12" />
                            </button>
                            <button class="icon-btn-ghost" title="Add Task to Epic" @click="openTaskEditor(undefined, epic.id)">
                                <Plus :size="14" />
                            </button>
                            </div>

                            <!-- Epic-Specific Milestones (Using Grid for Perfect Alignment) -->
                            <div 
                                class="epic-milestones-grid"
                                :style="{ 
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)`,
                                    width: '100%',
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    height: '100%',
                                    pointerEvents: 'none',
                                    zIndex: 20
                                }"
                            >
                                <div 
                                    v-for="milestone in store.milestones.filter(m => m.epicId === epic.id && shouldRenderMilestone(m))" 
                                    :key="milestone.id"
                                    class="epic-milestone-item"
                                    :style="{
                                        gridColumnStart: differenceInDays(parseISO(milestone.date), dateStore.startDate) + 2,
                                        gridColumnEnd: 'span 1',
                                        gridRow: '1 / -1'
                                    }"
                                >

                                    <!-- Label (Centered on line) -->
                                    <div 
                                        class="epic-milestone-label"
                                        :style="{ backgroundColor: milestone.color }"
                                        @click="openMilestoneEditor(milestone.id)"
                                        title="Edit Milestone"
                                    >
                                        <Flag :size="10" fill="currentColor" />
                                        <span>{{ milestone.title }}</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                        
                        <!-- Epic-Specific Milestones Layer -->

                        <!-- Task Rows Container (Relative for SVG Layer) -->
                        <div class="epic-tasks-body" style="position: relative;">
                            
                            <!-- Dependency Arrows Layer -->
                            <svg class="dependency-layer" 
                                :viewBox="`0 0 ${dateStore.daysToShow} ${getEpicLayout(epic).lanes.length * 48}`" 
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                        <polygon points="0 0, 6 2, 0 4" fill="#64748b" />
                                    </marker>
                                </defs>
                                <path 
                                    v-for="path in getEpicDependencies(epic)"
                                    :key="path.id"
                                    :d="path.d"
                                    stroke="#64748b"
                                    stroke-width="2px"
                                    fill="none"
                                    marker-end="url(#arrowhead)"
                                    vector-effect="non-scaling-stroke" 
                                    opacity="0.6"
                                />
                            </svg>

                            <div v-for="(lane, laneIdx) in getEpicLayout(epic).lanes" :key="laneIdx" class="task-row">
                                <!-- Grid Lines (Background) -->
                                <div 
                                    class="grid-lines grid-row"
                                    :style="{ gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)` }"
                                >
                                    <div 
                                        v-for="date in dateStore.timelineDates" 
                                        :key="date.toString()"
                                        class="grid-cell"
                                        :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
                                    ></div>
                                </div>

                                <!-- Task Bar (Overlaid Grid) -->
                                <div 
                                    class="task-layer grid-row"
                                    :style="{ gridTemplateColumns: `repeat(${dateStore.daysToShow}, 1fr)` }"
                                >
                                    <template v-for="task in lane" :key="task.id">
                                        <div
                                            v-if="shouldRenderTask(task)"
                                            class="task-bar"
                                            :class="{ 'overloaded': store.isTaskOverloaded(task.id) }"
                                            :style="{
                                                ...getTaskGridStyle(task),
                                                '--task-color': task.epicId
                                                    ? store.epics.find(e => e.id === task.epicId)?.color
                                                    : '#6366f1'
                                            }"
                                            :title="`${task.name}\n${formatAssignments(task.assignments)}`"
                                            @click.stop="openTaskEditor(task.id)"
                                            @mouseenter="hoveredTaskId = task.id"
                                            @mouseleave="hoveredTaskId = null"
                                        >
                                            <div class="task-content">
                                                <span class="task-name">{{ task.name }}</span>
                                                <span class="task-assignments">{{ formatAssignments(task.assignments) }}</span>
                                            </div>
                                            <div v-if="store.isTaskOverloaded(task.id)" class="error-indicator">
                                                <AlertCircle :size="14" />
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                        <!-- End Epic Tasks Body -->
                        </div>
                    </template>
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

    <Modal :isOpen="isMilestoneEditorOpen" :title="editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'" @close="closeEditors">
        <MilestoneEditor
            v-if="isMilestoneEditorOpen"
            :milestoneId="editingMilestoneId"
            :isOpen="isMilestoneEditorOpen"
            @save="closeEditors"
            @close="closeEditors"
        />
    </Modal>
  </div>
</template>

<style scoped>
/* Reuse existing styles + new ones */
.gantt-container { display: flex; flex-direction: column; height: 100%; padding: 1rem; overflow: hidden; }

/* Grid System */

/* Grid System */
/* Dynamic columns via inline style */
.grid-row {
    display: grid;
    /* grid-template-columns set via style binding */
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
    /* Removed flex to rely on flow layout + min-height */
}

.timeline-header { 
    position: sticky; top: 0; z-index: 20; 
    background: var(--color-bg-surface); 
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0; /* Keep header size */
}

/* ... existing styles ... */

.chart-header-cell {
    padding: 0.5rem;
    text-align: center;
    border-right: 1px solid var(--border-color);
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.gantt-body { 
    position: relative; 
    /* Header is ~49px (48px + border). Body should take at least the remaining height. */
    min-height: calc(100% - 49px); 
}

.epic-row { 
    position: relative; /* Parent for absolute grid */
    /* Removed sticky left:0 so milestones scroll with content */
    background: rgba(30, 41, 59, 0.95); 
    padding: 0.5rem 1rem; 
    border-bottom: 1px solid var(--border-color);
    /* z-index: 10;  Removed z-index on container in favor of sticky child */
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.epic-info { 
    display: flex; align-items: center; gap: 0.5rem; 
    /* Make the title sticky so it stays visible while milestones scroll */
    position: sticky;
    left: 0;
    z-index: 15;
    background: inherit; /* Inherit epic-row background */
    /* Add padding to cover background if needed, but inherit might work */
    /* To ensure text doesn't overlap scrolling milestones, we might need a background */
    background: rgba(30, 41, 59, 0.95); /* Explicit background to cover scrolling items behind */
    padding-right: 1rem; /* Space after sticky title */
    border-radius: 0 4px 4px 0;
}
.epic-label { font-weight: 700; padding-left: 0.5rem; border-left: 3px solid; }

.task-row { position: relative; height: 48px; border-bottom: 1px solid rgba(255,255,255,0.02); box-sizing: border-box; }

.grid-lines { 
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
    z-index: 0;
}
.grid-cell { 
    height: 100%; 
    border-right: 1px solid rgba(255,255,255,0.03); 
}

/* Task Layer */
.task-layer {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1;
    pointer-events: none; /* Let clicks pass through empty spaces if needed, but bars have events */
    padding: 6px 0; /* Vertical padding matching task-bar top/bottom logic */
}

.dependency-layer {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 2; /* Between grid (0) and tasks (5) */
    pointer-events: none;
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
    background-color: var(--task-color);
}
.task-bar:hover { filter: brightness(1.1); z-index: 15; min-width: fit-content; }
.task-content { display: flex; gap: 8px; overflow: hidden; text-overflow: ellipsis; }
.task-name { font-weight: 600; }
.task-assignments { opacity: 0.8; font-size: 0.7rem; }
.task-bar.overloaded { box-shadow: 0 0 10px 3px rgba(239, 68, 68, 0.7); border: 1px solid #ef4444; }
.error-indicator { color: #fff; background: #ef4444; border-radius: 50%; padding: 2px; display: flex; }

/* .epic-info styles moved up to epic-row block for cohesion */
.epic-row:hover .icon-btn-ghost { opacity: 1; }

/* Milestone Styles */
.milestone-overlay {
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    z-index: 9; /* Below Sticky Header (10) but above Tasks */
    pointer-events: none; /* Allow clicks through to tasks */
    /* Fix for stacking: Force single row */
    grid-template-rows: 1fr;
}


.epic-milestone-label {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    display: flex; 
    align-items: center; 
    gap: 4px; 
    padding: 2px 6px; 
    border-radius: 99px; 
    font-size: 0.7rem; 
    font-weight: 600; 
    color: white; 
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    cursor: pointer;
    white-space: nowrap;
    z-index: 5; /* Lower than button (10/20) */
    pointer-events: auto;
}
.epic-milestone-label:hover {
    z-index: 25; /* Bring to top on hover if needed */
}

/* Grid Container for Header Milestones */
.epic-milestones-grid {
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    display: grid;
    /* grid-template-columns set via style binding */
    grid-template-rows: 1fr; /* Force single row */
    pointer-events: none;
    z-index: 5;
}

.epic-milestone-item {
    position: relative;
    height: 100%;
    /* No width set, it fills the grid column? No, we just need the start position */
    /* We want line at START of this column */
    display: flex;
    align-items: center; /* Vertically center label */
    justify-content: flex-start; /* Line is at start */
    /* Shift content to align center of label with line */
    /* Line is at 0px of this item. */
}

.milestone-line {
    /* Positioned via grid-column */
    width: 0;
    border-left: 1px dashed; /* Using border-left to represent the line */
    height: 100%;
    position: relative;
    pointer-events: auto; /* Allow clicking the milestone itself */
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
}
.milestone-line:hover {
    opacity: 1;
    z-index: 60;
}

.milestone-label {
    position: absolute;
    top: 50%; 
    left: 0; 
    /* transform handled inline or by subclass, but base centering is good */
    transform: translateX(-50%);
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    z-index: 60;
}

.milestone-label.global {
    top: 6px; /* Just below top border of header */
    left: 0;
    transform: translateX(-50%); /* Still center on the line */
}

.milestone-label-container {
    position: relative;
    height: 100%;
    display: flex; /* New */
    align-items: flex-start; /* Align top? */
    justify-content: flex-start; /* Align left (at the line) */
}

.drag-handle {
    cursor: grab;
    color: var(--color-text-muted);
    opacity: 0.5;
    display: flex;
    align-items: center;
    margin-right: -4px; /* Pull closer to label */
    padding: 2px;
}
.drag-handle:hover {
    opacity: 1;
}

.epic-container.dragging {
    opacity: 0.4;
    background: rgba(255, 255, 255, 0.05);
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
  min-height: 200px; /* Ensure visible area */
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
