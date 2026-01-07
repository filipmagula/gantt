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
  <div class="app-name-editor">
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
.app-name-editor {
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
    font-size: 1.1rem;
}
.input-field:focus {
    outline: none;
    border-color: var(--color-primary);
}

.form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
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
