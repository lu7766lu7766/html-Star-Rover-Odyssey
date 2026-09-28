/**
 * Open-Meteo Weather Service for Star Rover Odyssey 2.0 (Level 8)
 * Handles live weather telemetry fetching with timeout, fallback simulation data,
 * and structured data formatting for drone flight assessment.
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

// Presets for simulated fallback / offline classroom testing
export const SIMULATED_WEATHER_PRESETS = [
  {
    id: 'sim-clear',
    name: '模擬數據：晴朗微風',
    temperature: 24.5,
    windSpeed: 8.2, // km/h
    precipitationProbability: 5, // %
    weatherCode: 0,
    weatherText: '晴朗無雲 (Clear Sky)',
    isRealData: false
  },
  {
    id: 'sim-windy',
    name: '模擬數據：強風警報',
    temperature: 18.0,
    windSpeed: 42.5, // km/h
    precipitationProbability: 15, // %
    weatherCode: 3,
    weatherText: '強陣風多雲 (Strong Winds)',
    isRealData: false
  },
  {
    id: 'sim-storm',
    name: '模擬數據：雷暴大雨',
    temperature: 15.2,
    windSpeed: 35.0, // km/h
    precipitationProbability: 95, // %
    weatherCode: 95,
    weatherText: '雷陣雨伴隨驟雨 (Thunderstorm)',
    isRealData: false
  }
];

/**
 * Maps WMO weather code to readable text
 */
export function interpretWeatherCode(code) {
  if (code === 0) return '晴朗無雲 (Clear)';
  if (code >= 1 && code <= 3) return '局部多雲 (Partly Cloudy)';
  if (code >= 45 && code <= 48) return '星塵薄霧 (Foggy)';
  if (code >= 51 && code <= 67) return '微量降雨 (Rain/Drizzle)';
  if (code >= 71 && code <= 77) return '降雪或冰雹 (Snow/Ice)';
  if (code >= 80 && code <= 82) return '短暫陣雨 (Showers)';
  if (code >= 95) return '雷暴天氣 (Thunderstorm)';
  return '穩定大氣 (Standard Atmosphere)';
}

/**
 * Fetches real weather data from Open-Meteo API with timeout and robust fallback
 */
export async function fetchStationWeather(station, timeoutMs = 6000) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.latitude}&longitude=${station.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP 伺服器錯誤: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    const temperature = typeof current.temperature_2m === 'number' ? current.temperature_2m : 22.0;
    const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 12.0;
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;
    
    // Precipitation probability: read current hour or default to 0
    let precipProb = 0;
    if (hourly.precipitation_probability && Array.isArray(hourly.precipitation_probability)) {
      precipProb = hourly.precipitation_probability[0] ?? 0;
    }

    return {
      stationId: station.id,
      stationName: station.name,
      region: station.region,
      temperature,
      windSpeed,
      precipitationProbability: precipProb,
      weatherCode,
      weatherText: interpretWeatherCode(weatherCode),
      isRealData: true,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawSource: 'Open-Meteo Public API'
    };
  } catch (error) {
    clearTimeout(timer);
    console.warn('[WeatherService] Live API fetch failed or timed out, returning fallback:', error.message);
    
    // Return graceful fallback simulation tagged clearly as non-real data
    const fallback = SIMULATED_WEATHER_PRESETS[0];
    return {
      stationId: station.id,
      stationName: station.name,
      region: station.region,
      temperature: fallback.temperature,
      windSpeed: fallback.windSpeed,
      precipitationProbability: fallback.precipitationProbability,
      weatherCode: fallback.weatherCode,
      weatherText: fallback.weatherText,
      isRealData: false,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawSource: '備用模擬資料 (離線/逾時模式)',
      fetchError: error.name === 'AbortError' ? '連線逾時 (Timeout)' : error.message
    };
  }
}

/**
 * Evaluates whether drone flight conditions meet student configured criteria
 */
export function evaluateFlightSafety(weatherData, conditions = {}) {
  const maxWindSpeed = conditions.maxWindSpeed ?? 25; // default max wind speed 25 km/h
  const maxPrecipitation = conditions.maxPrecipitation ?? 30; // default max precip 30%
  const minTemp = conditions.minTemp ?? -5;

  const windOk = weatherData.windSpeed <= maxWindSpeed;
  const precipOk = weatherData.precipitationProbability <= maxPrecipitation;
  const tempOk = weatherData.temperature >= minTemp;

  const canLaunch = windOk && precipOk && tempOk;

  const issues = [];
  if (!windOk) {
    issues.push(`風速過高 (${weatherData.windSpeed} km/h > 容許上限 ${maxWindSpeed} km/h)`);
  }
  if (!precipOk) {
    issues.push(`降雨機率過高 (${weatherData.precipitationProbability}% > 容許上限 ${maxPrecipitation}%)`);
  }
  if (!tempOk) {
    issues.push(`氣溫過低 (${weatherData.temperature}°C < 容許下限 ${minTemp}°C)`);
  }

  return {
    canLaunch,
    windOk,
    precipOk,
    tempOk,
    issues,
    summary: canLaunch 
      ? '氣象條件符合安全飛行標準，探勘無人機已核准升空！'
      : `氣象不符標準：${issues.join('，')}`
  };
}
