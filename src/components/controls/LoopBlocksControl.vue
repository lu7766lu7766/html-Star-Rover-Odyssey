<template>
  <div class="control-panel">
    <!-- Header -->
    <div class="deck-header">
      <div class="deck-title-group">
        <Repeat :size="18" class="text-brand" />
        <h3 class="deck-title">迷宮拼圖路徑規劃 · Maze Path Puzzle & Loops</h3>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="mode === 'blocks' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'blocks'"
          title="積木拼裝模式（新手友善）"
        >
          <span>🧩 積木</span>
        </button>
        <button
          class="btn btn-sm"
          :class="mode === 'code' ? 'btn-success' : 'btn-ghost'"
          @click="mode = 'code'"
          title="手寫 JS 模式（拿 3 星必須用 for）"
        >
          <span>⌨️ 寫碼</span>
        </button>
        <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="還原場景與參數至最初狀態">
          <RotateCcw :size="14" />
          <span>還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- 0. Code mode (L4 MVP: 真寫 JS，走 Worker 驗 trace) -->
      <div v-if="mode === 'code'" class="code-mode-card card">
        <div class="code-mode-header">
          <div class="code-mode-title">
            <Code :size="15" class="text-brand" />
            <span>手寫 JS 挑戰 · 把 ___ 補成數字再執行</span>
          </div>
          <span class="badge badge-info">for 迴圈 ×3 = 3星</span>
        </div>
        <div class="code-editor-wrap">
          <CodeEditor v-model="studentCode" :level-id="4" @reset="resetCode" />
        </div>
        <div class="code-mode-actions">
          <button class="btn btn-ghost btn-sm" @click="fillAnswerHint" title="填入提示數值（會降為 2 星起評）">
            <span>💡 填入提示值</span>
          </button>
          <button
            class="btn btn-success execute-btn"
            :disabled="levelStore.isExecuting || !studentCode.trim()"
            @click="runCodeExecution"
          >
            <Play :size="16" />
            <span>{{ levelStore.isExecuting ? '沙箱執行中...' : '執行 JS 程式碼' }}</span>
          </button>
        </div>
        <div class="code-mode-logs" v-if="levelStore.executionLogs.length > 0">
          <div
            v-for="log in levelStore.executionLogs.slice(-4)"
            :key="log.id"
            class="mini-log"
            :class="'mini-log-' + log.type"
          >
            {{ log.message }}
          </div>
        </div>
      </div>

      <!-- 1. Real-time Block Count & Optimal Comparison Banner -->
      <div class="benchmark-card card">
        <div class="benchmark-top">
          <div class="metric-group">
            <span class="metric-label">目前拼圖數量</span>
            <div class="metric-value-wrap">
              <span class="metric-val" :class="blockCountClass">{{ blocks.length }}</span>
              <span class="metric-unit">塊積木</span>
            </div>
          </div>

          <div class="metric-divider"></div>

          <div class="metric-group">
            <span class="metric-label">最優解目標</span>
            <div class="metric-value-wrap">
              <span class="metric-val optimal">5</span>
              <span class="metric-unit">塊積木</span>
            </div>
          </div>

          <div class="status-badge-wrap">
            <span
              class="badge"
              :class="blocks.length <= 5 ? 'badge-success' : 'badge-info'"
            >
              {{ blocks.length <= 5 ? '🌟 最優解達成中 (<= 5 塊)' : '✓ 抵達即可通關 (無需最優解)' }}
            </span>
          </div>
        </div>

        <div class="benchmark-hint">
          <Info :size="14" class="hint-icon" />
          <span>只要繞過障礙物抵達 <strong>(4, 4) 基地</strong> 即可過關！使用迴圈包裝重複步數可精簡為 5 塊最優解。</span>
        </div>
      </div>

      <!-- 2. Block Palette (拼圖工具箱) -->
      <div v-if="mode === 'blocks'" class="palette-section">
        <div class="section-label">
          <span>拼圖工具箱（點擊加入路徑）：</span>
        </div>
        <div class="palette-grid">
          <button class="palette-btn btn-forward" @click="addBlock('FORWARD')">
            <ArrowUp :size="16" />
            <span class="btn-text">前進</span>
            <span class="btn-sub">FORWARD</span>
          </button>

          <button class="palette-btn btn-backward" @click="addBlock('BACKWARD')">
            <ArrowDown :size="16" />
            <span class="btn-text">後退</span>
            <span class="btn-sub">BACKWARD</span>
          </button>

          <button class="palette-btn btn-turn" @click="addBlock('TURN_LEFT')">
            <CornerUpLeft :size="16" />
            <span class="btn-text">左轉 90°</span>
            <span class="btn-sub">TURN_LEFT</span>
          </button>

          <button class="palette-btn btn-turn" @click="addBlock('TURN_RIGHT')">
            <CornerUpRight :size="16" />
            <span class="btn-text">右轉 90°</span>
            <span class="btn-sub">TURN_RIGHT</span>
          </button>

          <button class="palette-btn btn-loop" @click="addBlock('LOOP')">
            <Repeat :size="16" />
            <span class="btn-text">for 迴圈</span>
            <span class="btn-sub">LOOP (N次)</span>
          </button>
        </div>
      </div>

      <!-- 3. Puzzle Assembly Workspace (已拼裝路徑清單) -->
      <div v-if="mode === 'blocks'" class="workspace-section">
        <div class="workspace-header">
          <div class="workspace-title-group">
            <span class="section-label">已拼裝路徑清單 ({{ blocks.length }} 塊)：</span>
          </div>
          <button
            class="btn btn-ghost btn-xs text-danger"
            @click="clearAllBlocks"
            :disabled="blocks.length === 0"
            title="清空所有積木"
          >
            <Trash2 :size="12" />
            <span>清空</span>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="blocks.length === 0" class="empty-workspace card">
          <HelpCircle :size="24" class="text-muted" />
          <p>目前拼圖序列為空！</p>
          <span>請從上方工具箱點擊「前進」、「轉彎」或「迴圈」積木開始拼裝路徑。</span>
        </div>

        <!-- Blocks List -->
        <div v-else class="blocks-list">
          <div
            v-for="(block, index) in blocks"
            :key="block.id"
            class="puzzle-block card"
            :class="'block-' + block.type.toLowerCase()"
          >
            <!-- Step Index -->
            <div class="step-num">#{{ index + 1 }}</div>

            <!-- Standard Action Block -->
            <div v-if="block.type !== 'LOOP'" class="block-main">
              <div class="block-icon-wrap" :class="'icon-' + block.type.toLowerCase()">
                <ArrowUp v-if="block.type === 'FORWARD'" :size="16" />
                <ArrowDown v-if="block.type === 'BACKWARD'" :size="16" />
                <CornerUpLeft v-if="block.type === 'TURN_LEFT'" :size="16" />
                <CornerUpRight v-if="block.type === 'TURN_RIGHT'" :size="16" />
              </div>
              <div class="block-info">
                <span class="block-name">{{ getBlockLabel(block.type) }}</span>
                <span class="block-code">{{ getBlockCodeSnippet(block) }}</span>
              </div>
            </div>

            <!-- Loop Block with Sub-Controls -->
            <div v-else class="block-main block-loop-body">
              <div class="loop-head">
                <div class="loop-title-wrap">
                  <Repeat :size="16" class="text-success" />
                  <span class="loop-keyword">重複執行 (for loop)</span>
                </div>
                <!-- Loop Stepper -->
                <div class="loop-stepper">
                  <button class="step-btn" @click="changeLoopCount(block, -1)" :disabled="block.count <= 2">-</button>
                  <span class="step-val">{{ block.count }}</span>
                  <button class="step-btn" @click="changeLoopCount(block, 1)" :disabled="block.count >= 6">+</button>
                  <span class="step-unit">次</span>
                </div>
              </div>

              <!-- Loop Inner Action Selector -->
              <div class="loop-inner-action">
                <span class="inner-label">每次循環：</span>
                <select
                  v-model="block.action"
                  class="action-select"
                >
                  <option value="FORWARD">⬆️ 前進 1 格 (moveForward)</option>
                  <option value="BACKWARD">⬇️ 後退 1 格 (moveBackward)</option>
                  <option value="TURN_LEFT">↩️ 左轉 90° (turnLeft)</option>
                  <option value="TURN_RIGHT">↪️ 右轉 90° (turnRight)</option>
                </select>
              </div>

              <div class="loop-foot">
                <span class="loop-code-hint">&#125; // 迴圈共重複 {{ block.count }} 次</span>
              </div>
            </div>

            <!-- Reorder & Delete Controls -->
            <div class="block-tools">
              <button
                class="tool-btn"
                :disabled="index === 0"
                @click="moveBlock(index, -1)"
                title="往上移"
              >
                ▲
              </button>
              <button
                class="tool-btn"
                :disabled="index === blocks.length - 1"
                @click="moveBlock(index, 1)"
                title="往下移"
              >
                ▼
              </button>
              <button
                class="tool-btn btn-del"
                @click="removeBlock(index)"
                title="刪除積木"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Path Simulation Radar（跑後才揭曉，避免照抄） -->
      <div class="radar-card card">
        <div class="radar-header">
          <div class="radar-title">
            <Compass :size="15" class="text-brand" />
            <span>2D 航向雷達與路徑預演（執行後揭曉）</span>
          </div>
          <span
            class="badge"
            :class="hasRunOnce ? simulationResult.statusClass : 'badge-info'"
          >
            {{ hasRunOnce ? simulationResult.statusText : '🔒 尚未執行' }}
          </span>
        </div>

        <div v-if="!hasRunOnce" class="radar-locked">
          <span>🔒 先按「執行 JS 程式碼」或「啟動巡航測試」，跑完才顯示終點、步數與撞牆位置。先想，再驗證。</span>
        </div>

        <div v-else class="radar-body">
          <!-- 6x6 Mini Grid -->
          <div class="mini-grid">
            <div
              v-for="r in 6"
              :key="'row-' + (6 - r)"
              class="grid-row"
            >
              <div
                v-for="c in 6"
                :key="'cell-' + (c - 1) + '-' + (6 - r)"
                class="grid-cell"
                :class="getCellClass(c - 1, 6 - r)"
                :title="getCellTitle(c - 1, 6 - r)"
              >
                <span v-if="c - 1 === 1 && (6 - r) === 0" class="cell-tag start">S</span>
                <span v-else-if="c - 1 === 4 && (6 - r) === 4" class="cell-tag target">★</span>
                <span v-else-if="isObstacle(c - 1, 6 - r)" class="cell-tag obs">▲</span>
                <span v-else-if="simulationResult.finalX === (c - 1) && simulationResult.finalY === (6 - r)" class="cell-tag rover">
                  {{ getDirArrow(simulationResult.finalDir) }}
                </span>
                <span v-else-if="simulationResult.visitedPaths.has(`${c - 1},${6 - r}`)" class="cell-dot">·</span>
              </div>
            </div>
          </div>

          <!-- Radar Info Readout -->
          <div class="radar-details">
            <div class="detail-row">
              <span class="detail-k">起點座標：</span>
              <span class="detail-v text-brand">(1, 0) 朝北</span>
            </div>
            <div class="detail-row">
              <span class="detail-k">目標基地：</span>
              <span class="detail-v text-success">(4, 4) 基地 ★</span>
            </div>
            <div class="detail-row">
              <span class="detail-k">預計終點：</span>
              <span class="detail-v" :class="simulationResult.arrived ? 'text-success font-bold' : 'text-primary'">
                ({{ simulationResult.finalX }}, {{ simulationResult.finalY }}) 朝{{ getDirName(simulationResult.finalDir) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-k">累計步數：</span>
              <span class="detail-v">{{ simulationResult.totalSteps }} 步動作</span>
            </div>
            <div class="detail-alert" :class="simulationResult.alertClass">
              {{ simulationResult.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Dynamic JavaScript Code Preview -->
      <div v-if="mode === 'blocks'" class="code-preview-card card">
        <div class="code-preview-header">
          <span class="code-preview-title">JavaScript 對照程式碼預覽：</span>
          <span class="code-badge">ES6 Syntax</span>
        </div>
        <pre class="code-content"><code>{{ generatedJsCode }}</code></pre>
      </div>
    </div>

    <!-- Footer Controls -->
    <div class="deck-footer">
      <div class="footer-left">
        <span v-if="mode === 'code'" class="footer-hint">寫碼模式：在上方編輯器按「執行 JS 程式碼」</span>
      </div>

      <div class="footer-right">
        <button
          v-if="mode === 'blocks'"
          class="btn btn-success execute-btn"
          :disabled="levelStore.isExecuting || blocks.length === 0"
          @click="runExecution"
        >
          <Play :size="16" />
          <span>{{ levelStore.isExecuting ? '探測車巡航測試中...' : '啟動巡航測試' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Repeat,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  CornerUpLeft,
  CornerUpRight,
  Trash2,
  Play,
  Info,
  Compass,
  HelpCircle,
  Code
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { LEVEL_4_MAP, LEVEL_4_STARTER_CODE } from '../../levels/level-4.js';
import CodeEditor from '../editor/CodeEditor.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

// 混合漸進：預設寫碼模式，積木當鷹架
const mode = ref('code');
const studentCode = ref(LEVEL_4_STARTER_CODE);
const hasRunOnce = ref(false);

let uid = 100;

// Blocks array
const blocks = ref([
  { id: 'b-init-1', type: 'FORWARD' }
]);

onMounted(() => {
  const saved = progressStore.getSavedOperation(4);
  if (saved) {
    if (typeof saved.code === 'string' && saved.code.length > 0) {
      studentCode.value = saved.code;
    }
    if (saved.loopConfig && Array.isArray(saved.loopConfig.blocks) && saved.loopConfig.blocks.length > 0) {
      blocks.value = JSON.parse(JSON.stringify(saved.loopConfig.blocks));
    }
  }
});

function addBlock(type) {
  uid++;
  if (type === 'LOOP') {
    blocks.value.push({
      id: `b-${uid}`,
      type: 'LOOP',
      count: 2,
      action: 'FORWARD'
    });
  } else {
    blocks.value.push({
      id: `b-${uid}`,
      type
    });
  }
}

function changeLoopCount(block, delta) {
  const next = (block.count || 2) + delta;
  if (next >= 2 && next <= 6) {
    block.count = next;
  }
}

function moveBlock(index, direction) {
  const target = index + direction;
  if (target >= 0 && target < blocks.value.length) {
    const item = blocks.value.splice(index, 1)[0];
    blocks.value.splice(target, 0, item);
  }
}

function removeBlock(index) {
  blocks.value.splice(index, 1);
}

function clearAllBlocks() {
  blocks.value = [];
}

function resetDefaults() {
  levelStore.resetCurrentLevel();
}

function runExecution() {
  hasRunOnce.value = true;
  levelStore.executeLevel({
    loopConfig: {
      blocks: JSON.parse(JSON.stringify(blocks.value))
    }
  });
}

function runCodeExecution() {
  hasRunOnce.value = true;
  levelStore.executeLevel({
    code: studentCode.value
  });
}

function resetCode() {
  studentCode.value = LEVEL_4_STARTER_CODE;
}

function fillAnswerHint() {
  // 提示值：2-3-2，但用提示後建議仍改成 for 才拿高星
  studentCode.value = studentCode.value
    .replace('i < ___', 'i < 2')
    .replace('j < ___', 'j < 3')
    .replace('k < ___', 'k < 2');
}

function getBlockLabel(type) {
  switch (type) {
    case 'FORWARD': return '前進 1 格 (Forward)';
    case 'BACKWARD': return '後退 1 格 (Backward)';
    case 'TURN_LEFT': return '向左轉 90° (Turn Left)';
    case 'TURN_RIGHT': return '向右轉 90° (Turn Right)';
    default: return type;
  }
}

function getBlockCodeSnippet(block) {
  switch (block.type) {
    case 'FORWARD': return 'rover.moveForward();';
    case 'BACKWARD': return 'rover.moveBackward();';
    case 'TURN_LEFT': return 'rover.turnLeft();';
    case 'TURN_RIGHT': return 'rover.turnRight();';
    default: return '';
  }
}

const blockCountClass = computed(() => {
  if (blocks.value.length === 0) return 'text-muted';
  if (blocks.value.length <= 5) return 'text-success';
  return 'text-brand';
});

// Map simulation helpers
function isObstacle(x, y) {
  return LEVEL_4_MAP.obstacles.some(ob => ob.x === x && ob.y === y);
}

function getDirName(dir) {
  const names = ['北 (+y)', '東 (+x)', '南 (-y)', '西 (-x)'];
  return names[dir] || '北';
}

function getDirArrow(dir) {
  const arrows = ['⬆', '➡', '⬇', '⬅'];
  return arrows[dir] || '⬆';
}

// 2D Real-time Path Simulation
const simulationResult = computed(() => {
  const map = LEVEL_4_MAP;
  const DIRS = [
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 }
  ];

  let x = map.start.x;
  let y = map.start.y;
  let dir = map.start.dir;

  const visitedPaths = new Set();
  visitedPaths.add(`${x},${y}`);

  const flatActions = [];
  for (const b of blocks.value) {
    if (b.type === 'LOOP') {
      const count = b.count || 2;
      for (let i = 0; i < count; i++) {
        flatActions.push(b.action || 'FORWARD');
      }
    } else {
      flatActions.push(b.type);
    }
  }

  let collided = false;
  let outOfBounds = false;
  let stepCount = 0;

  for (const act of flatActions) {
    stepCount++;
    if (act === 'TURN_LEFT') {
      dir = (dir + 3) % 4;
    } else if (act === 'TURN_RIGHT') {
      dir = (dir + 1) % 4;
    } else if (act === 'FORWARD') {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (nx < 0 || nx >= map.gridSize.width || ny < 0 || ny >= map.gridSize.height) {
        outOfBounds = true;
        break;
      }
      if (isObstacle(nx, ny)) {
        collided = true;
        x = nx;
        y = ny;
        break;
      }
      x = nx;
      y = ny;
      visitedPaths.add(`${x},${y}`);
    } else if (act === 'BACKWARD') {
      const nx = x - DIRS[dir].dx;
      const ny = y - DIRS[dir].dy;
      if (nx < 0 || nx >= map.gridSize.width || ny < 0 || ny >= map.gridSize.height) {
        outOfBounds = true;
        break;
      }
      if (isObstacle(nx, ny)) {
        collided = true;
        x = nx;
        y = ny;
        break;
      }
      x = nx;
      y = ny;
      visitedPaths.add(`${x},${y}`);
    }
  }

  const arrived = (x === map.target.x && y === map.target.y);
  let statusText = '規劃中';
  let statusClass = 'badge-info';
  let alertClass = 'alert-info';
  let message = `探測車目前停在 (${x}, ${y})。繼續拼裝路徑前往 (4, 4)！`;

  if (outOfBounds) {
    statusText = '⚠️ 衝出邊界';
    statusClass = 'badge-danger';
    alertClass = 'alert-danger';
    message = `警告：在第 ${stepCount} 步探測車將超出迷宮平台邊界！`;
  } else if (collided) {
    statusText = '💥 撞擊障礙物';
    statusClass = 'badge-danger';
    alertClass = 'alert-danger';
    message = `警告：在第 ${stepCount} 步將在座標 (${x}, ${y}) 撞上能量岩石！`;
  } else if (arrived) {
    if (blocks.value.length <= 5) {
      statusText = '🌟 最優解直達 (<=5塊)';
      statusClass = 'badge-success';
      alertClass = 'alert-success';
      message = `🎉 完美導航！使用 ${blocks.value.length} 塊積木精準抵達基地，達成最優解！`;
    } else {
      statusText = '🎯 成功抵達基地';
      statusClass = 'badge-success';
      alertClass = 'alert-success';
      message = `🎉 成功導航！可順利抵達目的地通關 (目前 ${blocks.value.length} 塊積木)。`;
    }
  } else {
    const dist = Math.abs(x - map.target.x) + Math.abs(y - map.target.y);
    message = `目前預計停在 (${x}, ${y})，距離 (4, 4) 基地尚差 ${dist} 格。`;
  }

  return {
    finalX: x,
    finalY: y,
    finalDir: dir,
    totalSteps: stepCount,
    collided,
    outOfBounds,
    arrived,
    visitedPaths,
    statusText,
    statusClass,
    alertClass,
    message
  };
});

function getCellClass(x, y) {
  const classes = [];
  if (x === 1 && y === 0) classes.push('cell-start');
  if (x === 4 && y === 4) classes.push('cell-target');
  if (isObstacle(x, y)) classes.push('cell-obstacle');
  if (simulationResult.value.visitedPaths.has(`${x},${y}`)) classes.push('cell-visited');
  if (simulationResult.value.finalX === x && simulationResult.value.finalY === y) {
    classes.push('cell-rover');
    if (simulationResult.value.collided) classes.push('cell-crashed');
  }
  return classes.join(' ');
}

function getCellTitle(x, y) {
  if (x === 1 && y === 0) return '起點座標 (1, 0)';
  if (x === 4 && y === 4) return '目標基地 (4, 4)';
  if (isObstacle(x, y)) return `能量岩石障礙物 (${x}, ${y})`;
  return `座標 (${x}, ${y})`;
}

// Generate Live JS code preview
const generatedJsCode = computed(() => {
  if (blocks.value.length === 0) {
    return '// 請從工具箱加入拼圖積木以產生程式碼...';
  }

  const lines = ['// 🚀 自動轉譯之 JavaScript 控制代碼：'];
  let loopIdx = 0;

  for (const b of blocks.value) {
    if (b.type === 'LOOP') {
      const varName = loopIdx === 0 ? 'i' : (loopIdx === 1 ? 'j' : `k${loopIdx}`);
      loopIdx++;
      lines.push(`for (let ${varName} = 0; ${varName} < ${b.count || 2}; ${varName}++) {`);
      lines.push(`  ${getBlockCodeSnippet({ type: b.action || 'FORWARD' })}`);
      lines.push('}');
    } else {
      lines.push(getBlockCodeSnippet(b));
    }
  }

  return lines.join('\n');
});
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 1. Benchmark card */
.benchmark-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.benchmark-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.metric-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.metric-val {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 800;
}

.metric-val.optimal {
  color: var(--primary-blue);
}

.metric-unit {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.metric-divider {
  width: 1px;
  height: 36px;
  background: var(--border-subtle);
}

.status-badge-wrap {
  margin-left: auto;
}

.benchmark-hint {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.hint-icon {
  color: var(--primary-blue);
  flex-shrink: 0;
}

/* 2. Palette Section */
.palette-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
  gap: 0.5rem;
}

.palette-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  gap: 0.2rem;
}

.palette-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.palette-btn:active {
  transform: translateY(0);
}

.btn-text {
  font-size: 0.82rem;
  font-weight: 700;
}

.btn-sub {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.btn-forward {
  border-color: #93c5fd;
  color: #1d4ed8;
  background: #eff6ff;
}

.btn-forward:hover {
  background: #dbeafe;
}

.btn-backward {
  border-color: #cbd5e1;
  color: #475569;
  background: #f8fafc;
}

.btn-backward:hover {
  background: #f1f5f9;
}

.btn-turn {
  border-color: #c7d2fe;
  color: #4338ca;
  background: #eef2ff;
}

.btn-turn:hover {
  background: #e0e7ff;
}

.btn-loop {
  border-color: #86efac;
  color: #15803d;
  background: #f0fdf4;
}

.btn-loop:hover {
  background: #dcfce7;
}

/* 3. Workspace Section */
.workspace-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  background: var(--bg-panel-hover);
  border: 1px dashed var(--border-medium);
  gap: 0.4rem;
}

.empty-workspace p {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text-primary);
  margin: 0;
}

.empty-workspace span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.puzzle-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--border-medium);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.block-forward {
  border-left-color: #3b82f6;
}

.block-backward {
  border-left-color: #64748b;
}

.block-turn_left,
.block-turn_right {
  border-left-color: #6366f1;
}

.block-loop {
  border-left-color: #10b981;
  background: #fafdfb;
}

.step-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 28px;
  flex-shrink: 0;
}

.block-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.block-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-forward {
  background: #dbeafe;
  color: #2563eb;
}

.icon-backward {
  background: #f1f5f9;
  color: #475569;
}

.icon-turn_left,
.icon-turn_right {
  background: #e0e7ff;
  color: #4f46e5;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.block-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.block-code {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Loop body customization */
.block-loop-body {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.loop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.loop-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.loop-keyword {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: #059669;
}

.loop-stepper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.5rem;
}

.step-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.step-val {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 800;
  color: #059669;
  min-width: 18px;
  text-align: center;
}

.step-unit {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.loop-inner-action {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-left: 0.5rem;
  border-left: 2px dashed #a7f3d0;
  width: 100%;
}

.inner-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.action-select {
  font-size: 0.78rem;
  font-family: var(--font-sans);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-primary);
  outline: none;
}

.loop-foot {
  padding-left: 0.5rem;
}

.loop-code-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Tool buttons (reorder, delete) */
.block-tools {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.tool-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-panel-hover);
  color: var(--text-secondary);
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover:not(:disabled) {
  background: var(--border-medium);
  color: var(--text-primary);
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tool-btn.btn-del:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

/* 4. Mini Radar 2D Map */
.radar-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.radar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.radar-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.radar-body {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.mini-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #e2e8f0;
  padding: 3px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.grid-row {
  display: flex;
  gap: 2px;
}

.grid-cell {
  width: 24px;
  height: 24px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 2px;
  position: relative;
  transition: all 0.15s ease;
}

.cell-start {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 800;
}

.cell-target {
  background: #dcfce7;
  color: #15803d;
  font-weight: 900;
  animation: pulse-target 2s infinite ease-in-out;
}

.cell-obstacle {
  background: #fed7aa;
  color: #c2410c;
}

.cell-visited {
  background: #e0f2fe;
}

.cell-rover {
  background: #3b82f6 !important;
  color: #ffffff !important;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
  z-index: 2;
}

.cell-crashed {
  background: #ef4444 !important;
  color: #ffffff !important;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
}

.cell-tag {
  font-size: 0.75rem;
}

.cell-dot {
  font-size: 1.2rem;
  color: #93c5fd;
  line-height: 0;
}

@keyframes pulse-target {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.radar-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
}

.detail-k {
  color: var(--text-muted);
}

.detail-v {
  font-family: var(--font-mono);
  font-weight: 600;
}

.detail-alert {
  margin-top: 0.25rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  line-height: 1.35;
}

.alert-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.alert-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  font-weight: 600;
}

/* 5. Code Preview */
.code-preview-card {
  background: var(--bg-panel-hover);
  border: 1px solid var(--border-subtle);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.code-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-preview-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.code-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background: var(--border-subtle);
  color: var(--text-muted);
}

.code-content {
  margin: 0;
  padding: 0.6rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-primary);
  max-height: 120px;
  overflow-y: auto;
}

/* Footer */
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

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
}

.execute-btn {
  padding: 0.5rem 1.4rem;
  font-size: 0.92rem;
  font-weight: 700;
}

/* L4 MVP: code mode + locked radar */
.code-mode-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.code-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-mode-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.code-editor-wrap {
  height: 260px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.code-mode-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.code-mode-logs {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mini-log {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-hover);
  border: 1px solid var(--border-subtle);
  white-space: pre-wrap;
  word-break: break-all;
}

.mini-log-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.mini-log-success {
  background: #f0fdf4;
  border-color: #86efac;
  color: #15803d;
}

.radar-locked {
  padding: 0.8rem;
  background: var(--bg-panel-hover);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.footer-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
