<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { Trash2 } from 'lucide-vue-next'
import type { Task, Assignment } from '../../types'

const props = defineProps<{
  taskId?: string
  epicId?: string // Required for creating new task
  isOpen: boolean 
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'close'): void
}>()

const store = useCapacityStore()
const task = ref<Task | null>(null)

// Local state for editing
const form = ref({
  name: '',
  start: '',
  end: '',
  assignments: [] as Assignment[],
  dependencies: [] as string[],
  epicId: ''
})

const isDeleting = ref(false)

// Initialize form
watch(() => props.isOpen, () => {
  if (props.taskId) {
    // Edit existing
    const foundTask = store.allTasks.find(t => t.id === props.taskId)
    if (foundTask) {
        task.value = foundTask // Keep ref for editing
        form.value = {
            name: foundTask.name,
            start: foundTask.start,
            end: foundTask.end,
            assignments: JSON.parse(JSON.stringify(foundTask.assignments)),
            dependencies: JSON.parse(JSON.stringify(foundTask.dependencies || [])),
            epicId: foundTask.epicId
        }
    }
  } else {
    // New Task
    task.value = null
    const today = new Date().toISOString().split('T')[0] || ''
    // Safe access to first epic
    const firstEpicId = (store.epics && store.epics.length > 0 && store.epics[0]) ? store.epics[0].id : ''
    
    form.value = {
        name: '',
        start: today,
        end: today,
        assignments: [],
        dependencies: [],
        epicId: props.epicId || firstEpicId
    }
    isDeleting.value = false
  }
}, { immediate: true })

// Available resources for new assignment
const availableResources = computed(() => {
  const currentIds = form.value.assignments.map(a => a.resourceId)
  return store.resources.filter(r => !currentIds.includes(r.id))
})

const availabledependencyTasks = computed(() => {
    // Tasks from same Epic, excluding self and already added
    const epicId = props.epicId || task.value?.epicId
    if (!epicId) return []
    
    return store.allTasks.filter(t => 
        t.epicId === epicId && 
        t.id !== props.taskId && 
        !form.value.dependencies.includes(t.id)
    )
})

const selectedDependencyId = ref('')



function removeDependency(index: number) {
    form.value.dependencies.splice(index, 1)
}

function getTaskName(id: string) {
    return store.allTasks.find(t => t.id === id)?.name || id
}

const selectedResourceId = ref('')

function addAssignment() {
  if (!selectedResourceId.value) return
  form.value.assignments.push({
    taskId: props.taskId || '', // Will be assigned on save/store logic if new
    resourceId: selectedResourceId.value,
    effort: 50 // Default
  })
  selectedResourceId.value = ''
}

function removeAssignment(index: number) {
  form.value.assignments.splice(index, 1)
}

function getResourceName(id: string) {
    return store.resources.find(r => r.id === id)?.name || id
}

function save() {
  if (!form.value.name) return
  
  if (props.taskId && task.value) {
     // Check if Epic Changed
     if (task.value.epicId !== form.value.epicId) {
         store.moveTask(props.taskId, form.value.epicId)
         // NOTE: After move, the task object reference in 'task.value' might be stale regarding its parent array,
         // but the object itself is likely the same reference if moveTask just spliced it.
         // However, let's re-fetch or ensure current mutations apply to the MOVED task.
         // Since 'moveTask' moves the OBJECT, mutations below should still apply to that object reference.
     }

     // Update existing (direct mutation for simplicity)
     // We need to find it again to be safe? Or utilize the same reference?
     // 'moveTask' logic: 
     // taskToMove = epics.value[i].tasks.splice(...)[0]
     // target.push(taskToMove)
     // So the underlying object reference is preserved.
     
     const storedTask = store.allTasks.find(t => t.id === props.taskId)
     if (storedTask) {
       storedTask.name = form.value.name
       storedTask.start = form.value.start
       storedTask.end = form.value.end
       storedTask.assignments = form.value.assignments
       storedTask.dependencies = form.value.dependencies
       // epicId is already updated by moveTask or needs to be set if we didn't move (unlikely if checks pass)
       // Actually moveTask sets: taskToMove.epicId = targetEpicId
       // So we don't need to manually set it here.
     }
  } else {
     // Create new
     // Use form.epicId instead of props.epicId
     const targetEpicId = form.value.epicId || props.epicId || (store.epics[0]?.id)
     if (!targetEpicId) return // Should not happen if epics exist

     const newTask: Task = {
         id: `t${Date.now()}`,
         epicId: targetEpicId,
         name: form.value.name,
         start: form.value.start,
         end: form.value.end,
         assignments: form.value.assignments,
         dependencies: form.value.dependencies
     }
     // Fix assignments taskId reference
     newTask.assignments.forEach(a => a.taskId = newTask.id)
     
     store.addTask(targetEpicId, newTask)
  }
  
  emit('save')
  emit('close')
}

function addDependency() {
    if (!selectedDependencyId.value) return
    if (!form.value.dependencies.includes(selectedDependencyId.value)) {
        form.value.dependencies.push(selectedDependencyId.value)
    }
    selectedDependencyId.value = ''
}

function handleDelete() {
    if (!props.taskId) return
    store.deleteTask(props.taskId)
    emit('save') // Refresh list
    emit('close')
}

</script>

<template>
  <div class="form-layout">
    <div class="form-group">
      <label>Task Name</label>
      <input v-model="form.name" type="text" class="input-field" placeholder="Task Name" autofocus />
    </div>

    <!-- Epic Selection -->
    <div class="form-group">
        <label>Epic</label>
        <select v-model="form.epicId" class="input-field select-field">
            <option v-for="epic in store.epics" :key="epic.id" :value="epic.id">
                {{ epic.title }}
            </option>
        </select>
    </div>

    <div v-if="!isDeleting">
        <div class="form-row">
        <div class="form-group">
            <label>Start Date</label>
            <input v-model="form.start" type="date" class="input-field" />
        </div>
        <div class="form-group">
            <label>End Date</label>
            <input v-model="form.end" type="date" class="input-field" />
        </div>
        </div>

        <!-- Assignments Section -->
        <!-- Assignments Section -->
        <div class="form-group" style="margin-top: 1rem;">
            <label>Assignments</label>
            
            <div class="seamless-list">
                <div v-for="(assignment, idx) in form.assignments" :key="assignment.resourceId" class="seamless-row">
                    <div class="resource-info">
                        <span class="res-name">{{ getResourceName(assignment.resourceId) }}</span>
                    </div>
                    <div class="effort-control">
                        <input 
                            v-model.number="assignment.effort" 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            class="range-slider"
                        />
                        <span class="effort-val">{{ assignment.effort }}%</span>
                    </div>
                    <button class="icon-btn-danger" @click="removeAssignment(idx)">
                        <Trash2 :size="16" />
                    </button>
                </div>

                <div class="seamless-row add-input-row">
                    <select v-model="selectedResourceId" class="seamless-select" @change="addAssignment">
                        <option value="" disabled selected>+ Add Assignment...</option>
                        <option v-for="r in availableResources" :key="r.id" :value="r.id">
                            {{ r.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <!-- Dependencies Section -->
        <!-- Dependencies Section -->
        <!-- Dependencies Section -->
        <div class="form-group" style="margin-top: 1rem;">
            <label>Dependencies</label>
            <div class="seamless-list">

                
                <div v-for="(depId, idx) in form.dependencies" :key="depId" class="seamless-row">
                    <div style="flex: 1; font-size: 0.9rem;">
                       Predecessor: <strong>{{ getTaskName(depId) }}</strong>
                    </div>
                    <button class="icon-btn-danger" @click="removeDependency(idx)">
                        <Trash2 :size="16" />
                    </button>
                </div>

                <div class="seamless-row add-input-row">
                    <select v-model="selectedDependencyId" class="seamless-select" @change="addDependency">
                        <option value="" disabled selected>+ Add Dependency...</option>
                        <option v-for="t in availabledependencyTasks" :key="t.id" :value="t.id">
                            {{ t.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="delete-warning-container">
        <div class="warning-icon">
            <Trash2 :size="48" class="text-danger" />
        </div>
        <h3>Delete Task?</h3>
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
    </div>

    <div class="form-actions" v-if="!isDeleting">
        <button v-if="props.taskId" class="icon-btn-danger" title="Delete Task" @click="isDeleting = true">
            <Trash2 :size="18" />
        </button>
        <div style="flex: 1"></div>
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="save">Save Changes</button>
    </div>

    <div class="delete-actions-centered" v-else>
        <button class="btn-danger-lg" @click="handleDelete">Confirm Delete</button>
        <button class="btn-text" @click="isDeleting = false">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.form-row {
    display: flex;
    gap: 1rem;
}
.form-row .form-group {
    flex: 1;
}

/* Seamless List Styles */
.seamless-list {
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: rgba(0,0,0,0.1);
}

.seamless-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.1); /* Darker row background like reference */
}

.seamless-row:last-child {
    border-bottom: none;
}

.add-input-row {
    padding: 0; 
    background: transparent; /* Makes the select blend in */
}

.seamless-select {
    width: 100%;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    cursor: pointer;
    outline: none;
    
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center; /* 10px from right */
    background-size: 16px;
    padding-right: 2.5rem; /* Space for icon */
}
.seamless-select:hover {
    color: var(--color-text-main);
    background-color: rgba(255,255,255,0.02); /* Keep background modification separate from image */
}
.seamless-select option {
    background: var(--color-bg-card); /* Ensure dropdown options are readable */
}

h4 {
    margin-bottom: 1rem;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.assignment-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    background: rgba(0,0,0,0.2);
    padding: 0.5rem;
    border-radius: var(--radius-sm);
}

.resource-info { width: 120px; font-size: 0.9rem; }
.effort-control { flex: 1; display: flex; align-items: center; gap: 1rem; }
.range-slider { flex: 1; }
.effort-val { width: 40px; text-align: right; font-variant-numeric: tabular-nums; }

.add-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}
.select-field { flex: 1; } /* Specific override or keep if needed context? Global .select-field is width 100%. Here flex 1 works. */
</style>


