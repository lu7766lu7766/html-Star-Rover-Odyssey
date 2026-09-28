<template>
  <main class="split-layout">
    <!-- Left Column: Mission + Code Editor + Console -->
    <section class="pane left-pane">
      <!-- Upper: Mission Info -->
      <div class="mission-wrapper">
        <slot name="mission"></slot>
      </div>

      <!-- Center: CodeMirror Editor -->
      <div class="editor-wrapper">
        <slot name="editor"></slot>
      </div>

      <!-- Bottom: Console Output -->
      <div class="console-wrapper">
        <slot name="console"></slot>
      </div>
    </section>

    <!-- Right Column: Three.js 3D Game Viewport -->
    <section class="pane right-pane">
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
  grid-template-columns: minmax(420px, 48%) 1fr;
  height: calc(100vh - 60px);
  padding: 0.75rem;
  gap: 0.75rem;
  background: var(--bg-space);
  overflow: hidden;
}

.pane {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.left-pane {
  display: grid;
  grid-template-rows: 210px 1fr 160px;
  gap: 0.65rem;
  height: 100%;
}

.mission-wrapper,
.editor-wrapper,
.console-wrapper {
  min-height: 0;
  overflow: hidden;
}

.right-pane {
  height: 100%;
  position: relative;
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
    height: 700px;
    grid-template-rows: 200px 1fr 160px;
  }

  .right-pane {
    height: 480px;
  }
}
</style>
