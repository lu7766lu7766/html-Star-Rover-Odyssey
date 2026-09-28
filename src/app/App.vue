<template>
  <div id="app" class="app-root">
    <!-- Top Navigation Bar -->
    <TopBar
      :current-level-id="progressStore.currentLevelId"
      :all-levels="ALL_LEVELS"
      :is-level-unlocked="progressStore.isLevelUnlocked"
      :is-level-completed="progressStore.isLevelCompleted"
      :progress-percentage="progressStore.progressPercentage"
      :is-executing="levelStore.isExecuting"
      :is-muted="soundManager.muted"
      :is-low-perf="progressStore.isLowPerformanceMode"
      :is-developer-mode="progressStore.isDeveloperMode"
      @select-level="handleSelectLevel"
      @run-code="handleRunCode"
      @export-save="handleExportSave"
      @import-save="handleImportSave"
      @toggle-sound="handleToggleSound"
      @toggle-perf="handleTogglePerf"
      @cheat-code="handleCheatCode"
    />

    <!-- Main Workspace Split Layout -->
    <SplitLayout>
      <!-- Mission Overview Slot -->
      <template #mission>
        <MissionPanel
          :level="levelStore.currentLevel"
          :is-completed="progressStore.isLevelCompleted(levelStore.currentLevel.id)"
          @open-hint="isHintOpen = true"
        />
      </template>

      <!-- Code Editor Slot -->
      <template #editor>
        <CodeEditor
          v-model="currentCode"
          :level-id="levelStore.currentLevel.id"
          @change="handleCodeChange"
          @reset="handleResetCode"
        />
      </template>

      <!-- Console Slot -->
      <template #console>
        <ConsolePanel
          :logs="levelStore.consoleLogs"
          @clear="levelStore.clearLogs"
        />
      </template>

      <!-- 3D Game Viewport Slot -->
      <template #viewport>
        <GameViewport
          :level-id="levelStore.currentLevel.id"
          :mock-dom-state="levelStore.mockDomState"
          :last-run-result="levelStore.lastRunResult"
          :is-success-modal-open="levelStore.isSuccessModalOpen"
          :is-low-performance="progressStore.isLowPerformanceMode"
          @mock-dom-click="handleMockDomClick"
          @next-level="handleNextLevel"
          @close-success="levelStore.isSuccessModalOpen = false"
          @register-trigger="handleRegisterSceneTrigger"
        />
      </template>
    </SplitLayout>

    <!-- Hint Modal -->
    <HintModal
      :is-open="isHintOpen"
      :hints="levelStore.currentLevel.hints"
      @close="isHintOpen = false"
    />

    <!-- Floating System Toast Notice -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="toast-notice glass-panel" :class="`toast-${toastType}`">
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import TopBar from '../components/layout/TopBar.vue';
import SplitLayout from '../components/layout/SplitLayout.vue';
import MissionPanel from '../components/mission/MissionPanel.vue';
import CodeEditor from '../components/editor/CodeEditor.vue';
import ConsolePanel from '../components/console/ConsolePanel.vue';
import GameViewport from '../components/game/GameViewport.vue';
import HintModal from '../components/mission/HintModal.vue';
import { ALL_LEVELS } from '../levels/index.js';
import { useProgressStore } from '../stores/progressStore.js';
import { useLevelStore } from '../stores/levelStore.js';
import { soundManager } from '../game/core/SoundManager.js';

const progressStore = useProgressStore();
const levelStore = useLevelStore();

const isHintOpen = ref(false);
const toastMessage = ref('');
const toastType = ref('info');
let toastTimer = null;

// Active code loaded for current level
const currentCode = ref(progressStore.getCodeForLevel(progressStore.currentLevelId));

function showToast(msg, type = 'info', duration = 3000) {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastType.value = type;
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, duration);
}

// When level changes, reload code and reset execution results
watch(() => progressStore.currentLevelId, (newId) => {
  currentCode.value = progressStore.getCodeForLevel(newId);
  levelStore.clearLogs();
  levelStore.isSuccessModalOpen = false;
});

function handleCodeChange(newCode) {
  progressStore.saveCode(progressStore.currentLevelId, newCode);
}

function handleResetCode() {
  const resetCode = progressStore.resetCurrentLevelCode(progressStore.currentLevelId);
  currentCode.value = resetCode;
  showToast('已重設為本關初始預設程式碼', 'info');
}

function handleSelectLevel(id) {
  progressStore.setCurrentLevel(id);
}

function handleRunCode() {
  levelStore.runCode(currentCode.value);
}

function handleNextLevel() {
  const nextId = progressStore.currentLevelId + 1;
  if (nextId <= ALL_LEVELS.length) {
    progressStore.setCurrentLevel(nextId);
  }
}

function handleMockDomClick(targetId) {
  levelStore.triggerMockDomEvent(targetId, 'click');
}

function handleExportSave() {
  progressStore.exportSave();
  showToast('已成功匯出學習存檔 JSON 檔案！', 'success');
}

async function handleImportSave(file) {
  const res = await progressStore.importSave(file);
  if (res.success) {
    currentCode.value = progressStore.getCodeForLevel(progressStore.currentLevelId);
    showToast('存檔匯入成功！已還原學習進度與代碼。', 'success');
  } else {
    showToast(`存檔匯入失敗: ${res.error}`, 'error');
  }
}

function handleToggleSound() {
  soundManager.toggleMute();
}

function handleTogglePerf() {
  const isLow = progressStore.toggleLowPerformanceMode();
  showToast(isLow ? '已切換為低效能模式（關閉抗鋸齒與降低粒子數）' : '已恢復標準畫質模式', 'info');
}

function handleCheatCode(code, callback) {
  const res = progressStore.applyCheatCode(code);
  callback(res);
  if (res.success) {
    showToast(res.message, 'success', 4000);
  } else {
    showToast(res.message, 'error');
  }
}

function handleRegisterSceneTrigger(triggerFn) {
  levelStore.setSceneActionTrigger(triggerFn);
}

// Global Keyboard Shortcuts (Ctrl+Enter or Cmd+Enter to Run)
function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!levelStore.isExecuting) {
      handleRunCode();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  soundManager.init();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-space);
  position: relative;
  overflow: hidden;
}

.toast-notice {
  position: fixed;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
  letter-spacing: 0.02em;
}

.toast-info {
  background: rgba(10, 16, 29, 0.96);
  border: 1px solid var(--cyan-primary);
  color: #e0f2fe;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.35);
}

.toast-success {
  background: rgba(8, 25, 20, 0.96);
  border: 1px solid var(--success-emerald);
  color: #d1fae5;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
}

.toast-error {
  background: rgba(30, 12, 16, 0.96);
  border: 1px solid var(--danger-crimson);
  color: #ffe4e6;
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.35);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
