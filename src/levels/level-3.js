/**
 * Level 3: 雷達自主避障
 */

export default {
  id: 3,
  title: '雷達自主避障',
  subtitle: '條件判斷與邏輯運算子',
  concepts: ['if', 'else if', 'else', '&&', '比較運算子'],
  description: `前方小行星帶地形險峻，請撰寫自動導航函式。雷達將回傳障礙物距離 (distance)，依照距離做出正確航行決策：
- 小於 5 單位：回傳 "STOP"（煞車緊急停止）
- 5 到 15 單位（含）：回傳 "SLOW_DOWN"（減速通過）
- 大於 15 單位：回傳 "FULL_SPEED"（全速前進）`,
  targetRequirements: [
    '定義包含 distance 參數的導航回呼函式',
    'distance < 5 時回傳 "STOP"',
    'distance >= 5 且 <= 15 時回傳 "SLOW_DOWN"',
    'distance > 15 時回傳 "FULL_SPEED"',
    '呼叫 rover.setAutoPilot(pilotFunction)'
  ],
  starterCode: `// 第 3 關：雷達自主避障
// 請撰寫避障邏輯函式

function autoPilot(distance) {
  if (distance < 5) {
    return "STOP";
  } else if (distance <= 15) {
    return "SLOW_DOWN";
  } else {
    return "FULL_SPEED";
  }
}

// 註冊自動導航
rover.setAutoPilot(autoPilot);
`,
  availableAPI: [
    'rover.setAutoPilot(callback: (distance: number) => "STOP" | "SLOW_DOWN" | "FULL_SPEED")'
  ],
  hints: [
    '提示 1：使用 if (distance < 5) 判斷極度危險距離。',
    '提示 2：使用 else if (distance <= 15) 或 (distance >= 5 && distance <= 15) 判斷緩衝距離。',
    '提示 3：字串大小寫必須精確為 "STOP"、"SLOW_DOWN" 與 "FULL_SPEED"。'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const autoPilotCall = (runResult.apiCalls || []).find(call => call.api === 'rover.setAutoPilot');
    if (!autoPilotCall) {
      return { pass: false, error: '未偵測到 rover.setAutoPilot(...) 呼叫！' };
    }

    if (!autoPilotCall.isFunction) {
      return { pass: false, error: 'rover.setAutoPilot 必須傳入一個函式 (Function) 作為參數！' };
    }

    if (autoPilotCall.fnError) {
      return { pass: false, error: `導航函式執行時拋出異常: ${autoPilotCall.fnError}` };
    }

    const res = autoPilotCall.testResults;
    if (!res) {
      return { pass: false, error: '無法讀取導航測試結果' };
    }

    // Test distance = 3
    if (res[3] !== 'STOP') {
      return { pass: false, error: `測試距離 3 單位失敗：預期回傳 "STOP"，實際回傳 "${res[3]}"` };
    }

    // Test distance = 10
    if (res[10] !== 'SLOW_DOWN') {
      return { pass: false, error: `測試距離 10 單位失敗：預期回傳 "SLOW_DOWN"，實際回傳 "${res[10]}"` };
    }

    // Test distance = 20
    if (res[20] !== 'FULL_SPEED') {
      return { pass: false, error: `測試距離 20 單位失敗：預期回傳 "FULL_SPEED"，實際回傳 "${res[20]}"` };
    }

    return {
      pass: true,
      data: { testResults: res },
      feedback: '雷達自主避障邏輯全部通過測試！探測船成功穿越未知小行星帶！'
    };
  }
};
