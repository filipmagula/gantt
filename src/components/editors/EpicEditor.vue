<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'
import type { Epic } from '../../types'
import { Trash2 } from 'lucide-vue-next'

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

const isDeleting = ref(false)

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
    isDeleting.value = false
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
  store.deleteEpic(props.epicId)
  emit('save')
}
</script>

<template>
  <div class="form-layout">
    <div v-if="!isDeleting">
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
    </div>

    <div v-else class="delete-warning-container">
        <div class="warning-icon">
            <Trash2 :size="48" class="text-danger" />
        </div>
        <h3>Delete Epic?</h3>
        <p>Are you sure you want to delete this Epic? This will permanently delete <strong>{{ form.tasks?.length || 0 }} tasks</strong> associated with it.</p>
    </div>

    <div class="form-actions" v-if="!isDeleting">
        <button type="button" v-if="props.epicId" class="icon-btn-danger" title="Delete Epic" @click="isDeleting = true">
            <Trash2 :size="18" />
        </button>
        <div class="right-actions">
            <button class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button class="btn-primary" @click="save">Save Epic</button>
        </div>
    </div>

    <div class="delete-actions-centered" v-else>
        <button class="btn-danger-lg" @click="handleDelete">Confirm Delete</button>
        <button class="btn-text" @click="isDeleting = false">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.right-actions {
    display: flex;
    gap: 1rem;
}
</style>
