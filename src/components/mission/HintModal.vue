<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog glass-panel">
      <div class="modal-header">
        <div class="modal-title">
          <Lightbulb class="icon-hint" :size="20" />
          <span>關卡通關錦囊與提示</span>
        </div>
        <button class="btn-close" @click="$emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <div v-for="(hint, idx) in hints" :key="idx" class="hint-card">
          <div class="hint-badge">提示 #0{{ idx + 1 }}</div>
          <div class="hint-content">{{ hint }}</div>
        </div>

        <div v-if="hints.length === 0" class="no-hints">
          本關暫無額外提示，請仔細閱讀任務目標！
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary btn-sm" @click="$emit('close')">
          我明白了，開始闖關！
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Lightbulb, X } from 'lucide-vue-next';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  hints: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close']);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(4, 7, 15, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  background: #0d1424;
  border: 1px solid var(--border-accent);
  box-shadow: 0 10px 40px rgba(0, 242, 254, 0.15);
  border-radius: 12px;
  overflow: hidden;
  animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #111a2e;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-display);
}

.icon-hint {
  color: var(--warning-amber);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.3rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.btn-close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
}

.hint-card {
  background: #080c16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid var(--warning-amber);
  padding: 0.85rem 1rem;
  border-radius: 6px;
}

.hint-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--warning-amber);
  margin-bottom: 0.3rem;
}

.hint-content {
  font-size: 0.875rem;
  color: #e2e8f0;
  line-height: 1.5;
}

.modal-footer {
  padding: 0.85rem 1.25rem;
  background: #090e1b;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}
</style>
