<template>
  <div class="workspace-root">
    <!-- Top Bar -->
    <LevelTopBar />

    <!-- Three Pane Workspace: Viewport | Controls | Mission -->
    <div
      class="workspace-main"
      :style="gridStyle"
      :class="{
        'is-controls-collapsed': isControlsCollapsed,
        'is-mission-collapsed': isMissionCollapsed
      }"
    >
      <!-- Pane A: 3D Viewport -->
      <section class="pane pane-viewport" aria-label="3D 遊戲場景">
        <div class="pane-toolbar">
          <span class="pane-eyebrow">3D 場景</span>
          <div class="pane-tools">
            <button class="btn btn-ghost btn-xs" @click="isControlsCollapsed = !isControlsCollapsed" :title="isControlsCollapsed ? '展開控制區' : '收合控制區以放大 3D'">
              {{ isControlsCollapsed ? '展開控制' : '專注 3D' }}
            </button>
          </div>
        </div>
        <div class="pane-body">
          <GameViewport
            :level-id="levelStore.currentLevel.id"
            :last-run-result="levelStore.lastRunResult"
            :is-success-modal-open="levelStore.isSuccessModalOpen"
            :is-fail-modal-open="levelStore.isFailModalOpen"
            :is-low-performance="progressStore.isLowPerformanceMode"
            @next-level="handleNextLevel"
            @close-success="levelStore.closeSuccessModal"
            @close-fail="levelStore.closeFailModal"
            @restore-scene="levelStore.restoreScene"
            @restore-vehicle="levelStore.restoreScene"
            @open-hint="levelStore.toggleHintModal(true)"
            @register-trigger="handleRegisterSceneTrigger"
          />
        </div>
      </section>

      <!-- Splitter: viewport <-> controls -->
      <div
        v-if="!isControlsCollapsed && !isMissionCollapsed"
        class="splitter"
        @pointerdown="startResize($event, 'controls')"
        title="拖曳調整控制區寬度"
      />

      <!-- Pane B: Interactive Control Deck -->
      <section v-show="!isControlsCollapsed" class="pane pane-controls" aria-label="操作控制區">
        <div class="pane-toolbar">
          <span class="pane-eyebrow">操作控制</span>
          <span class="pane-meta">{{ levelStore.currentLevel.controlType }}</span>
        </div>
        <div class="pane-body pane-body-tight">
          <ControlDeck />
        </div>
      </section>

      <!-- Splitter: controls <-> mission -->
      <div
        v-if="!isControlsCollapsed && !isMissionCollapsed"
        class="splitter"
        @pointerdown="startResize($event, 'mission')"
        title="拖曳調整任務區寬度"
      />

      <!-- Pane C: Mission Hub -->
      <section v-show="!isMissionCollapsed" class="pane pane-mission" aria-label="任務資訊區">
        <div class="pane-toolbar">
          <span class="pane-eyebrow">任務簡報</span>
          <div class="pane-tools">
            <button class="btn btn-ghost btn-xs" @click="isMissionCollapsed = true" title="收合任務欄以放大操作區">
              收合
            </button>
          </div>
        </div>
        <div class="pane-body pane-body-tight">
          <MissionHub />
        </div>
      </section>

      <!-- Collapsed mission reopen -->
      <button
        v-if="isMissionCollapsed"
        class="btn btn-outline btn-sm mission-reopen"
        @click="isMissionCollapsed = false"
        title="展開任務簡報"
      >
        任務
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import LevelTopBar from './LevelTopBar.vue';
import GameViewport from '../game/GameViewport.vue';
import ControlDeck from '../controls/ControlDeck.vue';
import MissionHub from '../mission/MissionHub.vue';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const isControlsCollapsed = ref(false);
const isMissionCollapsed = ref(false);
const controlsWidth = ref(460);
const missionWidth = ref(330);

const gridStyle = computed(() => {
  if (isControlsCollapsed.value && isMissionCollapsed.value) {
    return { gridTemplateColumns: 'minmax(0, 1fr)' };
  }
  if (isControlsCollapsed.value) {
    return { gridTemplateColumns: `minmax(0, 1fr) 8px minmax(280px, ${missionWidth.value}px)` };
  }
  if (isMissionCollapsed.value) {
    return { gridTemplateColumns: `minmax(0, 1fr) 8px minmax(380px, ${controlsWidth.value}px)` };
  }
  return {
    gridTemplateColumns: `minmax(0, 1fr) 8px minmax(380px, ${controlsWidth.value}px) 8px minmax(280px, ${missionWidth.value}px)`
  };
});

let resizingWhich = null;
function startResize(e, which) {
  resizingWhich = which;
  e.preventDefault();
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', stopResize, { once: true });
}

function onResizeMove(e) {
  if (!resizingWhich) return;
  if (resizingWhich === 'controls') {
    // distance from right edge approximates desired control width when mission visible
    const fromRight = window.innerWidth - e.clientX;
    const next = Math.round(fromRight - missionWidth.value - 40);
    controlsWidth.value = Math.min(620, Math.max(380, next));
  } else if (resizingWhich === 'mission') {
    const fromRight = window.innerWidth - e.clientX;
    missionWidth.value = Math.min(400, Math.max(280, Math.round(fromRight)));
  }
}

function stopResize() {
  resizingWhich = null;
  window.removeEventListener('pointermove', onResizeMove);
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onResizeMove);
});

function handleRegisterSceneTrigger(triggerFn) {
  levelStore.setSceneActionTrigger(triggerFn);
}

function handleNextLevel() {
  const nextId = levelStore.currentLevel.id + 1;
  if (nextId <= progressStore.totalLevels) {
    progressStore.goToLevel(nextId);
  } else {
    progressStore.goToHome();
  }
}
</script>

<style scoped>
.workspace-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-space);
  background-image: var(--bg-space-gradient);
}

.workspace-main {
  flex: 1;
  display: grid;
  gap: 0;
  padding: var(--workspace-pad);
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-panel);
}

.pane-viewport {
  background: #eef4ff;
}

.pane-toolbar {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.8rem;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.9);
}

.pane-eyebrow {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.pane-meta {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.pane-tools {
  display: flex;
  gap: 0.4rem;
}

.pane-body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.pane-body-scroll {
  overflow-y: auto;
}

.pane-body-tight {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-body-tight > * {
  flex: 1;
  min-height: 0;
}

.splitter {
  cursor: col-resize;
  background: transparent;
  position: relative;
}

.splitter::after {
  content: '';
  position: absolute;
  top: 12%;
  bottom: 12%;
  left: 3px;
  width: 2px;
  border-radius: 2px;
  background: var(--border-medium);
  opacity: 0.7;
  transition: background var(--transition-fast);
}

.splitter:hover::after {
  background: var(--primary-blue);
}

.mission-reopen {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 20;
  background: #ffffff;
}

/* Narrow: stack to 2 cols then 1 col */
@media (max-width: 1280px) {
  .workspace-main {
    grid-template-columns: minmax(0, 1fr) minmax(360px, 420px) !important;
  }
  .pane-mission {
    display: none;
  }
  .mission-reopen {
    display: inline-flex;
  }
  .splitter:nth-of-type(2) {
    display: none;
  }
}

@media (max-width: 900px) {
  .workspace-main {
    display: flex !important;
    flex-direction: column;
    overflow-y: auto;
  }
  .pane-viewport {
    height: 380px;
    flex: none;
  }
  .pane-controls,
  .pane-mission {
    min-height: 420px;
    flex: none;
  }
  .splitter {
    display: none;
  }
}
</style>
