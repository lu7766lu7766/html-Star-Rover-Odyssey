<template>
  <div class="console-panel">
    <div class="console-header">
      <div class="console-title">
        <Terminal class="icon-terminal" :size="16" />
        <span>主控台 (Console)</span>
        <span class="badge badge-cyan" v-if="logs.length > 0">{{ logs.length }} 則輸出</span>
      </div>
      <button class="btn btn-sm btn-clear" @click="$emit('clear')" title="清空主控台">
        <Trash2 :size="14" />
        <span>清空</span>
      </button>
    </div>

    <div class="console-body" ref="bodyRef">
      <div v-if="logs.length === 0" class="console-empty">
        <span class="empty-prompt">等待程式執行... 點擊「執行程式」觀察輸出與 3D 響應。</span>
      </div>
      <div
        v-for="log in logs"
        :key="log.id"
        :class="['log-item', `log-${log.type}`]"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-badge">[{{ log.type.toUpperCase() }}]</span>
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
  background: #070a11;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  background: #0c121e;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
}

.console-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.icon-terminal {
  color: var(--cyan-primary);
}

.btn-clear {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.console-body {
  flex: 1;
  padding: 0.6rem 0.8rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.console-empty {
  color: var(--text-muted);
  font-style: italic;
  padding: 0.5rem 0;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.4;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-time {
  color: #475569;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.log-badge {
  font-weight: 700;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.log-log .log-badge { color: #38bdf8; }
.log-log .log-text { color: #f1f5f9; }

.log-warn .log-badge { color: #f59e0b; }
.log-warn .log-text { color: #fef3c7; }

.log-error {
  background: rgba(239, 68, 68, 0.12);
  border-left: 3px solid #ef4444;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
}
.log-error .log-badge { color: #ef4444; }
.log-error .log-text { color: #fca5a5; font-weight: 500; }
</style>
