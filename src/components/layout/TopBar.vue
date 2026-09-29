<template>
  <header class="topbar">
    <!-- Brand / Aerospace Callout -->
    <div class="brand-section">
      <div class="logo-mark">
        <Rocket :size="18" class="icon-rocket" />
      </div>
      <div class="brand-text">
        <div class="brand-title-row">
          <h1 class="brand-title">Star Rover Odyssey</h1>
          <span class="mission-tag">MISSION CONTROL</span>
        </div>
        <div class="brand-sub">
          <span class="beacon-dot success"></span>
          <span class="sub-text">ORBITAL JS FLIGHT SIMULATOR</span>
        </div>
      </div>
    </div>

    <!-- Center: Flight Level Selector & Progress Telemetry -->
    <div class="nav-center">
      <div class="level-selector-wrapper">
        <span class="selector-prefix">SECTOR</span>
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
            {{ isLevelCompleted(lvl.id) ? '✓ ' : '' }}STATION 0{{ lvl.id }} · {{ lvl.title }}
            {{ !isLevelUnlocked(lvl.id) ? ' [LOCKED]' : '' }}
          </option>
        </select>
      </div>

      <!-- Telemetry Progress Gauge -->
      <div class="progress-pill" :title="`任務完成度: ${progressPercentage}%`">
        <div class="progress-info">
          <span class="progress-caption">SYSTEM SYNC</span>
          <span class="progress-value">{{ progressPercentage }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>

      <!-- Developer / Flight Instructor Mode Indicator -->
      <div
        v-if="isDeveloperMode"
        class="badge badge-amber dev-badge pulse-glow"
        title="開發者/導師模式已啟用：全關卡解鎖"
      >
        <Key :size="12" />
        <span>INSTRUCTOR OVERRIDE</span>
      </div>
    </div>

    <!-- Right: Flight Operations Dock -->
    <div class="nav-actions">
      <!-- High Impact Run Code CTA -->
      <button
        class="btn btn-primary btn-run"
        :class="{ 'is-executing': isExecuting }"
        :disabled="isExecuting"
        @click="$emit('run-code')"
        title="發送指令至探測船並驗證邏輯 (Ctrl+Enter / Cmd+Enter)"
      >
        <Play :size="15" v-if="!isExecuting" fill="currentColor" />
        <Loader2 :size="15" class="spin-icon" v-else />
        <span class="run-label">{{ isExecuting ? '傳輸指令中...' : '執行程式' }}</span>
        <span class="shortcut-tag">⌘↵</span>
      </button>

      <!-- Save Management Sub-dock -->
      <div class="dock-group">
        <button class="btn btn-sm btn-dock" @click="$emit('export-save')" title="匯出學習進度 JSON 存檔">
          <Download :size="14" />
          <span class="dock-text">匯出</span>
        </button>
        <button class="btn btn-sm btn-dock" @click="triggerFileInput" title="匯入學習進度 JSON 存檔">
          <Upload :size="14" />
          <span class="dock-text">匯入</span>
        </button>
        <input
          type="file"
          ref="fileInputRef"
          accept=".json"
          style="display: none"
          @change="handleFileChange"
        />
      </div>

      <!-- Instrument Controls Sub-dock -->
      <div class="dock-group">
        <!-- Sound Toggle -->
        <button
          class="btn btn-sm btn-icon-dock"
          @click="$emit('toggle-sound')"
          :title="isMuted ? '開啟環境與引擎音效' : '靜音'"
        >
          <VolumeX :size="15" v-if="isMuted" class="text-danger" />
          <Volume2 :size="15" v-else class="text-cyan" />
        </button>

        <!-- Low Performance Mode Toggle -->
        <button
          class="btn btn-sm btn-icon-dock"
          :class="{ 'dock-active': isLowPerf }"
          @click="$emit('toggle-perf')"
          :title="isLowPerf ? '目前為節能低效能模式（適合老舊電腦）' : '切換低效能模式'"
        >
          <Cpu :size="15" />
        </button>

        <!-- Cheat Code Dialog Trigger -->
        <button
          class="btn btn-sm btn-icon-dock"
          :class="{ 'dock-active': isDeveloperMode }"
          @click="showCheatInput = true"
          title="通關密碼 / 教師導師模式"
        >
          <Key :size="14" />
        </button>
      </div>
    </div>

    <!-- Telemetry Security Clearance Dialog -->
    <div v-if="showCheatInput" class="cheat-dialog-backdrop" @click.self="showCheatInput = false">
      <div class="cheat-card glass-panel">
        <div class="cheat-card-header">
          <div class="header-left">
            <Key :size="15" class="icon-key" />
            <span>MISSION OVERRIDE CLEARANCE</span>
          </div>
          <button class="btn-close-sm" @click="showCheatInput = false">×</button>
        </div>
        <div class="cheat-card-body">
          <p class="cheat-hint">請輸入教師導師金手指代碼以切換全關卡解鎖權限：</p>
          <div class="input-wrapper">
            <input
              v-model="cheatCodeInput"
              type="text"
              class="cheat-input"
              placeholder="輸入安全指令代碼..."
              @keyup.enter="submitCheat"
              autofocus
            />
          </div>
          <div v-if="cheatMessage" class="cheat-msg" :class="{ 'msg-success': isDeveloperMode }">
            {{ cheatMessage }}
          </div>
        </div>
        <div class="cheat-card-footer">
          <button class="btn btn-secondary btn-sm" @click="showCheatInput = false">取消</button>
          <button class="btn btn-primary btn-sm" @click="submitCheat">核准權限</button>
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
  padding: 0 1.25rem;
  background: rgba(9, 13, 24, 0.94);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 100;
  height: 60px;
  position: relative;
}

/* Subtle top glow line */
.topbar::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), rgba(16, 185, 129, 0.2), transparent);
  pointer-events: none;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  user-select: none;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(2, 132, 199, 0.25));
  border: 1px solid var(--border-accent);
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.logo-mark:hover {
  transform: scale(1.05);
}

.icon-rocket {
  color: var(--cyan-primary);
  filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.6));
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, #ffffff 30%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.mission-tag {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--cyan-primary);
  background: rgba(0, 229, 255, 0.1);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  letter-spacing: 0.05em;
}

.brand-sub {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sub-text {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.level-selector-wrapper {
  display: flex;
  align-items: center;
  background: rgba(17, 23, 40, 0.8);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.4rem;
  transition: border-color var(--transition-fast);
}

.level-selector-wrapper:focus-within {
  border-color: var(--border-accent);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
}

.selector-prefix {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  padding-left: 0.3rem;
  letter-spacing: 0.05em;
}

.level-select {
  background: transparent;
  color: #f1f5f9;
  border: none;
  padding: 0.35rem 0.5rem;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.level-select option {
  background: #0b111e;
  color: #e2e8f0;
}

.progress-pill {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 110px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: 0.65rem;
}

.progress-caption {
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.progress-value {
  color: var(--cyan-primary);
  font-weight: 700;
}

.progress-track {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00e5ff 0%, #10b981 100%);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.dev-badge {
  font-size: 0.68rem;
  padding: 0.2rem 0.5rem;
  letter-spacing: 0.05em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.btn-run {
  padding: 0.45rem 1.15rem;
  font-size: 0.85rem;
  gap: 0.45rem;
  position: relative;
}

.btn-run.is-executing {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
}

.shortcut-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin-left: 0.2rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dock-group {
  display: flex;
  align-items: center;
  background: rgba(17, 23, 40, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.btn-dock {
  background: transparent;
  border: none;
  padding: 0.35rem 0.55rem;
  font-size: 0.76rem;
  border-radius: 3px;
  color: var(--text-secondary);
}

.btn-dock:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  box-shadow: none;
  transform: none;
}

.btn-icon-dock {
  background: transparent;
  border: none;
  padding: 0.4rem 0.5rem;
  border-radius: 3px;
  color: var(--text-secondary);
}

.btn-icon-dock:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  box-shadow: none;
  transform: none;
}

.dock-active {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-amber);
}

.text-danger { color: var(--danger-crimson); }
.text-cyan { color: var(--cyan-primary); }

@media (max-width: 980px) {
  .dock-text, .shortcut-tag, .progress-caption {
    display: none;
  }
}

/* Telemetry Security Modal */
.cheat-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(4, 7, 15, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cheat-card {
  width: 100%;
  max-width: 420px;
  background: #0b1120;
  border: 1px solid var(--border-accent);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 229, 255, 0.2);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.cheat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.1rem;
  background: #111a2d;
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--cyan-primary);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-close-sm {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
}

.btn-close-sm:hover {
  color: #ffffff;
}

.cheat-card-body {
  padding: 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.cheat-hint {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.input-wrapper {
  position: relative;
}

.cheat-input {
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: #060911;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  color: #f8fafc;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  outline: none;
  transition: border-color var(--transition-fast);
}

.cheat-input:focus {
  border-color: var(--cyan-primary);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.25);
}

.cheat-msg {
  font-size: 0.8rem;
  color: var(--danger-crimson);
  font-weight: 600;
}

.cheat-msg.msg-success {
  color: var(--success-emerald);
}

.cheat-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.85rem 1.1rem;
  background: #090e1a;
  border-top: 1px solid var(--border-subtle);
}
</style>
