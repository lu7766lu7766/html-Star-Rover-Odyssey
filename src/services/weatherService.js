/**
 * Open-Meteo Weather Service for Star Rover Odyssey 2.0 (Level 8)
 * Handles live weather telemetry fetching with timeout, benchmark dataset,
 * JSON path resolution, and multi-station flight safety evaluation.
 */

export const WEATHER_STATIONS = [
  {
    id: 'station-tpe',
    name: '台北觀測站 (Taipei Alpha)',
    region: '東亞溫帶航區',
    latitude: 25.033,
    longitude: 121.5654
  },
  {
    id: 'station-tyo',
    name: '東京觀測站 (Tokyo Beta)',
    region: '太平洋航道樞紐',
    latitude: 35.6762,
    longitude: 139.6503
  },
  {
    id: 'station-lon',
    name: '倫敦觀測站 (London Gamma)',
    region: '北大西洋氣候帶',
    latitude: 51.5074,
    longitude: -0.1278
  },
  {
    id: 'station-dxb',
    name: '杜拜觀測站 (Dubai Delta)',
    region: '沙漠乾燥氣旋帶',
    latitude: 25.2048,
    longitude: 55.2708
  },
  {
    id: 'station-rkv',
    name: '雷克雅維克 (Reykjavik Epsilon)',
    region: '極地低溫強風區',
    latitude: 64.1466,
    longitude: -21.9426
  }
];

// Fixed Aerospace Hardware Flight Limits for Level 8 Drone
export const DRONE_FLIGHT_LIMITS = {
  maxWindSpeed: 25, // km/h (強風極限)
  maxPrecipitation: 20, // % (防潮抗雨極限)
  minTemperature: 0 // °C (低溫抗凍結冰極限)
};

// Standard Teaching Benchmark Dataset (guarantees clear safe vs unsafe contrast in any network condition)
export const BENCHMARK_STATION_DATA = {
  'station-tpe': {
    latitude: 25.033,
    longitude: 121.5654,
    elevation: 15.0,
    timezone: 'Asia/Taipei',
    current: {
      time: '2026-09-29T15:00',
      temperature_2m: 24.5,
      relative_humidity_2m: 68,
      precipitation: 0.0,
      weather_code: 1,
      wind_speed_10m: 14.2
    },
    hourly: {
      precipitation_probability: [15, 10, 5, 0, 0, 5],
      wind_speed_10m: [14.2, 13.8, 12.5, 11.0, 10.5, 12.0],
      temperature_2m: [24.5, 24.0, 23.2, 22.8, 22.0, 21.5]
    }
  },
  'station-tyo': {
    latitude: 35.6762,
    longitude: 139.6503,
    elevation: 40.0,
    timezone: 'Asia/Tokyo',
    current: {
      time: '2026-09-29T15:00',
      temperature_2m: 16.5,
      relative_humidity_2m: 55,
      precipitation: 0.0,
      weather_code: 3,
      wind_speed_10m: 38.0 // ⚠️ 超標強風 (> 25 km/h)
    },
    hourly: {
      precipitation_probability: [10, 15, 20, 15, 10, 5],
      wind_speed_10m: [38.0, 41.5, 43.0, 39.0, 35.0, 30.0],
      temperature_2m: [16.5, 15.8, 15.0, 14.2, 13.5, 13.0]
    }
  },
  'station-lon': {
    latitude: 51.5074,
    longitude: -0.1278,
    elevation: 25.0,
    timezone: 'Europe/London',
    current: {
      time: '2026-09-29T15:00',
      temperature_2m: 12.0,
      relative_humidity_2m: 92,
      precipitation: 3.8,
      weather_code: 61,
      wind_speed_10m: 18.5
    },
    hourly: {
      precipitation_probability: [85, 80, 75, 70, 60, 50], // ⚠️ 暴雨超標 (> 20%)
      wind_speed_10m: [18.5, 20.0, 19.2, 17.5, 16.0, 15.0],
      temperature_2m: [12.0, 11.5, 11.0, 10.2, 9.8, 9.5]
    }
  },
  'station-dxb': {
    latitude: 25.2048,
    longitude: 55.2708,
    elevation: 10.0,
    timezone: 'Asia/Dubai',
    current: {
      time: '2026-09-29T15:00',
      temperature_2m: 33.5,
      relative_humidity_2m: 30,
      precipitation: 0.0,
      weather_code: 0,
      wind_speed_10m: 18.0 // ✓ 晴朗微風，安全
    },
    hourly: {
      precipitation_probability: [0, 0, 0, 0, 0, 0],
      wind_speed_10m: [18.0, 17.2, 16.5, 15.0, 14.2, 13.8],
      temperature_2m: [33.5, 32.8, 31.5, 30.0, 29.2, 28.5]
    }
  },
  'station-rkv': {
    latitude: 64.1466,
    longitude: -21.9426,
    elevation: 30.0,
    timezone: 'Atlantic/Reykjavik',
    current: {
      time: '2026-09-29T15:00',
      temperature_2m: -6.2, // ⚠️ 嚴寒結冰 (< 0°C)
      relative_humidity_2m: 85,
      precipitation: 0.8,
      weather_code: 71,
      wind_speed_10m: 32.5 // ⚠️ 伴隨強風 (> 25 km/h)
    },
    hourly: {
      precipitation_probability: [45, 55, 60, 50, 40, 35],
      wind_speed_10m: [32.5, 35.0, 36.5, 34.0, 30.0, 28.0],
      temperature_2m: [-6.2, -6.8, -7.5, -8.0, -8.5, -9.0]
    }
  }
};

/**
 * Maps WMO weather code to readable text
 */
export function interpretWeatherCode(code) {
  if (code === 0) return '晴朗無雲 (Clear)';
  if (code >= 1 && code <= 3) return '局部多雲 (Partly Cloudy)';
  if (code >= 45 && code <= 48) return '星塵薄霧 (Foggy)';
  if (code >= 51 && code <= 67) return '微量降雨 (Rain/Drizzle)';
  if (code >= 71 && code <= 77) return '降雪結冰 (Snow/Ice)';
  if (code >= 80 && code <= 82) return '短暫陣雨 (Showers)';
  if (code >= 95) return '雷暴天氣 (Thunderstorm)';
  return '大氣穩定 (Standard Atmosphere)';
}

/**
 * Safely resolves a dot/array notation path from a JSON object.
 * e.g., 'current.wind_speed_10m', 'hourly.precipitation_probability[0]', 'data.current.temperature_2m'
 */
export function resolveJsonPath(obj, path) {
  if (!obj || typeof path !== 'string') return undefined;
  const cleanPath = path.trim().replace(/^data\./, '');
  if (!cleanPath) return undefined;

  // Convert array brackets [0] to .0
  const normalized = cleanPath.replace(/\[['"]?([^'"\]]+)['"]?\]/g, '.$1');
  const parts = normalized.split('.').filter(Boolean);

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Fetches station weather data.
 * If useBenchmark is true, uses the benchmark dataset directly.
 * Otherwise, calls the live Open-Meteo API with fallback on timeout/error.
 */
export async function fetchStationWeather(station, useBenchmark = false, timeoutMs = 6000) {
  if (useBenchmark) {
    const bench = BENCHMARK_STATION_DATA[station.id] || BENCHMARK_STATION_DATA['station-tpe'];
    return {
      stationId: station.id,
      stationName: station.name,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      rawJson: JSON.parse(JSON.stringify(bench)),
      isRealData: false,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawSource: '標準教學氣象情境組 (教學專用)'
    };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.latitude}&longitude=${station.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,wind_speed_10m,temperature_2m&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP 伺服器錯誤: ${response.status}`);
    }

    const data = await response.json();
    return {
      stationId: station.id,
      stationName: station.name,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      rawJson: data,
      isRealData: true,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawSource: 'Open-Meteo Public API (即時真實數據)'
    };
  } catch (error) {
    clearTimeout(timer);
    console.warn('[WeatherService] Live API fetch failed or timed out, returning benchmark fallback:', error.message);
    const bench = BENCHMARK_STATION_DATA[station.id] || BENCHMARK_STATION_DATA['station-tpe'];
    return {
      stationId: station.id,
      stationName: station.name,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      rawJson: JSON.parse(JSON.stringify(bench)),
      isRealData: false,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawSource: '備用教學模擬資料 (離線/逾時模式)',
      fetchError: error.name === 'AbortError' ? '連線逾時 (Timeout)' : error.message
    };
  }
}

/**
 * Evaluates telemetry decoded from rawJson according to student-specified paths.
 */
export function evaluateTelemetry(rawJson, paths = {}) {
  const {
    windPath = '',
    tempPath = '',
    precipPath = ''
  } = paths;

  const windVal = resolveJsonPath(rawJson, windPath);
  const tempVal = resolveJsonPath(rawJson, tempPath);
  const precipVal = resolveJsonPath(rawJson, precipPath);

  const isWindValid = typeof windVal === 'number' && !isNaN(windVal);
  const isTempValid = typeof tempVal === 'number' && !isNaN(tempVal);
  const isPrecipValid = typeof precipVal === 'number' && !isNaN(precipVal);

  const allSensorsOnline = isWindValid && isTempValid && isPrecipValid;

  if (!allSensorsOnline) {
    const missing = [];
    if (!isWindValid) missing.push('風速感測器 (wind_speed_10m)');
    if (!isTempValid) missing.push('氣溫感測器 (temperature_2m)');
    if (!isPrecipValid) missing.push('降雨感測器 (precipitation / probability)');

    return {
      allSensorsOnline: false,
      canLaunch: false,
      wind: windVal,
      temp: tempVal,
      precip: precipVal,
      missing,
      failReason: 'DISCONNECT',
      summary: `感測器路徑解析失敗：${missing.join('、')} 讀值為 undefined！請檢查 JSON 屬性路徑。`
    };
  }

  // Evaluate against Aerospace Drone Limits
  const windOk = windVal <= DRONE_FLIGHT_LIMITS.maxWindSpeed;
  const precipOk = precipVal <= DRONE_FLIGHT_LIMITS.maxPrecipitation;
  const tempOk = tempVal >= DRONE_FLIGHT_LIMITS.minTemperature;

  const canLaunch = windOk && precipOk && tempOk;
  const issues = [];
  let primaryFailReason = null;

  if (!windOk) {
    issues.push(`風速過高 (${windVal} km/h > 上限 ${DRONE_FLIGHT_LIMITS.maxWindSpeed} km/h)`);
    if (!primaryFailReason) primaryFailReason = 'WIND';
  }
  if (!precipOk) {
    issues.push(`降雨率過高 (${precipVal}% > 上限 ${DRONE_FLIGHT_LIMITS.maxPrecipitation}%)`);
    if (!primaryFailReason) primaryFailReason = 'PRECIP';
  }
  if (!tempOk) {
    issues.push(`氣溫過低 (${tempVal}°C < 下限 ${DRONE_FLIGHT_LIMITS.minTemperature}°C)`);
    if (!primaryFailReason) primaryFailReason = 'TEMP';
  }

  return {
    allSensorsOnline: true,
    canLaunch,
    wind: windVal,
    temp: tempVal,
    precip: precipVal,
    windOk,
    tempOk,
    precipOk,
    issues,
    failReason: canLaunch ? null : primaryFailReason,
    summary: canLaunch
      ? '各項大氣指標均符合航太安全規範，核准升空！'
      : `氣象不符標準：${issues.join('，')}`
  };
}
