<template>
  <div id="app" class="app-root">
    <!-- Home Starmap Screen -->
    <transition name="page-fade" mode="out-in">
      <HomePage v-if="progressStore.currentView === 'home'" key="home" />

      <!-- Interactive 3-Zone Level Game Workspace -->
      <GameWorkspace v-else key="workspace" />
    </transition>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import HomePage from '../components/home/HomePage.vue';
import GameWorkspace from '../components/layout/GameWorkspace.vue';
import { useProgressStore } from '../stores/progressStore.js';
import { soundManager } from '../game/core/SoundManager.js';

const progressStore = useProgressStore();

onMounted(() => {
  // Sync audio mute state with storage
  soundManager.setMuted(progressStore.isSoundMuted);
});
</script>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
