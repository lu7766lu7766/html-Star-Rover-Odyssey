<template>
  <div class="game-viewport-container">
    <!-- 3D Canvas Mount Point -->
    <div class="canvas-wrapper" ref="canvasContainer"></div>

    <!-- Viewport Optical HUD Header (Top Left / Right) -->
    <div class="viewport-telemetry-banner">
      <div class="telemetry-item">
        <span class="beacon-dot"></span>
        <span class="telemetry-label">3D OPTICAL SENSOR</span>
      </div>
      <div class="telemetry-item hide-mobile">
        <span class="telemetry-dim">SUB-ORBIT:</span>
        <span class="telemetry-val">ALT 142.8 KM</span>
      </div>
    </div>

    <!-- HUD Overlay Controls (Top Right) -->
    <div class="viewport-hud-controls">
      <button class="btn btn-sm hud-btn" @click="resetCamera" title="重設 3D 觀察視角">
        <Compass :size="14" class="icon-hud" />
        <span>視角復位</span>
      </button>
      <button class="btn btn-sm hud-btn" @click="resetScene" title="重設 3D 場景物理狀態">
        <RotateCcw :size="14" class="icon-hud" />
        <span>重置場景</span>
      </button>
    </div>

    <!-- Level 6 Custom Mock DOM HUD -->
    <ControlPanelHUD
      v-if="levelId === 6"
      :mock-dom-state="mockDomState"
      @button-click="$emit('mock-dom-click', $event)"
    />

    <!-- Level 7 Custom Drone Fleet HUD -->
    <DroneFleetHUD
      v-if="levelId === 7"
      :drones="droneFleetData"
    />

    <!-- WebGL Context Lost Warning -->
    <div v-if="contextLost" class="context-lost-banner">
      <AlertTriangle :size="22" class="text-danger" />
      <div class="banner-text">
        <strong>3D 圖形核心中斷 · WEBGL CONTEXT INTERRUPTED</strong>
        <span>瀏覽器已釋放 GPU 圖形資源，請點擊右側按鈕重新建立連線。</span>
      </div>
      <button class="btn btn-primary btn-sm" @click="reinitScene">重新連線</button>
    </div>

    <!-- Level Complete Success Milestone Modal -->
    <div v-if="showSuccessModal" class="success-overlay" @click.self="closeSuccess">
      <div class="success-card glass-panel pulse-glow">
        <div class="success-badge-container">
          <div class="badge-ring"></div>
          <div class="success-icon-wrapper">
            <Award :size="42" class="icon-award" />
          </div>
        </div>

        <div class="success-headings">
          <span class="sub-heading">MISSION NOMINAL · TELEMETRY VERIFIED</span>
          <h3 class="success-title">任務圓滿達成！</h3>
        </div>

        <div class="success-feedback-box">
          <p class="success-feedback">{{ feedbackText }}</p>
        </div>

        <div class="success-actions">
          <button class="btn btn-secondary btn-sm" @click="closeSuccess">
            留在本站觀察
          </button>
          <button v-if="hasNextLevel" class="btn btn-success" @click="goToNextLevel">
            <span>前往下一站導航</span>
            <ArrowRight :size="16" />
          </button>
          <button v-else class="btn btn-success" @click="closeSuccess">
            <span>恭喜通關全課程！</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { Compass, RotateCcw, AlertTriangle, Award, ArrowRight } from 'lucide-vue-next';
import { SceneManager } from '../../game/core/SceneManager.js';
import { Level1Scene } from '../../game/scenes/Level1Scene.js';
import { Level2Scene } from '../../game/scenes/Level2Scene.js';
import { Level3Scene } from '../../game/scenes/Level3Scene.js';
import { Level4Scene } from '../../game/scenes/Level4Scene.js';
import { Level5Scene } from '../../game/scenes/Level5Scene.js';
import { Level6Scene } from '../../game/scenes/Level6Scene.js';
import { Level7Scene } from '../../game/scenes/Level7Scene.js';
import ControlPanelHUD from './ControlPanelHUD.vue';
import DroneFleetHUD from './DroneFleetHUD.vue';

const props = defineProps({
  levelId: {
    type: Number,
    required: true
  },
  mockDomState: {
    type: Object,
    default: () => ({})
  },
  lastRunResult: {
    type: Object,
    default: null
  },
  isSuccessModalOpen: {
    type: Boolean,
    default: false
  },
  isLowPerformance: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['mock-dom-click', 'next-level', 'close-success', 'register-trigger']);

const canvasContainer = ref(null);
let sceneManager = null;
const contextLost = ref(false);

const showSuccessModal = computed(() => props.isSuccessModalOpen);
const hasNextLevel = computed(() => props.levelId < 7);
const feedbackText = computed(() => props.lastRunResult?.feedback || '探測船邏輯自檢完成，所有遙測數據全數通過！');

const droneFleetData = computed(() => {
  if (props.lastRunResult?.data?.fleet) {
    return props.lastRunResult.data.fleet;
  }
  return [
    { id: "drone-01", x: -6, y: 5, z: 2, battery: 85, status: 'STANDBY' },
    { id: "drone-02", x: -2, y: 7, z: -3, battery: 18, status: 'STANDBY' },
    { id: "drone-03", x: 3, y: 6, z: 1, battery: 92, status: 'STANDBY' },
    { id: "drone-04", x: 7, y: 4, z: -2, battery: 15, status: 'STANDBY' }
  ];
});

function createSceneInstance(id) {
  switch (id) {
    case 1: return new Level1Scene();
    case 2: return new Level2Scene();
    case 3: return new Level3Scene();
    case 4: return new Level4Scene();
    case 5: return new Level5Scene();
    case 6: return new Level6Scene();
    case 7: return new Level7Scene();
    default: return new Level1Scene();
  }
}

function loadLevelScene(id) {
  if (!sceneManager) return;
  const instance = createSceneInstance(id);
  sceneManager.switchGameScene(instance);
}

function resetCamera() {
  if (sceneManager) {
    sceneManager.cameraController.reset();
  }
}

function resetScene() {
  if (sceneManager) {
    sceneManager.resetCurrentScene();
  }
}

function reinitScene() {
  if (sceneManager) {
    sceneManager.dispose();
  }
  contextLost.value = false;
  init3D();
}

function closeSuccess() {
  emit('close-success');
}

function goToNextLevel() {
  emit('close-success');
  emit('next-level');
}

function init3D() {
  if (!canvasContainer.value) return;
  sceneManager = new SceneManager(canvasContainer.value);

  sceneManager.onContextLostCallback = () => {
    contextLost.value = true;
  };
  sceneManager.onContextRestoredCallback = () => {
    contextLost.value = false;
  };

  loadLevelScene(props.levelId);

  // Register scene action trigger so levelStore can drive 3D animations
  emit('register-trigger', (actionType, payload) => {
    if (sceneManager && sceneManager.activeGameScene) {
      sceneManager.activeGameScene.handleAction(actionType, payload);
    }
  });
}

onMounted(() => {
  init3D();
});

watch(() => props.levelId, (newId) => {
  loadLevelScene(newId);
});

watch(() => props.isLowPerformance, (isLow) => {
  if (sceneManager) {
    sceneManager.setLowPerformance(isLow);
  }
});

onBeforeUnmount(() => {
  if (sceneManager) {
    sceneManager.dispose();
    sceneManager = null;
  }
});
</script>

<style scoped>
.game-viewport-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #04070e;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  outline: none;
}

.viewport-telemetry-banner {
  position: absolute;
  top: 0.85rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(9, 14, 25, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-sm);
  z-index: 10;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.telemetry-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.telemetry-label {
  color: var(--cyan-primary);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.telemetry-dim {
  color: var(--text-muted);
}

.telemetry-val {
  color: #f1f5f9;
  font-weight: 600;
}

.viewport-hud-controls {
  position: absolute;
  top: 0.85rem;
  right: 1rem;
  display: flex;
  gap: 0.4rem;
  z-index: 10;
  pointer-events: auto;
}

.hud-btn {
  background: rgba(11, 16, 29, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-medium);
  font-size: 0.76rem;
  padding: 0.32rem 0.65rem;
}

.hud-btn:hover {
  border-color: var(--cyan-primary);
  background: rgba(0, 229, 255, 0.12);
}

.icon-hud {
  color: var(--cyan-primary);
}

.context-lost-banner {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(244, 63, 94, 0.18);
  border: 1px solid var(--danger-crimson);
  backdrop-filter: blur(12px);
  padding: 0.85rem 1.35rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 25;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
}

.banner-text {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: #fecdd3;
  gap: 0.15rem;
}

/* Success Milestone Modal */
.success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(3, 6, 12, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  padding: 1.5rem;
}

.success-card {
  width: 100%;
  max-width: 460px;
  background: #0a1120;
  border: 1px solid var(--success-emerald);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.25);
  padding: 2.2rem;
  text-align: center;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.15rem;
  animation: modalEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.success-badge-container {
  position: relative;
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px dashed rgba(16, 185, 129, 0.6);
  animation: rotateRing 12s linear infinite;
}

@keyframes rotateRing {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.success-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.16);
  border: 2px solid var(--success-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.icon-award {
  color: var(--success-emerald);
}

.success-headings {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sub-heading {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--success-emerald);
  letter-spacing: 0.08em;
}

.success-title {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.success-feedback-box {
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  width: 100%;
}

.success-feedback {
  font-size: 0.88rem;
  color: #d1fae5;
  line-height: 1.5;
}

.success-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.4rem;
  width: 100%;
  justify-content: center;
}

@media (max-width: 600px) {
  .hide-mobile {
    display: none;
  }
}
</style>
