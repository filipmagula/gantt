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
  <div class="form-layout">
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
            <select v-model="form.epicId" class="input-field select-field">
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
.right-actions {
    display: flex;
    gap: 1rem;
}
</style>
