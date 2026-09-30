<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <ListFilter :size="18" class="text-brand" />
        <h3 class="deck-title">陣列清單檢視與批次遍歷 · Array Fleet Dispatch</h3>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="還原場景與參數至最初狀態">
          <RotateCcw :size="14" />
          <span>還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- 手寫 forEach + deploy，走 Worker 真跑 -->
      <div class="code-mode-card card">
        <div class="code-mode-header">
          <div class="code-mode-title">
            <Code :size="15" class="text-brand" />
            <span>手寫 JS 挑戰 · 把 ___ 補完再執行</span>
          </div>
          <span class="badge badge-info">forEach = 3星</span>
        </div>
        <div class="code-editor-wrap">
          <CodeEditor v-model="studentCode" :level-id="7" @reset="resetCode" />
        </div>
        <div class="code-mode-actions">
          <button
            class="btn btn-success execute-btn"
            :disabled="levelStore.isExecuting || !studentCode.trim()"
            @click="runCodeExecution"
          >
            <Play :size="16" />
            <span>{{ levelStore.isExecuting ? '編隊調度中...' : '執行 JS 程式碼' }}</span>
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

      <!-- Array Inspector Table（唯讀資料集：讀出每架電量再寫 forEach） -->
      <div class="array-card card">
        <div class="array-header">
          <span class="box-label">無人機陣列清單 (const drones = [ ... ])：</span>
          <span class="badge badge-blue">共 {{ dronesData.length }} 筆資料元素</span>
        </div>

        <div class="drones-table-wrap">
          <table class="drones-table">
            <thead>
              <tr>
                <th>索引 (Index)</th>
                <th>機體代號 (id)</th>
                <th>名稱 (name)</th>
                <th>目前電量 (battery)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(drone, idx) in dronesData"
                :key="drone.id"
              >
                <td class="font-mono">[{{ idx }}]</td>
                <td class="font-mono">{{ drone.id }}</td>
                <td><strong>{{ drone.name }}</strong></td>
                <td>
                  <div class="battery-cell">
                    <span class="battery-pill">
                      <span>{{ drone.battery }}%</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        寫碼模式：在上方編輯器按「執行 JS 程式碼」（forEach 逐架判斷）
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ListFilter, RotateCcw, Play, Code } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { LEVEL_7_STARTER_CODE } from '../../levels/level-7.js';
import CodeEditor from '../editor/CodeEditor.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const dronesData = [
  { id: 'DRONE-01', name: '游隼號', battery: 85, model: 'Recon-X' },
  { id: 'DRONE-02', name: '夜梟號', battery: 15, model: 'Stealth-V' },
  { id: 'DRONE-03', name: '海鵰號', battery: 92, model: 'Heavy-T' },
  { id: 'DRONE-04', name: '雀鷹號', battery: 12, model: 'Scout-M' }
];

const studentCode = ref(LEVEL_7_STARTER_CODE);

onMounted(() => {
  const saved = progressStore.getSavedOperation(7);
  if (saved && typeof saved.code === 'string' && saved.code.length > 0) {
    studentCode.value = saved.code;
  }
});

function resetDefaults() {
  levelStore.resetCurrentLevel();
}

function runCodeExecution() {
  levelStore.executeLevel({
    code: studentCode.value,
    initialData: { drones: JSON.parse(JSON.stringify(dronesData)) }
  });
}

function resetCode() {
  studentCode.value = LEVEL_7_STARTER_CODE;
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

.array-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
}

.array-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-label {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary-blue);
}

.drones-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.drones-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.drones-table th {
  background: var(--bg-panel-hover);
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.drones-table td {
  padding: 0.45rem 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.font-mono {
  font-family: var(--font-mono);
}

.battery-cell {
  display: flex;
  align-items: center;
}

.battery-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.75rem;
  background: var(--bg-panel-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
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

.footer-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.execute-btn {
  padding: 0.5rem 1.4rem;
  font-size: 0.92rem;
}

/* L7: code mode */
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
  height: 240px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.code-mode-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
</style>
