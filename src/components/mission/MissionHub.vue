<template>
  <aside class="mission-hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="hub-title-row">
        <Target :size="18" class="text-brand" />
        <h2 class="hub-title">任務簡報 · Mission Brief</h2>
      </div>
      <span class="badge badge-blue">LEVEL {{ level.id }}</span>
    </div>

    <!-- Scrollable Content -->
    <div class="hub-content">
      <!-- Mission Objective Box -->
      <section class="info-card card">
        <h3 class="card-title">{{ level.title }}</h3>
        <p class="mission-story">{{ level.description }}</p>

        <div class="requirements-box">
          <span class="req-title">通關要求 (Requirements)：</span>
          <ul class="req-list">
            <li v-for="(req, idx) in level.targetRequirements" :key="idx" class="req-item">
              <CheckCircle2 v-if="isCompleted" :size="15" class="text-success req-icon" />
              <Circle v-else :size="15" class="text-muted req-icon" />
              <span>{{ req }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Execution Status & Diagnostic Feedback -->
      <section v-if="lastRunResult" class="feedback-card card" :class="lastRunResult.pass ? 'feedback-pass' : 'feedback-fail'">
        <div class="feedback-header">
          <CheckCircle2 v-if="lastRunResult.pass" :size="20" class="text-success" />
          <AlertCircle v-else :size="20" class="text-danger" />
          <strong class="feedback-title">{{ lastRunResult.pass ? '任務驗證成功！' : '遙測檢驗未通過' }}</strong>
        </div>
        <p class="feedback-body">
          {{ lastRunResult.pass ? lastRunResult.feedback : lastRunResult.error }}
        </p>
      </section>

      <!-- Core Concept Card -->
      <section class="concept-card card">
        <div class="concept-header">
          <BookOpen :size="16" class="text-purple" />
          <h4 class="concept-name">{{ level.conceptTitle }}</h4>
        </div>
        <p class="concept-text">{{ level.conceptExplanation }}</p>
      </section>

      <!-- JavaScript Code Peek (Collapsible by default as per PRD 4.2) -->
      <section class="code-peek-card card">
        <div class="peek-header" @click="levelStore.toggleCodePeek">
          <div class="peek-title">
            <Code2 :size="16" class="text-brand" />
            <span>JavaScript 程式碼對照</span>
          </div>
          <button class="btn btn-ghost btn-sm peek-toggle-btn">
            <ChevronUp v-if="levelStore.isCodePeekOpen" :size="16" />
            <ChevronDown v-else :size="16" />
          </button>
        </div>

        <transition name="expand">
          <div v-if="levelStore.isCodePeekOpen" class="peek-body">
            <div class="code-box">
              <pre><code>{{ level.jsCodeExample }}</code></pre>
            </div>
            <span class="code-tip">💡 提示：此程式碼為實際執行背後對應的 JavaScript 語法，供比對與延伸理解。</span>
          </div>
        </transition>
      </section>
    </div>

    <!-- Stepwise Hints Modal -->
    <div v-if="levelStore.isHintModalOpen" class="modal-overlay" @click.self="levelStore.toggleHintModal(false)">
      <div class="modal-card card">
        <div class="modal-header">
          <div class="flex-row">
            <HelpCircle :size="18" class="text-warning" />
            <h3 class="modal-title">任務導引提示</h3>
          </div>
          <button class="btn btn-ghost btn-sm" @click="levelStore.toggleHintModal(false)">
            <X :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <div v-for="(hint, i) in level.hints" :key="i" class="hint-bubble">
            <span class="hint-index">#{{ i + 1 }}</span>
            <p class="hint-text">{{ hint }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="levelStore.toggleHintModal(false)">我知道了</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import {
  Target, CheckCircle2, Circle, AlertCircle, BookOpen, Code2,
  ChevronDown, ChevronUp, HelpCircle, X
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const level = computed(() => levelStore.currentLevel);
const isCompleted = computed(() => progressStore.isLevelCompleted(level.value.id));
const lastRunResult = computed(() => levelStore.lastRunResult);
</script>

<style scoped>
.mission-hub {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-subtle);
  overflow: hidden;
}

.hub-header {
  height: 52px;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-panel-hover);
}

.hub-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hub-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.hub-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mission-story {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.requirements-box {
  background: var(--bg-panel-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.req-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.req-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.req-item {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.req-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* Feedback Card */
.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.feedback-pass {
  background: var(--success-light);
  border-color: var(--success-border);
}

.feedback-fail {
  background: var(--danger-light);
  border-color: var(--danger-border);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feedback-title {
  font-size: 0.9rem;
}

.feedback-pass .feedback-title,
.feedback-pass .feedback-body {
  color: var(--success-dark);
}

.feedback-fail .feedback-title,
.feedback-fail .feedback-body {
  color: var(--danger-dark);
}

.feedback-body {
  font-size: 0.85rem;
  line-height: 1.5;
}

/* Concept Card */
.concept-card {
  background: var(--accent-purple-light);
  border-color: #ddd6fe;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.concept-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.concept-name {
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-purple);
}

.concept-text {
  font-size: 0.82rem;
  color: #4c1d95;
  line-height: 1.5;
}

/* Code Peek Card */
.code-peek-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.peek-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.peek-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.code-box {
  background: #0f172a;
  border-radius: var(--radius-md);
  padding: 0.85rem;
  overflow-x: auto;
}

.code-box pre {
  margin: 0;
}

.code-box code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #38bdf8;
  line-height: 1.5;
}

.code-tip {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 0.4rem;
  display: block;
}

/* Modal */
.modal-overlay {
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
  z-index: 100;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: var(--shadow-elevated);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.65rem;
}

.flex-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
}

.hint-bubble {
  background: var(--warning-light);
  border: 1px solid var(--warning-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
}

.hint-index {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--warning-dark);
}

.hint-text {
  font-size: 0.85rem;
  color: var(--warning-dark);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
