/**
 * Level 4: 水晶採集
 * 核心概念：迴圈 (Loops - for)
 */

export default {
  id: 4,
  title: '水晶採集',
  subtitle: '迴圈與重複執行',
  conceptTitle: '擺脫人工重複：用迴圈掌控次數',
  concepts: ['for 迴圈', '計數器變數 (i++)', '重複執行邏輯'],
  description: `探測船在發光的結晶洞穴發現了能量水晶礦脈！此處有 5 顆高純度水晶需要採樣。不需要手動下達 5 次採集指令，請使用「迴圈積木」設定精確的重複次數，並把「機械臂採集」指令放入迴圈主體內，自動化完成採礦作業。`,
  targetRequirements: [
    '設定迴圈重複次數為 5 次',
    '在迴圈內放入「機械臂採集水晶」指令',
    '剛好採滿目標 5 顆能量水晶',
    '避免採集次數過多導致機械臂空抓磨損'
  ],
  controlType: 'loop-blocks',
  initialLoopConfig: {
    loopCount: 3,
    action: 'HARVEST_CRYSTAL'
  },
  availableLoopActions: [
    { id: 'HARVEST_CRYSTAL', label: '機械臂採集水晶', icon: 'Sparkles', description: '伸出機械臂採收一顆水晶並放入貨艙' },
    { id: 'IDLE_WAIT', label: '原地待命冷卻', icon: 'Clock', description: '不做任何動作，空轉一個循環' }
  ],
  targetCrystals: 5,
  hints: [
    '提示 1：礦脈中總共只有 5 顆發光水晶，目標採集數量為 5。',
    '提示 2：把迴圈計數器設定為 5，每次循環就會自動呼叫一次採集指令。',
    '提示 3：若次數小於 5，無法滿足動力艙的最低能源需求；若大於 5，機械爪會抓空岩壁造成設備損壞！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：使用 for 迴圈自動重複 5 次
const targetCrystals = 5;

for (let i = 0; i < targetCrystals; i++) {
  // 每次迴圈執行時，i 的值依序為 0, 1, 2, 3, 4
  mechanicalArm.harvestCrystal();
  console.log(\`已採集第 \${i + 1} 顆能量水晶！\`);
}`,
  conceptExplanation: `**迴圈 (Loop)** 是讓電腦處理重複繁瑣工作的強大神器。不需要複製貼上五行一模一樣的程式碼，只要用 \`for (let i = 0; i < 5; i++)\`，電腦就會自動重複執行大括號中的區塊 5 次，既簡潔又不容易出錯！`,
  validate: (runResult) => {
    const loopConfig = runResult.loopConfig || {};
    const { loopCount = 0, action } = loopConfig;
    const target = 5;

    if (!action || action !== 'HARVEST_CRYSTAL') {
      return {
        pass: false,
        error: '迴圈內尚未配置正確的採集指令！請將「機械臂採集水晶」放入迴圈內。'
      };
    }

    if (loopCount < target) {
      return {
        pass: false,
        error: `採集數量不足！目前迴圈僅執行 ${loopCount} 次，採集到 ${loopCount} 顆水晶，未達到目標 ${target} 顆！`,
        details: { loopCount, harvested: loopCount, target }
      };
    }

    if (loopCount > target) {
      return {
        pass: false,
        error: `次數過多！礦脈中只有 ${target} 顆水晶，迴圈執行了 ${loopCount} 次，機械臂後續空抓岩壁發生磨損！請將次數設為剛好 ${target}。`,
        details: { loopCount, harvested: target, extraEmptyPulls: loopCount - target }
      };
    }

    return {
      pass: true,
      data: { harvested: loopCount },
      feedback: `採礦任務圓滿達成！迴圈精確執行 ${loopCount} 次，成功採集 5 顆晶瑩剔透的能量水晶，能源庫存滿載！`
    };
  }
};
