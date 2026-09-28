<template>
  <div class="control-panel">
    <div class="deck-header">
      <div class="deck-title-group">
        <CloudSun :size="18" class="text-brand" />
        <h3 class="deck-title">外部氣象 API 連線與耐受評估 · Weather API & Drone Dispatch</h3>
      </div>
      <div class="deck-header-actions">
        <button
          class="btn btn-secondary btn-xs"
          @click="restoreScene"
          title="將氣象探測機還原至發射整備台"
        >
          <RotateCcw :size="13" />
          <span>場景還原</span>
        </button>
        <button
          class="btn btn-outline btn-xs"
          @click="loadSimulationPreset"
          title="切換為晴朗教學模擬數據"
        >
          <span>使用晴朗模擬</span>
        </button>
      </div>
    </div>

    <div class="deck-content">
      <!-- 1. API Fetch Control Bar -->
      <div class="api-request-card card">
        <div class="api-card-row">
          <div class="station-select-group">
            <label class="input-label">觀測站點 (Target Station)：</label>
            <select v-model="selectedStationId" class="station-select" :disabled="isLoading">
              <option v-for="st in WEATHER_STATIONS" :key="st.id" :value="st.id">
                {{ st.name }} ({{ st.region }})
              </option>
            </select>
          </div>

          <button
            class="btn btn-primary fetch-btn"
            @click="fetchWeatherData"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" :size="15" class="spin-icon" />
            <DownloadCloud v-else :size="15" />
            <span>{{ isLoading ? '發送 fetch 請求中...' : '發送 API 請求 (Fetch)' }}</span>
          </button>
        </div>

        <!-- API Status Tag -->
        <div v-if="weatherData" class="api-status-banner">
          <div class="source-badge">
            <span class="source-dot" :class="weatherData.isRealData ? 'dot-real' : 'dot-sim'"></span>
            <strong>{{ weatherData.isRealData ? 'Open-Meteo 公開 API (真實即時數據)' : weatherData.rawSource }}</strong>
          </div>
          <span class="timestamp-text">取樣時間: {{ weatherData.timestamp }}</span>
        </div>
      </div>

      <!-- 2. Weather Telemetry Display -->
      <div v-if="weatherData" class="telemetry-display-grid">
        <div class="telemetry-stat card">
          <Thermometer :size="20" class="text-brand" />
          <div class="stat-col">
            <span class="stat-label">地表氣溫</span>
            <strong class="stat-value">{{ weatherData.temperature }}°C</strong>
          </div>
        </div>

        <div class="telemetry-stat card">
          <Wind :size="20" class="text-brand" />
          <div class="stat-col">
            <span class="stat-label">10米風速</span>
            <strong class="stat-value">{{ weatherData.windSpeed }} km/h</strong>
          </div>
        </div>

        <div class="telemetry-stat card">
          <CloudRain :size="20" class="text-brand" />
          <div class="stat-col">
            <span class="stat-label">降雨機率</span>
            <strong class="stat-value">{{ weatherData.precipitationProbability }}%</strong>
          </div>
        </div>

        <div class="telemetry-stat card">
          <Compass :size="20" class="text-purple" />
          <div class="stat-col">
            <span class="stat-label">氣候現象</span>
            <strong class="stat-value-sm">{{ weatherData.weatherText }}</strong>
          </div>
        </div>
      </div>

      <!-- 3. Drone Flight Safety Conditions Configuration -->
      <div v-if="weatherData" class="flight-safety-card card">
        <h4 class="card-subtitle">設定無人機安全耐受標準 (Flight Thresholds)</h4>
        
        <div class="thresholds-grid">
          <div class="thresh-item">
            <div class="thresh-header">
              <span class="thresh-name">容許風速上限 (maxWindSpeed)</span>
              <span class="badge badge-blue">&le; {{ maxWindSpeed }} km/h</span>
            </div>
            <input
              v-model.number="maxWindSpeed"
              type="range"
              min="15"
              max="40"
              step="1"
              class="slider"
            />
            <span class="thresh-hint">當前風速: {{ weatherData.windSpeed }} km/h ({{ weatherData.windSpeed <= maxWindSpeed ? '安全 ✓' : '超標 ⚠️' }})</span>
          </div>

          <div class="thresh-item">
            <div class="thresh-header">
              <span class="thresh-name">容許降雨率上限 (maxPrecipitation)</span>
              <span class="badge badge-purple">&le; {{ maxPrecipitation }}%</span>
            </div>
            <input
              v-model.number="maxPrecipitation"
              type="range"
              min="10"
              max="60"
              step="5"
              class="slider"
            />
            <span class="thresh-hint">當前降水率: {{ weatherData.precipitationProbability }}% ({{ weatherData.precipitationProbability <= maxPrecipitation ? '安全 ✓' : '超標 ⚠️' }})</span>
          </div>
        </div>

        <!-- Safety Assessment Status Box -->
        <div class="assessment-box" :class="safetyAssessment.canLaunch ? 'box-safe' : 'box-warn'">
          <CheckCircle2 v-if="safetyAssessment.canLaunch" :size="18" class="text-success" />
          <AlertTriangle v-else :size="18" class="text-warning" />
          <span>{{ safetyAssessment.summary }}</span>
        </div>
      </div>

      <div v-else class="empty-fetch-hint card">
        <CloudSun :size="32" class="text-brand" />
        <h4>請點擊上方按鈕發起 API 連線</h4>
        <p>系統將透過 HTTPS 向全球 Open-Meteo 大氣資料庫請求選定站點的真實氣象數據。</p>
      </div>
    </div>

    <!-- Execute Bar -->
    <div class="deck-footer">
      <div class="footer-hint">
        取得 API 數據 ➔ 符合無人機安全耐受標準 ➔ 派遣起飛
      </div>
      <button
        class="btn btn-success execute-btn"
        :disabled="!weatherData || levelStore.isExecuting"
        @click="runExecution"
      >
        <Send :size="16" />
        <span>{{ levelStore.isExecuting ? '無人機升空中...' : '派遣探測無人機升空' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  CloudSun, DownloadCloud, Loader2, Thermometer, Wind, CloudRain,
  Compass, CheckCircle2, AlertTriangle, Send, RotateCcw
} from 'lucide-vue-next';
import {
  WEATHER_STATIONS,
  SIMULATED_WEATHER_PRESETS,
  fetchStationWeather,
  evaluateFlightSafety
} from '../../services/weatherService.js';
import { useLevelStore } from '../../stores/levelStore.js';
import { useProgressStore } from '../../stores/progressStore.js';
import { soundManager } from '../../game/core/SoundManager.js';

const levelStore = useLevelStore();
const progressStore = useProgressStore();

const selectedStationId = ref('station-tpe');
const isLoading = ref(false);
const weatherData = ref(null);

const maxWindSpeed = ref(10);
const maxPrecipitation = ref(10);

onMounted(async () => {
  const saved = progressStore.getSavedOperation(8);
  if (saved && saved.weatherSession) {
    weatherData.value = saved.weatherSession.weatherData || null;
    if (saved.weatherSession.conditions) {
      maxWindSpeed.value = saved.weatherSession.conditions.maxWindSpeed ?? 10;
      maxPrecipitation.value = saved.weatherSession.conditions.maxPrecipitation ?? 10;
    }
  } else {
    // Automatically perform initial fetch for seamless first impression
    await fetchWeatherData();
  }
});

const currentStation = computed(() => {
  return WEATHER_STATIONS.find(s => s.id === selectedStationId.value) || WEATHER_STATIONS[0];
});

const safetyAssessment = computed(() => {
  if (!weatherData.value) return { canLaunch: false, summary: '尚未取得天氣資料' };
  return evaluateFlightSafety(weatherData.value, {
    maxWindSpeed: maxWindSpeed.value,
    maxPrecipitation: maxPrecipitation.value
  });
});

async function fetchWeatherData() {
  soundManager.playClick();
  isLoading.value = true;
  try {
    const res = await fetchStationWeather(currentStation.value);
    weatherData.value = res;
    soundManager.playPowerUp();
  } finally {
    isLoading.value = false;
  }
}

function loadSimulationPreset() {
  soundManager.playClick();
  const sim = SIMULATED_WEATHER_PRESETS[0];
  weatherData.value = {
    stationId: currentStation.value.id,
    stationName: currentStation.value.name,
    region: currentStation.value.region,
    temperature: sim.temperature,
    windSpeed: sim.windSpeed,
    precipitationProbability: sim.precipitationProbability,
    weatherCode: sim.weatherCode,
    weatherText: sim.weatherText,
    isRealData: false,
    timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rawSource: '內建晴朗微風模擬組 (教學專用)'
  };
  restoreScene();
}

function restoreScene() {
  levelStore.restoreScene();
}

function runExecution() {
  levelStore.executeLevel({
    weatherSession: {
      weatherData: weatherData.value,
      conditions: {
        maxWindSpeed: maxWindSpeed.value,
        maxPrecipitation: maxPrecipitation.value
      },
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

/* API Request Card */
.api-request-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: var(--bg-panel-hover);
}

.api-card-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.station-select-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.station-select {
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: #ffffff;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
  outline: none;
}

.station-select:focus {
  border-color: var(--primary-blue);
}

.fetch-btn {
  padding: 0.45rem 1rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.api-status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.45rem;
}

.source-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-secondary);
}

.source-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-real {
  background: var(--success);
  box-shadow: 0 0 6px var(--success-glow);
}

.dot-sim {
  background: var(--warning);
  box-shadow: 0 0 6px var(--warning-glow);
}

.timestamp-text {
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* Telemetry Grid */
.telemetry-display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.65rem;
}

.telemetry-stat {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem;
  background: #ffffff;
}

.stat-col {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value-sm {
  font-size: 0.75rem;
  color: var(--text-primary);
}

/* Flight Safety Card */
.flight-safety-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-subtitle {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.thresholds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.thresh-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.thresh-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thresh-name {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.slider {
  width: 100%;
  accent-color: var(--primary-blue);
  cursor: pointer;
}

.thresh-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.assessment-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
}

.box-safe {
  background: var(--success-light);
  border: 1px solid var(--success-border);
  color: var(--success-dark);
}

.box-warn {
  background: var(--warning-light);
  border: 1px solid var(--warning-border);
  color: var(--warning-dark);
}

/* Empty Hint */
.empty-fetch-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 0.5rem;
}

.empty-fetch-hint h4 {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.empty-fetch-hint p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 400px;
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
