<template>
  <div class="control-panel-hud glass-panel">
    <div class="panel-header">
      <ShieldAlert :size="16" class="icon-shield" />
      <span>控制中心虛擬終端 (Mock DOM)</span>
    </div>

    <div class="panel-body">
      <div class="hud-item">
        <span class="hud-label">&lt;div id="status"&gt;</span>
        <div
          id="status"
          class="status-display"
          :style="{ color: statusStyleColor, borderColor: statusStyleColor }"
        >
          {{ statusText }}
        </div>
      </div>

      <div class="hud-item">
        <span class="hud-label">&lt;button id="btn-unlock"&gt;</span>
        <button
          id="btn-unlock"
          class="btn btn-unlock"
          :class="{ 'has-listener': hasListener }"
          @click="$emit('button-click', 'btn-unlock')"
        >
          <LockKeyhole :size="14" v-if="!isUnlocked" />
          <LockKeyholeOpen :size="14" v-else />
          <span>{{ buttonText }}</span>
        </button>
      </div>

      <div class="hud-helper-note" v-if="hasListener && !isUnlocked">
        💡 偵測到程式已註冊監聽器！你可以點擊上方按鈕測試觸發。
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
const statusStyleColor = computed(() => statusNode.value?.style?.color || '#ef4444');
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
  width: 290px;
  background: rgba(11, 16, 28, 0.9);
  border: 1px solid var(--border-accent);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  z-index: 10;
  pointer-events: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 242, 254, 0.1);
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cyan-primary);
}

.icon-shield {
  color: var(--cyan-primary);
}

.panel-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hud-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hud-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: #64748b;
}

.status-display {
  padding: 0.4rem 0.75rem;
  background: #060910;
  border: 1px solid #ef4444;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  transition: all 0.2s ease;
}

.btn-unlock {
  width: 100%;
  padding: 0.45rem;
  font-size: 0.8rem;
  background: #1e293b;
  border-color: #38bdf8;
  color: #38bdf8;
}

.btn-unlock.has-listener {
  border-color: var(--cyan-primary);
  background: rgba(0, 242, 254, 0.15);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
  animation: pulseButton 1.5s infinite;
}

@keyframes pulseButton {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.hud-helper-note {
  font-size: 0.7rem;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
</style>
