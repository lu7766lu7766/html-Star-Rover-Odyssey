/**
 * Level 1: 探測船通電自檢
 */

export default {
  id: 1,
  title: '探測船通電自檢',
  subtitle: '變數宣告與基礎資料型態',
  concepts: ['let', 'String', 'Number', 'Boolean', 'typeof'],
  description: `太空艙內探測船處於離線狀態。請宣告船艦名稱、初始電量及啟動狀態，並呼叫 \`rover.setup()\` 完成開機通電自檢。`,
  targetRequirements: [
    '宣告船名 (字串 string)',
    '宣告電量 (1 ~ 100 數字 number)',
    '宣告啟動狀態為 true (布林 boolean)',
    '呼叫 rover.setup(name, battery, isActive)'
  ],
  starterCode: `// 第 1 關：探測船通電自檢
// 請宣告變數並填入對應資料型態

let shipName = "奧德賽號";
let battery = 100;
let isActive = true;

// 呼叫開機 API
rover.setup(shipName, battery, isActive);
`,
  availableAPI: [
    'rover.setup(name: string, battery: number, isActive: boolean)'
  ],
  hints: [
    '提示 1：使用 let 關鍵字宣告變數，字串需要用雙引號或單引號包裹，例如 "奧德賽號"。',
    '提示 2：電量必須是介於 1 到 100 之間的數字（Number）。',
    '提示 3：啟動狀態 isActive 必須設定為布林值 true，探測船引擎才能順利通電點火！'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const setupCall = (runResult.apiCalls || []).find(call => call.api === 'rover.setup');
    if (!setupCall) {
      return { pass: false, error: '未偵測到 rover.setup(...) 呼叫，請呼叫開機 API！' };
    }

    const [name, battery, isActive] = setupCall.args;

    if (typeof name !== 'string' || name.trim() === '') {
      return { pass: false, error: '船艦名稱必須為非空字串 (string)！' };
    }

    if (typeof battery !== 'number' || isNaN(battery) || battery < 1 || battery > 100) {
      return { pass: false, error: '電量數值必須為 1 到 100 之間的數字 (number)！' };
    }

    if (typeof isActive !== 'boolean' || isActive !== true) {
      return { pass: false, error: '啟動狀態 isActive 必須為布林值 true 才能啟動系統！' };
    }

    return {
      pass: true,
      data: { name, battery, isActive },
      feedback: `通電自檢成功！探測船【${name}】核心上線，電量 ${battery}%，引擎已全數就緒！`
    };
  }
};
