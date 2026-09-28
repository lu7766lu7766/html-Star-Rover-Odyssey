<template>
  <div class="workspace-root">
    <!-- Top Bar -->
    <LevelTopBar />

    <!-- Three Zones Layout -->
    <div class="workspace-main">
      <!-- Left Column: Zone A (3D Scene) + Zone B (Interactive Control Deck) -->
      <div class="stage-column">
        <!-- Zone A: 3D Game Viewport (Primary Visual Focus) -->
        <section class="zone-viewport">
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
        </section>

        <!-- Zone B: Interactive Control Deck -->
        <section class="zone-controls">
          <ControlDeck />
        </section>
      </div>

      <!-- Right Column: Zone C (Mission Hub) -->
      <div class="mission-column">
        <MissionHub />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import LevelTopBar from './LevelTopBar.vue';
import GameViewport from '../game/GameViewport.vue';
import ControlDeck from '../controls/ControlDeck.vue';
import MissionHub from '../mission/MissionHub.vue';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

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
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Left Column: Stage (3D Viewport + Control Deck) */
.stage-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Zone A: 3D Viewport (Takes ~56% height) */
.zone-viewport {
  flex: 56;
  min-height: 240px;
  position: relative;
  overflow: hidden;
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

/* Zone B: Control Deck (Takes ~44% height) */
.zone-controls {
  flex: 44;
  min-height: 200px;
  overflow: hidden;
  border-right: 1px solid var(--border-subtle);
}

/* Zone C: Mission Hub Right Column */
.mission-column {
  width: 380px;
  min-width: 320px;
  max-width: 440px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .workspace-main {
    flex-direction: column;
    overflow-y: auto;
  }
  .stage-column {
    flex: none;
    height: auto;
  }
  .zone-viewport {
    height: 340px;
  }
  .zone-controls {
    height: 380px;
  }
  .mission-column {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: auto;
  }
}
</style>
