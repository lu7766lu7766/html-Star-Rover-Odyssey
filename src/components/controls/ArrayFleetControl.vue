<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <ListFilter :size="18" class="text-brand" />
        <h3 class="deck-title">陣列清單檢視與批次遍歷 · Array Fleet Dispatch</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="還原場景與參數至最初狀態">
        <RotateCcw :size="14" />
        <span>還原</span>
      </button>
    </div>

    <div class="deck-content">
      <!-- 1. Array Inspector Table -->
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
                <th>判定處置 (Action)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(drone, idx) in dronesData"
                :key="drone.id"
                :class="drone.battery < batteryThreshold ? 'row-low-battery' : 'row-normal-battery'"
              >
                <td class="font-mono">[{{ idx }}]</td>
                <td class="font-mono">{{ drone.id }}</td>
                <td><strong>{{ drone.name }}</strong></td>
                <td>
                  <div class="battery-cell">
                    <span
                      class="battery-pill"
                      :class="drone.battery < 20 ? 'pill-danger' : 'pill-success'"
                    >
                      <BatteryCharging v-if="drone.battery < 20" :size="12" />
                      <BatteryMedium v-else :size="12" />
                      <span>{{ drone.battery }}%</span>
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="drone.battery < batteryThreshold ? 'badge-warning' : 'badge-blue'"
                  >
                    {{ drone.battery < batteryThreshold ? '返航充電 (RETURN)' : '空域巡邏 (PATROL)' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. Dispatch Logic & Threshold Rules -->
      <div class="rules-card card">
        <h4 class="rules-title">批次處理規則 (Array forEach Logic)</h4>
        
        <div class="rule-inputs-row">
          <div class="rule-item">
            <span class="rule-label">安全防護電量閾值：</span>
            <div class="flex-row">
              <span class="code-sym">if (drone.battery &lt; </span>
              <input
                v-model.number="batteryThreshold"
                type="number"
                min="10"
                max="40"
                class="num-input"
              />
              <span class="code-sym">%)</span>
            </div>
          </div>

          <div class="rule-item">
            <span class="rule-label">低電量指派：</span>
            <select v-model="lowBatteryAction" class="rule-select">
              <option value="RETURN_BASE">返航充電 (RETURN_BASE)</option>
              <option value="PATROL">強行巡邏 (PATROL) ⚠️危險</option>
            </select>
          </div>

          <div class="rule-item">
            <span class="rule-label">充足電量指派：</span>
            <select v-model="normalBatteryAction" class="rule-select">
              <option value="PATROL">執行巡邏 (PATROL)</option>
              <option value="RETURN_BASE">原地待命 (RETURN_BASE)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        低電量 (&lt; 20%) 需安排返航 · 充足電量安排巡邏
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '編隊調度中...' : '執行編隊派遣 (Dispatch)' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ListFilter, RotateCcw, Play, BatteryCharging, BatteryMedium } from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const dronesData = [
  { id: 'DRONE-01', name: '游隼號', battery: 85, model: 'Recon-X' },
  { id: 'DRONE-02', name: '夜梟號', battery: 15, model: 'Stealth-V' },
  { id: 'DRONE-03', name: '海鵰號', battery: 92, model: 'Heavy-T' },
  { id: 'DRONE-04', name: '雀鷹號', battery: 12, model: 'Scout-M' }
];

const batteryThreshold = ref(10);
const lowBatteryAction = ref('PATROL');
const normalBatteryAction = ref('RETURN_BASE');

onMounted(() => {
  const saved = progressStore.getSavedOperation(7);
  if (saved && saved.fleetConfig) {
    batteryThreshold.value = saved.fleetConfig.batteryThreshold ?? 10;
    lowBatteryAction.value = saved.fleetConfig.lowBatteryAction ?? 'PATROL';
    normalBatteryAction.value = saved.fleetConfig.normalBatteryAction ?? 'RETURN_BASE';
  }
});

function resetDefaults() {
  levelStore.resetCurrentLevel();
}

function runExecution() {
  levelStore.executeLevel({
    fleetConfig: {
      batteryThreshold: batteryThreshold.value,
      lowBatteryAction: lowBatteryAction.value,
      normalBatteryAction: normalBatteryAction.value,
      dispatched: true
    }
  });
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

.row-low-battery {
  background: #fffbeb;
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
}

.pill-danger {
  background: var(--danger-light);
  color: var(--danger-dark);
}

.pill-success {
  background: var(--success-light);
  color: var(--success-dark);
}

/* Rules Card */
.rules-card {
  background: var(--bg-panel-hover);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rules-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rule-inputs-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.rule-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.rule-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.flex-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.code-sym {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.num-input {
  width: 50px;
  padding: 0.25rem 0.4rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.85rem;
  text-align: center;
}

.rule-select {
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  font-size: 0.8rem;
  outline: none;
  background: #ffffff;
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
</style>
