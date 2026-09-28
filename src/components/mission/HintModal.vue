<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog glass-panel">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title">
          <div class="icon-wrapper">
            <Lightbulb class="icon-hint" :size="18" />
          </div>
          <div class="title-text">
            <span class="sub-label">FLIGHT MANUAL &amp; DIAGNOSTICS</span>
            <span class="main-title">關卡通關錦囊與技術提示</span>
          </div>
        </div>
        <button class="btn-close" @click="$emit('close')" title="關閉手冊">
          <X :size="18" />
        </button>
      </div>

      <!-- Modal Body (Hints List) -->
      <div class="modal-body">
        <div v-for="(hint, idx) in hints" :key="idx" class="hint-card">
          <div class="hint-badge">
            <span class="beacon-dot warning"></span>
            <span>DIAGNOSTIC ADVISORY #0{{ idx + 1 }}</span>
          </div>
          <p class="hint-content">{{ hint }}</p>
        </div>

        <div v-if="hints.length === 0" class="no-hints">
          <span class="no-hints-text">本關暫無額外特殊提示，請依照主控台之遙測目標執行！</span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn btn-primary btn-sm btn-dismiss" @click="$emit('close')">
          <span>確認指引，返回飛行操作台</span>
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
  background: rgba(3, 6, 12, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  background: #0b1120;
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: modalEnter 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(10px);
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
  background: #10182b;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-hint {
  color: var(--warning-amber);
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.sub-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--warning-amber);
  letter-spacing: 0.08em;
}

.main-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  color: #ffffff;
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
  background: #060911;
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-left: 3px solid var(--warning-amber);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hint-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--warning-amber);
  letter-spacing: 0.05em;
}

.hint-content {
  font-size: 0.86rem;
  color: #e2e8f0;
  line-height: 1.6;
}

.no-hints {
  padding: 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.modal-footer {
  padding: 0.85rem 1.25rem;
  background: #090e1a;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.btn-dismiss {
  padding: 0.45rem 1rem;
}
</style>
