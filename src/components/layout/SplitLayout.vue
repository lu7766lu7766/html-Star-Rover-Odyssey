<template>
  <main class="split-layout">
    <!-- Left Column: Mission + Code Editor + Console -->
    <section class="pane left-pane">
      <!-- Upper: Mission Info -->
      <div class="mission-wrapper avionics-panel">
        <slot name="mission"></slot>
      </div>

      <!-- Center: CodeMirror Editor -->
      <div class="editor-wrapper avionics-panel">
        <slot name="editor"></slot>
      </div>

      <!-- Bottom: Console Output -->
      <div class="console-wrapper avionics-panel">
        <slot name="console"></slot>
      </div>
    </section>

    <!-- Right Column: Three.js 3D Game Viewport -->
    <section class="pane right-pane avionics-panel">
      <!-- Tactical viewport reticles -->
      <div class="corner-reticle top-left"></div>
      <div class="corner-reticle top-right"></div>
      <div class="corner-reticle bottom-left"></div>
      <div class="corner-reticle bottom-right"></div>
      <slot name="viewport"></slot>
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
.split-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(430px, 46%) 1fr;
  height: calc(100vh - 60px);
  padding: 0.65rem 0.85rem 0.85rem 0.85rem;
  gap: 0.75rem;
  background: transparent;
  overflow: hidden;
}

.pane {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.left-pane {
  display: grid;
  grid-template-rows: 215px 1fr 165px;
  gap: 0.65rem;
  height: 100%;
}

.mission-wrapper,
.editor-wrapper,
.console-wrapper {
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

.right-pane {
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #04070e;
}

/* Tactical Corner Reticles on 3D Viewport */
.corner-reticle {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
  z-index: 15;
}

.top-left {
  top: 8px;
  left: 8px;
  border-top: 2px solid rgba(0, 229, 255, 0.45);
  border-left: 2px solid rgba(0, 229, 255, 0.45);
}

.top-right {
  top: 8px;
  right: 8px;
  border-top: 2px solid rgba(0, 229, 255, 0.45);
  border-right: 2px solid rgba(0, 229, 255, 0.45);
}

.bottom-left {
  bottom: 8px;
  left: 8px;
  border-bottom: 2px solid rgba(0, 229, 255, 0.45);
  border-left: 2px solid rgba(0, 229, 255, 0.45);
}

.bottom-right {
  bottom: 8px;
  right: 8px;
  border-bottom: 2px solid rgba(0, 229, 255, 0.45);
  border-right: 2px solid rgba(0, 229, 255, 0.45);
}

/* Responsive Narrow Screen layout */
@media (max-width: 960px) {
  .split-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
    overflow-y: auto;
    height: auto;
  }

  .left-pane {
    height: 720px;
    grid-template-rows: 215px 1fr 165px;
  }

  .right-pane {
    height: 480px;
  }
}
</style>
