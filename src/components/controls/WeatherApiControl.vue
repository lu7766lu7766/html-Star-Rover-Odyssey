<template>
  <div class="control-panel">
    <!-- Header -->
    <div class="deck-header">
      <div class="deck-title-group">
        <Globe :size="18" class="text-brand" />
        <h3 class="deck-title">外部氣象 API 連線、JSON 解析與航區決策 · Weather API & Station Selection</h3>
      </div>
      <div class="deck-header-actions">
        <!-- Dual Mode Toggle -->
        <div class="mode-toggle-group">
          <button
            class="mode-btn"
            :class="{ active: !useBenchmark }"
            @click="setDataSource(false)"
            title="連線 Open-Meteo 即時大氣 API"
          >
            真實 API
          </button>
          <button
            class="mode-btn"
            :class="{ active: useBenchmark }"
            @click="setDataSource(true)"
            title="切換至教學標準對照情境組 (離線/對比用)"
          >
            教學標準組
          </button>
        </div>

        <button
          class="btn btn-secondary btn-xs"
          @click="handleRestore"
          title="還原場景與參數至最初狀態"
        >
          <RotateCcw :size="13" />
          <span>還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content custom-scrollbar">
      <!-- 0. Code mode（手寫 async/await + JSON 路徑，走 Worker 模擬 API） -->
      <div class="code-mode-card card">
        <div class="code-mode-header">
          <div class="code-mode-title">
            <Code2 :size="15" class="text-brand" />
            <span>手寫 JS 挑戰 · 把 ___ 補完再執行</span>
          </div>
          <span class="badge badge-info">async/await = 3星</span>
        </div>
        <div class="code-editor-wrap">
          <CodeEditor v-model="studentCode" :level-id="8" @reset="resetCode" />
        </div>
        <div class="code-mode-note">
          <span>沙箱內建模擬氣象 API <b>fetchStation(id)</b> 與無人機 <b>drone.launch(id) / drone.abortMission()</b>。下方 JSON 樹可對照路徑（寫碼模式點擊只複習、不代填）。注意：不安全基地必須 abort，換安全基地再發射！</span>
        </div>
        <div class="code-mode-actions">
          <button class="btn btn-secondary btn-sm" @click="fillAnswerHint" title="填入提示數值">
            <span>💡 填入提示值</span>
          </button>
          <button
            class="btn btn-success execute-btn"
            :disabled="isLoading || levelStore.isExecuting || !studentCode.trim()"
            @click="runCodeExecution"
          >
            <Loader2 v-if="levelStore.isExecuting" :size="16" class="spin-icon" />
            <Send v-else :size="16" />
            <span>{{ levelStore.isExecuting ? '模擬 API 連線中...' : '執行 JS 並評估發射' }}</span>
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

      <!-- 1. Global Stations Selector Bar -->
      <div class="stations-card card">
        <div class="stations-header">
          <div class="label-group">
            <span class="box-label">全球觀測基地 (Target Stations)：</span>
            <span class="badge badge-blue">點擊基地切換連線，並在右側感測器觀察即時回傳讀數</span>
          </div>

          <div class="header-right-btns">
            <button
              class="btn btn-primary btn-xs fetch-btn"
              @click="fetchAllStations"
              :disabled="isLoading"
            >
              <Loader2 v-if="isLoading" :size="13" class="spin-icon" />
              <DownloadCloud v-else :size="13" />
              <span>{{ isLoading ? '連線中...' : '掃描全球 5 大基地 API' }}</span>
            </button>
          </div>
        </div>

        <div class="stations-grid">
          <div
            v-for="st in WEATHER_STATIONS"
            :key="st.id"
            class="station-chip"
            :class="{
              selected: selectedStationId === st.id,
              'has-data': !!stationCache[st.id]
            }"
            @click="selectStation(st.id)"
          >
            <div class="chip-top">
              <span class="station-name">{{ st.name.split(' ')[0] }}</span>
              <span class="station-region">{{ st.region }}</span>
            </div>

            <div class="chip-bottom">
              <span class="chip-coords">
                {{ st.latitude >= 0 ? `${st.latitude.toFixed(1)}°N` : `${Math.abs(st.latitude).toFixed(1)}°S` }},
                {{ st.longitude >= 0 ? `${st.longitude.toFixed(1)}°E` : `${Math.abs(st.longitude).toFixed(1)}°W` }}
              </span>
              <span class="chip-status-text" :class="stationCache[st.id] ? 'status-connected' : 'status-pending'">
                {{ stationCache[st.id] ? '● 已連線' : '○ 未掃描' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Dual Column: JSON Tree Inspector & Sensor Path Mapping (Strictly constrained within viewport) -->
      <div class="workspace-grid">
        <!-- Left: Interactive JSON Tree Inspector with Auto-wrapping Request URL Bar -->
        <div class="json-inspector-card card">
          <div class="card-title-bar">
            <div class="title-with-icon">
              <Database :size="16" class="text-brand" />
              <span class="card-title-text">API 回傳原始 JSON 物件樹 (Response JSON Tree)</span>
            </div>
            <span class="json-station-tag">{{ currentStation.name }}</span>
          </div>

          <!-- Actual API Request URL Bar (Auto-wrapping to prevent horizontal scroll) -->
          <div class="api-url-bar">
            <div class="api-url-header">
              <div class="api-url-meta">
                <span class="method-tag">GET</span>
                <span class="status-code-badge" :class="stationCache[selectedStationId] ? 'status-200' : 'status-pending'">
                  {{ stationCache[selectedStationId] ? (useBenchmark ? '200 OK (情境組)' : '200 OK (即時)') : '等待請求' }}
                </span>
              </div>
              <button class="copy-url-btn" @click="copyApiUrl" :title="copied ? '已複製' : '複製 API 網址'">
                <Check v-if="copied" :size="13" class="text-success" />
                <Copy v-else :size="13" />
                <span>{{ copied ? '已複製網址' : '複製網址' }}</span>
              </button>
            </div>
            <div class="url-text">{{ actualApiUrl }}</div>
          </div>

          <div class="json-instruction-hint">
            💡 <strong>使用指引：</strong>對照下方 JSON 屬性層級，用點運算子寫出取值路徑（例如 <code>current.wind_speed_10m</code>），再到上方編輯器手寫程式。
          </div>

          <div class="json-tree-container custom-scrollbar">
            <div class="json-tree-root">
              <div class="tree-line">
                <span class="json-brace">{</span>
              </div>
              
              <!-- Latitude / Longitude -->
              <div class="tree-line indent-1">
                <span class="json-key">"latitude"</span>: <span class="json-number">{{ currentRawJson?.latitude ?? currentStation.latitude }}</span>,
              </div>
              <div class="tree-line indent-1">
                <span class="json-key">"longitude"</span>: <span class="json-number">{{ currentRawJson?.longitude ?? currentStation.longitude }}</span>,
              </div>

              <!-- Current Object -->
              <div class="tree-group">
                <div class="tree-line indent-1 tree-fold-header" @click="toggleFold('current')">
                  <component :is="isFolded.current ? ChevronRight : ChevronDown" :size="13" class="fold-arrow" />
                  <span class="json-key">"current"</span>: <span class="json-brace">{</span>
                </div>

                <div v-show="!isFolded.current" class="fold-body">
                  <div class="tree-line indent-2">
                    <span class="json-key">"time"</span>: <span class="json-string">"{{ currentRawJson?.current?.time ?? '2026-09-29T15:00' }}"</span>,
                  </div>
                  <div class="tree-line indent-2 highlight-node">
                    <span class="json-key" title="氣溫鍵名：current.temperature_2m">
                      "temperature_2m"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.temperature_2m ?? '--' }}</span>,
                    <span class="inline-badge">🌡️ 氣溫 (°C)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key">"relative_humidity_2m"</span>: <span class="json-number">{{ currentRawJson?.current?.relative_humidity_2m ?? 65 }}</span>,
                  </div>
                  <div class="tree-line indent-2 highlight-node">
                    <span class="json-key" title="降水量鍵名：current.precipitation">
                      "precipitation"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.precipitation ?? '--' }}</span>,
                    <span class="inline-badge">🌧️ 降水量 (mm)</span>
                  </div>
                  <div class="tree-line indent-2 highlight-node">
                    <span class="json-key" title="風速鍵名：current.wind_speed_10m">
                      "wind_speed_10m"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.wind_speed_10m ?? '--' }}</span>
                    <span class="inline-badge">💨 風速 (km/h)</span>
                  </div>
                </div>
                <div class="tree-line indent-1">
                  <span class="json-brace">}</span>,
                </div>
              </div>

              <!-- Hourly Object -->
              <div class="tree-group">
                <div class="tree-line indent-1 tree-fold-header" @click="toggleFold('hourly')">
                  <component :is="isFolded.hourly ? ChevronRight : ChevronDown" :size="13" class="fold-arrow" />
                  <span class="json-key">"hourly"</span>: <span class="json-brace">{</span>
                </div>

                <div v-show="!isFolded.hourly" class="fold-body">
                  <div class="tree-line indent-2 highlight-node">
                    <span class="json-key" title="降水機率鍵名：hourly.precipitation_probability[0]">
                      "precipitation_probability"
                    </span>: [ <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[0] ?? '--' }}</span>, <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[1] ?? '--' }}</span>, ... ],
                    <span class="inline-badge">🌧️ 降水機率 (%)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key">"wind_speed_10m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.wind_speed_10m?.[0] ?? '--' }}</span>, ... ],
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key">"temperature_2m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.temperature_2m?.[0] ?? '--' }}</span>, ... ]
                  </div>
                </div>
                <div class="tree-line indent-1">
                  <span class="json-brace">}</span>
                </div>
              </div>

              <div class="tree-line">
                <span class="json-brace">}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 感測器表單已移除（改手寫 JS：async/await + JSON 路徑），左側 JSON 樹保留對照 -->
      </div>
    </div>

    <!-- Execution Footer -->
    <div class="deck-footer">
      <div class="footer-hint">
        <span>寫碼模式：在上方編輯器按執行（先 fetch 取數，再判斷發射）</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Globe, DownloadCloud, Loader2,
  Send, RotateCcw, Code2, Database, ChevronDown, ChevronRight,
  Copy, Check
} from 'lucide-vue-next';
import {
  WEATHER_STATIONS,
  fetchStationWeather
} from '../../services/weatherService.js';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';
import { LEVEL_8_STARTER_CODE } from '../../levels/level-8.js';
import CodeEditor from '../editor/CodeEditor.vue';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

// 寫碼模式：學生手寫 async/await + JSON 路徑
const studentCode = ref(LEVEL_8_STARTER_CODE);

// State
const selectedStationId = ref('station-tpe');
const useBenchmark = ref(true); // Default to benchmark for guaranteed reliable contrast
const isLoading = ref(false);
const stationCache = ref({}); // { [stationId]: { rawJson, isRealData, timestamp } }
const copied = ref(false);

const isFolded = ref({
  current: false,
  hourly: false
});

onMounted(async () => {
  const saved = progressStore.getSavedOperation(8);
  if (saved) {
    if (typeof saved.code === 'string' && saved.code.length > 0) {
      studentCode.value = saved.code;
    }
    if (saved.weatherSession) {
      const ws = saved.weatherSession;
      if (ws.selectedStationId) {
        selectedStationId.value = ws.selectedStationId;
      }
      if (ws.useBenchmark !== undefined) {
        useBenchmark.value = ws.useBenchmark;
      }
    }
  }

  // Pre-fetch all stations so student can immediately inspect and contrast
  await fetchAllStations();
});

const currentStation = computed(() => {
  return WEATHER_STATIONS.find(s => s.id === selectedStationId.value) || WEATHER_STATIONS[0];
});

const currentRawJson = computed(() => {
  return stationCache.value[selectedStationId.value]?.rawJson || null;
});

// Actual Requested API Endpoint URL for the active station
const actualApiUrl = computed(() => {
  const st = currentStation.value;
  return `https://api.open-meteo.com/v1/forecast?latitude=${st.latitude}&longitude=${st.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,wind_speed_10m,temperature_2m&timezone=auto`;
});

async function copyApiUrl() {
  soundManager.playClick();
  try {
    await navigator.clipboard.writeText(actualApiUrl.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (e) {
    console.warn('Clipboard write failed:', e);
  }
}

// Actions
function toggleFold(key) {
  isFolded.value[key] = !isFolded.value[key];
}

function selectStation(stationId) {
  soundManager.playClick();
  selectedStationId.value = stationId;
  if (!stationCache.value[stationId]) {
    fetchSingleStation(stationId);
  }
}

async function setDataSource(benchmarkMode) {
  soundManager.playClick();
  useBenchmark.value = benchmarkMode;
  await fetchAllStations();
}

async function fetchSingleStation(stationId) {
  const station = WEATHER_STATIONS.find(s => s.id === stationId);
  if (!station) return;
  isLoading.value = true;
  try {
    const res = await fetchStationWeather(station, useBenchmark.value);
    stationCache.value[stationId] = res;
  } finally {
    isLoading.value = false;
  }
}

async function fetchAllStations() {
  soundManager.playClick();
  isLoading.value = true;
  try {
    const promises = WEATHER_STATIONS.map(st => fetchStationWeather(st, useBenchmark.value));
    const results = await Promise.all(promises);
    const newCache = {};
    for (const res of results) {
      newCache[res.stationId] = res;
    }
    stationCache.value = newCache;
    soundManager.playPowerUp();
  } finally {
    isLoading.value = false;
  }
}

function handleRestore() {
  levelStore.resetCurrentLevel();
}

function runCodeExecution() {
  levelStore.executeLevel({
    code: studentCode.value
  });
}

function resetCode() {
  studentCode.value = LEVEL_8_STARTER_CODE;
}

function fillAnswerHint() {
  studentCode.value = studentCode.value
    .replace('await ___;', 'await fetchStation(stationId);')
    .replace('data.___;                  // 風速路徑', 'data.current.wind_speed_10m;                  // 風速路徑')
    .replace('data.___;                  // 氣溫路徑', 'data.current.temperature_2m;                  // 氣溫路徑')
    .replace('data.___;              // 降水機率路徑（含 [0]）', 'data.hourly.precipitation_probability[0];              // 降水機率路徑（含 [0]）')
    .replace('if (___) {', 'if (wind <= 25 && rainProb <= 20 && temp >= 0) {')
    .replace('drone.launch(___);', 'drone.launch(stationId);')
    .replace('evaluateAndLaunch(___);', 'evaluateAndLaunch("station-tpe");');
}
</script>

<style scoped>
.control-panel {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-top: 1px solid var(--border-subtle);
  overflow-x: hidden;
  overflow-y: hidden;
  box-sizing: border-box;
}

.deck-header {
  height: 48px;
  min-height: 48px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid var(--border-subtle);
  gap: 0.75rem;
  flex-shrink: 0;
  box-sizing: border-box;
}

.deck-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.deck-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deck-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.mode-toggle-group {
  display: flex;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #cbd5e1;
}

.mode-btn {
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
}

/* 1. Global Stations Selector */
.stations-card {
  width: 100%;
  max-width: 100%;
  padding: 0.75rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
}

.stations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.label-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.box-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
}

.stations-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.station-chip {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.station-chip:hover {
  background: #ffffff;
  border-color: #93c5fd;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.station-chip.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.chip-top {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.station-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.station-region {
  font-size: 0.68rem;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  min-width: 0;
  gap: 0.25rem;
}

.chip-coords {
  color: #64748b;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-status-text {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-connected {
  color: #0284c7;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

.status-pending {
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

/* 2. Workspace Grid (Bounded strictly to 50% / 50% without overflowing) */
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
  min-width: 0;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.card-title-text {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.json-station-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
  white-space: nowrap;
  flex-shrink: 0;
}

.station-indicator-pill {
  font-size: 0.72rem;
  color: #334155;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.station-indicator-pill strong {
  color: #1d4ed8;
  font-weight: 700;
}

/* Left Column: JSON Inspector Card */
.json-inspector-card {
  padding: 0.75rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* API Request URL Bar: Stacked with Full Auto-wrapping */
.api-url-bar {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.api-url-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.api-url-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.method-tag {
  background: #0284c7;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.66rem;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-code-badge {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-200 {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.status-pending {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.copy-url-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.copy-url-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

/* URL Text: Full Wrap across lines, never pushing container */
.url-text {
  color: #0f172a;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  line-height: 1.45;
  word-break: break-all;
  overflow-wrap: anywhere;
  white-space: normal;
  background: #ffffff;
  padding: 5px 7px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  user-select: all;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.json-instruction-hint {
  font-size: 0.72rem;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 5px 8px;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  word-break: break-word;
}

.json-instruction-hint code {
  color: #1d4ed8;
  background: #dbeafe;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
  word-break: break-all;
}

.json-tree-container {
  max-height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #0b1120;
  padding: 0.65rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  font-family: ui-monospace, 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.tree-line {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 1px 0;
  word-break: break-all;
  overflow-wrap: anywhere;
  max-width: 100%;
}

.indent-1 {
  padding-left: 1rem;
}

.indent-2 {
  padding-left: 1.8rem;
}

.tree-fold-header {
  cursor: pointer;
  user-select: none;
}

.fold-arrow {
  color: #94a3b8;
  margin-top: 3px;
  flex-shrink: 0;
}

.json-brace {
  color: #cbd5e1;
  font-weight: 600;
}

.json-key {
  color: #60a5fa;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.15s;
}

.json-key:hover {
  color: #93c5fd;
  text-decoration: underline;
}

.json-string {
  color: #34d399;
}

.json-number {
  color: #fbbf24;
  font-weight: 700;
}

.highlight-node {
  background: rgba(59, 130, 246, 0.12);
  border-radius: 4px;
  padding: 2px 5px !important;
  margin: 1px 0;
}

.highlight-node.node-active {
  background: rgba(37, 99, 235, 0.35);
  border-left: 3px solid #60a5fa;
}

.node-btn {
  font-weight: 700;
  text-decoration: underline dotted;
}

.inline-badge {
  font-size: 0.65rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #1e293b;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: auto;
  border: 1px solid #334155;
  white-space: nowrap;
}

/* Right Column: Sensor Slots & Code Preview */
.mapping-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.sensor-slots-card {
  padding: 0.75rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.sensor-slot-item {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: all 0.25s ease;
  min-width: 0;
  box-sizing: border-box;
}

/* Green highlight for compliant sensors */
.sensor-slot-item.slot-pass {
  border-color: #10b981;
  border-left: 5px solid #10b981;
  background: #f0fdf4;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

/* Red highlight for non-compliant sensors */
.sensor-slot-item.slot-fail {
  border-color: #ef4444;
  border-left: 5px solid #ef4444;
  background: #fef2f2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
}

.sensor-slot-item.slot-disconnected {
  border-color: #cbd5e1;
  border-left: 5px solid #94a3b8;
  background: #f8fafc;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.slot-label-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.slot-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}

.slot-limit-badge {
  font-size: 0.65rem;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Status Badges */
.status-reading {
  font-size: 0.74rem;
  font-weight: 800;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.reading-pass {
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #86efac;
}

.reading-fail {
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.reading-disconnected {
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px 7px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
  min-width: 0;
  box-sizing: border-box;
}

.input-row:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.prefix-text {
  font-size: 0.75rem;
  color: #0f172a;
  font-weight: 700;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.path-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: #0f172a;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.path-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.quick-chips {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.chip-label {
  color: #475569;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.chip-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.chip-distractor {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #991b1b;
}

.chip-distractor:hover {
  background: #ffe4e6;
  border-color: #f87171;
  color: #7f1d1d;
}

/* 3. Code Preview Card */
.code-preview-card {
  padding: 0.7rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.code-title-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.code-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-body {
  margin-top: 0.5rem;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.code-block {
  background: #0b1120;
  padding: 0.75rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  font-size: 0.72rem;
  color: #38bdf8;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
}

/* Footer Execution Bar */
.deck-footer {
  height: 52px;
  min-height: 52px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  box-sizing: border-box;
}

.footer-hint {
  font-size: 0.78rem;
  font-weight: 500;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-tag {
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  white-space: nowrap;
}

.step-tag.step-done {
  color: #15803d;
  background: #dcfce7;
  border-color: #86efac;
  font-weight: 700;
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.45rem 1.25rem;
  flex-shrink: 0;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* L8: code mode */
.code-mode-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
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
  color: #0f172a;
}

.code-editor-wrap {
  height: 300px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.code-mode-note {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-panel-hover);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.65rem;
  line-height: 1.5;
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
</style>
