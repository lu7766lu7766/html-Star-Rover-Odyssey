/**
 * Level 2: 推進力計算
 */

export default {
  id: 2,
  title: '推進力計算',
  subtitle: '算術運算子與運算順序',
  concepts: ['+', '-', '*', '/', '運算優先順序', '變數計算'],
  description: `探測船即將突破大氣層。初始燃料為 500 單位，每次推進消耗 25 單位，共需執行 8 次推進脈衝。請計算剩餘燃料並呼叫 \`rover.launch()\`。`,
  targetRequirements: [
    '設定初始燃料 500',
    '計算消耗燃料：每次 25 單位，共 8 次',
    '計算剩餘燃料 remainingFuel',
    '呼叫 rover.launch(remainingFuel)'
  ],
  starterCode: `// 第 2 關：推進力計算
let initialFuel = 500;
let burnCost = 25;
let burnsCount = 8;

// 請使用算術運算子計算剩餘燃料
let remainingFuel = initialFuel - burnCost * burnsCount;

// 發射推進！
rover.launch(remainingFuel);
`,
  availableAPI: [
    'rover.launch(remainingFuel: number)'
  ],
  hints: [
    '提示 1：先乘除後加減，總消耗燃料為 burnCost * burnsCount（即 25 * 8 = 200）。',
    '提示 2：剩餘燃料為 500 - 200 = 300 單位。',
    '提示 3：呼叫 rover.launch(remainingFuel)，剩餘燃料必須剛好等於 300 才能安全突破引力圈！'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const launchCall = (runResult.apiCalls || []).find(call => call.api === 'rover.launch');
    if (!launchCall) {
      return { pass: false, error: '未偵測到 rover.launch(...) 呼叫！' };
    }

    const [fuel] = launchCall.args;

    if (typeof fuel !== 'number' || isNaN(fuel)) {
      return { pass: false, error: '剩餘燃料必須為數值 (number)！' };
    }

    if (fuel !== 300) {
      return { 
        pass: false, 
        error: `燃料計算錯誤！目前傳入 ${fuel}，預期剩餘燃料為 300 (500 - 25 * 8)。` 
      };
    }

    return {
      pass: true,
      data: { fuel },
      feedback: `推進力計算完美！剩餘燃料 ${fuel} 單位，探測船成功點火突破大氣層！`
    };
  }
};
