<script setup lang="ts">
import { ref } from 'vue'
import { Rocket, BarChart2, Upload, Download, ChartGantt } from 'lucide-vue-next'
import ResourceHeatmap from './components/heatmap/ResourceHeatmap.vue'
import GanttChart from './components/gantt/GanttChart.vue'
import { useCapacityStore } from './stores/capacity'
import { useNotificationStore } from './stores/notifications'
import Modal from './components/common/Modal.vue'
import AppNameEditor from './components/editors/AppNameEditor.vue'
import ToastContainer from './components/ui/ToastContainer.vue'

const currentView = ref<'heatmap' | 'gantt'>('heatmap')
const store = useCapacityStore()
const notifications = useNotificationStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isNameEditorOpen = ref(false)

// Export Handler
function handleExport() {
  const json = store.exportState()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  
  a.download = `capacity-plan-${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.json`
  
  a.click()
  URL.revokeObjectURL(url)
}

// Import Handler
function triggerImport() {
  fileInput.value?.click()
}

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (store.importState(content)) {
        notifications.add('Plan imported successfully!', 'success')
      } else {
        notifications.add('Failed to import plan. Invalid JSON.', 'error')
      }
    }
    reader.readAsText(file)
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">
        <Rocket class="logo-icon" />
        <h1>
          <span class="editable-name" @click="isNameEditorOpen = true" title="Edit Name">{{ store.appName }}</span>
          <span class="accent"> Planner</span>
        </h1>
      </div>

      <nav class="view-switcher">
        <button 
          :class="['nav-btn', { active: currentView === 'heatmap' }]"
          @click="currentView = 'heatmap'"
        >
          <BarChart2 :size="18" />
          Resource Heatmap
        </button>
        <button 
          :class="['nav-btn', { active: currentView === 'gantt' }]"
          @click="currentView = 'gantt'"
        >
          <ChartGantt :size="18" />
          Gantt Chart
        </button>
      </nav>

      <div class="actions">
        <button class="icon-btn" title="Import JSON" @click="triggerImport">
          <Upload :size="18" />
        </button>
        <input 
          type="file" 
          ref="fileInput" 
          accept=".json" 
          style="display: none" 
          @change="handleFileImport"
        >
        <button class="icon-btn" title="Export JSON" @click="handleExport">
          <Download :size="18" />
        </button>
      </div>
    </header>

    <main class="main-content">
      <div v-if="currentView === 'heatmap'" class="view-container">
        <ResourceHeatmap />
      </div>
      
      <div v-else class="view-container">
        <GanttChart />
      </div>
    </main>

    <Modal 
      :isOpen="isNameEditorOpen" 
      title="Edit Application Name" 
      @close="isNameEditorOpen = false"
    >
      <AppNameEditor 
        :isOpen="isNameEditorOpen" 
        @save="isNameEditorOpen = false" 
        @close="isNameEditorOpen = false" 
      />
    </Modal>
    <ToastContainer />
  </div>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top center, #1e293b 0%, #0f172a 60%);
}

.app-header {
  height: var(--header-height);
  margin: 0;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-main);
}
.logo-icon {
  color: var(--color-primary);
}
.brand h1 {
  font-size: 1.25rem;
}
.brand .accent {
  color: var(--color-primary);
}

.editable-name {
    cursor: pointer;
    transition: color 0.2s;
}
.editable-name:hover {
    color: white;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 4px;
}

.view-switcher {
  display: flex;
  background: rgba(0,0,0,0.2);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.05);
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-btn:hover {
  color: var(--color-text-main);
}

.nav-btn.active {
  background: var(--color-bg-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.05);
  color: var(--color-text-muted);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: rgba(255,255,255,0.1);
  color: var(--color-text-main);
}

.main-content {
  flex: 1;
  padding: 0 1rem 1rem 1rem;
  overflow: hidden;
}

.view-container {
  height: 100%;
  width: 100%;
}

.placeholder-msg {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: var(--radius-lg);
}
</style>
