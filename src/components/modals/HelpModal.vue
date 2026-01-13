<script setup lang="ts">
import { Rocket, Command, MousePointer2, Github } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="help-content">
    <div class="about-section">
      <div class="brand-large">
        <Rocket :size="48" class="logo-icon" />
        <div>
            <h2>Vibe Planner</h2>
            <p class="version">v1.x</p>
        </div>
      </div>
      <p class="description">
        An interactive Gantt chart and resource planning tool designed for modern teams.
      </p>
      <a href="https://github.com/filipmagula/gantt/" target="_blank" class="github-link">
        <Github :size="16" /> View on GitHub
      </a>
    </div>

    <div class="shortcuts-section">
      <h3><Command :size="16" /> Keyboard Shortcuts</h3>
      <div class="shortcut-grid">
        <div class="shortcut-item">
            <span class="keys"><span class="key">Ctrl</span> + <span class="key">D</span></span>
            <span class="action">Duplicate Task (on hover)</span>
        </div>
        <div class="shortcut-item">
            <span class="keys"><span class="key">Shift</span> + <span class="key">Scroll</span></span>
            <span class="action">Horizontal Timeline Scroll</span>
        </div>
      </div>
    </div>

    <!-- Mouse Interactions -->
    <div class="shortcuts-section">
      <h3><MousePointer2 :size="16" /> Interactions</h3>
      <div class="shortcut-grid">
        <div class="shortcut-item">
            <span class="keys">Drag & Drop</span>
            <span class="action">Reorder Epics and Resources</span>
        </div>
        <div class="shortcut-item">
            <span class="keys">Hover</span>
            <span class="action">View details and edit actions</span>
        </div>
      </div>
    </div>


    <div class="footer">
        <p>Built with Gemini 3 Pro, Vue 3, Pinia, and ❤️</p>
        <button class="btn-primary" @click="emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.help-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
}

.brand-large {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
    color: white;
}
.logo-icon { color: var(--color-primary); }

h2 { margin: 0; font-size: 1.5rem; }
.version { color: var(--color-text-muted); font-size: 0.9rem; margin: 0; }

.description {
    color: var(--color-text-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    max-width: 400px;
    margin: 0 auto;
}

.github-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 1rem;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    background: rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-full);
    transition: all 0.2s;
}
.github-link:hover {
    background: rgba(99, 102, 241, 0.2);
    transform: translateY(-2px);
}

.shortcuts-section {
    text-align: left;
    background: rgba(0,0,0,0.2);
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(255,255,255,0.05);
}

.shortcuts-section h3 {
    font-size: 0.9rem;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.shortcut-grid {
    display: grid;
    gap: 0.75rem;
}

.shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
}

.keys {
    display: flex;
    gap: 4px;
    align-items: center;
    font-family: monospace;
    font-weight: 600;
}

.key {
    background: rgba(255,255,255,0.1);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    font-size: 0.8rem;
}

.action {
    color: var(--color-text-muted);
}

.footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
}
</style>
