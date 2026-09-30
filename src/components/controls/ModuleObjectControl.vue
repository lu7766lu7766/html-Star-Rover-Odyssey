<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <Cpu :size="18" class="text-brand" />
        <h3 class="deck-title">函式呼叫與物件參數 · f(x)</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="還原場景與參數至最初狀態">
        <RotateCcw :size="14" />
        <span>還原</span>
      </button>
    </div>

    <div class="deck-content">
      <!-- 1. Select Function (verb) -->
      <div class="module-select-box">
        <span class="box-label">選擇要呼叫的函式 f（動詞・三選一）：</span>
        <div class="module-cards-grid">
          <div
            v-for="m in availableMethods"
            :key="m.id"
            class="mod-option-card card"
            :class="{ 'card-active': selectedMethodId === m.id }"
            @click="selectedMethodId = m.id"
          >
            <div class="mod-top">
              <strong class="mono">{{ m.signature }}</strong>
              <span class="badge" :class="m.id === 'activateScan' ? 'badge-blue' : 'badge-warning'">
                {{ m.label }}
              </span>
            </div>
            <p class="mod-desc">{{ m.description }}</p>
            <p class="mod-return mono">回傳 {{ m.returns }}</p>
          </div>
        </div>
      </div>

      <!-- 2. Configure Object Argument (object) -->
      <div class="properties-box card">
        <h4 class="prop-title">配置參數物件 scanParams（受詞・傳進函式的原料包）</h4>

        <div class="prop-row">
          <div class="prop-info">
            <span class="prop-key">scanParams.range（廣域覆蓋半徑／activateScan 用）：</span>
            <strong class="prop-val">{{ scanRange }} 單位</strong>
          </div>
          <input
            v-model.number="scanRange"
            type="range"
            min="10"
            max="25"
            step="1"
            class="slider"
          />
          <span class="prop-hint">深空最遠目標位於 18 單位處，range 必須 &ge; 18（只對 activateScan 有效）</span>
        </div>

        <div class="prop-row">
          <div class="prop-info">
            <span class="prop-key">scanParams.mode（頻譜解析度／activateScan 用）：</span>
            <div class="mode-toggles">
              <button
                class="btn btn-xs"
                :class="mode === 'HIGH' ? 'btn-primary' : 'btn-outline'"
                @click="mode = 'HIGH'"
              >
                HIGH (高解析)
              </button>
              <button
                class="btn btn-xs"
                :class="mode === 'NORMAL' ? 'btn-primary' : 'btn-outline'"
                @click="mode = 'NORMAL'"
              >
                NORMAL (普通)
              </button>
            </div>
          </div>
        </div>

        <div class="prop-row param-duo">
          <div class="duo-item">
            <span class="prop-key">scanParams.target（集束目標／focusScan 用）：</span>
            <select v-model="target" class="select">
              <option value="NEAR-01">NEAR-01（近距離）</option>
              <option value="FAR-07">FAR-07（遠端隱藏天體）</option>
            </select>
          </div>
          <div class="duo-item">
            <span class="prop-key">功率 power：</span>
            <strong class="prop-val">{{ power }}%</strong>
            <input v-model.number="power" type="range" min="10" max="100" step="5" class="slider" />
          </div>
        </div>

        <div class="prop-row">
          <div class="prop-info">
            <span class="prop-key">scanParams.duration（回波时长秒／pingEcho 用）：</span>
            <strong class="prop-val">{{ duration }}s</strong>
          </div>
          <input v-model.number="duration" type="range" min="1" max="5" step="1" class="slider" />
        </div>
      </div>

      <!-- 3. Call preview -->
      <div class="object-preview card">
        <span class="preview-label">即將執行的函式呼叫：</span>
        <div class="code-view">
          <pre><code>{{ callPreview }}</code></pre>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        先選對 f，再配對 x
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Radio :size="16" />
        <span>{{ levelStore.isExecuting ? '執行中...' : `呼叫 ${selectedMethodId}(scanParams)` }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Cpu, RotateCcw, Radio } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import level5, { AVAILABLE_METHODS, INITIAL_METHOD_CALL } from '../../levels/level-5.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const availableMethods = AVAILABLE_METHODS;

const selectedMethodId = ref(INITIAL_METHOD_CALL.methodId);
const scanRange = ref(INITIAL_METHOD_CALL.params.range);
const mode = ref(INITIAL_METHOD_CALL.params.mode);
const target = ref(INITIAL_METHOD_CALL.params.target);
const power = ref(INITIAL_METHOD_CALL.params.power);
const duration = ref(INITIAL_METHOD_CALL.params.duration);

function applyMethodCall(mc) {
  if (!mc) return;
  if (mc.methodId) selectedMethodId.value = mc.methodId;
  const p = mc.params || {};
  if (p.range !== undefined) scanRange.value = p.range;
  if (p.mode !== undefined) mode.value = p.mode;
  if (p.target !== undefined) target.value = p.target;
  if (p.power !== undefined) power.value = p.power;
  if (p.duration !== undefined) duration.value = p.duration;
}

onMounted(() => {
  const saved = progressStore.getSavedOperation(5);
  if (saved && saved.methodCall) {
    applyMethodCall(saved.methodCall);
  } else if (saved && saved.moduleConfig) {
    // 舊存檔遷移：quantum-scanner 視為選對方法，其餘視為選錯
    const mc = saved.moduleConfig;
    if (mc.moduleId === 'quantum-scanner') {
      selectedMethodId.value = 'activateScan';
      scanRange.value = mc.range ?? 10;
      mode.value = mc.mode ?? 'NORMAL';
    } else {
      selectedMethodId.value = 'pingEcho';
      scanRange.value = mc.range ?? 10;
      mode.value = mc.mode ?? 'NORMAL';
    }
  }
});

const callPreview = computed(() => {
  if (selectedMethodId.value === 'activateScan') {
    return `${selectedMethodId.value}({ range: ${scanRange.value}, mode: "${mode.value}" });`;
  } else if (selectedMethodId.value === 'focusScan') {
    return `${selectedMethodId.value}({ target: "${target.value}", power: ${power.value} });`;
  }
  return `${selectedMethodId.value}({ duration: ${duration.value} });`;
});

function resetDefaults() {
  levelStore.resetCurrentLevel();
}

function runExecution() {
  const params = {
    range: scanRange.value,
    mode: mode.value,
    target: target.value,
    power: power.value,
    duration: duration.value
  };
  levelStore.executeLevel({
    methodCall: {
      methodId: selectedMethodId.value,
      params
    },
    // 供 3D 場景向下相容讀取
    moduleConfig: {
      moduleId: 'quantum-scanner',
      range: scanRange.value,
      mode: mode.value,
      isMethodInvoked: true
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

.module-select-box {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.box-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.module-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.mod-option-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;
  transition: all var(--transition-fast);
}

.mod-option-card:hover {
  border-color: var(--primary-blue);
}

.card-active {
  border-color: var(--primary-blue);
  background: var(--primary-blue-light);
  box-shadow: 0 0 0 2px var(--primary-blue-glow);
}

.mod-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.mono {
  font-family: var(--font-mono);
}

.mod-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.mod-return {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.properties-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-panel-hover);
}

.prop-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.prop-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.prop-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prop-key {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.prop-val {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--primary-blue);
}

.slider {
  width: 100%;
  accent-color: var(--primary-blue);
  cursor: pointer;
}

.prop-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.mode-toggles {
  display: flex;
  gap: 0.35rem;
}

.param-duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.duo-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.select {
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: #fff;
  font-size: 0.8rem;
}

/* Call Preview */
.object-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #ffffff;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.code-view {
  background: #0f172a;
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.85rem;
}

.code-view code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #38bdf8;
  line-height: 1.45;
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
