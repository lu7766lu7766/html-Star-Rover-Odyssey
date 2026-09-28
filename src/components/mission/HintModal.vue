<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title">
          <div class="icon-wrapper">
            <Lightbulb class="icon-hint" :size="20" />
          </div>
          <div class="title-text">
            <span class="sub-label">EXPLORATION GUIDE &amp; CONCEPT TIPS</span>
            <h3 class="main-title">任務探索錦囊與思考引導</h3>
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
            <span class="step-badge-num">STAGE 0{{ idx + 1 }}</span>
            <span class="step-badge-text">思考提示階段</span>
          </div>
          <p class="hint-content">{{ hint }}</p>
        </div>

        <div v-if="hints.length === 0" class="no-hints">
          <span class="no-hints-text">本關暫無額外特殊提示，請依照左側主控台之目標直接操作！</span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn btn-primary btn-sm btn-dismiss" @click="$emit('close')">
          <span>明白指引，返回操作台</span>
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
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  width: 100%;
  max-width: 540px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
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
  padding: 1.1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: #fef3c7;
  border: 1px solid #fde68a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-hint {
  color: #d97706;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sub-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  color: #d97706;
  letter-spacing: 0.06em;
}

.main-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.btn-close:hover {
  color: var(--text-main);
  background: #e2e8f0;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 60vh;
  overflow-y: auto;
  background: #ffffff;
}

.hint-card {
  background: #f8fafc;
  border: 1px solid #fed7aa;
  border-left: 4px solid #f97316;
  padding: 0.9rem 1.1rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.hint-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-badge-num {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  background: #ffedd5;
  color: #c2410c;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.step-badge-text {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9a3412;
}

.hint-content {
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}

.no-hints {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.modal-footer {
  padding: 0.9rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.btn-dismiss {
  padding: 0.5rem 1.2rem;
  font-weight: 600;
}
</style>
