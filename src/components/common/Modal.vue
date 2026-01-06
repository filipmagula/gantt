<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  title: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Track if the interaction started on the backdrop
let isMouseDownOnBackdrop = false

function handleBackdropMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) {
        isMouseDownOnBackdrop = true
    }
}

function handleBackdropMouseUp(e: MouseEvent) {
    // Only close if we started on the backdrop AND ended on the backdrop
    if (isMouseDownOnBackdrop && e.target === e.currentTarget) {
        emit('close')
    }
    // Always reset
    isMouseDownOnBackdrop = false
}
</script>

<template>
  <Teleport to="body">
    <div 
        v-if="isOpen" 
        class="modal-backdrop" 
        @mousedown="handleBackdropMouseDown" 
        @mouseup="handleBackdropMouseUp"
    >
      <div class="modal-content glass-panel" @mousedown.stop @mouseup.stop @click.stop>
        <header class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="$emit('close')">
            <X :size="20" />
          </button>
        </header>
        
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #1e293b; /* Fallback */
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  transform: translateY(0);
  animation: modal-slide-up 0.3s ease-out;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-main);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

@keyframes modal-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
