<template>
  <div class="game-viewport-container">
    <!-- 3D Canvas Mount Point -->
    <div class="canvas-wrapper" ref="canvasContainer"></div>

    <!-- HUD Overlay Controls (Top Right) -->
    <div class="viewport-hud-controls">
      <button class="btn btn-sm hud-btn" @click="resetCamera" title="重設 3D 觀察視角">
        <Compass :size="14" />
        <span>重設視角</span>
      </button>
      <button class="btn btn-sm hud-btn" @click="resetScene" title="重設 3D 場景狀態">
        <RotateCcw :size="14" />
        <span>重設場景</span>
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
      <AlertTriangle :size="24" class="text-danger" />
      <div class="banner-text">
        <strong>3D 渲染核心斷開 (WebGL Context Lost)</strong>
        <span>瀏覽器釋放了圖形資源，請點擊按鈕重新初始化。</span>
      </div>
      <button class="btn btn-primary btn-sm" @click="reinitScene">重新連線</button>
    </div>

    <!-- Level Complete Success Banner Modal -->
    <div v-if="showSuccessModal" class="success-overlay" @click.self="closeSuccess">
      <div class="success-card glass-panel pulse-glow">
        <div class="success-icon-wrapper">
          <Award :size="48" class="icon-award" />
        </div>
        <h3 class="success-title">任務圓滿達成！</h3>
        <p class="success-feedback">{{ feedbackText }}</p>

        <div class="success-actions">
          <button class="btn btn-secondary btn-sm" @click="closeSuccess">留在本關觀察</button>
          <button v-if="hasNextLevel" class="btn btn-success" @click="goToNextLevel">
            <span>前往下一關</span>
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
const feedbackText = computed(() => props.lastRunResult?.feedback || '程式碼邏輯檢驗全部通過！');

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
  background: #07090e;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  outline: none;
}

.viewport-hud-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
  pointer-events: auto;
}

.hud-btn {
  background: rgba(13, 18, 29, 0.75);
  backdrop-filter: blur(8px);
}

.context-lost-banner {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  backdrop-filter: blur(8px);
  padding: 0.8rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 20;
}

.banner-text {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: #fca5a5;
}

.success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(4, 7, 15, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  padding: 1rem;
}

.success-card {
  width: 100%;
  max-width: 440px;
  background: #0b1220;
  border: 1px solid var(--success-emerald);
  padding: 2rem;
  text-align: center;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.success-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.15);
  border: 2px solid var(--success-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-award {
  color: var(--success-emerald);
}

.success-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
}

.success-feedback {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
}

.success-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  width: 100%;
  justify-content: center;
}
</style>
