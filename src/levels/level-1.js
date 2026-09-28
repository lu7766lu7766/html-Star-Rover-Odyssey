/**
 * Level 1: 探測船通電自檢
 * 核心概念：變數宣告與基礎資料型態 (Variables & Data Types: String, Number, Boolean)
 */

export default {
  id: 1,
  title: '探測船通電自檢',
  subtitle: '變數宣告與資料型態',
  conceptTitle: '變數是儲存資料的容器：let 與三大基礎型態',
  concepts: ['變數宣告 (let)', '字串 (String)', '數值 (Number)', '布林值 (Boolean)'],
  description: `歡迎來到奧德賽基地！全新出廠的探測船目前靜止在整備台，系統記憶體處於未配置狀態。請為探測船宣告並初始化 3 個核心狀態變數：設定探測船代號 (字串 String)、調整主系統輸出功率 (數值 Number) 並啟動量子防護力場 (布林值 Boolean)，完成全艦開機通電自檢！`,
  targetRequirements: [
    '宣告 roverName (字串)：為探測船命名 (不可留空或為預設值)',
    '宣告 powerLevel (數值)：調校系統輸出功率至安全標準 (80% ~ 100%)',
    '宣告 shieldActive (布林值)：啟動防護力場開關 (必須為 true)',
    '確認三大變數型態正確，點擊「執行通電自檢」喚醒探測船'
  ],
  controlType: 'variable-declaration',
  initialVariables: {
    roverName: '',
    powerLevel: 0,
    shieldActive: false
  },
  hints: [
    '提示 1【觀念引導】：變數就像貼有標籤的收納盒。宣告變數使用 let，例如 let roverName = "奧德賽號"。',
    '提示 2【型態觀察】：JavaScript 的資料型態包括文字字串 (用引號包覆)、數值 (直接寫數字) 與布林值 (true 或 false)。',
    '提示 3【任務重點】：探測船需要足夠的能源 (至少 80%)，且在深空航行時必須開啟防護罩 (shieldActive 設為 true) 才能通過安全檢測！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：宣告變數並賦予初始值
// 使用 let 關鍵字建立變數，等號 = 表示賦值

let roverName = "奧德賽號";   // 1. 字串 (String)：用引號包裹的文字
let powerLevel = 100;         // 2. 數值 (Number)：數值計算與計量
let shieldActive = true;      // 3. 布林值 (Boolean)：只有 true 或 false

// 將變數傳入探測船自檢系統
rover.systemCheck({ roverName, powerLevel, shieldActive });`,
  conceptExplanation: `**變數 (Variable)** 是程式設計中最基礎也最重要的觀念。它就像電腦記憶體中的「有名字的抽屜」，讓我們可以把字串（文字）、數值（數字）、布林（真/假開關）等資料存起來，隨時在後續的程式邏輯中使用與修改。`,
  validate: (runResult) => {
    const vars = runResult.variables || runResult || {};
    const { roverName = '', powerLevel = 0, shieldActive = false } = vars;

    // 1. Check roverName (String)
    const trimmedName = String(roverName).trim();
    if (!trimmedName || trimmedName === '未命名' || trimmedName === 'UNKNOWN') {
      return {
        pass: false,
        error: '探測船未命名！請在 roverName 輸入有效的船艦代號 (例如 "奧德賽號"、"星馳號")。',
        details: { field: 'roverName', current: trimmedName }
      };
    }

    // 2. Check powerLevel (Number)
    const numPower = Number(powerLevel);
    if (isNaN(numPower) || numPower < 80) {
      return {
        pass: false,
        error: `能源不足！目前 powerLevel 僅為 ${numPower}%，系統最低啟動門檻為 80%。請調高功率數值！`,
        details: { field: 'powerLevel', current: numPower, minRequired: 80 }
      };
    }

    if (numPower > 100) {
      return {
        pass: false,
        error: `電壓超載！目前 powerLevel 為 ${numPower}%，超過反應爐額定上限 (100%)。請避免設備過熱！`,
        details: { field: 'powerLevel', current: numPower, maxLimit: 100 }
      };
    }

    // 3. Check shieldActive (Boolean)
    if (shieldActive !== true) {
      return {
        pass: false,
        error: '防護力場未啟動！深空充滿宇宙射線，shieldActive 必須設定為 true (布林值) 才能通過安全驗證。',
        details: { field: 'shieldActive', current: shieldActive }
      };
    }

    return {
      pass: true,
      feedback: `通電自檢全部通過！探測船「${trimmedName}」系統功率已達 ${numPower}%，電漿防護罩成功激活，全艦進入啟航就緒狀態！`,
      data: {
        roverName: trimmedName,
        powerLevel: numPower,
        shieldActive: true
      }
    };
  }
};
