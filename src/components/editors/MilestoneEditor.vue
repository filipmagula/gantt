<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import type { Milestone } from '../../types'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  milestoneId?: string
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'close'): void
}>()

const store = useCapacityStore()

const form = ref<Milestone>({
  id: '',
  title: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  color: '#f43f5e',
  epicId: ''
})

// Curated colors for premium feel
const colors = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f43f5e'  // Rose
]

const isDeleting = ref(false)

watch(() => props.isOpen, () => {
    if (props.milestoneId) {
        // Edit mode
        const existing = store.milestones.find(m => m.id === props.milestoneId)
        if (existing) {
            form.value = { ...existing }
        }
    } else {
        // Add mode
        form.value = {
            id: `m${Date.now()}`,
            title: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            color: colors[Math.floor(Math.random() * colors.length)] || '#f43f5e',
            epicId: ''
        }
    }
    isDeleting.value = false
}, { immediate: true })

function save() {
    if (!form.value.title || !form.value.date) return

    if (props.milestoneId) {
        store.updateMilestone(form.value)
    } else {
        store.addMilestone(form.value)
    }
    emit('save')
}

function handleDelete() {
    if (!props.milestoneId) return
    store.deleteMilestone(props.milestoneId)
    emit('save')
}
</script>

<template>
  <div class="milestone-form">
    <div v-if="!isDeleting">
        <div class="form-group">
        <label>Milestone Name</label>
        <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Code Freeze" autofocus />
        </div>

        <div class="form-group">
            <label>Date</label>
            <input v-model="form.date" type="date" class="input-field" />
        </div>

        <div class="form-group">
            <label>Epic (Optional)</label>
            <select v-model="form.epicId" class="input-field">
                <option value="">(Global Milestone)</option>
                <option v-for="epic in store.epics" :key="epic.id" :value="epic.id">
                    {{ epic.title }}
                </option>
            </select>
        </div>

        <div class="form-group">
        <label>Color Code</label>
        <div class="color-picker">
            <button 
            v-for="color in colors" 
            :key="color"
            class="color-swatch"
            :class="{ active: form.color === color }"
            :style="{ backgroundColor: color }"
            @click="form.color = color"
            ></button>
        </div>
        </div>
    </div>

    <div v-else class="delete-warning-container">
        <div class="warning-icon">
            <Trash2 :size="48" class="text-danger" />
        </div>
        <h3>Delete Milestone?</h3>
        <p>Are you sure you want to delete this Milestone? This action cannot be undone.</p>
    </div>

    <div class="form-actions" v-if="!isDeleting">
        <button type="button" v-if="props.milestoneId" class="icon-btn-danger" title="Delete Milestone" @click="isDeleting = true">
            <Trash2 :size="18" />
        </button>
        <div class="right-actions">
            <button class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button class="btn-primary" @click="save">Save Milestone</button>
        </div>
    </div>

    <div class="delete-actions-centered" v-else>
        <button class="btn-danger-lg" @click="handleDelete">Confirm Delete</button>
        <button class="btn-text" @click="isDeleting = false">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.milestone-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.input-field {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
}
.input-field:focus {
    outline: none;
    border-color: var(--color-primary);
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s;
}
.color-swatch:hover {
  transform: scale(1.1);
}
.color-swatch.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
}

.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.right-actions {
    display: flex;
    gap: 1rem;
}

.icon-btn-danger {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
}
.icon-btn-danger:hover { color: var(--color-danger); }

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

.btn-primary, .btn-secondary {
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
</style>
