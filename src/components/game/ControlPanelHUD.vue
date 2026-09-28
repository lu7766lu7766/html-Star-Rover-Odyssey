<template>
  <div class="control-panel-hud glass-panel">
    <!-- Terminal Header -->
    <div class="panel-header">
      <div class="header-left">
        <ShieldAlert :size="15" class="icon-shield" />
        <span class="panel-title">MOCK DOM VIRTUAL TERMINAL</span>
      </div>
      <span class="beacon-dot" :class="isUnlocked ? 'success' : 'warning'"></span>
    </div>

    <!-- Terminal Body -->
    <div class="panel-body">
      <!-- Status Readout -->
      <div class="hud-item">
        <div class="hud-label-row">
          <span class="hud-node-tag">&lt;div id="status"&gt;</span>
          <span class="node-state-label">LIVE PROPERTY</span>
        </div>
        <div
          id="status"
          class="status-display"
          :style="{
            color: statusStyleColor,
            borderColor: statusStyleColor,
            boxShadow: `0 0 12px ${statusStyleColor}40`
          }"
        >
          <span class="status-value">{{ statusText }}</span>
        </div>
      </div>

      <!-- Unlock Action Button Node -->
      <div class="hud-item">
        <div class="hud-label-row">
          <span class="hud-node-tag">&lt;button id="btn-unlock"&gt;</span>
          <span v-if="hasListener" class="node-listener-active">LISTENER BOUND</span>
        </div>
        <button
          id="btn-unlock"
          class="btn btn-unlock"
          :class="{ 'has-listener': hasListener, 'is-unlocked': isUnlocked }"
          @click="$emit('button-click', 'btn-unlock')"
        >
          <LockKeyhole :size="14" v-if="!isUnlocked" />
          <LockKeyholeOpen :size="14" v-else />
          <span>{{ buttonText }}</span>
        </button>
      </div>

      <!-- Interactive Cue -->
      <div class="hud-helper-note" v-if="hasListener && !isUnlocked">
        <span class="note-icon">⚡</span>
        <span>已偵測到 JavaScript 事件監聽器！請點擊上方按鈕測試觸發回呼。</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ShieldAlert, LockKeyhole, LockKeyholeOpen } from 'lucide-vue-next';

const props = defineProps({
  mockDomState: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['button-click']);

const statusNode = computed(() => props.mockDomState?.['status']);
const buttonNode = computed(() => props.mockDomState?.['btn-unlock']);

const statusText = computed(() => statusNode.value?.innerText || '鎖定中');
const statusStyleColor = computed(() => statusNode.value?.style?.color || '#f43f5e');
const buttonText = computed(() => buttonNode.value?.innerText || '解除安全鎖');
const hasListener = computed(() => buttonNode.value?.hasListener || false);

const isUnlocked = computed(() => {
  const t = statusText.value;
  return t.includes('解鎖') || t.includes('開啟') || t.includes('PASS') || t.includes('正常');
});
</script>

<style scoped>
.control-panel-hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 300px;
  background: rgba(10, 15, 27, 0.92);
  border: 1px solid var(--border-accent);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 229, 255, 0.15);
  border-radius: var(--radius-md);
  z-index: 10;
  pointer-events: auto;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.85rem;
  background: #0f182c;
  border-bottom: 1px solid var(--border-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-shield {
  color: var(--cyan-primary);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--cyan-primary);
  letter-spacing: 0.05em;
}

.panel-body {
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hud-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.hud-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hud-node-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

.node-state-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: #475569;
  font-weight: 600;
}

.node-listener-active {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--success-emerald);
  font-weight: 700;
  background: rgba(16, 185, 129, 0.12);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
}

.status-display {
  padding: 0.55rem 0.85rem;
  background: #04070e;
  border: 1px solid #f43f5e;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
  transition: all 0.25s ease;
  letter-spacing: 0.05em;
}

.btn-unlock {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.82rem;
  background: #141c2e;
  border-color: rgba(255, 255, 255, 0.15);
  color: #94a3b8;
}

.btn-unlock.has-listener {
  border-color: var(--cyan-primary);
  background: rgba(0, 229, 255, 0.14);
  color: #ffffff;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
  animation: pulseButton 1.6s infinite ease-in-out;
}

.btn-unlock.is-unlocked {
  border-color: var(--success-emerald);
  background: rgba(16, 185, 129, 0.18);
  color: #d1fae5;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
}

@keyframes pulseButton {
  0%, 100% { transform: scale(1); box-shadow: 0 0 14px rgba(0, 229, 255, 0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 22px rgba(0, 229, 255, 0.6); }
}

.hud-helper-note {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.08);
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(16, 185, 129, 0.25);
  line-height: 1.45;
}

.note-icon {
  flex-shrink: 0;
}
</style>
