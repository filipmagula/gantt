<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import type { Resource } from '../../types'
import { Trash2 } from 'lucide-vue-next'

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

const isDeleting = ref(false)

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
    isDeleting.value = false
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
  store.deleteResource(props.resourceId)
  emit('save')
}
</script>

<template>
  <div class="form-layout">
    <div v-if="!isDeleting">
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
    </div>

    <div v-else class="delete-warning-container">
        <div class="warning-icon">
            <Trash2 :size="48" class="text-danger" />
        </div>
        <h3>Delete Resource?</h3>
        <p>Are you sure you want to delete this Resource? This will remove them from <strong>all assigned tasks</strong>.</p>
    </div>

    <div class="form-actions" v-if="!isDeleting">
        <button type="button" v-if="props.resourceId" class="icon-btn-danger" title="Delete Resource" @click="isDeleting = true">
            <Trash2 :size="18" />
        </button>
        <div class="right-actions">
            <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn-primary" @click="save">Save Resource</button>
        </div>
    </div>

    <div class="delete-actions-centered" v-else>
        <button class="btn-danger-lg" @click="handleDelete">Confirm Delete</button>
        <button class="btn-text" @click="isDeleting = false">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.help-text { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
.right-actions { display: flex; gap: 1rem; margin-left: auto; }
</style>
