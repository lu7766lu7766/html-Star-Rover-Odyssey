<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <Sliders :size="18" class="text-brand" />
        <h3 class="deck-title">飛行變數與推力參數調節 · Flight Parameters</h3>
      </div>
      <div class="deck-actions">
        <button class="btn btn-secondary btn-sm" @click="restorePosition" title="還原 3D 場景跑道與探測船位置">
          <RotateCcw :size="14" />
          <span>場景還原</span>
        </button>
        <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="恢復預設參數">
          <RefreshCw :size="14" />
          <span>預設值</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- Parameter Sliders -->
      <div class="sliders-grid">
        <!-- Initial Fuel -->
        <div class="param-card card">
          <div class="param-header">
            <span class="param-name">初始燃料 (initialFuel)</span>
            <span class="param-val badge badge-blue">{{ initialFuel }} 單位</span>
          </div>
          <input
            v-model.number="initialFuel"
            type="range"
            min="100"
            max="500"
            step="20"
            class="slider"
          />
          <span class="param-hint">變數用來保存探測船在發射台注入的總燃料量</span>
        </div>

        <!-- Burn Per Thrust -->
        <div class="param-card card">
          <div class="param-header">
            <span class="param-name">單次推進消耗 (burnPerThrust)</span>
            <span class="param-val badge badge-purple">{{ burnPerThrust }} 單位/次</span>
          </div>
          <input
            v-model.number="burnPerThrust"
            type="range"
            min="10"
            max="50"
            step="5"
            class="slider"
          />
          <span class="param-hint">每次點火噴射所損耗的化學反應燃料</span>
        </div>

        <!-- Thrust Count -->
        <div class="param-card card">
          <div class="param-header">
            <span class="param-name">推進次數 (thrustCount)</span>
            <span class="param-val badge badge-blue">{{ thrustCount }} 次</span>
          </div>
          <input
            v-model.number="thrustCount"
            type="range"
            min="1"
            max="12"
            step="1"
            class="slider"
          />
          <span class="param-hint">點火推進的循環次數 (影響總前進距離與總耗能)</span>
        </div>

        <!-- Speed -->
        <div class="param-card card">
          <div class="param-header">
            <span class="param-name">推力速度 (speed)</span>
            <span class="param-val" :class="speed <= 3 ? 'badge badge-success' : 'badge badge-danger'">
              {{ speed }} 米/次 ({{ speed <= 3 ? '安全' : '超速危險' }})
            </span>
          </div>
          <input
            v-model.number="speed"
            type="range"
            min="1"
            max="6"
            step="1"
            class="slider"
          />
          <span class="param-hint">單次前進動能速度 (若大於 3 著陸時將劇烈撞毀平台)</span>
        </div>
      </div>

      <!-- Real-time Formula Telemetry Preview -->
      <div class="telemetry-calc-card card">
        <h4 class="calc-title">即時計算遙測預覽 (Formula Calculations)</h4>
        <div class="calc-row">
          <div class="calc-item">
            <span class="calc-label">總位移預估 (次數 × 速度)</span>
            <strong :class="totalDistance === 24 ? 'text-success' : 'text-brand'">
              {{ totalDistance }} / 24 單位 {{ totalDistance === 24 ? '✓ 剛好抵達' : '' }}
            </strong>
          </div>
          <div class="calc-item">
            <span class="calc-label">總燃料消耗 (次數 × 單耗)</span>
            <span>{{ totalBurn }} 單位</span>
          </div>
          <div class="calc-item">
            <span class="calc-label">剩餘燃料預估</span>
            <strong :class="remainingFuel >= 0 ? 'text-success' : 'text-danger'">
              {{ remainingFuel }} 單位 {{ remainingFuel < 0 ? '⚠️ 燃料不足' : '' }}
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        平台距離 24 單位 · 著陸速度必須 &le; 3
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '推進點火中...' : '發動推進軌道轉移' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Sliders, RotateCcw, RefreshCw, Play } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const initialFuel = ref(150);
const burnPerThrust = ref(30);
const thrustCount = ref(3);
const speed = ref(2);

onMounted(() => {
  const saved = progressStore.getSavedOperation(2);
  if (saved && saved.params) {
    initialFuel.value = saved.params.initialFuel ?? 150;
    burnPerThrust.value = saved.params.burnPerThrust ?? 30;
    thrustCount.value = saved.params.thrustCount ?? 3;
    speed.value = saved.params.speed ?? 2;
  }
});

const totalDistance = computed(() => thrustCount.value * speed.value);
const totalBurn = computed(() => thrustCount.value * burnPerThrust.value);
const remainingFuel = computed(() => initialFuel.value - totalBurn.value);

// Auto-restore rover to starting line whenever student tweaks parameters
watch([thrustCount, speed, initialFuel, burnPerThrust], () => {
  levelStore.restoreVehiclePosition();
});

function restorePosition() {
  levelStore.restoreVehiclePosition();
}

function resetDefaults() {
  initialFuel.value = 150;
  burnPerThrust.value = 30;
  thrustCount.value = 3;
  speed.value = 2;
  restorePosition();
}

function runExecution() {
  levelStore.executeLevel({
    params: {
      initialFuel: initialFuel.value,
      burnPerThrust: burnPerThrust.value,
      thrustCount: thrustCount.value,
      speed: speed.value
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

.sliders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.param-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-name {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.slider {
  width: 100%;
  accent-color: var(--primary-blue);
  cursor: pointer;
}

.param-hint {
  font-size: 0.73rem;
  color: var(--text-muted);
  line-height: 1.35;
}

/* Telemetry Card */
.telemetry-calc-card {
  background: var(--bg-panel-hover);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.calc-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.calc-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.calc-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
}

.calc-label {
  font-size: 0.75rem;
  color: var(--text-muted);
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
