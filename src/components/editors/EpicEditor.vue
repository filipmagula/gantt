<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import type { Epic } from '../../types'

const props = defineProps<{
  epicId?: string
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'close'): void
}>()

const store = useCapacityStore()

const form = ref<Epic>({
  id: '',
  title: '',
  color: '#6366f1',
  tasks: []
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

watch(() => props.isOpen, () => {
  if (props.epicId) {
    // Edit (Not strictly requested but good to have)
    const existing = store.epics.find(e => e.id === props.epicId)
    if (existing) {
      form.value = JSON.parse(JSON.stringify(existing))
    }
  } else {
    // Add Mode
    form.value = {
      id: `e${Date.now()}`,
      title: '',
      color: colors[Math.floor(Math.random() * colors.length)],
      tasks: []
    }
  }
}, { immediate: true })

function save() {
  if (!form.value.title) return

  if (props.epicId) {
    store.updateEpic(form.value)
  } else {
    store.addEpic(form.value)
  }
  emit('save')
}

function handleDelete() {
  if (!props.epicId) return
  
  if (confirm(`Are you sure you want to delete ${form.value.title}? This will also delete all tasks within this epic.`)) {
    store.deleteEpic(props.epicId)
    emit('save')
  }
}
</script>

<template>
  <div class="epic-form">
    <div class="form-group">
      <label>Epic Title</label>
      <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Q4 Marketing Campaign" autofocus />
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

    <div class="form-actions">
        <button type="button" v-if="props.epicId" class="btn-danger-text" @click="handleDelete">Delete</button>
        <div class="right-actions">
            <button class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button class="btn-primary" @click="save">Save Epic</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.epic-form {
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
    align-items: center; /* V-align delete button */
    gap: 1rem;
    margin-top: 1rem;
}

.right-actions {
    display: flex;
    gap: 1rem;
}

.btn-danger-text { background: transparent; color: #ef4444; border: none; padding: 0.5rem; cursor: pointer; font-size: 0.9rem; }
.btn-danger-text:hover { text-decoration: underline; }

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
