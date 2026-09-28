<template>
  <div class="control-panel">
    <!-- Header -->
    <div class="deck-header">
      <div class="deck-title-group">
        <Variable :size="18" class="text-brand" />
        <h3 class="deck-title">變數宣告與記憶體配置 · Variable Declaration</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetToFactory" title="重設至出廠預設值">
        <RotateCcw :size="14" />
        <span>出廠狀態</span>
      </button>
    </div>

    <!-- Main Deck Grid -->
    <div class="deck-content">
      <!-- Variable 1: roverName (String) -->
      <div class="var-card card">
        <div class="var-header">
          <div class="var-title-wrap">
            <span class="keyword">let</span>
            <strong class="var-name">roverName</strong>
            <span class="type-tag tag-string">String (字串)</span>
          </div>
          <span class="var-comment">// 探測船識別代號</span>
        </div>

        <div class="var-body">
          <div class="input-with-quotes">
            <span class="quote">"</span>
            <input
              v-model="roverName"
              type="text"
              class="text-input"
              placeholder="輸入船艦名稱，例如: 奧德賽號"
              maxlength="16"
            />
            <span class="quote">"</span>
          </div>

          <div class="quick-chips">
            <span class="chips-label">快速代號：</span>
            <button
              v-for="name in presetNames"
              :key="name"
              class="btn btn-xs chip-btn"
              :class="{ 'chip-active': roverName === name }"
              @click="selectPresetName(name)"
            >
              {{ name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Variable 2: powerLevel (Number) -->
      <div class="var-card card">
        <div class="var-header">
          <div class="var-title-wrap">
            <span class="keyword">let</span>
            <strong class="var-name">powerLevel</strong>
            <span class="type-tag tag-number">Number (數值)</span>
          </div>
          <span class="var-comment">// 系統輸出功率 (80% ~ 100%)</span>
        </div>

        <div class="var-body">
          <div class="slider-row">
            <input
              v-model.number="powerLevel"
              type="range"
              min="0"
              max="110"
              step="5"
              class="slider"
            />
            <div class="power-badge" :class="powerStatusClass">
              <strong>{{ powerLevel }}</strong>
              <span class="unit">%</span>
            </div>
          </div>

          <div class="power-feedback">
            <span v-if="powerLevel === 0" class="text-muted">⚪ 系統無供電（黑屏停機）</span>
            <span v-else-if="powerLevel < 80" class="text-warning">⚠️ 功率不足（最低需 80% 啟動反應爐）</span>
            <span v-else-if="powerLevel <= 100" class="text-success">✓ 功率安全合格（額定範圍內）</span>
            <span v-else class="text-danger">⚠️ 電壓超載危險（超過 100% 額定上限）</span>
          </div>
        </div>
      </div>

      <!-- Variable 3: shieldActive (Boolean) -->
      <div class="var-card card">
        <div class="var-header">
          <div class="var-title-wrap">
            <span class="keyword">let</span>
            <strong class="var-name">shieldActive</strong>
            <span class="type-tag tag-boolean">Boolean (布林值)</span>
          </div>
          <span class="var-comment">// 防護力場開關 (true / false)</span>
        </div>

        <div class="var-body">
          <div class="boolean-toggle-row">
            <button
              class="btn btn-sm bool-btn"
              :class="shieldActive === true ? 'btn-primary active-glow' : 'btn-outline'"
              @click="setShield(true)"
            >
              <ShieldCheck :size="16" />
              <span>true (開啟防護罩)</span>
            </button>

            <button
              class="btn btn-sm bool-btn"
              :class="shieldActive === false ? 'btn-secondary' : 'btn-outline'"
              @click="setShield(false)"
            >
              <ShieldAlert :size="16" />
              <span>false (關閉防護罩)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Live JavaScript Code Preview Card -->
      <div class="code-preview-card card">
        <div class="preview-header">
          <Code :size="14" class="text-brand" />
          <span>即時記憶體狀態 (Live JavaScript Scope)</span>
        </div>
        <pre class="js-pre"><code><span class="keyword">let</span> roverName = <span class="string">"{{ roverName || '未命名' }}"</span>;
<span class="keyword">let</span> powerLevel = <span class="number">{{ powerLevel }}</span>;
<span class="keyword">let</span> shieldActive = <span class="boolean">{{ shieldActive }}</span>;

rover.<span class="func">systemCheck</span>({ roverName, powerLevel, shieldActive });</code></pre>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        設定完成 3 項核心狀態變數 ➔ 點擊執行通電自檢
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Zap :size="16" />
        <span>{{ levelStore.isExecuting ? '通電自檢運行中...' : '執行通電自檢 (rover.systemCheck)' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Variable, RotateCcw, ShieldCheck, ShieldAlert, Code, Zap } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const presetNames = ['奧德賽號', '星馳號', '先鋒探索者', '阿波羅極光'];

// Initial state starts with uninitialized factory default (requires student tuning to pass)
const roverName = ref('');
const powerLevel = ref(0);
const shieldActive = ref(false);

const powerStatusClass = computed(() => {
  if (powerLevel.value === 0) return 'badge-muted';
  if (powerLevel.value < 80) return 'badge-warn';
  if (powerLevel.value <= 100) return 'badge-safe';
  return 'badge-danger';
});

onMounted(() => {
  const saved = progressStore.getSavedOperation(1);
  if (saved && saved.variables) {
    roverName.value = saved.variables.roverName ?? '';
    powerLevel.value = saved.variables.powerLevel ?? 0;
    shieldActive.value = saved.variables.shieldActive ?? false;
  }
});

function selectPresetName(name) {
  soundManager.playClick();
  roverName.value = name;
}

function setShield(val) {
  soundManager.playClick();
  shieldActive.value = val;
}

function resetToFactory() {
  soundManager.playClick();
  roverName.value = '';
  powerLevel.value = 0;
  shieldActive.value = false;
}

function runExecution() {
  levelStore.executeLevel({
    variables: {
      roverName: roverName.value,
      powerLevel: powerLevel.value,
      shieldActive: shieldActive.value
    }
  });
}
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  overflow: hidden;
}

.deck-header {
  padding: 0.75rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  background: #ffffff;
}

.deck-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.deck-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.var-card {
  padding: 0.85rem 1rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: all 0.2s ease;
}

.var-card:hover {
  border-color: var(--brand-300);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.05);
}

.var-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.var-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.keyword {
  color: #7c3aed;
  font-weight: 700;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.var-name {
  font-size: 0.95rem;
  color: #0f172a;
  font-family: var(--font-mono);
}

.type-tag {
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.tag-string {
  background: #fdf2f8;
  color: #db2777;
  border: 1px solid #fbcfe8;
}

.tag-number {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.tag-boolean {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.var-comment {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.input-with-quotes {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: var(--bg-space);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.6rem;
}

.quote {
  font-family: var(--font-mono);
  color: #db2777;
  font-size: 1.1rem;
  font-weight: bold;
}

.text-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-main);
}

.quick-chips {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.4rem;
  flex-wrap: wrap;
}

.chips-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.chip-btn {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.chip-active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider {
  flex: 1;
  accent-color: var(--brand-500);
}

.power-badge {
  min-width: 60px;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.badge-muted {
  background: #f1f5f9;
  color: #64748b;
}

.badge-warn {
  background: #fef3c7;
  color: #d97706;
}

.badge-safe {
  background: #ecfdf5;
  color: #059669;
  font-weight: bold;
}

.badge-danger {
  background: #fee2e2;
  color: #dc2626;
  font-weight: bold;
}

.power-feedback {
  font-size: 0.75rem;
  margin-top: 0.3rem;
}

.boolean-toggle-row {
  display: flex;
  gap: 0.75rem;
}

.bool-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.active-glow {
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
}

.code-preview-card {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.js-pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.5;
  color: #334155;
  background: #ffffff;
  padding: 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.string { color: #db2777; }
.number { color: #2563eb; }
.boolean { color: #059669; font-weight: bold; }
.func { color: #0284c7; }

.deck-footer {
  padding: 0.75rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  background: #ffffff;
}

.footer-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  padding: 0.6rem 1.25rem;
}
</style>
