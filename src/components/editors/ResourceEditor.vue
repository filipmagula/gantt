<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import type { Resource } from '../../types'

const props = defineProps<{
  resourceId?: string
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'close'): void
}>()

const store = useCapacityStore()

const form = ref<Resource>({
  id: '',
  name: '',
  capacity: 100,
  color: '#6366f1'
})

const colors = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'
]

watch(() => props.isOpen, () => {
  if (props.resourceId) {
    // Edit Mode
    const existing = store.resources.find(r => r.id === props.resourceId)
    if (existing) {
      form.value = { ...existing, color: existing.color || colors[0] }
    }
  } else {
    // Add Mode
    form.value = {
      id: `r${Date.now()}`, 
      name: '',
      capacity: 100,
      color: colors[0]
    }
  }
}, { immediate: true })

function save() {
  if (!form.value.name) return

  if (props.resourceId) {
    store.updateResource(form.value)
  } else {
    store.addResource(form.value)
  }
  emit('save')
}

function handleDelete() {
  if (!props.resourceId) return

  if (confirm(`Are you sure you want to delete ${form.value.name}? This will remove them from all assigned tasks.`)) {
    store.deleteResource(props.resourceId)
    emit('save')
  }
}
</script>

<template>
  <div class="resource-form">
    <div class="form-group">
      <label>Full Name</label>
      <input v-model="form.name" type="text" class="input-field" placeholder="e.g. Jane Doe" autofocus />
    </div>

    <div class="form-group">
      <label>Capacity Limit (%)</label>
      <div class="input-wrapper">
        <input v-model.number="form.capacity" type="number" class="input-field" min="0" max="200" />
      </div>
      <p class="help-text">Standard full-time is 100%.</p>
    </div>

    <div class="form-group">
      <label>Role Color</label>
      <div class="color-picker">
        <button 
          v-for="c in colors" 
          :key="c"
          class="color-swatch"
          :class="{ active: form.color === c }"
          :style="{ backgroundColor: c }"
          @click="form.color = c"
        ></button>
      </div>
    </div>

    <div class="form-footer">
        <button type="button" v-if="props.resourceId" class="btn-danger-text" @click="handleDelete">Delete</button>
        <div class="footer-right">
            <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn-primary" @click="save">Save Resource</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.resource-form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.875rem; color: var(--color-text-muted); }

.input-field { 
    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); 
    color: white; padding: 0.5rem; border-radius: var(--radius-sm); 
    font-family: inherit; width: 100%; box-sizing: border-box; 
}
.input-field:focus { outline: none; border-color: var(--color-primary); }

.help-text { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }

.form-footer { margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; }
.footer-right { display: flex; gap: 1rem; margin-left: auto; }

.btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary { background: transparent; color: var(--color-text-main); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: rgba(255,255,255,0.05); }

.btn-danger-text { background: transparent; color: #ef4444; border: none; padding: 0.5rem; cursor: pointer; font-size: 0.9rem; }
.btn-danger-text:hover { text-decoration: underline; }

.color-picker { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.color-swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s; }
.color-swatch:hover { transform: scale(1.1); }
.color-swatch.active { border-color: white; box-shadow: 0 0 0 2px rgba(255,255,255,0.2); }
</style>
