<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCapacityStore } from '../../stores/capacity'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'close'): void
}>()

const store = useCapacityStore()
const localName = ref('')

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        localName.value = store.appName
    }
}, { immediate: true })

function save() {
    if (!localName.value.trim()) return
    store.updateAppName(localName.value)
    emit('save')
}
</script>

<template>
  <div class="form-layout">
    <div class="form-group">
      <label>Application Name</label>
      <input 
        v-model="localName" 
        type="text" 
        class="input-field" 
        placeholder="Enter name..." 
        autofocus 
        @keyup.enter="save"
      />
    </div>
    
    <div class="form-actions">
      <div style="flex: 1"></div>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" @click="save">Save Changes</button>
    </div>
  </div>
</template>

<style scoped>
/* No specific styles needed, using global */
</style>
