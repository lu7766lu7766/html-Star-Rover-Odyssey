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
          @click="restoreScene"
          title="將氣象探測機還原至發射整備台"
        >
          <RotateCcw :size="13" />
          <span>場景還原</span>
        </button>
      </div>
    </div>

    <div class="deck-content custom-scrollbar">
      <!-- 1. Global Stations Selector Bar -->
      <div class="stations-card card">
        <div class="stations-header">
          <div class="label-group">
            <span class="box-label">全球觀測基地 (Target Stations)：</span>
            <span class="badge badge-blue">點擊切換觀測站並取得大氣 JSON</span>
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
              'has-data': !!stationCache[st.id],
              'chip-safe': stationClearance[st.id]?.canLaunch,
              'chip-unsafe': stationClearance[st.id] && !stationClearance[st.id]?.canLaunch
            }"
            @click="selectStation(st.id)"
          >
            <div class="chip-top">
              <span class="station-name">{{ st.name.split(' ')[0] }}</span>
              <span class="station-region">{{ st.region }}</span>
            </div>

            <div class="chip-bottom">
              <div v-if="stationCache[st.id]" class="chip-telemetry">
                <span class="chip-stat" title="風速">💨 {{ getStationWind(st.id) }}</span>
                <span class="chip-stat" title="氣溫">🌡️ {{ getStationTemp(st.id) }}</span>
                <span class="chip-stat" title="降雨">🌧️ {{ getStationPrecip(st.id) }}</span>
              </div>
              <div v-else class="chip-telemetry-empty">
                <span>尚未掃描</span>
              </div>

              <span
                v-if="stationClearance[st.id]"
                class="status-pill"
                :class="stationClearance[st.id].canLaunch ? 'pill-safe' : 'pill-warn'"
              >
                {{ stationClearance[st.id].canLaunch ? '安全 ✓' : '超標 ⚠️' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Dual Column: JSON Tree Inspector & Sensor Path Mapping -->
      <div class="workspace-grid">
        <!-- Left: Interactive JSON Tree Inspector -->
        <div class="json-inspector-card card">
          <div class="card-title-bar">
            <div class="title-with-icon">
              <Database :size="15" class="text-brand" />
              <span class="card-title-text">API 回傳原始 JSON 物件樹 (Response JSON Tree)</span>
            </div>
            <span class="json-station-tag">{{ currentStation.name }}</span>
          </div>

          <div class="json-instruction-hint">
            💡 <strong>提示：</strong>可點擊下方 JSON 屬性直接將路徑填入右側感測器，或手動輸入點運算子取值（例如 <code>current.wind_speed_10m</code>）。
          </div>

          <div class="json-tree-container custom-scrollbar">
            <div class="json-tree-root">
              <div class="tree-line">
                <span class="json-brace">{</span>
              </div>
              
              <!-- Latitude / Longitude -->
              <div class="tree-line indent-1">
                <span class="json-key" @click="quickFillPath('latitude')">"latitude"</span>: <span class="json-number">{{ currentRawJson?.latitude ?? 25.03 }}</span>,
              </div>
              <div class="tree-line indent-1">
                <span class="json-key" @click="quickFillPath('longitude')">"longitude"</span>: <span class="json-number">{{ currentRawJson?.longitude ?? 121.56 }}</span>,
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
                    </span>: <span class="json-number">{{ currentRawJson?.current?.temperature_2m ?? 24.5 }}</span>,
                    <span class="inline-badge">🌡️ 氣溫 (°C)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('current.relative_humidity_2m')">"relative_humidity_2m"</span>: <span class="json-number">{{ currentRawJson?.current?.relative_humidity_2m ?? 65 }}</span>,
                  </div>
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': precipPath === 'current.precipitation' }">
                    <span class="json-key node-btn" @click="assignToSensor('precip', 'current.precipitation')" title="點擊綁定至降雨感測器">
                      "precipitation"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.precipitation ?? 0.0 }}</span>,
                    <span class="inline-badge">🌧️ 降水量 (mm)</span>
                  </div>
                  <div class="tree-line indent-2 highlight-node" :class="{ 'node-active': windPath === 'current.wind_speed_10m' }">
                    <span class="json-key node-btn" @click="assignToSensor('wind', 'current.wind_speed_10m')" title="點擊綁定至風速感測器">
                      "wind_speed_10m"
                    </span>: <span class="json-number">{{ currentRawJson?.current?.wind_speed_10m ?? 14.2 }}</span>
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
                    </span>: [ <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[0] ?? 15 }}</span>, <span class="json-number">{{ currentRawJson?.hourly?.precipitation_probability?.[1] ?? 10 }}</span>, ... ],
                    <span class="inline-badge">🌧️ 降雨機率 (%)</span>
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('hourly.wind_speed_10m[0]')">"wind_speed_10m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.wind_speed_10m?.[0] ?? 14.2 }}</span>, ... ],
                  </div>
                  <div class="tree-line indent-2">
                    <span class="json-key" @click="quickFillPath('hourly.temperature_2m[0]')">"temperature_2m"</span>: [ <span class="json-number">{{ currentRawJson?.hourly?.temperature_2m?.[0] ?? 24.5 }}</span>, ... ]
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

        <!-- Right: Sensor Path Mapping & Aerospace Clearance -->
        <div class="mapping-column">
          <!-- Sensor Slots -->
          <div class="sensor-slots-card card">
            <div class="card-title-bar">
              <div class="title-with-icon">
                <Sparkles :size="15" class="text-brand" />
                <span class="card-title-text">無人機感測器路徑對應 (JSON Path Binding)</span>
              </div>
              <span class="badge badge-purple">航太安全規格限制</span>
            </div>

            <!-- Sensor 1: Wind Speed -->
            <div class="sensor-slot-item" :class="{ 'slot-connected': isSensorValid('wind'), 'slot-error': !isSensorValid('wind') }">
              <div class="slot-header">
                <div class="slot-label-group">
                  <Wind :size="16" class="text-brand" />
                  <strong class="slot-title">1. 風速感測器 (windSpeed)</strong>
                  <span class="slot-limit-badge">上限 &le; 25 km/h</span>
                </div>
                <span class="status-reading" :class="isSensorValid('wind') ? 'reading-ok' : 'reading-err'">
                  {{ isSensorValid('wind') ? `${resolvedValues.wind} km/h` : 'undefined (離線)' }}
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
            <div class="sensor-slot-item" :class="{ 'slot-connected': isSensorValid('temp'), 'slot-error': !isSensorValid('temp') }">
              <div class="slot-header">
                <div class="slot-label-group">
                  <Thermometer :size="16" class="text-brand" />
                  <strong class="slot-title">2. 地表氣溫感測器 (temperature)</strong>
                  <span class="slot-limit-badge">下限 &ge; 0°C (防結冰)</span>
                </div>
                <span class="status-reading" :class="isSensorValid('temp') ? 'reading-ok' : 'reading-err'">
                  {{ isSensorValid('temp') ? `${resolvedValues.temp} °C` : 'undefined (離線)' }}
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
            <div class="sensor-slot-item" :class="{ 'slot-connected': isSensorValid('precip'), 'slot-error': !isSensorValid('precip') }">
              <div class="slot-header">
                <div class="slot-label-group">
                  <CloudRain :size="16" class="text-brand" />
                  <strong class="slot-title">3. 降水感測器 (precipitation)</strong>
                  <span class="slot-limit-badge">上限 &le; 20% (防短路)</span>
                </div>
                <span class="status-reading" :class="isSensorValid('precip') ? 'reading-ok' : 'reading-err'">
                  {{ isSensorValid('precip') ? `${resolvedValues.precip}%` : 'undefined (離線)' }}
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

          <!-- Aerospace Clearance Status Card -->
          <div class="clearance-card card" :class="clearanceStatus.boxClass">
            <div class="clearance-header">
              <div class="clearance-title-row">
                <component :is="clearanceStatus.icon" :size="20" :class="clearanceStatus.iconClass" />
                <h4 class="clearance-title">【{{ currentStation.name }}】航太飛行許可評估</h4>
              </div>
              <span class="badge" :class="clearanceStatus.badgeClass">{{ clearanceStatus.badgeText }}</span>
            </div>

            <p class="clearance-summary">{{ clearanceStatus.message }}</p>

            <div v-if="telemetryResult.allSensorsOnline" class="mini-metrics-bar">
              <span class="metric-pill" :class="telemetryResult.windOk ? 'pill-good' : 'pill-bad'">
                風速: {{ telemetryResult.wind }} km/h ({{ telemetryResult.windOk ? '合格 ✓' : '超標 ⚠️' }})
              </span>
              <span class="metric-pill" :class="telemetryResult.tempOk ? 'pill-good' : 'pill-bad'">
                氣溫: {{ telemetryResult.temp }} °C ({{ telemetryResult.tempOk ? '合格 ✓' : '過低 ⚠️' }})
              </span>
              <span class="metric-pill" :class="telemetryResult.precipOk ? 'pill-good' : 'pill-bad'">
                降水: {{ telemetryResult.precip }}% ({{ telemetryResult.precipOk ? '合格 ✓' : '超標 ⚠️' }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Live JavaScript Async/Await Code View (Collapsible) -->
      <div class="code-preview-card card">
        <div class="code-header" @click="isCodeExpanded = !isCodeExpanded">
          <div class="code-title-group">
            <Code2 :size="16" class="text-brand" />
            <span class="code-title">即時生成之非同步 API 處理程式碼 (Live Async/Await JavaScript Code)</span>
          </div>
          <button class="btn btn-ghost btn-xs">
            <span>{{ isCodeExpanded ? '收合' : '展開檢視' }}</span>
            <component :is="isCodeExpanded ? ChevronDown : ChevronRight" :size="14" />
          </button>
        </div>

        <div v-show="isCodeExpanded" class="code-body">
          <pre class="code-block font-mono"><code>{{ liveGeneratedJsCode }}</code></pre>
        </div>
      </div>
    </div>

    <!-- Execution Footer -->
    <div class="deck-footer">
      <div class="footer-hint">
        <span>步驟：</span>
        <span class="step-tag" :class="{ 'step-done': allSensorsValid }">1. 綁定 JSON 路徑</span> ➔
        <span class="step-tag" :class="{ 'step-done': telemetryResult.canLaunch }">2. 選定安全觀測站</span> ➔
        <span class="step-tag">3. 批准無人機升空</span>
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
import { ref, computed, onMounted, watch } from 'vue';
import {
  Globe, DownloadCloud, Loader2, Thermometer, Wind, CloudRain,
  CheckCircle2, AlertTriangle, Send, RotateCcw, Code2, Database,
  Sparkles, ChevronDown, ChevronRight, XCircle
} from 'lucide-vue-next';
import {
  WEATHER_STATIONS,
  DRONE_FLIGHT_LIMITS,
  fetchStationWeather,
  resolveJsonPath,
  evaluateTelemetry
} from '../../services/weatherService.js';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

// State
const selectedStationId = ref('station-tpe');
const useBenchmark = ref(true); // Default to benchmark for guaranteed reliable contrast in initial view
const isLoading = ref(false);
const stationCache = ref({}); // { [stationId]: { rawJson, isRealData, timestamp } }

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

// Telemetry evaluation for current station
const telemetryResult = computed(() => {
  if (!currentRawJson.value) return { allSensorsOnline: false, canLaunch: false };
  return evaluateTelemetry(currentRawJson.value, {
    windPath: windPath.value,
    tempPath: tempPath.value,
    precipPath: precipPath.value
  });
});

// Clearance results for each station for the top selector pills
const stationClearance = computed(() => {
  const map = {};
  for (const st of WEATHER_STATIONS) {
    const entry = stationCache.value[st.id];
    if (entry && entry.rawJson) {
      map[st.id] = evaluateTelemetry(entry.rawJson, {
        windPath: windPath.value,
        tempPath: tempPath.value,
        precipPath: precipPath.value
      });
    }
  }
  return map;
});

// Visual clearance status banner styling
const clearanceStatus = computed(() => {
  if (!currentRawJson.value) {
    return {
      boxClass: 'box-muted',
      icon: AlertTriangle,
      iconClass: 'text-muted',
      badgeClass: 'badge-muted',
      badgeText: '未載入',
      message: '尚未取得當前站點氣象資料。'
    };
  }

  if (!telemetryResult.value.allSensorsOnline) {
    return {
      boxClass: 'box-warn',
      icon: XCircle,
      iconClass: 'text-warning',
      badgeClass: 'badge-warning',
      badgeText: '感測器離線',
      message: telemetryResult.value.summary
    };
  }

  if (telemetryResult.value.canLaunch) {
    return {
      boxClass: 'box-safe',
      icon: CheckCircle2,
      iconClass: 'text-success',
      badgeClass: 'badge-success',
      badgeText: 'ALL SYSTEMS GO',
      message: `【${currentStation.value.name}】風速 ${resolvedValues.value.wind} km/h、氣溫 ${resolvedValues.value.temp}°C、降水 ${resolvedValues.value.precip}% 均符合標準，核准發射！`
    };
  } else {
    return {
      boxClass: 'box-danger',
      icon: AlertTriangle,
      iconClass: 'text-danger',
      badgeClass: 'badge-danger',
      badgeText: '發射中止 (ABORT)',
      message: `【${currentStation.value.name}】氣候超標危險：${telemetryResult.value.issues.join('、')}。請切換至其他溫和觀測站！`
    };
  }
});

// Dynamically generated JS code
const liveGeneratedJsCode = computed(() => {
  const windP = windPath.value || 'current.wind_speed_10m';
  const tempP = tempPath.value || 'current.temperature_2m';
  const precipP = precipPath.value || 'hourly.precipitation_probability[0]';

  return `// 🛰️ JavaScript 非同步 API 連線與航太安全決策
async function evaluateAndLaunchDrone() {
  const stationUrl = "https://api.open-meteo.com/v1/forecast?latitude=${currentStation.value.latitude}&longitude=${currentStation.value.longitude}&current=temperature_2m,precipitation,wind_speed_10m&hourly=precipitation_probability";

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

function getStationWind(stationId) {
  const raw = stationCache.value[stationId]?.rawJson;
  if (!raw) return '--';
  const val = resolveJsonPath(raw, windPath.value);
  return typeof val === 'number' ? `${val}k` : 'und';
}

function getStationTemp(stationId) {
  const raw = stationCache.value[stationId]?.rawJson;
  if (!raw) return '--';
  const val = resolveJsonPath(raw, tempPath.value);
  return typeof val === 'number' ? `${val}°` : 'und';
}

function getStationPrecip(stationId) {
  const raw = stationCache.value[stationId]?.rawJson;
  if (!raw) return '--';
  const val = resolveJsonPath(raw, precipPath.value);
  return typeof val === 'number' ? `${val}%` : 'und';
}

function restoreScene() {
  levelStore.restoreScene();
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
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.7);
  border-bottom: 1px solid var(--border-subtle);
  gap: 0.75rem;
}

.deck-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.deck-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-bright);
}

.deck-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-toggle-group {
  display: flex;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 6px;
  padding: 2px;
  border: 1px solid var(--border-subtle);
}

.mode-btn {
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--brand-blue, #2563eb);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.deck-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 1. Global Stations Selector */
.stations-card {
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.stations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.box-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-bright);
}

.stations-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.station-chip {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.station-chip:hover {
  background: rgba(51, 65, 85, 0.6);
  border-color: rgba(96, 165, 250, 0.5);
}

.station-chip.selected {
  border-color: var(--brand-blue, #3b82f6);
  background: rgba(37, 99, 235, 0.15);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.25);
}

.chip-top {
  display: flex;
  flex-direction: column;
}

.station-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-bright);
}

.station-region {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.chip-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
}

.chip-telemetry {
  display: flex;
  gap: 0.25rem;
  font-family: monospace;
  color: var(--text-muted);
}

.chip-telemetry-empty {
  color: var(--text-muted);
  font-size: 0.68rem;
}

.status-pill {
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
}

.pill-safe {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pill-warn {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* 2. Workspace Grid */
.workspace-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 0.75rem;
}

.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.card-title-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-bright);
}

.json-station-tag {
  font-size: 0.72rem;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

/* Left: JSON Inspector */
.json-inspector-card {
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.json-instruction-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: rgba(30, 41, 59, 0.4);
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.json-instruction-hint code {
  color: #38bdf8;
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 3px;
  border-radius: 3px;
}

.json-tree-container {
  max-height: 280px;
  overflow-y: auto;
  background: rgba(10, 15, 30, 0.7);
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.76rem;
  line-height: 1.4;
}

.tree-line {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 1px 0;
}

.indent-1 {
  padding-left: 1rem;
}

.indent-2 {
  padding-left: 2rem;
}

.tree-fold-header {
  cursor: pointer;
  user-select: none;
}

.fold-arrow {
  color: var(--text-muted);
}

.json-brace {
  color: #94a3b8;
}

.json-key {
  color: #60a5fa;
  cursor: pointer;
  transition: color 0.15s;
}

.json-key:hover {
  color: #93c5fd;
  text-decoration: underline;
}

.json-string {
  color: #a7f3d0;
}

.json-number {
  color: #fde047;
  font-weight: 600;
}

.highlight-node {
  background: rgba(59, 130, 246, 0.08);
  border-radius: 4px;
  padding: 2px 4px !important;
  margin: 1px 0;
}

.highlight-node.node-active {
  background: rgba(16, 185, 129, 0.15);
  border-left: 2px solid #10b981;
}

.node-btn {
  font-weight: 600;
  text-decoration: underline dotted;
}

.inline-badge {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-left: auto;
  opacity: 0.8;
}

/* Right: Sensor Slots */
.mapping-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sensor-slots-card {
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sensor-slot-item {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: all 0.2s;
}

.sensor-slot-item.slot-connected {
  border-left: 3px solid #10b981;
}

.sensor-slot-item.slot-error {
  border-left: 3px solid #ef4444;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-label-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.slot-title {
  font-size: 0.78rem;
  color: var(--text-bright);
}

.slot-limit-badge {
  font-size: 0.65rem;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  padding: 1px 4px;
  border-radius: 3px;
}

.status-reading {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  padding: 1px 6px;
  border-radius: 4px;
}

.reading-ok {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
}

.reading-err {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(10, 15, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
}

.prefix-text {
  font-size: 0.74rem;
  color: #94a3b8;
  font-family: monospace;
}

.path-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-family: monospace;
  font-size: 0.76rem;
}

.quick-chips {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  flex-wrap: wrap;
}

.chip-label {
  color: var(--text-muted);
}

.chip-btn {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.66rem;
  cursor: pointer;
  font-family: monospace;
  transition: all 0.15s;
}

.chip-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  color: #fff;
}

.chip-distractor {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.2);
}

/* Aerospace Clearance Banner */
.clearance-card {
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 1px solid;
}

.box-safe {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.box-danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.box-warn {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.box-muted {
  background: rgba(30, 41, 59, 0.4);
  border-color: var(--border-subtle);
}

.clearance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clearance-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.clearance-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-bright);
}

.clearance-summary {
  font-size: 0.73rem;
  line-height: 1.4;
  color: #e2e8f0;
}

.mini-metrics-bar {
  display: flex;
  gap: 0.5rem;
  font-size: 0.68rem;
  font-family: monospace;
}

.metric-pill {
  padding: 2px 6px;
  border-radius: 4px;
}

.pill-good {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.pill-bad {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* 3. Code Preview */
.code-preview-card {
  padding: 0.6rem 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
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
  gap: 0.4rem;
}

.code-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-bright);
}

.code-body {
  margin-top: 0.5rem;
}

.code-block {
  background: rgba(10, 15, 30, 0.8);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.73rem;
  color: #38bdf8;
  line-height: 1.45;
  white-space: pre-wrap;
}

/* Footer Execution Bar */
.deck-footer {
  height: 52px;
  min-height: 52px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid var(--border-subtle);
}

.footer-hint {
  font-size: 0.74rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.step-tag {
  color: var(--text-muted);
  padding: 1px 4px;
  border-radius: 3px;
  transition: all 0.2s;
}

.step-tag.step-done {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  font-weight: 600;
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 1.25rem;
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
