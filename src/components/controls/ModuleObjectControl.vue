<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <Cpu :size="18" class="text-brand" />
        <h3 class="deck-title">物件模組封裝與方法調用 · Object Methods</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="重置模組">
        <RotateCcw :size="14" />
        <span>預設值</span>
      </button>
    </div>

    <div class="deck-content">
      <!-- 1. Select Module Object -->
      <div class="module-select-box">
        <span class="box-label">選擇裝配的雷達模組物件 (Select Module)：</span>
        <div class="module-cards-grid">
          <div
            v-for="mod in availableModules"
            :key="mod.id"
            class="mod-option-card card"
            :class="{ 'card-active': selectedModuleId === mod.id }"
            @click="selectedModuleId = mod.id"
          >
            <div class="mod-top">
              <strong>{{ mod.name }}</strong>
              <span class="badge" :class="mod.id === 'quantum-scanner' ? 'badge-blue' : 'badge-warning'">
                最遠 {{ mod.maxRange }} 單位
              </span>
            </div>
            <p class="mod-desc">{{ mod.description }}</p>
          </div>
        </div>
      </div>

      <!-- 2. Configure Object Properties -->
      <div class="properties-box card">
        <h4 class="prop-title">設定物件屬性 (Object Properties)</h4>
        
        <div class="prop-row">
          <div class="prop-info">
            <span class="prop-key">scanner.range (掃描覆蓋半徑)：</span>
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
          <span class="prop-hint">深空最遠目標位於 18 單位處，半徑必須 &ge; 18 才能完全覆蓋</span>
        </div>

        <div class="prop-row">
          <div class="prop-info">
            <span class="prop-key">scanner.mode (頻譜解析度)：</span>
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
      </div>

      <!-- 3. Object Representation Card -->
      <div class="object-preview card">
        <span class="preview-label">JavaScript 物件記憶體狀態：</span>
        <div class="code-view">
          <pre><code>const scanner = {
  name: "{{ currentModuleName }}",
  range: {{ scanRange }},
  mode: "{{ mode }}",
  activateScan() { ... }
};</code></pre>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        設定屬性並呼叫物件的 activateScan() 方法函式
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Radio :size="16" />
        <span>{{ levelStore.isExecuting ? '雷達掃描中...' : '呼叫 scanner.activateScan()' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Cpu, RotateCcw, Radio } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const availableModules = [
  {
    id: 'quantum-scanner',
    name: '量子廣角光譜儀 (QuantumScanner)',
    maxRange: 25,
    description: '深空專用高頻量子雷達，覆蓋範圍可達 25 單位，可穿透星雲探測星體'
  },
  {
    id: 'basic-sensor',
    name: '基礎聲納感測器 (BasicSensor)',
    maxRange: 12,
    description: '舊型近程儀器，最大範圍僅 12 單位，無法探測遠端目標'
  }
];

const selectedModuleId = ref('basic-sensor');
const scanRange = ref(10);
const mode = ref('NORMAL');

onMounted(() => {
  const saved = progressStore.getSavedOperation(5);
  if (saved && saved.moduleConfig) {
    selectedModuleId.value = saved.moduleConfig.moduleId ?? 'basic-sensor';
    scanRange.value = saved.moduleConfig.range ?? 10;
    mode.value = saved.moduleConfig.mode ?? 'NORMAL';
  }
});

const currentModuleName = computed(() => {
  return selectedModuleId.value === 'quantum-scanner' ? 'QuantumScanner' : 'BasicSensor';
});

function resetDefaults() {
  selectedModuleId.value = 'basic-sensor';
  scanRange.value = 10;
  mode.value = 'NORMAL';
}

function runExecution() {
  levelStore.executeLevel({
    moduleConfig: {
      moduleId: selectedModuleId.value,
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
}

.mod-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.35;
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

/* Object Preview */
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
