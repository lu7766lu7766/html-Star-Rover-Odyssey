/**
 * Level 4: 地表深度鑽探
 */

export default {
  id: 4,
  title: '地表深度鑽探',
  subtitle: 'for 迴圈與計數器控制',
  concepts: ['for 迴圈', '計數器變數', '終止條件', '遞增運算子 ++'],
  description: `探測船抵達富含能源水晶的異星地表。地下共有 5 個深度的水晶礦層（深度索引 0 到 4）。請使用 \`for\` 迴圈指揮鑽探機械手臂逐層挖掘，採集全部 5 顆水晶！`,
  targetRequirements: [
    '使用 for 迴圈遍歷深度 0 到 4',
    '依序呼叫 drill.dig(i)',
    '完整採集 5 顆水晶礦石',
    '不可超出深度範圍 (0 ~ 4) 或重複採集相同深度'
  ],
  starterCode: `// 第 4 關：地表深度鑽探
// 請使用 for 迴圈採集地下 5 顆能源水晶（深度索引 0 到 4）

for (let i = 0; i < 5; i++) {
  // TODO: 請在迴圈內呼叫 drill.dig(i) 進行採集
  
}
`,
  availableAPI: [
    'drill.dig(depthIndex: number)'
  ],
  hints: [
    '提示 1：標準 for 迴圈語法：for (let i = 0; i < 5; i++) { ... }。',
    '提示 2：迴圈內呼叫 drill.dig(i)，i 會依序為 0, 1, 2, 3, 4。',
    '提示 3：不要手動複製 5 行程式碼，請務必使用迴圈控制，體會程式自動化的威力！'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const digCalls = (runResult.apiCalls || []).filter(call => call.api === 'drill.dig');
    if (digCalls.length === 0) {
      return { pass: false, error: '未偵測到任何 drill.dig(...) 鑽探呼叫！' };
    }

    const depths = digCalls.map(c => c.args[0]);

    // Check count
    if (depths.length !== 5) {
      return { 
        pass: false, 
        error: `鑽探次數不符！預期採集 5 顆水晶，目前採集了 ${depths.length} 次。` 
      };
    }

    // Check depths are 0, 1, 2, 3, 4
    const expected = [0, 1, 2, 3, 4];
    const isMatched = depths.every((val, idx) => val === expected[idx]);

    if (!isMatched) {
      return { 
        pass: false, 
        error: `採集深度順序錯誤！採集紀錄為 [${depths.join(', ')}]，預期為 [0, 1, 2, 3, 4]。` 
      };
    }

    return {
      pass: true,
      data: { depths },
      feedback: '鑽探手臂運作順暢！成功從地表採集 5 顆高純度能源水晶！'
    };
  }
};
