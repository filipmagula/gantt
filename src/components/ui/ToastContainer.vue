<script setup lang="ts">
import { useNotificationStore } from '../../stores/notifications'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

const store = useNotificationStore()

function getIcon(type: string) {
    if (type === 'success') return CheckCircle
    if (type === 'error') return AlertCircle
    return Info
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
        <div 
            v-for="notif in store.notifications" 
            :key="notif.id"
            class="toast-item"
            :class="notif.type"
        >
            <component :is="getIcon(notif.type)" :size="20" />
            <span class="message">{{ notif.message }}</span>
            <button class="close-btn" @click="store.remove(notif.id)">
                <X :size="16" />
            </button>
        </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 1000;
    pointer-events: none;
}

.toast-item {
    background: var(--color-bg-surface);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    border: 1px solid rgba(255,255,255,0.1);
}

.toast-item.success { border-left: 4px solid #10b981; }
.toast-item.error { border-left: 4px solid #ef4444; }
.toast-item.info { border-left: 4px solid #3b82f6; }

.message {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
}
.close-btn:hover { color: white; }

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
