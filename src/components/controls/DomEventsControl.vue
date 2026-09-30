<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <MousePointer :size="18" class="text-brand" />
        <h3 class="deck-title">DOM 事件實驗室 · 幫網頁按鈕接上電線</h3>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="mode === 'blocks' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'blocks'"
          title="接線表單模式（新手友善，上限 2 星）"
        >
          <span>🧩 接線</span>
        </button>
        <button
          class="btn btn-sm"
          :class="mode === 'code' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'code'"
          title="手寫 JS 模式（模擬點擊驗證拿 3 星）"
        >
          <span>⌨️ 寫碼</span>
        </button>
        <button class="btn btn-ghost btn-sm" @click="onReset" title="還原場景與參數至最初狀態">
          <RotateCcw :size="14" />
          <span>還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- 0. Code mode（L6：手寫接線＋回呼，走 Worker 模擬點擊） -->
      <div v-if="mode === 'code'" class="code-mode-card card">
        <div class="code-mode-header">
          <div class="code-mode-title">
            <Code :size="15" class="text-brand" />
            <span>手寫 JS 挑戰 · 把 ___ 補完再執行</span>
          </div>
          <span class="badge badge-info">守衛判斷 = 3星</span>
        </div>
        <div class="code-editor-wrap">
          <CodeEditor v-model="studentCode" :level-id="6" @reset="resetCode" />
        </div>
        <div class="code-mode-note">
          <span>系統會自動點擊驗證：先解除警報再開門（門要開），以及警報中直接開門（門必須關著）。上方 2D 網頁僅供表單模式操作。</span>
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
            <span>{{ levelStore.isExecuting ? '模擬點擊中...' : '執行 JS 並模擬點擊' }}</span>
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

      <!-- Steps checklist -->
      <div v-if="mode === 'blocks'" class="steps-row">
        <div class="step" :class="{ done: step1Done }">
          <span class="step-num">1</span>
          <span>兩顆按鈕都綁 <b>click</b></span>
          <span class="step-check">{{ step1Done ? '✓' : '○' }}</span>
        </div>
        <div class="step" :class="{ done: dom.disarmed }">
          <span class="step-num">2</span>
          <span>上方 2D 網頁解除警報</span>
          <span class="step-check">{{ dom.disarmed ? '✓' : '○' }}</span>
        </div>
        <div class="step" :class="{ done: dom.airlockOpen }">
          <span class="step-num">3</span>
          <span>上方 2D 網頁開啟氣閘</span>
          <span class="step-check">{{ dom.airlockOpen ? '✓' : '○' }}</span>
        </div>
      </div>

      <!-- 1. Bindings -->
      <div v-if="mode === 'blocks'" class="binding-card card">
        <h4 class="card-subtitle">1. 配置事件監聽器 — 就像幫按鈕接電線</h4>
        <p class="card-tip">左邊是「元素」，中間選「什麼動作會觸發」，右邊選「觸發後要做什麼」。改完立刻看上方 2D 網頁按鈕上的 👂 徽章變化！</p>

        <div class="binding-row">
          <span class="element-tag">元素: #disarm-btn</span>
          <div class="bind-selects">
            <div class="select-group">
              <label>事件類型:</label>
              <select v-model="dom.disarmEvent" class="mini-select" @change="onBindingChange">
                <option value="click">click (滑鼠點擊)</option>
                <option value="mouseover">mouseover (懸停)</option>
                <option value="dblclick">dblclick (雙擊)</option>
              </select>
            </div>
            <div class="select-group">
              <label>回呼動作:</label>
              <select v-model="dom.disarmAction" class="mini-select" @change="onBindingChange">
                <option value="DISARM_ALARM">解除安全警報 (disarmAlarm)</option>
                <option value="EMERGENCY_LOCK">緊急封鎖 (emergencyLock)</option>
              </select>
            </div>
          </div>
          <div class="wire-hint" :class="disarmWireOk ? 'ok' : 'bad'">
            {{ disarmWireOk ? '✓ 這條線接對了：點擊 → 解除警報' : '⚠ 想想看：日常網頁按鈕最常用哪種觸發？動作該是解除警報嗎？' }}
          </div>
        </div>

        <div class="binding-row">
          <span class="element-tag">元素: #airlock-btn</span>
          <div class="bind-selects">
            <div class="select-group">
              <label>事件類型:</label>
              <select v-model="dom.airlockEvent" class="mini-select" @change="onBindingChange">
                <option value="click">click (滑鼠點擊)</option>
                <option value="mouseover">mouseover (懸停)</option>
                <option value="dblclick">dblclick (雙擊)</option>
              </select>
            </div>
            <div class="select-group">
              <label>回呼動作:</label>
              <select v-model="dom.airlockAction" class="mini-select" @change="onBindingChange">
                <option value="OPEN_AIRLOCK">開啟氣閘艙門 (openAirlock)</option>
                <option value="DISARM_ALARM">解除安全警報 (disarmAlarm)</option>
              </select>
            </div>
          </div>
          <div class="wire-hint" :class="airlockWireOk ? 'ok' : 'bad'">
            {{ airlockWireOk ? '✓ 這條線接對了：點擊 → 開啟氣閘' : '⚠ 氣閘門該配哪個動作？事件該用最直覺的點擊嗎？' }}
          </div>
        </div>
      </div>

      <!-- 2. Live JS preview（接線模式專用，寫碼模式不預演） -->
      <div v-if="mode === 'blocks'" class="code-card card">
        <div class="code-head">
          <h4 class="card-subtitle">2. 你剛剛寫的 JS 長這樣（即時連動）</h4>
          <span class="live-tag">LIVE</span>
        </div>
        <pre class="live-code"><code>{{ dom.liveJsCode }}</code></pre>
        <p class="card-tip">💡 重點：<b>addEventListener(事件, 回呼)</b> 只是「先接好線」；要親自去上方 2D 網頁觸發事件，回呼才會跑，才會改到 textContent / style / class。</p>
      </div>

    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        {{ mode === 'code' ? '寫碼模式：在上方編輯器按執行，系統自動兩路點擊驗證' : '綁定 click ➔ 上方網頁先解除警報 ➔ 再開氣閘 ➔ 提交驗證' }}
      </div>
      <button
        v-if="mode === 'blocks'"
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '系統驗證中...' : '提交事件控制驗證' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  MousePointer, RotateCcw, Play, Code
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { useDomLabStore } from '../../stores/domLabStore.js';
import { soundManager } from '../../game/core/SoundManager.js';
import { LEVEL_6_STARTER_CODE } from '../../levels/level-6.js';
import CodeEditor from '../editor/CodeEditor.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();
const dom = useDomLabStore();

// 混合漸進：預設寫碼模式（填空），接線表單當鷹架
const mode = ref('code');
const studentCode = ref(LEVEL_6_STARTER_CODE);

const step1Done = computed(() =>
  dom.disarmEvent === 'click' && dom.disarmAction === 'DISARM_ALARM' &&
  dom.airlockEvent === 'click' && dom.airlockAction === 'OPEN_AIRLOCK'
);
const disarmWireOk = computed(() => dom.disarmEvent === 'click' && dom.disarmAction === 'DISARM_ALARM');
const airlockWireOk = computed(() => dom.airlockEvent === 'click' && dom.airlockAction === 'OPEN_AIRLOCK');

onMounted(() => {
  const saved = progressStore.getSavedOperation(6);
  if (saved) {
    if (typeof saved.code === 'string' && saved.code.length > 0) {
      studentCode.value = saved.code;
    }
    if (saved.domState) {
      dom.hydrateFromSaved(saved.domState);
    }
  }
});

function onBindingChange() {
  try { soundManager.playClick(); } catch (e) {}
  dom.pushLog('system', `🔌 重新接線：#disarm-btn ← ${dom.disarmEvent} → ${dom.disarmAction}；#airlock-btn ← ${dom.airlockEvent} → ${dom.airlockAction}`);
}

function onReset() {
  dom.resetDefaults();
  levelStore.resetCurrentLevel();
}

function runExecution() {
  levelStore.executeLevel({ domState: dom.getDomStateForValidation() });
}

function runCodeExecution() {
  levelStore.executeLevel({ code: studentCode.value });
}

function resetCode() {
  studentCode.value = LEVEL_6_STARTER_CODE;
}

function fillAnswerHint() {
  studentCode.value = studentCode.value
    .replace("document.querySelector(___);", 'document.querySelector("#disarm-btn");')
    .replace("document.querySelector(___);", 'document.querySelector("#airlock-btn");')
    .replace("document.querySelector(___);", 'document.querySelector("#status-indicator");')
    .replace("document.querySelector(___);", 'document.querySelector("#airlock-door");')
    .replace("addEventListener(___, () => {", 'addEventListener("click", () => {')
    .replace("addEventListener(___, () => {", 'addEventListener("click", () => {')
    .replace("statusEl.textContent = ___;", 'statusEl.textContent = "系統正常 (NORMAL)";')
    .replace("statusEl.style.color = ___;", 'statusEl.style.color = "green";')
    .replace("if (!___) {", "if (!isAlarmActive) {")
    .replace("doorEl.classList.add(___);", 'doorEl.classList.add("open");')
    .replace("doorEl.textContent = ___;", 'doorEl.textContent = "氣閘已開啟 (OPEN)";');
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

.card-subtitle {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.card-tip {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Steps */
.steps-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.step {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  background: #fff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  color: var(--text-secondary);
}
.step.done { border-color: #6ee7b7; background: #ecfdf5; color: #065f46; font-weight: 700; }
.step-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: #e2e8f0; color: #475569;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 800; flex-shrink: 0;
}
.step.done .step-num { background: #10b981; color: #fff; }
.step-check { margin-left: auto; font-weight: 800; }

/* Bindings */
.binding-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-panel-hover);
}

.binding-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.element-tag {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary-blue);
}

.bind-selects {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.mini-select {
  padding: 0.25rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  font-size: 0.78rem;
  outline: none;
}

.wire-hint { font-size: 0.76rem; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid; line-height: 1.45; }
.wire-hint.ok { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.wire-hint.bad { background: #fffbeb; border-color: #fde68a; color: #92400e; }

/* Live code */
.code-card { display: flex; flex-direction: column; gap: 0.55rem; }
.code-head { display: flex; align-items: center; justify-content: space-between; }
.live-tag {
  font-size: 0.65rem; font-weight: 800; color: #059669;
  background: #ecfdf5; border: 1px solid #6ee7b7;
  padding: 0.1rem 0.45rem; border-radius: 999px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
.live-code {
  margin: 0; background: #0f172a; color: #a5f3fc;
  border-radius: 8px; padding: 0.7rem 0.8rem;
  font-family: var(--font-mono); font-size: 0.72rem; line-height: 1.6;
  overflow-x: auto; white-space: pre;
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

/* L6: code mode */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

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
  height: 280px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.code-mode-note {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-panel-hover);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.65rem;
  line-height: 1.5;
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
</style>
