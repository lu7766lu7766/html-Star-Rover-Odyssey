/**
 * Level 5: 模組裝載
 * 核心概念：函式與物件 (Objects & Methods)
 */

export default {
  id: 5,
  title: '模組裝載',
  subtitle: '函式與物件',
  conceptTitle: '物件打包屬性，方法定義行為',
  concepts: ['物件結構 (Object)', '屬性與鍵值 (Key-Value)', '物件方法 (Methods)'],
  description: `探測船進入未探明的迷霧星區。請替探測船裝配先進的掃描雷達模組。物件可以用來封裝模組的「規格屬性」（如名稱、掃描半徑、增益檔位），並透過掛載其上的「方法函式」一鍵觸發雷達掃描！請將掃描半徑設定至覆蓋所有隱藏天體（>= 18 單位）並點擊啟動。`,
  targetRequirements: [
    '選擇搭載「量子廣角光譜儀 (QuantumScanner)」模組',
    '設定掃描半徑 range >= 18 單位 (以覆蓋遠端星體)',
    '設定解析度 mode 為 "HIGH"',
    '呼叫模組物件自帶的方法函式 scanner.activateScan() 觸發光波'
  ],
  controlType: 'module-object',
  availableModules: [
    {
      id: 'quantum-scanner',
      name: '量子廣角光譜儀 (QuantumScanner)',
      type: 'WIDE_SPECTRUM',
      maxRange: 25,
      description: '具備穿透星塵迷霧的量子級雷達，支援大範圍高解析掃描'
    },
    {
      id: 'basic-sensor',
      name: '基礎聲納感測器 (BasicSensor)',
      type: 'ACOUSTIC',
      maxRange: 12,
      description: '舊型近程感測器，掃描範圍有限，無法探測遠端天體'
    }
  ],
  hints: [
    '提示 1【物件觀念】：JavaScript 物件用大括號 { } 將屬性（資料）與方法（函式行為）打包在一起。',
    '提示 2【模組規格觀察】：深空中隱藏的目標天體距離較遠。比較兩款模組的規格與最大支援半徑 (maxRange)，哪一款才具備足夠的探測極限？',
    '提示 3【引導式思考】：選定合適模組並調高 range 覆蓋半徑與解析度後，點擊執行按鈕即可呼叫物件的方法函式 (scanner.activateScan()) 觸發光波！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：物件包含資料 (屬性) 與動作 (方法)
const scannerModule = {
  name: "QuantumScanner",
  range: 20,           // 屬性：掃描半徑
  mode: "HIGH",        // 屬性：高解析度

  // 方法函式：啟動掃描行為
  activateScan() {
    console.log(\`[系統] 啟動 \${this.name}，覆蓋半徑 \${this.range} 單位\`);
    rover.emitRadarPulse(this.range);
    return "SCAN_COMPLETE";
  }
};

// 呼叫物件的方法
scannerModule.activateScan();`,
  conceptExplanation: `在真實世界中，任何東西都是**物件 (Object)**。一輛車有顏色、速度（屬性），也有開車門、煞車（方法）。在 JavaScript 中，物件用大括號 \`{ }\` 將資料（屬性）和功能（函式/方法）打包在一起，方便統一管理與調用。`,
  validate: (runResult) => {
    const moduleConfig = runResult.moduleConfig || {};
    const { moduleId, range = 0, mode, isMethodInvoked } = moduleConfig;

    if (moduleId !== 'quantum-scanner') {
      return {
        pass: false,
        error: '模組選型錯誤！「基礎聲納感測器」最大範圍僅 12 單位，無法探測遠端目標。請切換為「量子廣角光譜儀」。'
      };
    }

    if (range < 18) {
      return {
        pass: false,
        error: `掃描半徑不足！目前設定為 ${range} 單位，最遠的隱藏天體位於 18 單位處，請將半徑調至 18 或以上！`,
        details: { range, targetRange: 18 }
      };
    }

    if (mode !== 'HIGH') {
      return {
        pass: false,
        error: '解析度設定過低！請將 mode 屬性切換為 "HIGH" 才能解析星圖深空頻譜。'
      };
    }

    if (!isMethodInvoked) {
      return {
        pass: false,
        error: '模組已配置但尚未呼叫啟動方法！請點擊「呼叫 scanner.activateScan()」按鈕觸發掃描。'
      };
    }

    return {
      pass: true,
      data: { moduleId, range, mode },
      feedback: `深空掃描大獲全勝！量子光波完全覆蓋 ${range} 單位空域，所有隱匿星體座標已全數解密歸檔！`
    };
  }
};
