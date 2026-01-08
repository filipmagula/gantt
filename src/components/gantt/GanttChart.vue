<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { addDays, format, startOfWeek, differenceInDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, AlertCircle, Calendar, Plus, Pencil } from 'lucide-vue-next'
import Modal from '../common/Modal.vue'
import TaskEditor from '../editors/TaskEditor.vue'
import EpicEditor from '../editors/EpicEditor.vue'
import MilestoneEditor from '../editors/MilestoneEditor.vue'
import { Flag } from 'lucide-vue-next'

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

const isMilestoneEditorOpen = ref(false)
const editingMilestoneId = ref('')

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

function getEpicDependencies(epic: any) {
    interface PathData { id: string; d: string; color: string }
    const paths: PathData[] = []
    // Helper to get X position (Grid Units 0-21) for a date
    const getX = (dateStr: string, isEnd: boolean = false) => {
        const date = parseISO(dateStr)
        const diff = differenceInDays(date, startDate.value)
        // If isEnd, we want the end of that day, so +1 day worth of width
        const offset = isEnd ? 1 : 0
        return (diff + offset) // Return grid units, not percentage (ViewBox handles scaling)
    }

    // Map Tasks to their index (row number) for Y calculation
    // const visibleTasks = epic.tasks 
    const taskRowHeight = 40 // px
    const rowCenter = 20 // px

    epic.tasks.forEach((task: any, index: number) => {
        if (!task.dependencies || task.dependencies.length === 0) return

        task.dependencies.forEach((depId: string) => {
            const depTask = epic.tasks.find((t: any) => t.id === depId)
            const depIndex = epic.tasks.findIndex((t: any) => t.id === depId)
            
            if (depTask && depIndex !== -1) {
                // Coordinates
                const x1 = getX(depTask.end, true) // Source Right
                const y1 = depIndex * taskRowHeight + rowCenter
                
                const x2 = getX(task.start, false) // Target Left
                const y2 = index * taskRowHeight + rowCenter

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
                const cpOffset = 0.5 // 0.5 grid column curvature
                
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

function nextWeek() { startDate.value = addDays(startDate.value, 7) }
function prevWeek() { startDate.value = addDays(startDate.value, -7) }
function scrollToToday() { startDate.value = startOfWeek(new Date(), { weekStartsOn: 1 }) }
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
          class="chart-header-cell"
          :class="{ 'weekend': date.getDay() === 0 || date.getDay() === 6 }"
        >
          <div class="day-name">{{ format(date, 'EEE') }}</div>
          <div class="day-num">{{ format(date, 'd') }}</div>
        </div>

        <!-- Global Milestones Label Overlay (Only for milestones with NO epicId) -->
        <!-- We reuse the grid system to place labels. -->
        <div class="milestone-labels-layer grid-row" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
             <div 
                v-for="milestone in store.milestones.filter(m => !m.epicId)" 
                :key="milestone.id"
                class="milestone-label-container"
                :style="{ 
                    gridColumnStart: differenceInDays(parseISO(milestone.date), startDate) + 1,
                    gridColumnEnd: 'span 2' 
                }"
             >
                <div class="milestone-label global" 
                     :style="{ backgroundColor: milestone.color, left: '50%' }"
                     @click.stop="openMilestoneEditor(milestone.id)"
                     style="pointer-events: auto; cursor: pointer; transform: translateX(-50%);"
                >
                    <Flag :size="10" fill="currentColor" />
                    <span>{{ milestone.title }}</span>
                </div>
             </div>
        </div>
      </div>

            <!-- Epics & Tasks -->
            <div class="gantt-body">
                <!-- Milestones Overlay -->
                <!-- (Rendered above in its own grid-row container if we wanted, but let's look at structure) -->
                <!-- Wait, the previous edit inserted milestone-overlay then closed divs weirdly. Let's fix structure. -->
                <!-- The structure is gantt-scroll-area > timeline-header, then gantt-body. -->
                <!-- Inside gantt-body we have milestones overlay and then epics. -->
                
                <div class="milestone-overlay grid-row">
                    <!-- Global Lines (All Milestones get a line) -->
                    <div 
                        v-for="milestone in store.milestones" 
                        :key="milestone.id"
                        class="milestone-line"
                        :style="{ 
                            gridColumnStart: differenceInDays(parseISO(milestone.date), startDate) + 2, 
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

        <template v-for="epic in store.epics" :key="epic.id">
            <!-- Epic Header Row -->
            <div class="epic-row">
                <div class="epic-info">
                  <div class="epic-label" :style="{ borderColor: epic.color }">{{ epic.title }}</div>
                  <button class="icon-btn-ghost" title="Edit Epic" @click="openEpicEditor(epic.id)">
                      <Pencil :size="12" />
                  </button>
                  <button class="icon-btn-ghost" title="Add Task to Epic" @click="openTaskEditor(undefined, epic.id)">
                      <Plus :size="14" />
                  </button>
                </div>

                <!-- Milestone rendering logic implemented below -->



                <!-- Epic-Specific Milestones (Inside Header for Z-Index Control) -->
                <!-- Positioned absolutely relative to the epic-row (sticky container) -->
                <!-- Epic-Specific Milestones (Inside Header for Z-Index Control) -->
                <!-- Epic-Specific Milestones (Using Grid for Perfect Alignment) -->
                <div class="epic-milestones-grid">
                    <div 
                        v-for="milestone in store.milestones.filter(m => m.epicId === epic.id)" 
                        :key="milestone.id"
                        class="epic-milestone-item"
                        :style="{
                            gridColumnStart: differenceInDays(parseISO(milestone.date), startDate) + 2,
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
            <!-- This layer scrolls with the grid, but we visually position items upwards to overlap the sticky header. -->
            <!-- Old epic-milestone-layer removed -->

            <!-- Task Rows Container (Relative for SVG Layer) -->
            <div class="epic-tasks-body" :style="{ position: 'relative', height: `${epic.tasks.length * 40}px` }">
                
                <!-- Dependency Arrows Layer -->
                <svg class="dependency-layer" 
                     :viewBox="`0 0 21 ${epic.tasks.length * 40}`" 
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
            </div>
            <!-- End Epic Tasks Body -->
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
    /* Removed flex to rely on flow layout + min-height */
}

.timeline-header { 
    position: sticky; top: 0; z-index: 20; 
    background: var(--color-bg-surface); 
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0; /* Keep header size */
}

/* ... existing styles ... */

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

.task-row { position: relative; height: 40px; border-bottom: 1px solid rgba(255,255,255,0.02); }

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
    grid-template-columns: repeat(21, 1fr);
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
}

.milestone-label-container {
    position: relative;
    height: 100%;
    /* border-left: 1px solid red; debug */
}
</style>
