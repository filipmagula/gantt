<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import { Plus, Trash2 } from 'lucide-vue-next'
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
  assignments: [] as Assignment[]
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
            assignments: JSON.parse(JSON.stringify(foundTask.assignments))
        }
    }
  } else {
    // New Task
    task.value = null
    const today = new Date().toISOString().split('T')[0] || ''
    form.value = {
        name: '',
        start: today,
        end: today,
        assignments: []
    }
    isDeleting.value = false
  }
}, { immediate: true })

// Available resources for new assignment
const availableResources = computed(() => {
  const currentIds = form.value.assignments.map(a => a.resourceId)
  return store.resources.filter(r => !currentIds.includes(r.id))
})

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
     // Update existing (direct mutation for simplicity)
     const storedTask = store.allTasks.find(t => t.id === props.taskId)
     if (storedTask) {
       storedTask.name = form.value.name
       storedTask.start = form.value.start
       storedTask.end = form.value.end
       storedTask.assignments = form.value.assignments
     }
  } else if (props.epicId) {
     // Create new
     const newTask: Task = {
         id: `t${Date.now()}`,
         epicId: props.epicId,
         name: form.value.name,
         start: form.value.start,
         end: form.value.end,
         assignments: form.value.assignments
     }
     // Fix assignments taskId reference
     newTask.assignments.forEach(a => a.taskId = newTask.id)
     
     store.addTask(props.epicId, newTask)
  }
  
  emit('save')
  emit('close')
}

function handleDelete() {
    if (!props.taskId) return
    store.deleteTask(props.taskId)
    emit('save') // Refresh list
    emit('close')
}

</script>

<template>
  <div class="editor-form">
    <div class="form-group">
      <label>Task Name</label>
      <input v-model="form.name" type="text" class="input-field" placeholder="Task Name" autofocus />
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

        <div class="assignments-section">
        <h4>Assignments</h4>
        
        <div v-for="(assignment, idx) in form.assignments" :key="assignment.resourceId" class="assignment-row">
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

        <div class="add-row">
            <select v-model="selectedResourceId" class="select-field">
                <option value="" disabled>Select Resource</option>
                <option v-for="r in availableResources" :key="r.id" :value="r.id">
                    {{ r.name }}
                </option>
            </select>
            <button class="btn-primary-sm" :disabled="!selectedResourceId" @click="addAssignment">
                <Plus :size="16" /> Add
            </button>
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
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-row {
    display: flex;
    gap: 1rem;
}
.form-row .form-group {
    flex: 1;
}

label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.input-field, .select-field {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
}
.input-field:focus, .select-field:focus {
    outline: none;
    border-color: var(--color-primary);
}

.assignments-section {
    background: rgba(255,255,255,0.03);
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(255,255,255,0.05);
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

.icon-btn-danger {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
}
.icon-btn-danger:hover { color: var(--color-danger); }

.add-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}
.select-field { flex: 1; }

.btn-primary, .btn-secondary, .btn-primary-sm {
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary { background: transparent; color: var(--color-text-main); border: 1px solid rgba(255,255,255,0.1); }
.btn-secondary:hover { background: rgba(255,255,255,0.05); }

.btn-primary-sm {
    background: var(--color-primary);
    color: white;
    padding: 0.25rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
}
.btn-primary-sm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.form-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.delete-warning-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2rem 0;
    gap: 1rem;
    animation: fadeIn 0.3s ease;
    color: var(--color-text-muted);
}
.warning-icon {
    background: rgba(239, 68, 68, 0.1);
    padding: 1rem;
    border-radius: 50%;
    margin-bottom: 0.5rem;
}
.delete-warning-container h3 {
    margin: 0;
    color: white;
    font-size: 1.25rem;
}
.text-danger { color: var(--color-danger); }

.delete-actions-centered {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.btn-danger-lg {
    background: var(--color-danger);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    transition: background 0.2s;
}
.btn-danger-lg:hover { background: #b91c1c; }

.btn-text {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: underline;
}
.btn-text:hover { color: white; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
