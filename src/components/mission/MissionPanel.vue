<template>
  <div class="mission-panel">
    <div class="mission-header">
      <div class="level-tag-row">
        <span class="badge badge-cyan">LEVEL 0{{ level.id }}</span>
        <span class="level-subtitle">{{ level.subtitle }}</span>
        <span v-if="isCompleted" class="badge badge-emerald">
          <Check :size="12" /> 已通關
        </span>
      </div>
      <h2 class="mission-title">{{ level.title }}</h2>
    </div>

    <div class="mission-scrollable">
      <!-- Concepts -->
      <div class="section concepts-section">
        <div class="section-title">核心學習概念</div>
        <div class="concept-tags">
          <span v-for="c in level.concepts" :key="c" class="concept-chip">
            {{ c }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <div class="section">
        <div class="section-title">任務情境與目標</div>
        <p class="mission-desc">{{ level.description }}</p>
      </div>

      <!-- Target Checklist -->
      <div class="section">
        <div class="section-title">通關檢驗指標</div>
        <ul class="requirements-list">
          <li v-for="(req, idx) in level.targetRequirements" :key="idx" class="requirement-item">
            <span class="bullet" :class="{ 'bullet-active': isCompleted }"></span>
            <span>{{ req }}</span>
          </li>
        </ul>
      </div>

      <!-- Available APIs -->
      <div class="section">
        <div class="section-title">本關可用 API</div>
        <div class="api-list">
          <code v-for="(api, idx) in level.availableAPI" :key="idx" class="api-code">
            {{ api }}
          </code>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="mission-footer">
      <button class="btn btn-sm btn-hint" @click="$emit('open-hint')">
        <Lightbulb :size="15" />
        <span>查看關卡提示 ({{ level.hints?.length || 0 }})</span>
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
  background: var(--bg-panel-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.mission-header {
  padding: 0.85rem 1rem;
  background: #0d1422;
  border-bottom: 1px solid var(--border-subtle);
}

.level-tag-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.level-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.mission-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-display);
}

.mission-scrollable {
  flex: 1;
  padding: 0.85rem 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--cyan-primary);
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
  font-family: var(--font-display);
}

.concept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.concept-chip {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.25);
  color: #38bdf8;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.mission-desc {
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.5;
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
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #475569;
}

.bullet-active {
  background: var(--success-emerald);
  box-shadow: 0 0 8px var(--success-emerald);
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.api-code {
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #f1f5f9;
}

.mission-footer {
  padding: 0.6rem 1rem;
  background: #0b111e;
  border-top: 1px solid var(--border-subtle);
}

.btn-hint {
  width: 100%;
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.btn-hint:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: var(--warning-amber);
}
</style>
