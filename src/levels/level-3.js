/**
 * Level 3: 隕石避障
 * 核心概念：條件判斷 (Conditionals - if / else if / else)
 */

export default {
  id: 3,
  title: '隕石避障',
  subtitle: '條件判斷',
  conceptTitle: '讓程式依不同情況做決定：if / else',
  concepts: ['條件判斷', '邏輯比較 (<, <=, >)', '分支決策'],
  description: `前方進入密集小行星亂石流！雷達感測器會持續回傳與前方隕石的「即時距離」。請為探測船的自動導航系統設定條件邏輯，根據距離做出正確的安全決策：極度接近時緊急煞停、近距離時減速觀察、遠距離時全速巡航。`,
  targetRequirements: [
    '設定條件 1：若距離 < 5，執行「停止 (STOP)」避免撞毀',
    '設定條件 2：若距離 < 15，執行「減速巡航 (SLOW_DOWN)」謹慎通過',
    '設定預設分支 (否則)：執行「全速前進 (FULL_SPEED)」維持前進動能'
  ],
  controlType: 'condition-builder',
  conditionRules: {
    rule1: { threshold: 5, action: 'STOP' },
    rule2: { threshold: 15, action: 'SLOW_DOWN' },
    fallbackAction: 'FULL_SPEED'
  },
  availableActions: [
    { id: 'STOP', label: '停止避碰 (STOP)', tag: 'danger' },
    { id: 'SLOW_DOWN', label: '減速慢行 (SLOW_DOWN)', tag: 'warning' },
    { id: 'FULL_SPEED', label: '全速前進 (FULL_SPEED)', tag: 'success' }
  ],
  testDistances: [3, 10, 22],
  hints: [
    '提示 1：當距離小於 5 時，隕石已經近在眼前！必須立刻「停止」否則會發生撞擊。',
    '提示 2：當距離在 5 到 15 之間時，減速慢行是最佳避障策略。',
    '提示 3：如果距離大於 15（進入 else 否則分支），前方視野開闊，可以放心「全速前進」。',
    '提示 4：注意檢查小於 (<) 的數值設定是否符合題目要求！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：多重條件判斷
function autoPilotDecision(distance) {
  if (distance < 5) {
    // 距離極近：緊急停止
    return 'STOP';
  } else if (distance < 15) {
    // 距離接近：減速巡航
    return 'SLOW_DOWN';
  } else {
    // 安全開闊：全速前進
    return 'FULL_SPEED';
  }
}`,
  conceptExplanation: `**條件判斷 (Conditional)** 是程式具備「智慧」的基石。透過 \`if\`、\`else if\` 與 \`else\`，電腦能檢視環境數據（例如距離、電量、分數），並根據比較的結果自動走進不同的處理分支，做出最佳反應。`,
  validate: (runResult) => {
    const rules = runResult.rules || {};
    const { rule1Threshold, rule1Action, rule2Threshold, rule2Action, fallbackAction } = rules;

    // Simulation helper based on user input rules
    function evaluate(dist) {
      if (dist < rule1Threshold) return rule1Action;
      if (dist < rule2Threshold) return rule2Action;
      return fallbackAction;
    }

    const testCases = [
      { dist: 3, expected: 'STOP', reason: '距離 3（極近距離），應緊急煞停避免撞擊！' },
      { dist: 10, expected: 'SLOW_DOWN', reason: '距離 10（警戒範圍），應減速巡航謹慎通過！' },
      { dist: 22, expected: 'FULL_SPEED', reason: '距離 22（安全距離），應全速前進！' }
    ];

    for (const test of testCases) {
      const actual = evaluate(test.dist);
      if (actual !== test.expected) {
        return {
          pass: false,
          error: `在測距為 ${test.dist} 單位時，探測船選擇了【${actual || '未指定'}】，但正確行為應為【${test.expected}】。原因：${test.reason}`,
          details: { dist: test.dist, actual, expected: test.expected }
        };
      }
    }

    return {
      pass: true,
      data: { rules },
      feedback: `避障邏輯測試全數通過！探測船在所有測距情境（3、10、22 單位）皆做出完美決策，順利穿越隕石帶！`
    };
  }
};
