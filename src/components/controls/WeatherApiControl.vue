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
            💡 <strong>使用指引：</strong>點擊下方 JSON 屬性名稱可直接代入右側感測器，或觀察其層級鍵名使用點運算子取值（例如 <code>current.wind_speed_10m</code>）。
          </div>

          <div class="json-tree-container custom-scrollbar">
            <div class="json-tree-root">
              <div class="tree-line">
                <span class="json-brace">{</span>
              </div>
              
              <!-- Latitude / Longitude -->
              <div class="tree-line indent-1">
                <span class="json-key" @click="quickFillPath('latitude')">"latitude"</span>: <span class="json-number">{{ currentRawJson?.latitude ?? currentStation.latitude }}</span>,
              </div>
              <div class="tree-line indent-1">
                <span class="json-key" @click="quickFillPath('longitude')">"longitude"</span>: <span class="json-number">{{ currentRawJson?.longitude ?? currentStation.longitude }}</span>,
              </div>

              <!-- Current Object -->
              <div class="tree-group">
                <div class="tree-line indent-1 tree-fold-header" @click="toggleFold('current')">
                  <component :is="isFolded.current ? ChevronRight : ChevronDown" :size="13" class="fold-arrow" />
                  <span class="json-key" @click.stop="quickFillPath('current')">"current"</span>: <span class="json-brace">{</span>
                </div>

                <div v-show="!isFolded.current" class="fold-body">
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('current.time')">"time"</span>: <span class="json-string">"{{ currentRawJson?.current?.time ?? '2026-09-29T15:00' }}"</span>,
                  </div>
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': tempPath === 'current.temperature_2m' }">
                    <span class="json-key node-btn" @click="assignToSensor('temp', 'current.temperature_2m')" title="點擊綁定至氣溫感測器">
                      "temperature_2m"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.temperature_2m ?? '--' }}</span>,
                    <span class="inline-badge">🌡️ 氣溫 (°C)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('current.relative_humidity_2m')">"relative_humidity_2m"</span>: <span class="json-number">{{ currentRawJson?.current?.relative_humidity_2m ?? 65 }}</span>,
                  </div>
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': precipPath === 'current.precipitation' }">
                    <span class="json-key node-btn" @click="assignToSensor('precip', 'current.precipitation')" title="點擊綁定至降雨感測器">
                      "precipitation"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.precipitation ?? '--' }}</span>,
                    <span class="inline-badge">🌧️ 降水量 (mm)</span>
                  </div>
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': windPath === 'current.wind_speed_10m' }">
                    <span class="json-key node-btn" @click="assignToSensor('wind', 'current.wind_speed_10m')" title="點擊綁定至風速感測器">
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
                  <span class="json-key" @click.stop="quickFillPath('hourly')">"hourly"</span>: <span class="json-brace">{</span>
                </div>

                <div v-show="!isFolded.hourly" class="fold-body">
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': precipPath === 'hourly.precipitation_probability[0]' }">
                    <span class="json-key node-btn" @click="assignToSensor('precip', 'hourly.precipitation_probability[0]')" title="點擊綁定至降水機率">
                      "precipitation_probability"
                    </span>: [ <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[0] ?? '--' }}</span>, <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[1] ?? '--' }}</span>, ... ],
                    <span class="inline-badge">🌧️ 降水機率 (%)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('hourly.wind_speed_10m[0]')">"wind_speed_10m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.wind_speed_10m?.[0] ?? '--' }}</span>, ... ],
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('hourly.temperature_2m[0]')">"temperature_2m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.temperature_2m?.[0] ?? '--' }}</span>, ... ]
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

        <!-- Right: Sensor Path Mapping Slots with Clear High-Contrast Pass/Fail Indicators -->
        <div class="mapping-column">
          <!-- Sensor Slots Card -->
          <div class="sensor-slots-card card">
            <div class="card-title-bar">
              <div class="title-with-icon">
                <Sparkles :size="16" class="text-brand" />
                <span class="card-title-text">無人機感測器路徑對應 (JSON Path Binding)</span>
              </div>
              <span class="station-indicator-pill">
                目前檢視基地: <strong>{{ currentStation.name.split(' ')[0] }}</strong>
              </span>
            </div>

            <!-- Sensor 1: Wind Speed -->
            <div
              class="sensor-slot-item"
              :class="{
                'slot-pass': isSensorValid('wind') && windPass,
                'slot-fail': isSensorValid('wind') && !windPass,
                'slot-disconnected': !isSensorValid('wind')
              }"
            >
              <div class="slot-header">
                <div class="slot-label-group">
                  <Wind :size="16" class="text-brand" />
                  <strong class="slot-title">1. 風速感測器 (windSpeed)</strong>
                  <span class="slot-limit-badge">安全標準 &le; 25 km/h</span>
                </div>

                <!-- Pass/Fail Status Reading Badge -->
                <span v-if="!isSensorValid('wind')" class="status-reading reading-disconnected">
                  ❌ undefined (離線)
                </span>
                <span v-else-if="windPass" class="status-reading reading-pass">
                  ✓ {{ resolvedValues.wind }} km/h · 合格
                </span>
                <span v-else class="status-reading reading-fail">
                  ⚠️ {{ resolvedValues.wind }} km/h · 超標
                </span>
              </div>

              <div class="input-row">
                <span class="prefix-text">const wind = data.</span>
                <input
                  v-model="windPath"
                  type="text"
                  class="path-input"
                  placeholder="請輸入屬性路徑，如 current.wind_speed_10m"
                  @focus="activeSensorField = 'wind'"
                />
              </div>

              <!-- Quick Path Chips -->
              <div class="quick-chips">
                <span class="chip-label">快捷候選：</span>
                <button class="chip-btn" @click="windPath = 'current.wind_speed_10m'">current.wind_speed_10m</button>
                <button class="chip-btn" @click="windPath = 'hourly.wind_speed_10m[0]'">hourly.wind_speed_10m[0]</button>
                <button class="chip-btn chip-distractor" @click="windPath = 'current.wind'">current.wind ❌</button>
              </div>
            </div>

            <!-- Sensor 2: Temperature -->
            <div
              class="sensor-slot-item"
              :class="{
                'slot-pass': isSensorValid('temp') && tempPass,
                'slot-fail': isSensorValid('temp') && !tempPass,
                'slot-disconnected': !isSensorValid('temp')
              }"
            >
              <div class="slot-header">
                <div class="slot-label-group">
                  <Thermometer :size="16" class="text-brand" />
                  <strong class="slot-title">2. 地表氣溫感測器 (temperature)</strong>
                  <span class="slot-limit-badge">安全標準 &ge; 0°C (防結冰)</span>
                </div>

                <!-- Pass/Fail Status Reading Badge -->
                <span v-if="!isSensorValid('temp')" class="status-reading reading-disconnected">
                  ❌ undefined (離線)
                </span>
                <span v-else-if="tempPass" class="status-reading reading-pass">
                  ✓ {{ resolvedValues.temp }} °C · 合格
                </span>
                <span v-else class="status-reading reading-fail">
                  ⚠️ {{ resolvedValues.temp }} °C · 超標 (結冰危險)
                </span>
              </div>

              <div class="input-row">
                <span class="prefix-text">const temp = data.</span>
                <input
                  v-model="tempPath"
                  type="text"
                  class="path-input"
                  placeholder="請輸入屬性路徑，如 current.temperature_2m"
                  @focus="activeSensorField = 'temp'"
                />
              </div>

              <!-- Quick Path Chips -->
              <div class="quick-chips">
                <span class="chip-label">快捷候選：</span>
                <button class="chip-btn" @click="tempPath = 'current.temperature_2m'">current.temperature_2m</button>
                <button class="chip-btn" @click="tempPath = 'hourly.temperature_2m[0]'">hourly.temperature_2m[0]</button>
                <button class="chip-btn chip-distractor" @click="tempPath = 'temperature'">temperature ❌</button>
              </div>
            </div>

            <!-- Sensor 3: Precipitation -->
            <div
              class="sensor-slot-item"
              :class="{
                'slot-pass': isSensorValid('precip') && precipPass,
                'slot-fail': isSensorValid('precip') && !precipPass,
                'slot-disconnected': !isSensorValid('precip')
              }"
            >
              <div class="slot-header">
                <div class="slot-label-group">
                  <CloudRain :size="16" class="text-brand" />
                  <strong class="slot-title">3. 降水感測器 (precipitation)</strong>
                  <span class="slot-limit-badge">安全標準 &le; 20% (防短路)</span>
                </div>

                <!-- Pass/Fail Status Reading Badge -->
                <span v-if="!isSensorValid('precip')" class="status-reading reading-disconnected">
                  ❌ undefined (離線)
                </span>
                <span v-else-if="precipPass" class="status-reading reading-pass">
                  ✓ {{ resolvedValues.precip }}% · 合格
                </span>
                <span v-else class="status-reading reading-fail">
                  ⚠️ {{ resolvedValues.precip }}% · 超標 (暴雨危險)
                </span>
              </div>

              <div class="input-row">
                <span class="prefix-text">const precip = data.</span>
                <input
                  v-model="precipPath"
                  type="text"
                  class="path-input"
                  placeholder="請輸入屬性路徑，如 hourly.precipitation_probability[0]"
                  @focus="activeSensorField = 'precip'"
                />
              </div>

              <!-- Quick Path Chips -->
              <div class="quick-chips">
                <span class="chip-label">快捷候選：</span>
                <button class="chip-btn" @click="precipPath = 'hourly.precipitation_probability[0]'">hourly.precipitation_probability[0]</button>
                <button class="chip-btn" @click="precipPath = 'current.precipitation'">current.precipitation</button>
                <button class="chip-btn chip-distractor" @click="precipPath = 'precipitation'">precipitation ❌</button>
              </div>
            </div>
          </div>

          <!-- Live JavaScript Async/Await Code View (Auto-wrapping inside card) -->
          <div class="code-preview-card card">
            <div class="code-header" @click="isCodeExpanded = !isCodeExpanded">
              <div class="code-title-group">
                <Code2 :size="15" class="text-brand" />
                <span class="code-title">非同步 API 處理程式碼預覽 (Live Code Preview)</span>
              </div>
              <button class="btn btn-ghost btn-xs">
                <span>{{ isCodeExpanded ? '收合' : '展開' }}</span>
                <component :is="isCodeExpanded ? ChevronDown : ChevronRight" :size="13" />
              </button>
            </div>

            <div v-show="isCodeExpanded" class="code-body">
              <pre class="code-block font-mono"><code>{{ liveGeneratedJsCode }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Execution Footer -->
    <div class="deck-footer">
      <div class="footer-hint">
        <span>飛行發射指引：</span>
        <span class="step-tag" :class="{ 'step-done': allSensorsValid }">
          1. 綁定感測器 JSON 路徑
        </span> ➔
        <span class="step-tag" :class="{ 'step-done': allSensorsPass }">
          2. 切換基地比對 (3 項均為綠色合格)
        </span> ➔
        <span class="step-tag">
          3. 批准無人機升空
        </span>
      </div>

      <button
        class="btn btn-success execute-btn"
        :disabled="isLoading || levelStore.isExecuting || !currentRawJson"
        @click="runExecution"
      >
        <Loader2 v-if="levelStore.isExecuting" :size="16" class="spin-icon" />
        <Send v-else :size="16" />
        <span>{{ levelStore.isExecuting ? '無人機升空程序中...' : '派遣探測無人機升空' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Globe, DownloadCloud, Loader2, Thermometer, Wind, CloudRain,
  Send, RotateCcw, Code2, Database, Sparkles, ChevronDown, ChevronRight,
  Copy, Check
} from 'lucide-vue-next';
import {
  WEATHER_STATIONS,
  DRONE_FLIGHT_LIMITS,
  fetchStationWeather,
  resolveJsonPath
} from '../../services/weatherService.js';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

// State
const selectedStationId = ref('station-tpe');
const useBenchmark = ref(true); // Default to benchmark for guaranteed reliable contrast
const isLoading = ref(false);
const stationCache = ref({}); // { [stationId]: { rawJson, isRealData, timestamp } }
const copied = ref(false);

// JSON Path Inputs for Drone Telemetry Sensors
const windPath = ref('current.wind_speed_10m');
const tempPath = ref('current.temperature_2m');
const precipPath = ref('hourly.precipitation_probability[0]');

const activeSensorField = ref('wind');
const isCodeExpanded = ref(true);

const isFolded = ref({
  current: false,
  hourly: false
});

onMounted(async () => {
  const saved = progressStore.getSavedOperation(8);
  if (saved && saved.weatherSession) {
    const ws = saved.weatherSession;
    if (ws.paths) {
      windPath.value = ws.paths.windPath ?? 'current.wind_speed_10m';
      tempPath.value = ws.paths.tempPath ?? 'current.temperature_2m';
      precipPath.value = ws.paths.precipPath ?? 'hourly.precipitation_probability[0]';
    }
    if (ws.selectedStationId) {
      selectedStationId.value = ws.selectedStationId;
    }
    if (ws.useBenchmark !== undefined) {
      useBenchmark.value = ws.useBenchmark;
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

// Real-time resolved values for current station
const resolvedValues = computed(() => {
  if (!currentRawJson.value) return { wind: undefined, temp: undefined, precip: undefined };
  return {
    wind: resolveJsonPath(currentRawJson.value, windPath.value),
    temp: resolveJsonPath(currentRawJson.value, tempPath.value),
    precip: resolveJsonPath(currentRawJson.value, precipPath.value)
  };
});

function isSensorValid(sensorKey) {
  const val = resolvedValues.value[sensorKey];
  return typeof val === 'number' && !isNaN(val);
}

const allSensorsValid = computed(() => {
  return isSensorValid('wind') && isSensorValid('temp') && isSensorValid('precip');
});

// Individual Sensor Compliance Checks
const windPass = computed(() => {
  const val = resolvedValues.value.wind;
  return typeof val === 'number' && !isNaN(val) && val <= DRONE_FLIGHT_LIMITS.maxWindSpeed;
});

const tempPass = computed(() => {
  const val = resolvedValues.value.temp;
  return typeof val === 'number' && !isNaN(val) && val >= DRONE_FLIGHT_LIMITS.minTemperature;
});

const precipPass = computed(() => {
  const val = resolvedValues.value.precip;
  return typeof val === 'number' && !isNaN(val) && val <= DRONE_FLIGHT_LIMITS.maxPrecipitation;
});

const allSensorsPass = computed(() => {
  return windPass.value && tempPass.value && precipPass.value;
});

// Dynamically generated JS code
const liveGeneratedJsCode = computed(() => {
  const windP = windPath.value || 'current.wind_speed_10m';
  const tempP = tempPath.value || 'current.temperature_2m';
  const precipP = precipPath.value || 'hourly.precipitation_probability[0]';

  return `// 🛰️ JavaScript 非同步 API 連線與航太安全決策
async function evaluateAndLaunchDrone() {
  const stationUrl = 
    "${actualApiUrl.value}";

  // 1. 發送網路請求 (非同步等待回傳)
  const response = await fetch(stationUrl);
  // 2. 將回傳資料轉為 JavaScript JSON 物件
  const data = await response.json();

  // 3. 依據設定路徑解析感測器數值
  const windSpeed = data.${windP};     // ${isSensorValid('wind') ? `${resolvedValues.value.wind} km/h` : 'undefined'}
  const temperature = data.${tempP};   // ${isSensorValid('temp') ? `${resolvedValues.value.temp} °C` : 'undefined'}
  const precipProb = data.${precipP};  // ${isSensorValid('precip') ? `${resolvedValues.value.precip}%` : 'undefined'}

  // 4. 航太硬體三道複合安全門檻驗證
  if (windSpeed <= ${DRONE_FLIGHT_LIMITS.maxWindSpeed} && precipProb <= ${DRONE_FLIGHT_LIMITS.maxPrecipitation} && temperature >= ${DRONE_FLIGHT_LIMITS.minTemperature}) {
    console.log("【${currentStation.value.name}】氣象符合安全標準，無人機核准發射！");
    drone.launch("${currentStation.value.id}");
  } else {
    console.warn("大氣超標或低溫結冰，安全協議禁止發射！");
    drone.abortMission();
  }
}`;
});

// Actions
function toggleFold(key) {
  isFolded.value[key] = !isFolded.value[key];
}

function assignToSensor(sensor, path) {
  soundManager.playClick();
  if (sensor === 'wind') windPath.value = path;
  if (sensor === 'temp') tempPath.value = path;
  if (sensor === 'precip') precipPath.value = path;
}

function quickFillPath(path) {
  soundManager.playClick();
  if (activeSensorField.value === 'wind') windPath.value = path;
  else if (activeSensorField.value === 'temp') tempPath.value = path;
  else if (activeSensorField.value === 'precip') precipPath.value = path;
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

function runExecution() {
  levelStore.executeLevel({
    weatherSession: {
      rawJson: currentRawJson.value,
      station: currentStation.value,
      paths: {
        windPath: windPath.value,
        tempPath: tempPath.value,
        precipPath: precipPath.value
      },
      selectedStationId: selectedStationId.value,
      useBenchmark: useBenchmark.value,
      isRealData: stationCache.value[selectedStationId.value]?.isRealData ?? false,
      launched: true
    }
  });
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
</style>
