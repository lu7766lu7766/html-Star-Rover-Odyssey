<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <GitBranch :size="18" class="text-brand" />
        <h3 class="deck-title">條件判斷邏輯樹 · Decision Branching</h3>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="mode === 'blocks' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'blocks'"
          title="條件積木模式（新手友善）"
        >
          <span>🧩 積木</span>
        </button>
        <button
          class="btn btn-sm"
          :class="mode === 'code' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'code'"
          title="手寫 JS 模式（含隱藏邊界拿 3 星）"
        >
          <span>⌨️ 寫碼</span>
        </button>
        <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="還原場景與參數至最初狀態">
          <RotateCcw :size="14" />
          <span>還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- 0. Code mode（L3：手寫 autoPilot，走 Worker 真測 + 隱藏邊界） -->
      <div v-if="mode === 'code'" class="code-mode-card card">
        <div class="code-mode-header">
          <div class="code-mode-title">
            <Code :size="15" class="text-brand" />
            <span>手寫 JS 挑戰 · 把 ___ 補成數字再執行</span>
          </div>
          <span class="badge badge-info">邊界全對 = 3星</span>
        </div>
        <div class="code-editor-wrap">
          <CodeEditor v-model="studentCode" :level-id="3" @reset="resetCode" />
        </div>
        <div class="code-mode-actions">
          <button class="btn btn-ghost btn-sm" @click="fillAnswerHint" title="填入提示數值">
            <span>💡 填入提示值</span>
          </button>
          <button
            class="btn btn-success execute-btn"
            :disabled="levelStore.isExecuting || !studentCode.trim()"
            @click="runCodeExecution"
          >
            <Play :size="16" />
            <span>{{ levelStore.isExecuting ? '沙箱執行中...' : '執行 JS 程式碼' }}</span>
          </button>
        </div>
        <div class="code-mode-logs" v-if="levelStore.executionLogs.length > 0">
          <div
            v-for="log in levelStore.executionLogs.slice(-4)"
            :key="log.id"
            class="mini-log"
            :class="'mini-log-' + log.type"
          >
            {{ log.message }}
          </div>
        </div>
      </div>

      <!-- Visual Condition Blocks -->
      <div v-if="mode === 'blocks'" class="conditions-flow">
        <!-- Branch 1: if distance < threshold1 -->
        <div class="branch-block card branch-if">
          <div class="branch-header">
            <span class="keyword-badge badge-blue">如果 (if)</span>
            <div class="condition-expression">
              <span>隕石距離 (distance) &lt;</span>
              <input
                v-model.number="rule1Threshold"
                type="number"
                min="1"
                max="20"
                class="num-input"
              />
              <span>單位</span>
            </div>
          </div>
          <div class="branch-action-row">
            <span class="action-arrow">➔ 執行動作：</span>
            <select v-model="rule1Action" class="action-select">
              <option value="" disabled>請選擇動作…</option>
              <option value="STOP">緊急停止避碰 (STOP)</option>
              <option value="SLOW_DOWN">減速巡航慢行 (SLOW_DOWN)</option>
              <option value="FULL_SPEED">全速前進巡航 (FULL_SPEED)</option>
            </select>
          </div>
        </div>

        <!-- Branch 2: else if distance < threshold2 -->
        <div class="branch-block card branch-elif">
          <div class="branch-header">
            <span class="keyword-badge badge-purple">否則如果 (else if)</span>
            <div class="condition-expression">
              <span>隕石距離 (distance) &lt;</span>
              <input
                v-model.number="rule2Threshold"
                type="number"
                min="5"
                max="30"
                class="num-input"
              />
              <span>單位</span>
            </div>
          </div>
          <div class="branch-action-row">
            <span class="action-arrow">➔ 執行動作：</span>
            <select v-model="rule2Action" class="action-select">
              <option value="" disabled>請選擇動作…</option>
              <option value="STOP">緊急停止避碰 (STOP)</option>
              <option value="SLOW_DOWN">減速巡航慢行 (SLOW_DOWN)</option>
              <option value="FULL_SPEED">全速前進巡航 (FULL_SPEED)</option>
            </select>
          </div>
        </div>

        <!-- Branch 3: else -->
        <div class="branch-block card branch-else">
          <div class="branch-header">
            <span class="keyword-badge badge-warning">否則 (else)</span>
            <span class="condition-fallback-label">前方空域開闊安全時</span>
          </div>
          <div class="branch-action-row">
            <span class="action-arrow">➔ 執行動作：</span>
            <select v-model="fallbackAction" class="action-select">
              <option value="" disabled>請選擇動作…</option>
              <option value="STOP">緊急停止避碰 (STOP)</option>
              <option value="SLOW_DOWN">減速巡航慢行 (SLOW_DOWN)</option>
              <option value="FULL_SPEED">全速前進巡航 (FULL_SPEED)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Live Simulator / Test Distances Preview（跑後才揭曉） -->
      <div class="preview-card card">
        <h4 class="preview-title">雷達測距測試情境 (Telemetry Test Preview) · 執行後揭曉</h4>
        <div v-if="!hasRunOnce" class="preview-locked">
          <span>🔒 先按「執行 JS 程式碼」或「啟動避障巡航測試」，跑完才顯示各距離判定。先想，再驗證。</span>
        </div>
        <div v-else class="preview-grid">
          <div
            v-for="dist in [3, 10, 22]"
            :key="dist"
            class="dist-test-item"
            :class="getDecisionClass(dist)"
          >
            <span class="dist-val">測距: {{ dist }} 單位</span>
            <div class="dist-result">
              <span>判定行為: </span>
              <strong>{{ getDecisionText(dist) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        {{ mode === 'code' ? '寫碼模式：在上方編輯器按「執行 JS 程式碼」（含 5/15 隱藏邊界）' : '需依序通過 3 單位、10 單位與 22 單位的雷達避障測試' }}
      </div>
      <button
        v-if="mode === 'blocks'"
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '避障自駕測試中...' : '啟動避障巡航測試' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { GitBranch, RotateCcw, Play, Code } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { LEVEL_3_STARTER_CODE } from '../../levels/level-3.js';
import CodeEditor from '../editor/CodeEditor.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

// 混合漸進：預設寫碼模式，積木當鷹架
const mode = ref('code');
const studentCode = ref(LEVEL_3_STARTER_CODE);
const hasRunOnce = ref(false);

const rule1Threshold = ref(5);
const rule1Action = ref('');

const rule2Threshold = ref(15);
const rule2Action = ref('');

const fallbackAction = ref('');

onMounted(() => {
  const saved = progressStore.getSavedOperation(3);
  if (saved) {
    if (typeof saved.code === 'string' && saved.code.length > 0) {
      studentCode.value = saved.code;
    }
    if (saved.rules) {
      rule1Threshold.value = saved.rules.rule1Threshold ?? 5;
      rule1Action.value = saved.rules.rule1Action ?? '';
      rule2Threshold.value = saved.rules.rule2Threshold ?? 15;
      rule2Action.value = saved.rules.rule2Action ?? '';
      fallbackAction.value = saved.rules.fallbackAction ?? '';
    }
  }
});

function evaluateDecision(dist) {
  if (dist < rule1Threshold.value) return rule1Action.value;
  if (dist < rule2Threshold.value) return rule2Action.value;
  return fallbackAction.value;
}

function getDecisionText(dist) {
  const act = evaluateDecision(dist);
  if (!act) return '未選擇動作';
  if (act === 'STOP') return '緊急停止 (STOP)';
  if (act === 'SLOW_DOWN') return '減速慢行 (SLOW_DOWN)';
  if (act === 'FULL_SPEED') return '全速前進 (FULL_SPEED)';
  return act;
}

function getDecisionClass(dist) {
  const act = evaluateDecision(dist);
  if (act === 'STOP') return 'tag-danger-bg';
  if (act === 'SLOW_DOWN') return 'tag-warning-bg';
  return 'tag-success-bg';
}

function resetDefaults() {
  levelStore.resetCurrentLevel();
}

function runExecution() {
  hasRunOnce.value = true;
  levelStore.executeLevel({
    rules: {
      rule1Threshold: rule1Threshold.value,
      rule1Action: rule1Action.value,
      rule2Threshold: rule2Threshold.value,
      rule2Action: rule2Action.value,
      fallbackAction: fallbackAction.value
    }
  });
}

function runCodeExecution() {
  hasRunOnce.value = true;
  levelStore.executeLevel({
    code: studentCode.value
  });
}

function resetCode() {
  studentCode.value = LEVEL_3_STARTER_CODE;
}

function fillAnswerHint() {
  studentCode.value = studentCode.value
    .replace('distance < ___', 'distance < 5')
    .replace('distance < ___', 'distance < 15');
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* L3: code mode + locked preview */
.code-mode-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.code-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-mode-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.code-editor-wrap {
  height: 260px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.code-mode-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.code-mode-logs {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mini-log {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-hover);
  border: 1px solid var(--border-subtle);
  white-space: pre-wrap;
  word-break: break-all;
}

.mini-log-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.mini-log-success {
  background: #f0fdf4;
  border-color: #86efac;
  color: #15803d;
}

.preview-locked {
  padding: 0.8rem;
  background: var(--bg-panel-hover);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conditions-flow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.branch-block {
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.branch-if {
  border-left: 4px solid var(--primary-blue);
}

.branch-elif {
  border-left: 4px solid var(--accent-purple);
}

.branch-else {
  border-left: 4px solid var(--warning);
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.keyword-badge {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

.badge-blue {
  background: var(--primary-blue-light);
  color: var(--primary-blue);
}

.badge-purple {
  background: var(--accent-purple-light);
  color: var(--text-purple);
}

.badge-warning {
  background: var(--warning-light);
  color: var(--warning-dark);
}

.condition-expression {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.condition-fallback-label {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.num-input {
  width: 58px;
  padding: 0.25rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
  outline: none;
}

.num-input:focus {
  border-color: var(--primary-blue);
}

.branch-action-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.action-arrow {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.action-select {
  flex: 1;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  background: #ffffff;
  outline: none;
  cursor: pointer;
}

.action-select:focus {
  border-color: var(--primary-blue);
}

/* Preview */
.preview-card {
  background: var(--bg-panel-hover);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.preview-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
}

.dist-test-item {
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.dist-val {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.76rem;
}

.tag-danger-bg {
  background: var(--danger-light);
  border-color: var(--danger-border);
  color: var(--danger-dark);
}

.tag-warning-bg {
  background: var(--warning-light);
  border-color: var(--warning-border);
  color: var(--warning-dark);
}

.tag-success-bg {
  background: var(--success-light);
  border-color: var(--success-border);
  color: var(--success-dark);
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
