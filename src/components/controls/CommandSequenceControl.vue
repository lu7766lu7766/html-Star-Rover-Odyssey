<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <Layers :size="18" class="text-brand" />
        <h3 class="deck-title">指令編排隊列 · Command Sequencer</h3>
      </div>
      <div class="deck-actions">
        <button class="btn btn-ghost btn-sm" @click="clearSequence" :disabled="sequence.length === 0" title="清空全部指令">
          <Trash2 :size="14" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- Available Commands Palette (Click to Add) -->
    <div class="palette-box">
      <span class="palette-label">指令庫 (點擊加入執行隊列)：</span>
      <div class="commands-row">
        <button
          v-for="cmd in availableCommands"
          :key="cmd.id"
          class="btn btn-outline btn-sm cmd-chip"
          @click="addCommand(cmd.id)"
          :title="cmd.description"
        >
          <component :is="getCommandIcon(cmd.id)" :size="14" class="text-brand" />
          <span>{{ cmd.label }}</span>
        </button>
      </div>
    </div>

    <!-- Sequence Drag-and-Drop / Reorder List -->
    <div class="sequence-box">
      <div v-if="sequence.length === 0" class="empty-placeholder">
        <MousePointerClick :size="24" class="text-muted" />
        <p>尚未加入任何指令，點擊上方指令卡開始排入隊列！</p>
      </div>

      <div v-else class="sequence-list">
        <div
          v-for="(cmdId, index) in sequence"
          :key="index"
          class="sequence-item"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent
          @drop="onDrop($event, index)"
        >
          <div class="item-left">
            <span class="step-badge">STEP {{ index + 1 }}</span>
            <div class="item-name">
              <component :is="getCommandIcon(cmdId)" :size="15" class="text-brand" />
              <strong>{{ getCommandLabel(cmdId) }}</strong>
            </div>
          </div>

          <div class="item-controls">
            <!-- Move Up -->
            <button
              class="btn btn-ghost btn-xs ctrl-btn"
              :disabled="index === 0"
              @click="moveStep(index, -1)"
              title="上移"
            >
              <ArrowUp :size="12" />
            </button>

            <!-- Move Down -->
            <button
              class="btn btn-ghost btn-xs ctrl-btn"
              :disabled="index === sequence.length - 1"
              @click="moveStep(index, 1)"
              title="下移"
            >
              <ArrowDown :size="12" />
            </button>

            <!-- Delete -->
            <button
              class="btn btn-ghost btn-xs ctrl-btn text-danger"
              @click="removeStep(index)"
              title="移除此步驟"
            >
              <X :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="steps-count">
        已編排 <strong>{{ sequence.length }}</strong> 個指令步驟
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="sequence.length === 0 || levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '探測船執行中...' : '啟動執行' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  Layers, Trash2, ArrowUp, ArrowDown, X, Play, MousePointerClick,
  Power, ArrowUp as ForwardIcon, RotateCcw, RotateCw, Square
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const availableCommands = [
  { id: 'START_ENGINE', label: '啟動引擎', description: '激活主發電機與推進器' },
  { id: 'MOVE_FORWARD', label: '前進一格', description: '沿當前朝向前進一個座標單位' },
  { id: 'TURN_LEFT', label: '向左轉', description: '逆時針旋轉 90 度' },
  { id: 'TURN_RIGHT', label: '向右轉', description: '順時針旋轉 90 度' },
  { id: 'STOP', label: '停止', description: '切斷動力煞停在泊位' }
];

const sequence = ref([]);
let draggedIndex = null;

onMounted(() => {
  const saved = progressStore.getSavedOperation(1);
  if (saved && Array.isArray(saved.sequence)) {
    sequence.value = [...saved.sequence];
  } else {
    // Default initial hint sequence
    sequence.value = ['START_ENGINE', 'TURN_RIGHT', 'MOVE_FORWARD'];
  }
});

function getCommandLabel(cmdId) {
  return availableCommands.find(c => c.id === cmdId)?.label || cmdId;
}

function getCommandIcon(cmdId) {
  switch (cmdId) {
    case 'START_ENGINE': return Power;
    case 'MOVE_FORWARD': return ForwardIcon;
    case 'TURN_LEFT': return RotateCcw;
    case 'TURN_RIGHT': return RotateCw;
    case 'STOP': return Square;
    default: return ForwardIcon;
  }
}

function addCommand(cmdId) {
  soundManager.playClick();
  sequence.value.push(cmdId);
}

function removeStep(index) {
  soundManager.playClick();
  sequence.value.splice(index, 1);
}

function moveStep(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= sequence.value.length) return;
  soundManager.playClick();
  const temp = sequence.value[index];
  sequence.value[index] = sequence.value[target];
  sequence.value[target] = temp;
}

function clearSequence() {
  soundManager.playClick();
  sequence.value = [];
}

function onDragStart(e, index) {
  draggedIndex = index;
  e.dataTransfer.effectAllowed = 'move';
}

function onDrop(e, index) {
  if (draggedIndex === null || draggedIndex === index) return;
  soundManager.playClick();
  const moved = sequence.value.splice(draggedIndex, 1)[0];
  sequence.value.splice(index, 0, moved);
  draggedIndex = null;
}

function runExecution() {
  levelStore.executeLevel({ sequence: sequence.value });
}
</script>

<style scoped>
.control-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-top: 1px solid var(--border-subtle);
  overflow: hidden;
}

.deck-header {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-panel-hover);
}

.deck-title-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.deck-title {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.palette-box {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.palette-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
}

.commands-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cmd-chip {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
}

.sequence-box {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
}

.empty-placeholder {
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.sequence-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.sequence-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  transition: all var(--transition-fast);
}

.sequence-item:hover {
  border-color: var(--primary-blue);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--bg-panel-hover);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.item-name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.ctrl-btn {
  padding: 0.25rem;
  border-radius: var(--radius-sm);
}

.deck-footer {
  height: 52px;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-panel-hover);
}

.steps-count {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.execute-btn {
  padding: 0.5rem 1.4rem;
  font-size: 0.92rem;
}
</style>
