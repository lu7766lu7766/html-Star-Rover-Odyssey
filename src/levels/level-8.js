/**
 * Level 8: 星際氣象站
 * 核心概念：API 與外部資料交換 (Fetch & External Web APIs)
 */

export default {
  id: 8,
  title: '星際氣象站',
  subtitle: 'API 與外部資料',
  conceptTitle: '連結世界：透過 API 交換即時資料',
  concepts: ['Web API (fetch)', 'JSON 資料解析', '非同步資料交換 (Async/Await)'],
  description: `高空探測無人機準備升空進行行星高層大氣測繪！然而無人機對強風與暴雨極度敏感。我們需要透過「星際氣象 API (Open-Meteo)」向地面觀測站請求真實即時天氣數據。請選擇觀測站、發起 API 請求取得即時風速與降雨機率，並在操作台設定安全飛行門檻，判定是否安全派遣無人機！`,
  targetRequirements: [
    '選擇任一觀測站（台北、東京、倫敦、杜拜或雷克雅維克）',
    '點擊「發送 API 請求」取得即時大氣資料 (溫度、風速、降雨率)',
    '檢視 API 回傳的真實或模擬數據結構',
    '設定無人機耐受標準（風速上限 15~35 km/h、降雨上限 10~50%）',
    '確保目前天氣指標符合安全標準後，點擊「派遣無人機」完成高空測繪'
  ],
  controlType: 'weather-api',
  defaultConditions: {
    maxWindSpeed: 25,
    maxPrecipitation: 30
  },
  hints: [
    '提示 1：API (Application Programming Interface) 是程式用來向外部伺服器索取資料的管道。點擊「發送 API 請求」按鈕體驗真實資料傳輸！',
    '提示 2：若你選擇的城市今天剛好刮大風或下暴雨，你可以嘗試切換到其他氣候晴朗的站點，或是切換至「晴朗模擬數據」。',
    '提示 3：如果當前站點風速是 12 km/h，只要你的風速容許上限設為 20 km/h（大於等於 12），無人機就能通過安全檢核！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：使用 fetch() 發送 API 請求並解析 JSON
async function assessWeatherAndLaunch() {
  const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&current=wind_speed_10m,precipitation";

  // 1. 發送網路請求 (非同步等待回傳)
  const response = await fetch(apiUrl);
  // 2. 將回傳內容解析為 JavaScript 物件
  const data = await response.json();

  const currentWind = data.current.wind_speed_10m; // 例如 14.5 km/h
  const maxSafeWind = 25; // 學生設定的安全上限

  // 3. 根據外部 API 取得的真實數據做出飛行決策
  if (currentWind <= maxSafeWind) {
    console.log("氣象符合標準，無人機核准升空！");
    drone.launch();
  } else {
    console.warn("風速過高，取消本次飛行任務。");
  }
}`,
  conceptExplanation: `在現代網路世界中，**API (應用程式介面)** 是系統之間溝通的語言。例如遊戲想知道今天會不會下雨，不需要自建氣象雷達，只需向氣象局的 API 伺服器發送一條請求，對方就會將最新的資料（通常是 JSON 格式）回傳給遊戲，程式就能即時做出反應！`,
  validate: (runResult) => {
    const weatherSession = runResult.weatherSession || {};
    const { weatherData, conditions = {}, launched = false } = weatherSession;

    if (!weatherData) {
      return {
        pass: false,
        error: '尚未取得天氣資料！請先點擊「發送 API 請求」向氣象站索取資料。'
      };
    }

    if (!launched) {
      return {
        pass: false,
        error: '天氣資料已解析，但尚未點擊「派遣無人機」執行發射！'
      };
    }

    const maxWind = conditions.maxWindSpeed ?? 25;
    const maxPrecip = conditions.maxPrecipitation ?? 30;

    // Physical limits of drone hardware
    if (weatherData.windSpeed > 50) {
      return {
        pass: false,
        error: `當前站點風速高達 ${weatherData.windSpeed} km/h，已超出無人機機體物理安全極限 (50 km/h)！請切換至其他溫和站點或切換模擬天氣。`
      };
    }

    if (weatherData.windSpeed > maxWind) {
      return {
        pass: false,
        error: `目前風速 (${weatherData.windSpeed} km/h) 超過你設定的容許上限 (${maxWind} km/h)！飛行電腦拒絕起飛以防失控。請調整門檻或更換平靜站點。`
      };
    }

    if (weatherData.precipitationProbability > maxPrecip) {
      return {
        pass: false,
        error: `目前降雨機率 (${weatherData.precipitationProbability}%) 超過你設定的容許上限 (${maxPrecip}%)！儀器恐受潮短路。請調整條件或換站。`
      };
    }

    return {
      pass: true,
      data: {
        station: weatherData.stationName,
        windSpeed: weatherData.windSpeed,
        temperature: weatherData.temperature,
        isRealData: weatherData.isRealData
      },
      feedback: `API 氣象評估大成功！【${weatherData.stationName}】天氣符合安全標準，無人機穿破雲層完成高空行星測繪，傳回壯麗全景資料！`
    };
  }
};
