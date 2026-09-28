/**
 * Level 7: 無人機編隊
 * 核心概念：陣列與綜合應用 (Arrays & Iteration)
 */

export default {
  id: 7,
  title: '無人機編隊',
  subtitle: '陣列與批次處理',
  conceptTitle: '批次管理成批資料：陣列與迭代',
  concepts: ['陣列 (Array [])', '資料遍歷 (forEach)', '條件篩選 (filter)'],
  description: `巡邏編隊由 4 架不同型號的偵查無人機組成。每架無人機的即時電量資料已存放在「無人機陣列」中。請遍歷陣列中的每架無人機，設定安全電量判斷閾值（< 20%）：讓低電量無人機優先「返航充電」，高電量無人機出發「執行巡邏」，防止無人機在深空因電力耗盡而墜毀！`,
  targetRequirements: [
    '檢視無人機陣列清單資料 (共 4 架無人機)',
    '設定低電量防護閾值為 20%',
    '低電量無人機判定執行「返航充電 (RETURN_BASE)」',
    '高電量無人機判定執行「空域巡邏 (PATROL)」',
    '啟動編隊，確認全員零損傷安全回傳數據'
  ],
  controlType: 'array-fleet',
  dronesData: [
    { id: 'DRONE-01', name: '游隼號', battery: 85, model: 'Recon-X' },
    { id: 'DRONE-02', name: '夜梟號', battery: 15, model: 'Stealth-V' },
    { id: 'DRONE-03', name: '海鵰號', battery: 92, model: 'Heavy-T' },
    { id: 'DRONE-04', name: '雀鷹號', battery: 12, model: 'Scout-M' }
  ],
  hints: [
    '提示 1：觀察清單，DRONE-02 (15%) 與 DRONE-04 (12%) 的電量都低於 20%，若強行出勤將在半途失聯！',
    '提示 2：把安全閾值設定為 20%，並配置判斷：當無人機電量 < 20% 執行「返航充電」，否則執行「空域巡邏」。',
    '提示 3：點擊「執行編隊派遣」後，4 架無人機將在 3D 空域中各自執行分派任務。'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：使用陣列與 forEach 逐一處理無人機
const fleet = [
  { id: "01", name: "游隼號", battery: 85 },
  { id: "02", name: "夜梟號", battery: 15 },
  { id: "03", name: "海鵰號", battery: 92 },
  { id: "04", name: "雀鷹號", battery: 12 }
];

// 遍歷陣列中的每一個物件
fleet.forEach((drone) => {
  if (drone.battery < 20) {
    drone.order = "RETURN_BASE";
    console.log(\`\${drone.name} 電量偏低 (\${drone.battery}%)，已返航！\`);
  } else {
    drone.order = "PATROL";
    console.log(\`\${drone.name} 狀態良好 (\${drone.battery}%)，出發巡邏！\`);
  }
});`,
  conceptExplanation: `當我們需要管理多筆同類型的資料（例如全班學生成績、遊戲中的眾多敵人物件）時，會使用**陣列 (Array)**。陣列就像一排置物櫃，可以用 \`[0], [1], [2]...\` 依序索引，也能透過 \`forEach\` 快速對每一筆資料執行相同的邏輯判斷。`,
  validate: (runResult) => {
    const fleetConfig = runResult.fleetConfig || {};
    const { batteryThreshold = 20, lowBatteryAction, normalBatteryAction, dispatched = false } = fleetConfig;

    if (!dispatched) {
      return {
        pass: false,
        error: '邏輯已配置，但尚未點擊「執行編隊派遣」按鈕以派發任務！'
      };
    }

    if (batteryThreshold < 16) {
      return {
        pass: false,
        error: `安全閾值設為 ${batteryThreshold}% 過低！夜梟號 (15%) 未被攔截而出勤，在半途中斷電墜毀！安全閾值應設為 20%。`
      };
    }

    if (lowBatteryAction !== 'RETURN_BASE') {
      return {
        pass: false,
        error: '低電量無人機的處置行為必須為「返航充電」，不可安排其他任務！'
      };
    }

    if (normalBatteryAction !== 'PATROL') {
      return {
        pass: false,
        error: '電量充足的無人機應分派執行「空域巡邏」以防守空域！'
      };
    }

    return {
      pass: true,
      data: { batteryThreshold, lowBatteryAction, normalBatteryAction },
      feedback: `編隊調度大獲全勝！游隼號與海鵰號完成全域巡邏，低電量的夜梟號與雀鷹號安全回塢充滿能源！`
    };
  }
};
