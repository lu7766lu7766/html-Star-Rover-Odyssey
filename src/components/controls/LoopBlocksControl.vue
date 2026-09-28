<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <Repeat :size="18" class="text-brand" />
        <h3 class="deck-title">迴圈結構與重複計數器 · Loop Constructor</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="重置迴圈">
        <RotateCcw :size="14" />
        <span>預設值</span>
      </button>
    </div>

    <div class="deck-content">
      <!-- Loop Wrapper Block (Scratch/Blockly inspired visual enclosure) -->
      <div class="loop-container card">
        <div class="loop-top-bar">
          <span class="loop-keyword">重複執行 (for loop)</span>
          <div class="loop-stepper">
            <button class="step-btn" @click="changeCount(-1)" :disabled="loopCount <= 1">-</button>
            <span class="count-display">{{ loopCount }}</span>
            <button class="step-btn" @click="changeCount(1)" :disabled="loopCount >= 10">+</button>
            <span class="unit-text">次 (times)</span>
          </div>
        </div>

        <!-- Loop Inner Body -->
        <div class="loop-inner-slot">
          <div class="slot-label">迴圈主體內執行的指令 (Loop Body)：</div>
          <div class="loop-action-card card">
            <div class="action-icon-wrap">
              <Sparkles :size="16" class="text-brand" />
            </div>
            <div class="action-info">
              <strong>機械臂採集水晶 (harvestCrystal)</strong>
              <span>每次循環將伸出機械爪，精準採集 1 顆發光水晶</span>
            </div>
          </div>
        </div>

        <div class="loop-bottom-bar">
          <span class="loop-end-tag">&#125; // 迴圈結束標記</span>
        </div>
      </div>

      <!-- Iteration Timeline Preview -->
      <div class="preview-card card">
        <div class="preview-header">
          <span class="preview-title">預計執行歷程預覽 ({{ loopCount }} 次循環)：</span>
          <span
            class="badge"
            :class="loopCount === 5 ? 'badge-success' : (loopCount < 5 ? 'badge-warning' : 'badge-danger')"
          >
            {{ loopCount === 5 ? '✓ 剛好採集 5 顆' : (loopCount < 5 ? `不足 (僅 ${loopCount}/5 顆)` : `過多 (空抓 ${loopCount - 5} 次)`) }}
          </span>
        </div>

        <div class="timeline-pills">
          <div
            v-for="i in loopCount"
            :key="i"
            class="timeline-pill"
            :class="i <= 5 ? 'pill-crystal' : 'pill-empty'"
          >
            <Sparkles v-if="i <= 5" :size="12" />
            <AlertTriangle v-else :size="12" />
            <span>第 {{ i }} 次{{ i > 5 ? ' (空採)' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        水晶礦脈剛好儲備 5 顆發光晶體 · 請設定剛好的重複次數
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '機械臂採集中...' : '啟動自動化採集迴圈' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Repeat, RotateCcw, Sparkles, AlertTriangle, Play } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const loopCount = ref(3);
const action = ref('HARVEST_CRYSTAL');

onMounted(() => {
  const saved = progressStore.getSavedOperation(4);
  if (saved && saved.loopConfig) {
    loopCount.value = saved.loopConfig.loopCount ?? 3;
    action.value = saved.loopConfig.action ?? 'HARVEST_CRYSTAL';
  }
});

function changeCount(delta) {
  const next = loopCount.value + delta;
  if (next >= 1 && next <= 10) {
    loopCount.value = next;
  }
}

function resetDefaults() {
  loopCount.value = 3;
}

function runExecution() {
  levelStore.executeLevel({
    loopConfig: {
      loopCount: loopCount.value,
      action: action.value
    }
  });
}
</script>

<style scoped>
.control-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-top: 1px solid var(--border-subtle);
  overflow: hidden;
}

.deck-header {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-panel-hover);
}

.deck-title-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.deck-title {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Loop Visual Container */
.loop-container {
  border-left: 5px solid var(--primary-blue);
  background: #ffffff;
  padding: 0;
  overflow: hidden;
}

.loop-top-bar {
  background: var(--primary-blue-light);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-accent-light);
}

.loop-keyword {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--primary-blue);
}

.loop-stepper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.step-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  background: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

.count-display {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary-blue);
  min-width: 24px;
  text-align: center;
}

.unit-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.loop-inner-slot {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
  border-left: 2px dashed var(--border-medium);
}

.slot-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.loop-action-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: var(--bg-panel-hover);
}

.action-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--primary-blue-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.action-info strong {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.action-info span {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.loop-bottom-bar {
  background: var(--bg-panel-hover);
  padding: 0.4rem 1rem;
  border-top: 1px solid var(--border-subtle);
}

.loop-end-tag {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Timeline */
.preview-card {
  background: var(--bg-panel-hover);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.timeline-pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.timeline-pill {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-crystal {
  background: var(--success-light);
  border: 1px solid var(--success-border);
  color: var(--success-dark);
}

.pill-empty {
  background: var(--danger-light);
  border: 1px solid var(--danger-border);
  color: var(--danger-dark);
}

.deck-footer {
  height: 52px;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-panel-hover);
}

.footer-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.execute-btn {
  padding: 0.5rem 1.4rem;
  font-size: 0.92rem;
}
</style>
