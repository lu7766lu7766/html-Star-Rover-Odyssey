<template>
  <aside class="mission-hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="hub-title-row">
        <Target :size="18" class="text-brand" />
        <h2 class="hub-title">任務簡報 · Mission Brief</h2>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost btn-xs hint-nav-btn" @click="openHints" title="查看任務導引提示">
          <Lightbulb :size="14" class="text-warning" />
          <span>提示</span>
        </button>
        <span class="badge badge-blue">LEVEL 0{{ level.id }}</span>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="hub-content">
      <!-- Mission Objective Box -->
      <section class="info-card card">
        <div class="card-top-title">
          <h3 class="card-title">{{ level.title }}</h3>
          <span class="card-subtitle">{{ level.subtitle }}</span>
        </div>

        <!-- Concept Badges -->
        <div v-if="level.concepts" class="concept-tags-row">
          <span v-for="tag in level.concepts" :key="tag" class="concept-pill">
            {{ tag }}
          </span>
        </div>

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
          <CheckCircle2 v-if="lastRunResult.pass" :size="18" class="text-success" />
          <AlertCircle v-else :size="18" class="text-danger" />
          <strong class="feedback-title">{{ lastRunResult.pass ? '通關遙測驗證通過！' : '遙測自檢未通過 (需調整參數)' }}</strong>
        </div>
        <p class="feedback-body">
          {{ lastRunResult.pass ? lastRunResult.feedback : lastRunResult.error }}
        </p>
        <div v-if="!lastRunResult.pass && failureHint" class="feedback-action-hint">
          <Lightbulb :size="14" class="text-brand" />
          <span>{{ failureHint }}</span>
        </div>
      </section>

      <!-- Live Scope & Variable Inspector (collapsed by default to prioritize controls) -->
      <section class="inspector-card card collapsible">
        <div class="inspector-header collapsible-header" @click="toggleSection('scope')">
          <div class="inspector-title">
            <Eye :size="15" class="text-brand" />
            <span>即時記憶體變數監視器 (Scope Watch)</span>
          </div>
          <div class="header-right-group">
            <span class="live-pulse">LIVE</span>
            <ChevronUp v-if="openSections.scope" :size="15" class="text-muted" />
            <ChevronDown v-else :size="15" class="text-muted" />
          </div>
        </div>

        <div v-show="openSections.scope" class="inspector-table-wrapper">
          <table class="inspector-table">
            <thead>
              <tr>
                <th>變數名稱</th>
                <th>型態 (typeof)</th>
                <th>當前數值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in activeScopeVariables" :key="v.name">
                <td class="col-name font-mono">{{ v.name }}</td>
                <td class="col-type">
                  <span class="type-pill" :class="'type-' + v.type">{{ v.type }}</span>
                </td>
                <td class="col-val font-mono" :class="'val-' + v.type">{{ v.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Core Concept Card (collapsed to reduce scroll) -->
      <section class="concept-card card collapsible">
        <div class="concept-header collapsible-header" @click="toggleSection('concept')">
          <BookOpen :size="16" class="text-purple" />
          <h4 class="concept-name">{{ level.conceptTitle }}</h4>
          <span class="collapse-icon">
            <ChevronUp v-if="openSections.concept" :size="15" class="text-muted" />
            <ChevronDown v-else :size="15" class="text-muted" />
          </span>
        </div>
        <p v-show="openSections.concept" class="concept-text">{{ level.conceptExplanation }}</p>
      </section>

      <!-- JavaScript Code Peek (Collapsible by default as per PRD 4.2) -->
      <section class="code-peek-card card">
        <div class="peek-header" @click="levelStore.toggleCodePeek">
          <div class="peek-title">
            <Code2 :size="16" class="text-brand" />
            <span>JavaScript 程式碼語法對照</span>
          </div>
          <div class="peek-actions">
            <button
              v-if="levelStore.isCodePeekOpen"
              class="btn btn-ghost btn-xs copy-btn"
              @click.stop="copyCodeExample"
              title="複製範例程式碼"
            >
              <Copy :size="13" />
              <span>{{ copyStatusText }}</span>
            </button>
            <ChevronUp v-if="levelStore.isCodePeekOpen" :size="16" class="text-muted" />
            <ChevronDown v-else :size="16" class="text-muted" />
          </div>
        </div>

        <transition name="expand">
          <div v-if="levelStore.isCodePeekOpen" class="peek-body">
            <div class="code-box">
              <pre><code>{{ level.jsCodeExample }}</code></pre>
            </div>
            <span class="code-tip">💡 提示：左側所有遊戲操作，背後都對應著這段簡潔嚴謹的 JavaScript 語法。</span>
          </div>
        </transition>
      </section>
    </div>

    <!-- Socratic Hint Modal Component -->
    <HintModal
      :is-open="levelStore.isHintModalOpen"
      :hints="level.hints || []"
      @close="levelStore.toggleHintModal(false)"
    />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Target, CheckCircle2, Circle, AlertCircle, BookOpen, Code2,
  ChevronDown, ChevronUp, Lightbulb, Eye, Copy
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import HintModal from './HintModal.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const level = computed(() => levelStore.currentLevel);
const isCompleted = computed(() => progressStore.isLevelCompleted(level.value.id));
const lastRunResult = computed(() => levelStore.lastRunResult);

const failureHint = computed(() => {
  if (!lastRunResult.value || lastRunResult.value.pass) return '';
  const err = lastRunResult.value.error || '';
  if (err.includes('未命名')) return 'JavaScript 變數需賦予字串，請在左下輸入名稱或點選快速代號。';
  if (err.includes('能源不足') || err.includes('功率')) return '系統最低需 80% 功率，請拉動功率滑桿至 80%~100% 範圍。';
  if (err.includes('防護力場') || err.includes('防護罩')) return '請將 shieldActive 設為 true 以啟動防護力場。';
  if (err.includes('推力不足') || err.includes('尚未抵達補給站')) return '請調整推進次數與速度，讓 總位移 (次數 × 速度) 剛好等於 24 單位。';
  if (err.includes('超速') || err.includes('超出')) return '速度或位移過大，請將著陸速度控制在 3 以內，並讓位移剛好為 24。';
  if (err.includes('燃料不足') || err.includes('燃料耗盡')) return '請調高初始燃料或減少推進次數，確保剩餘燃料大於 0。';
  if (err.includes('採集數量不足')) return '請調整 for 迴圈次數至 5 次以採集所有水晶。';
  if (err.includes('模組型號')) return '請更換為高階模組並調用 scanArea() 方法。';
  return '請調整左側控制項參數後再次點擊測試。';
});

const copyStatusText = ref('複製程式碼');

const openSections = ref({ scope: false, concept: false });
function toggleSection(key) {
  openSections.value[key] = !openSections.value[key];
}

function openHints() {
  levelStore.toggleHintModal(true);
}

async function copyCodeExample() {
  if (level.value?.jsCodeExample) {
    try {
      await navigator.clipboard.writeText(level.value.jsCodeExample);
      copyStatusText.value = '已複製 ✓';
      setTimeout(() => { copyStatusText.value = '複製程式碼'; }, 2000);
    } catch (e) {
      copyStatusText.value = '複製失敗';
    }
  }
}

// Generate dynamic Live Scope variables based on current level state & saved operations
const activeScopeVariables = computed(() => {
  const currentId = level.value.id;
  const saved = progressStore.getSavedOperation(currentId);

  if (currentId === 1) {
    const vars = saved?.variables || {};
    return [
      { name: 'roverName', type: 'string', value: vars.roverName ? `"${vars.roverName}"` : '""' },
      { name: 'powerLevel', type: 'number', value: vars.powerLevel ?? 0 },
      { name: 'shieldActive', type: 'boolean', value: String(vars.shieldActive ?? false) }
    ];
  } else if (currentId === 2) {
    const p = saved?.params || {};
    return [
      { name: 'initialFuel', type: 'number', value: p.initialFuel ?? 300 },
      { name: 'thrustCount', type: 'number', value: p.thrustCount ?? 6 },
      { name: 'speed', type: 'number', value: p.speed ?? 4 },
      { name: 'totalDistance', type: 'number', value: (p.thrustCount || 6) * (p.speed || 4) }
    ];
  } else if (currentId === 3) {
    const r = saved?.rules || {};
    return [
      { name: 'threshold1', type: 'number', value: r.rule1Threshold ?? 2 },
      { name: 'action1', type: 'string', value: `"${r.rule1Action || 'FULL_SPEED'}"` },
      { name: 'fallback', type: 'string', value: `"${r.fallbackAction || 'SLOW_DOWN'}"` }
    ];
  } else if (currentId === 4) {
    const lc = saved?.loopConfig || {};
    return [
      { name: 'loopCount', type: 'number', value: lc.loopCount ?? 3 },
      { name: 'action', type: 'string', value: `"${lc.action || 'HARVEST_CRYSTAL'}"` },
      { name: 'isLooping', type: 'boolean', value: String(levelStore.isExecuting) }
    ];
  } else if (currentId === 5) {
    const mc = saved?.moduleConfig || {};
    return [
      { name: 'module.name', type: 'string', value: `"${mc.moduleId || 'basic-sensor'}"` },
      { name: 'module.range', type: 'number', value: mc.range ?? 10 },
      { name: 'module.mode', type: 'string', value: `"${mc.mode || 'NORMAL'}"` }
    ];
  } else if (currentId === 6) {
    const ds = saved?.domState || {};
    return [
      { name: 'disarmEvent', type: 'string', value: `"${ds.bindings?.disarmEvent || 'mouseover'}"` },
      { name: 'isAlarmActive', type: 'boolean', value: String(!ds.disarmed) },
      { name: 'airlockOpen', type: 'boolean', value: String(ds.airlockOpen ?? false) }
    ];
  } else if (currentId === 7) {
    const fc = saved?.fleetConfig || {};
    return [
      { name: 'fleet.length', type: 'number', value: 4 },
      { name: 'batteryThreshold', type: 'number', value: fc.batteryThreshold ?? 10 },
      { name: 'lowBatteryOrder', type: 'string', value: `"${fc.lowBatteryAction || 'PATROL'}"` }
    ];
  } else {
    const ws = saved?.weatherSession || {};
    return [
      { name: 'windSpeed', type: 'number', value: ws.weatherData?.windSpeed ?? 18 },
      { name: 'maxWindSpeed', type: 'number', value: ws.conditions?.maxWindSpeed ?? 10 },
      { name: 'canLaunch', type: 'boolean', value: String(ws.launched ?? false) }
    ];
  }
});
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
  background: #ffffff;
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
  color: var(--text-main);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hint-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  font-weight: 600;
}

.hint-nav-btn:hover {
  background: #fde68a;
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
  background: #ffffff;
  border: 1px solid var(--border-subtle);
}

.card-top-title {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.concept-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.concept-pill {
  font-size: 0.7rem;
  font-weight: 600;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.mission-story {
  font-size: 0.86rem;
  color: #475569;
  line-height: 1.55;
  margin: 0;
}

.requirements-box {
  background: #f8fafc;
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
  color: var(--text-main);
}

.req-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0;
  margin: 0;
}

.req-item {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: #334155;
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
  padding: 0.85rem 1rem;
}

.feedback-pass {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.feedback-fail {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feedback-title {
  font-size: 0.9rem;
}

.feedback-body {
  font-size: 0.84rem;
  line-height: 1.5;
  margin: 0;
}

.feedback-action-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
  font-size: 0.8rem;
  color: #991b1b;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Live Scope Inspector Card */
.inspector-card {
  background: #ffffff;
  border: 1px solid #bfdbfe;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inspector-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e40af;
}

.live-pulse {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  color: #10b981;
  background: #ecfdf5;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.inspector-table-wrapper {
  overflow-x: auto;
}

.inspector-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.inspector-table th {
  text-align: left;
  padding: 0.35rem 0.45rem;
  background: #f8fafc;
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--border-subtle);
}

.inspector-table td {
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid #f1f5f9;
}

.col-name {
  color: #334155;
  font-weight: 600;
}

.type-pill {
  font-size: 0.68rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.type-string { background: #fdf2f8; color: #db2777; }
.type-number { background: #eff6ff; color: #2563eb; }
.type-boolean { background: #ecfdf5; color: #059669; }

.val-string { color: #db2777; }
.val-number { color: #2563eb; font-weight: 600; }
.val-boolean { color: #059669; font-weight: 600; }

/* Concept Card */
.concept-card {
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
}

.concept-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.concept-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #6b21a8;
  margin: 0;
}

.concept-text {
  font-size: 0.82rem;
  color: #581c87;
  line-height: 1.5;
  margin: 0;
}

/* Code Peek Card */
.code-peek-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 0.75rem 1rem;
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
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

.peek-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--brand-600);
}

.code-box {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  margin-top: 0.5rem;
  overflow-x: auto;
}

.code-box pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #1e293b;
  line-height: 1.5;
}

.code-tip {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 0.35rem;
}

.collapsible-header {
  cursor: pointer;
  user-select: none;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.collapse-icon {
  margin-left: auto;
  display: inline-flex;
}

.hub-content {
  gap: 0.8rem !important;
  padding: 0.8rem !important;
}
</style>
