<template>
  <div class="mission-panel">
    <!-- Flight Directive Header -->
    <div class="mission-header">
      <div class="level-meta-row">
        <div class="level-badge-group">
          <span class="badge badge-cyan">STATION 0{{ level.id }}</span>
          <span class="mission-code">{{ level.subtitle }}</span>
        </div>
        <div v-if="isCompleted" class="badge badge-emerald completed-badge">
          <Check :size="12" />
          <span>NOMINAL PASS</span>
        </div>
        <div v-else class="badge badge-cyan awaiting-badge">
          <span class="beacon-dot"></span>
          <span>AWAITING EXECUTION</span>
        </div>
      </div>
      <h2 class="mission-title">{{ level.title }}</h2>
    </div>

    <!-- Scrollable Flight Directives -->
    <div class="mission-scrollable">
      <!-- Concepts Section -->
      <div class="directive-section">
        <div class="section-label">
          <span class="label-indicator"></span>
          <span>核心語法概念 · CONCEPTS</span>
        </div>
        <div class="concept-tags">
          <span v-for="c in level.concepts" :key="c" class="concept-chip">
            {{ c }}
          </span>
        </div>
      </div>

      <!-- Situation / Objective -->
      <div class="directive-section">
        <div class="section-label">
          <span class="label-indicator"></span>
          <span>任務簡報情境 · BRIEFING</span>
        </div>
        <p class="mission-desc">{{ level.description }}</p>
      </div>

      <!-- Verification Requirements Checklist -->
      <div class="directive-section">
        <div class="section-label">
          <span class="label-indicator"></span>
          <span>遙測驗證指標 · TELEMETRY CHECKLIST</span>
        </div>
        <ul class="requirements-list">
          <li
            v-for="(req, idx) in level.targetRequirements"
            :key="idx"
            class="requirement-item"
            :class="{ 'is-completed': isCompleted }"
          >
            <div class="req-led" :class="{ 'led-active': isCompleted }"></div>
            <span class="req-text">{{ req }}</span>
          </li>
        </ul>
      </div>

      <!-- Mission API Reference -->
      <div class="directive-section">
        <div class="section-label">
          <span class="label-indicator"></span>
          <span>本關可用探測船介面 · SUBSYSTEM APIS</span>
        </div>
        <div class="api-list">
          <div v-for="(api, idx) in level.availableAPI" :key="idx" class="api-card">
            <span class="api-symbol">&gt;</span>
            <code class="api-code">{{ api }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Directive Footer / Hints Action -->
    <div class="mission-footer">
      <button class="btn btn-sm btn-hint" @click="$emit('open-hint')">
        <Lightbulb :size="14" class="icon-hint" />
        <span class="hint-text">查閱飛行手冊與錦囊提示</span>
        <span class="hint-count-pill">{{ level.hints?.length || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Check, Lightbulb } from 'lucide-vue-next';

defineProps({
  level: {
    type: Object,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

defineEmits(['open-hint']);
</script>

<style scoped>
.mission-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-panel);
  position: relative;
  overflow: hidden;
}

.mission-header {
  padding: 0.75rem 1rem 0.65rem 1rem;
  background: #0d1322;
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
}

.mission-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 120px;
  height: 1px;
  background: var(--cyan-primary);
  box-shadow: 0 0 8px var(--cyan-glow);
}

.level-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.level-badge-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mission-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.awaiting-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  background: rgba(0, 229, 255, 0.05);
  border-color: rgba(0, 229, 255, 0.2);
}

.completed-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
}

.mission-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: #ffffff;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.mission-scrollable {
  flex: 1;
  padding: 0.85rem 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.directive-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--cyan-primary);
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.label-indicator {
  width: 4px;
  height: 4px;
  background: var(--cyan-primary);
  border-radius: 1px;
}

.concept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.concept-chip {
  background: rgba(0, 229, 255, 0.07);
  border: 1px solid rgba(0, 229, 255, 0.22);
  color: #38bdf8;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all var(--transition-fast);
}

.concept-chip:hover {
  background: rgba(0, 229, 255, 0.14);
  border-color: var(--cyan-primary);
  color: #ffffff;
}

.mission-desc {
  font-size: 0.84rem;
  color: #cbd5e1;
  line-height: 1.6;
  white-space: pre-line;
}

.requirements-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.45;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 0.35rem 0.55rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.requirement-item.is-completed {
  border-color: rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.04);
  color: #cbd5e1;
}

.req-led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #334155;
  margin-top: 5px;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.req-led.led-active {
  background: var(--success-emerald);
  box-shadow: 0 0 8px var(--success-emerald);
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.api-card {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #080c16;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: border-color var(--transition-fast);
}

.api-card:hover {
  border-color: rgba(0, 229, 255, 0.3);
}

.api-symbol {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--cyan-primary);
  font-weight: 700;
}

.api-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #e2e8f0;
  letter-spacing: 0.01em;
}

.mission-footer {
  padding: 0.55rem 0.85rem;
  background: #090e1a;
  border-top: 1px solid var(--border-subtle);
}

.btn-hint {
  width: 100%;
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  justify-content: space-between;
  padding: 0.45rem 0.85rem;
}

.btn-hint:hover {
  background: rgba(245, 158, 11, 0.18);
  border-color: var(--warning-amber);
  color: #fef3c7;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
}

.icon-hint {
  color: var(--warning-amber);
}

.hint-count-pill {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.25);
  color: #ffffff;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
}
</style>
