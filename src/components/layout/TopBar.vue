<template>
  <header class="topbar">
    <!-- Brand / Title -->
    <div class="brand-section">
      <div class="logo-mark">
        <Rocket :size="20" class="icon-rocket" />
      </div>
      <div class="brand-text">
        <h1 class="brand-title">Star Rover Odyssey</h1>
        <span class="brand-badge">星際巡航 3D</span>
      </div>
    </div>

    <!-- Center: Level Selector & Progress -->
    <div class="nav-center">
      <div class="level-selector-wrapper">
        <label for="level-select" class="selector-label">關卡：</label>
        <select
          id="level-select"
          class="level-select"
          :value="currentLevelId"
          @change="$emit('select-level', Number($event.target.value))"
        >
          <option
            v-for="lvl in allLevels"
            :key="lvl.id"
            :value="lvl.id"
            :disabled="!isLevelUnlocked(lvl.id)"
          >
            {{ isLevelCompleted(lvl.id) ? '✓ ' : '' }}關卡 {{ lvl.id }}：{{ lvl.title }}
            {{ !isLevelUnlocked(lvl.id) ? ' 🔒' : '' }}
          </option>
        </select>
      </div>

      <!-- Overall Progress -->
      <div class="progress-pill" :title="`學習進度: ${progressPercentage}%`">
        <div class="progress-track">
          <div class="progress-bar-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <span class="progress-label">{{ progressPercentage }}%</span>
      </div>

      <!-- Developer Mode Indicator -->
      <div
        v-if="isDeveloperMode"
        class="badge badge-amber dev-badge pulse-glow"
        title="開發者/教師模式已啟用，所有關卡皆可自由切換"
      >
        <Key :size="12" />
        <span>開發者模式</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="nav-actions">
      <!-- Run Code Button -->
      <button
        class="btn btn-primary btn-run"
        :disabled="isExecuting"
        @click="$emit('run-code')"
        title="執行目前程式碼並驗證 (Ctrl+Enter)"
      >
        <Play :size="16" v-if="!isExecuting" fill="currentColor" />
        <Loader2 :size="16" class="spin-icon" v-else />
        <span>{{ isExecuting ? '執行中...' : '執行程式' }}</span>
      </button>

      <!-- Import / Export Save -->
      <div class="save-actions">
        <button class="btn btn-sm btn-icon" @click="$emit('export-save')" title="匯出學習進度 JSON 檔案">
          <Download :size="15" />
          <span class="btn-text-desktop">匯出</span>
        </button>
        <button class="btn btn-sm btn-icon" @click="triggerFileInput" title="匯入存檔 JSON 檔案">
          <Upload :size="15" />
          <span class="btn-text-desktop">匯入</span>
        </button>
        <input
          type="file"
          ref="fileInputRef"
          accept=".json"
          style="display: none"
          @change="handleFileChange"
        />
      </div>

      <!-- Sound Toggle -->
      <button
        class="btn btn-sm btn-icon"
        @click="$emit('toggle-sound')"
        :title="isMuted ? '取消靜音' : '靜音'"
      >
        <VolumeX :size="16" v-if="isMuted" class="text-danger" />
        <Volume2 :size="16" v-else class="text-cyan" />
      </button>

      <!-- Low Performance Mode Toggle -->
      <button
        class="btn btn-sm btn-icon"
        :class="{ 'btn-active-toggle': isLowPerf }"
        @click="$emit('toggle-perf')"
        :title="isLowPerf ? '已開啟低效能模式（適合老舊電腦）' : '標準畫質模式'"
      >
        <Cpu :size="16" />
      </button>

      <!-- Cheat Key Modal Trigger -->
      <button
        class="btn btn-sm btn-icon"
        @click="showCheatInput = true"
        title="輸入金手指代碼"
      >
        <Key :size="15" />
      </button>
    </div>

    <!-- Cheat Code Dialog -->
    <div v-if="showCheatInput" class="cheat-dialog-backdrop" @click.self="showCheatInput = false">
      <div class="cheat-card glass-panel">
        <div class="cheat-card-header">
          <Key :size="16" class="icon-key" />
          <span>通關金手指 / 開發者模式</span>
        </div>
        <div class="cheat-card-body">
          <p class="cheat-hint">請輸入指定金手指代碼以切換開發者全關卡解鎖模式：</p>
          <input
            v-model="cheatCodeInput"
            type="text"
            class="cheat-input"
            placeholder="請輸入代碼 (例如 jaccis666)"
            @keyup.enter="submitCheat"
          />
          <div v-if="cheatMessage" class="cheat-msg" :class="{ 'msg-success': isDeveloperMode }">
            {{ cheatMessage }}
          </div>
        </div>
        <div class="cheat-card-footer">
          <button class="btn btn-sm" @click="showCheatInput = false">關閉</button>
          <button class="btn btn-primary btn-sm" @click="submitCheat">送出代碼</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import {
  Rocket, Play, Loader2, Download, Upload, Volume2, VolumeX,
  Cpu, Key
} from 'lucide-vue-next';

const props = defineProps({
  currentLevelId: { type: Number, required: true },
  allLevels: { type: Array, required: true },
  isLevelUnlocked: { type: Function, required: true },
  isLevelCompleted: { type: Function, required: true },
  progressPercentage: { type: Number, default: 0 },
  isExecuting: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isLowPerf: { type: Boolean, default: false },
  isDeveloperMode: { type: Boolean, default: false }
});

const emit = defineEmits([
  'select-level', 'run-code', 'export-save', 'import-save',
  'toggle-sound', 'toggle-perf', 'cheat-code'
]);

const fileInputRef = ref(null);
const showCheatInput = ref(false);
const cheatCodeInput = ref('');
const cheatMessage = ref('');

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}

function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    emit('import-save', file);
  }
}

function submitCheat() {
  emit('cheat-code', cheatCodeInput.value, (res) => {
    cheatMessage.value = res.message;
    if (res.success) {
      setTimeout(() => {
        showCheatInput.value = false;
        cheatMessage.value = '';
        cheatCodeInput.value = '';
      }, 1200);
    }
  });
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.25rem;
  background: rgba(9, 13, 22, 0.95);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  z-index: 100;
  height: 60px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  user-select: none;
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(2, 132, 199, 0.3));
  border: 1px solid var(--border-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-rocket {
  color: var(--cyan-primary);
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  background: linear-gradient(90deg, #ffffff 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-badge {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.selector-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.level-select {
  background: #111726;
  color: #f1f5f9;
  border: 1px solid var(--border-subtle);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.level-select:focus {
  border-color: var(--cyan-primary);
}

.progress-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

.progress-track {
  width: 50px;
  height: 5px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00f2fe, #10b981);
  transition: width 0.4s ease;
}

.progress-label {
  font-family: var(--font-mono);
  font-size: 0.725rem;
  color: #94a3b8;
  font-weight: 600;
}

.dev-badge {
  font-size: 0.7rem;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-run {
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.save-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-icon {
  padding: 0.4rem 0.6rem;
}

.btn-active-toggle {
  background: rgba(245, 158, 11, 0.2);
  border-color: var(--warning-amber);
  color: var(--warning-amber);
}

@media (max-width: 900px) {
  .btn-text-desktop {
    display: none;
  }
}

/* Cheat dialog */
.cheat-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cheat-card {
  width: 100%;
  max-width: 400px;
  background: #0d1424;
  border: 1px solid var(--border-accent);
  border-radius: 10px;
  overflow: hidden;
}

.cheat-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  background: #111a2e;
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 700;
  color: var(--cyan-primary);
  font-size: 0.9rem;
}

.cheat-card-body {
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cheat-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.cheat-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: #060910;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: #f8fafc;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  outline: none;
}

.cheat-input:focus {
  border-color: var(--cyan-primary);
}

.cheat-msg {
  font-size: 0.8rem;
  color: #f87171;
  padding: 0.35rem 0;
}

.cheat-msg.msg-success {
  color: #34d399;
}

.cheat-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #090e1b;
  border-top: 1px solid var(--border-subtle);
}
</style>
