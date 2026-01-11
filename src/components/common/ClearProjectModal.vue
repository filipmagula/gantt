<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'
import { AlertTriangle, Download } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', options: { export: boolean, names: boolean, resources: boolean, epics: boolean }): void
}>()

const doExport = ref(true)
const clearName = ref(false)
const clearResources = ref(false)
const clearEpics = ref(false)

function handleConfirm() {
  emit('confirm', {
    export: doExport.value,
    names: clearName.value,
    resources: clearResources.value,
    epics: clearEpics.value
  })
}

// Check if any clear option is selected to enable the button (or if we just want to export, that's fine too?)
// User request: "When pressed a new modal shows where user can specify if he want to clear"
// If everything is unchecked, "Clear" probably shouldn't do anything or should be disabled.
// But technically clearing "nothing" is a valid no-op. 
// However, UX wise, at least one "clear" option should be checked OR export should be checked?
// Let's assume the primary action is "Clear", so we should probably require at least one clear checkbox 
// UNLESS export is checked, in which case it acts as an export.
// But we have a dedicated export button. 
// Let's enforce at least one "Clear" option is checked to enable the DESTRUCTIVE button.
const canClear = computed(() => clearName.value || clearResources.value || clearEpics.value)

import { computed } from 'vue'

</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Clear Project Data" 
    @close="$emit('close')"
  >
    <div class="clear-modal">
      <div class="warning-banner">
        <AlertTriangle class="warning-icon" :size="20" />
        <p>This action cannot be undone unless you export your data first.</p>
      </div>

      <div class="options-group">
        <label class="checkbox-option export-option">
          <input type="checkbox" v-model="doExport">
          <div class="option-content">
            <span class="option-label">Export before deletion</span>
            <span class="option-desc">Download a backup .json file</span>
          </div>
          <Download :size="16" class="option-icon" />
        </label>

        <div class="divider"></div>

        <p class="section-label">Select data to clear:</p>

        <label class="checkbox-option">
          <input type="checkbox" v-model="clearName">
          <span class="option-label">Project Name</span>
        </label>

        <label class="checkbox-option">
          <input type="checkbox" v-model="clearResources">
          <span class="option-label">Resources</span>
        </label>

        <label class="checkbox-option">
          <input type="checkbox" v-model="clearEpics">
          <span class="option-label">Epics & Stories</span>
        </label>
      </div>

      <div class="modal-actions">
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button 
          class="confirm-btn" 
          :disabled="!canClear"
          @click="handleConfirm"
        >
          Clear Selected
        </button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.clear-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  color: #fca5a5;
  font-size: 0.875rem;
}

.warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.checkbox-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-option input[type="checkbox"] {
  width: 1.1em;
  height: 1.1em;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.option-label {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--color-text-main);
}

.option-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.export-option {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.export-option:hover {
  background: rgba(99, 102, 241, 0.15);
}

.export-option input[type="checkbox"] {
  accent-color: #6366f1;
}

.option-icon {
  color: #6366f1;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.section-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-muted);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-main);
}

.confirm-btn {
  background: #ef4444;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #7f1d1d;
}
</style>
