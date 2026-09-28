<template>
  <div class="console-panel">
    <!-- Telemetry Log Header -->
    <div class="console-header">
      <div class="header-left">
        <Terminal class="icon-terminal" :size="14" />
        <span class="console-title">SUB-ORBITAL TELEMETRY CONSOLE</span>
        <span class="log-count-pill" v-if="logs.length > 0">{{ logs.length }} ENTRIES</span>
      </div>
      <button class="btn btn-sm btn-clear" @click="$emit('clear')" title="清空遙測日誌">
        <Trash2 :size="12" />
        <span>清空日誌</span>
      </button>
    </div>

    <!-- Telemetry Stream Output -->
    <div class="console-body" ref="bodyRef">
      <div v-if="logs.length === 0" class="console-empty">
        <div class="empty-radar"></div>
        <span class="empty-prompt">等待探測船指令執行 · STANDBY FOR TELEMETRY STREAM</span>
      </div>
      <div
        v-for="log in logs"
        :key="log.id"
        :class="['log-entry', `log-${log.type}`]"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-tag">[{{ log.type.toUpperCase() }}]</span>
        <span class="log-text">{{ formatArgs(log.args) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { Terminal, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
});

defineEmits(['clear']);

const bodyRef = ref(null);

function formatArgs(args) {
  if (!args || args.length === 0) return '';
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

// Auto scroll on new logs
watch(() => props.logs.length, () => {
  nextTick(() => {
    if (bodyRef.value) {
      bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.console-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #050811;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  position: relative;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  height: 34px;
  background: #090e1a;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-terminal {
  color: var(--cyan-primary);
}

.console-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.log-count-pill {
  font-size: 0.62rem;
  font-weight: 700;
  background: rgba(0, 229, 255, 0.1);
  color: var(--cyan-primary);
  border: 1px solid rgba(0, 229, 255, 0.25);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
}

.btn-clear {
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-muted);
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.console-body {
  flex: 1;
  padding: 0.6rem 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background-image: linear-gradient(rgba(0, 229, 255, 0.015) 1px, transparent 1px);
  background-size: 100% 24px;
}

.console-empty {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #475569;
  font-size: 0.72rem;
  padding: 0.5rem 0;
  letter-spacing: 0.03em;
}

.empty-radar {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #334155;
  box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4);
  animation: radarPulse 2s infinite;
}

@keyframes radarPulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(0, 229, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  line-height: 1.45;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
}

.log-time {
  color: #475569;
  font-size: 0.7rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.log-tag {
  font-weight: 700;
  font-size: 0.68rem;
  flex-shrink: 0;
  margin-top: 1px;
  letter-spacing: 0.02em;
}

.log-log .log-tag { color: var(--cyan-primary); }
.log-log .log-text { color: #f1f5f9; }

.log-warn {
  background: rgba(245, 158, 11, 0.06);
  border-left: 2px solid var(--warning-amber);
}
.log-warn .log-tag { color: var(--warning-amber); }
.log-warn .log-text { color: #fef3c7; }

.log-error {
  background: rgba(244, 63, 94, 0.1);
  border-left: 2px solid var(--danger-crimson);
}
.log-error .log-tag { color: var(--danger-crimson); }
.log-error .log-text { color: #fecdd3; font-weight: 500; }
</style>
