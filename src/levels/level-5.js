/**
 * Level 5: 外掛模組裝載
 */

export default {
  id: 5,
  title: '外掛模組裝載',
  subtitle: 'JavaScript 物件與 this 關鍵字',
  concepts: ['Object 物件字面值', '屬性與方法', 'this 關鍵字', '模組裝載'],
  description: `探測船需裝載擴充科技模組。請定義一個具有 \`name\`（名稱）、\`range\`（掃描半徑）屬性與 \`activate\` 方法的物件，並使用 \`this.range\` 回傳掃描半徑，最後透過 \`rover.installModule()\` 完成安裝！`,
  targetRequirements: [
    '定義物件具有 name 屬性 (字串)',
    '定義物件具有 range 屬性 (大於 0 之數字)',
    '定義 activate 方法，透過 this.range 回傳半徑數值',
    '呼叫 rover.installModule(moduleObject)'
  ],
  starterCode: `// 第 5 關：外掛模組裝載
// 請定義雷達掃描儀物件 scanModule，需包含：
// 1. name: 模組名稱 (非空字串，例如 "星環雷達掃描儀")
// 2. range: 掃描半徑 (大於 0 之數字，例如 30)
// 3. activate(): 方法函式，透過 this.range 回傳半徑數值

const scanModule = {
  // TODO: 定義 name, range 與 activate() 方法
  
};

// 裝載模組到探測船
rover.installModule(scanModule);
`,
  availableAPI: [
    'rover.installModule(moduleObject: { name: string, range: number, activate: () => number })'
  ],
  hints: [
    '提示 1：JavaScript 物件由大括號 {} 包裹，鍵值對之間以冒號 : 分隔。',
    '提示 2：在物件方法內部，可使用 this 關鍵字存取自身屬性，例如 return this.range;。',
    '提示 3：呼叫 rover.installModule(scanModule) 將物件傳入系統安裝插槽。'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const installCall = (runResult.apiCalls || []).find(call => call.api === 'rover.installModule');
    if (!installCall) {
      return { pass: false, error: '未偵測到 rover.installModule(...) 呼叫！' };
    }

    const mod = installCall.args?.[0];
    if (!mod || typeof mod !== 'object') {
      return { pass: false, error: '傳入的模組必須為 JavaScript 物件！' };
    }

    if (!mod.name || typeof mod.name !== 'string' || mod.name.trim() === '') {
      return { pass: false, error: '模組物件必須包含非空字串屬性 name！' };
    }

    if (typeof mod.range !== 'number' || isNaN(mod.range) || mod.range <= 0) {
      return { pass: false, error: '模組物件必須包含大於 0 的數字屬性 range！' };
    }

    if (!mod.hasActivate) {
      return { pass: false, error: '模組物件必須定義 activate() 方法函式！' };
    }

    if (mod.activateResult !== mod.range) {
      return { 
        pass: false, 
        error: `activate() 方法執行回傳值為 ${mod.activateResult}，未正確回傳 this.range (${mod.range})！` 
      };
    }

    return {
      pass: true,
      data: { module: mod },
      feedback: `模組【${mod.name}】裝載成功！掃描半徑 ${mod.range} 公里，全息雷達啟動旋轉！`
    };
  }
};
