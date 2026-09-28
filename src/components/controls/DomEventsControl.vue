<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <MousePointer :size="18" class="text-brand" />
        <h3 class="deck-title">DOM 事件監聽與控制台 · Event Binding</h3>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetDefaults" title="重置事件配置">
        <RotateCcw :size="14" />
        <span>重置狀態</span>
      </button>
    </div>

    <div class="deck-content">
      <!-- 1. Event Listeners Configuration Card -->
      <div class="binding-card card">
        <h4 class="card-subtitle">1. 配置事件監聽器 (addEventListener)</h4>

        <!-- Binding for Disarm Button -->
        <div class="binding-row">
          <span class="element-tag">元素: #disarm-btn</span>
          <div class="bind-selects">
            <div class="select-group">
              <label>事件類型:</label>
              <select v-model="disarmEvent" class="mini-select">
                <option value="click">click (滑鼠點擊)</option>
                <option value="mouseover">mouseover (懸停)</option>
                <option value="dblclick">dblclick (雙擊)</option>
              </select>
            </div>
            <div class="select-group">
              <label>回呼動作:</label>
              <select v-model="disarmAction" class="mini-select">
                <option value="DISARM_ALARM">解除安全警報 (disarmAlarm)</option>
                <option value="EMERGENCY_LOCK">緊急封鎖 (emergencyLock)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Binding for Airlock Button -->
        <div class="binding-row">
          <span class="element-tag">元素: #airlock-btn</span>
          <div class="bind-selects">
            <div class="select-group">
              <label>事件類型:</label>
              <select v-model="airlockEvent" class="mini-select">
                <option value="click">click (滑鼠點擊)</option>
                <option value="mouseover">mouseover (懸停)</option>
                <option value="dblclick">dblclick (雙擊)</option>
              </select>
            </div>
            <div class="select-group">
              <label>回呼動作:</label>
              <select v-model="airlockAction" class="mini-select">
                <option value="OPEN_AIRLOCK">開啟氣閘艙門 (openAirlock)</option>
                <option value="DISARM_ALARM">解除安全警報 (disarmAlarm)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Interactive Virtual Physical Control Console -->
      <div class="virtual-console-card card">
        <div class="console-header">
          <h4 class="card-subtitle">2. 實體太空艙面板 (點擊親自觸發事件)</h4>
          <div class="status-indicator-badge">
            <span class="status-dot" :class="isDisarmed ? 'dot-green' : 'dot-red'"></span>
            <span>系統狀態：{{ isDisarmed ? '正常 (NORMAL)' : '警戒鎖定中 (ALARM ACTIVE)' }}</span>
          </div>
        </div>

        <div class="physical-buttons-row">
          <!-- Button 1: Disarm -->
          <button
            id="disarm-btn"
            class="physical-btn"
            :class="isDisarmed ? 'btn-disarmed' : 'btn-alarm'"
            @click="handleDisarmClick"
          >
            <ShieldAlert v-if="!isDisarmed" :size="20" />
            <ShieldCheck v-else :size="20" />
            <div class="btn-text-col">
              <strong>解除警報 (#disarm-btn)</strong>
              <span>{{ isDisarmed ? '警報已解除 ✓' : '點擊送出解除信號' }}</span>
            </div>
          </button>

          <!-- Button 2: Airlock -->
          <button
            id="airlock-btn"
            class="physical-btn btn-airlock"
            :class="{ 'btn-door-open': isAirlockOpen }"
            @click="handleAirlockClick"
          >
            <DoorOpen v-if="isAirlockOpen" :size="20" />
            <DoorClosed v-else :size="20" />
            <div class="btn-text-col">
              <strong>氣閘艙門 (#airlock-btn)</strong>
              <span>{{ isAirlockOpen ? '氣閘已開啟 (OPEN) ✓' : '點擊手動開啟氣閘' }}</span>
            </div>
          </button>
        </div>

        <div v-if="consoleNotice" class="console-notice" :class="noticeType">
          {{ consoleNotice }}
        </div>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        綁定 click 事件 ➔ 點擊解除警報 ➔ 點擊開啟氣閘
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="levelStore.isExecuting"
        @click="runExecution"
      >
        <Play :size="16" />
        <span>{{ levelStore.isExecuting ? '系統驗證中...' : '提交事件控制驗證' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  MousePointer, RotateCcw, Play, ShieldAlert, ShieldCheck,
  DoorClosed, DoorOpen
} from 'lucide-vue-next';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const disarmEvent = ref('mouseover');
const disarmAction = ref('DISARM_ALARM');

const airlockEvent = ref('dblclick');
const airlockAction = ref('OPEN_AIRLOCK');

const isDisarmed = ref(false);
const isAirlockOpen = ref(false);
const consoleNotice = ref('');
const noticeType = ref('text-muted');

onMounted(() => {
  const saved = progressStore.getSavedOperation(6);
  if (saved && saved.domState) {
    disarmEvent.value = saved.domState.bindings?.disarmEvent ?? 'mouseover';
    disarmAction.value = saved.domState.bindings?.disarmAction ?? 'DISARM_ALARM';
    airlockEvent.value = saved.domState.bindings?.airlockEvent ?? 'dblclick';
    airlockAction.value = saved.domState.bindings?.airlockAction ?? 'OPEN_AIRLOCK';
    isDisarmed.value = saved.domState.disarmed ?? false;
    isAirlockOpen.value = saved.domState.airlockOpen ?? false;
  }
});

function handleDisarmClick() {
  soundManager.playClick();
  if (disarmEvent.value !== 'click') {
    consoleNotice.value = `監聽器型態設定為 ${disarmEvent.value}，點擊未觸發此事件！`;
    noticeType.value = 'text-warning';
    return;
  }
  if (disarmAction.value === 'DISARM_ALARM') {
    isDisarmed.value = true;
    soundManager.playPowerUp();
    consoleNotice.value = '【事件觸發】解除警報動作生效，指示燈切換為綠色正常狀態！';
    noticeType.value = 'text-success';
  } else {
    consoleNotice.value = '【事件觸發】但指派的動作不是解除警報！';
    noticeType.value = 'text-danger';
  }
}

function handleAirlockClick() {
  soundManager.playClick();
  if (airlockEvent.value !== 'click') {
    consoleNotice.value = `氣閘事件監聽為 ${airlockEvent.value}，點擊未觸發！`;
    noticeType.value = 'text-warning';
    return;
  }
  if (!isDisarmed.value) {
    soundManager.playError();
    consoleNotice.value = '【安全協議攔截】主警報尚未解除，嚴禁開啟外部氣閘！請先點擊解除警報。';
    noticeType.value = 'text-danger';
    return;
  }
  if (airlockAction.value === 'OPEN_AIRLOCK') {
    isAirlockOpen.value = true;
    soundManager.playDoorOpen();
    consoleNotice.value = '【事件觸發】氣閘艙門液壓解鎖，3D 重型艙門已順利開啟！';
    noticeType.value = 'text-success';
  }
}

function resetDefaults() {
  disarmEvent.value = 'mouseover';
  disarmAction.value = 'DISARM_ALARM';
  airlockEvent.value = 'dblclick';
  airlockAction.value = 'OPEN_AIRLOCK';
  isDisarmed.value = false;
  isAirlockOpen.value = false;
  consoleNotice.value = '';
}

function runExecution() {
  levelStore.executeLevel({
    domState: {
      bindings: {
        disarmEvent: disarmEvent.value,
        disarmAction: disarmAction.value,
        airlockEvent: airlockEvent.value,
        airlockAction: airlockAction.value
      },
      disarmed: isDisarmed.value,
      airlockOpen: isAirlockOpen.value
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

.card-subtitle {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Bindings */
.binding-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-panel-hover);
}

.binding-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.element-tag {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary-blue);
}

.bind-selects {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.mini-select {
  padding: 0.25rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  font-size: 0.78rem;
  outline: none;
}

/* Virtual Console */
.virtual-console-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-indicator-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot-red {
  background: var(--danger);
  box-shadow: 0 0 8px var(--danger-glow);
}

.dot-green {
  background: var(--success);
  box-shadow: 0 0 8px var(--success-glow);
}

.physical-buttons-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.physical-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--border-medium);
  transition: all var(--transition-normal);
  text-align: left;
}

.btn-alarm {
  background: var(--danger-light);
  border-color: var(--danger-border);
  color: var(--danger-dark);
}

.btn-alarm:hover {
  background: #fee2e2;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.btn-disarmed {
  background: var(--success-light);
  border-color: var(--success-border);
  color: var(--success-dark);
}

.btn-airlock {
  background: var(--primary-blue-light);
  border-color: var(--border-accent-light);
  color: var(--primary-blue);
}

.btn-door-open {
  background: var(--success-light);
  border-color: var(--success-border);
  color: var(--success-dark);
}

.btn-text-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.btn-text-col strong {
  font-size: 0.88rem;
}

.btn-text-col span {
  font-size: 0.75rem;
  opacity: 0.85;
}

.console-notice {
  font-size: 0.82rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--bg-panel-hover);
  border: 1px solid var(--border-subtle);
  line-height: 1.4;
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
