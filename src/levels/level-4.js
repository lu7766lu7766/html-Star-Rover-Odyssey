/**
 * Level 4: 迷宮巡航與迴圈拼圖
 * 核心概念：for 迴圈結構、重複路徑模組化與演算法最佳化
 */

export const LEVEL_4_STARTER_CODE = `// 迷宮巡航
for (let i = 0; i < ___; i++) {
  rover.moveForward(); // 北上第 1 段
}

rover.turnRight(); // 右轉朝東

for (let j = 0; j < ___; j++) {
  rover.moveForward(); // 東行穿越
}

rover.turnLeft(); // 左轉朝北

for (let k = 0; k < ___; k++) {
  rover.moveForward(); // 北上進駐基地
}
`;

export const LEVEL_4_MAP = {
  gridSize: { width: 6, height: 6 },
  start: { x: 1, y: 0, dir: 0 }, // dir: 0=North(+y), 1=East(+x), 2=South(-y), 3=West(-x)
  target: { x: 4, y: 4 },
  obstacles: [
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
    { x: 0, y: 2 }
  ],
  optimalBlockCount: 5
};

export default {
  id: 4,
  title: '迷宮巡航與迴圈拼圖',
  subtitle: '迴圈結構與路徑最佳化',
  conceptTitle: '擺脫人工重複：用 for 迴圈精簡拼圖路徑',
  concepts: ['for 迴圈', '路徑規劃演算法', '積木最佳化 (Optimal Blocks)'],
  description: `探測船進入了岩石嶙峋的峽谷迷宮！探測船從起點 (1, 0) 朝北出發，前方佈滿能量障礙物，直行將會撞毀。請使用「前進、後退、左轉、右轉」以及「迴圈積木」拼出安全路線，繞過障礙物抵達目標基地 (座標 4, 4)。只要能成功抵達即可通關；把重複前進用 for 迴圈包起來，更可以挑戰最精簡的 5 塊拼圖最佳解！`,
  targetRequirements: [
    '避開所有岩石障礙物與迷宮邊界',
    '成功導航抵達目的地基地 (座標 4, 4)',
    '可以自由使用前進、後退、左轉、右轉拼出路徑 (抵達即通關)',
    '（進階挑戰）善用 for 迴圈包裝重複前進指令，挑戰最優解 5 塊積木'
  ],
  controlType: 'loop-blocks',
  mapConfig: LEVEL_4_MAP,
  initialLoopConfig: {
    // Initial state has only 1 forward step (stops far short of target, prevents auto-pass)
    blocks: [
      { id: 'b-init-1', type: 'FORWARD' }
    ]
  },
  hints: [
    '提示 1【觀察地圖】：從起點 (1, 0) 朝北直行 3 格會撞到 (1, 3) 障礙物。請在 (1, 2) 處向右轉朝東前進！',
    '提示 2【路徑策略】：先向前走 2 格 ➔ 向右轉 ➔ 向前走 3 格 ➔ 向左轉 ➔ 向前走 2 格，剛好能抵達 (4, 4) 目標基地！',
    '提示 3【迴圈最佳化】：連續前進 2 次或 3 次時，可以使用「重複執行 N 次」迴圈積木，把程式積木大幅精簡到 5 塊完成最優解！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：利用 for 迴圈最佳化導航路徑 (只需 5 塊積木)
for (let i = 0; i < 2; i++) {
  rover.moveForward(); // 向前 2 格抵達轉折點
}

rover.turnRight(); // 右轉朝東

for (let i = 0; i < 3; i++) {
  rover.moveForward(); // 向前 3 格穿越安全峽谷
}

rover.turnLeft(); // 左轉朝北

for (let i = 0; i < 2; i++) {
  rover.moveForward(); // 向前 2 格進駐目的地基地！
}`,
  conceptExplanation: `**迴圈 (for loop)** 是程式設計中最核心的抽象能力。當我們需要讓角色連續前進 3 步或 10 步時，不需要重複寫 10 行相同程式碼，只要透過 \`for (let i = 0; i < N; i++)\` 即可高效率完成。在積木程式中，這能讓我們的拼圖數量大幅減少，達成「最優解」！`,
  starterCode: LEVEL_4_STARTER_CODE,
  validate: (runResult) => {
    const map = LEVEL_4_MAP;
    const code = runResult.code || '';
    const apiCalls = runResult.apiCalls || null;

    let blocks = [];
    let flatActions = [];
    let fromCode = false;

    if (apiCalls && Array.isArray(apiCalls)) {
      // 新鏈路：Worker 真跑 JS 的 apiCalls trace
      fromCode = true;
      const apiToAction = {
        'rover.moveForward': 'FORWARD',
        'rover.moveBackward': 'BACKWARD',
        'rover.turnLeft': 'TURN_LEFT',
        'rover.turnRight': 'TURN_RIGHT'
      };
      flatActions = apiCalls
        .map((c, idx) => {
          const action = apiToAction[c.api];
          return action ? { action, sourceBlockId: `code-${idx}` } : null;
        })
        .filter(Boolean);

      if (flatActions.length === 0) {
        return {
          pass: false,
          error: '沒有偵測到任何移動指令！請呼叫 rover.moveForward() / turnRight() / turnLeft()。'
        };
      }
    } else {
      const loopConfig = runResult.loopConfig || runResult || {};
      blocks = loopConfig.blocks || [];
      if (!blocks || blocks.length === 0) {
        return {
          pass: false,
          error: '拼圖序列為空！請從工具箱加入前進、轉彎或迴圈積木，或切到寫碼模式執行。'
        };
      }
      // Expand blocks (including loops) into a flat simulation step sequence
      for (const b of blocks) {
        if (b.type === 'LOOP') {
          const count = Math.max(1, Math.min(b.count || 2, 10));
          const actionType = b.action || 'FORWARD';
          for (let i = 0; i < count; i++) {
            flatActions.push({ action: actionType, sourceBlockId: b.id });
          }
        } else {
          flatActions.push({ action: b.type, sourceBlockId: b.id });
        }
      }
    }

    // Directions: 0=North(dy=+1), 1=East(dx=+1), 2=South(dy=-1), 3=West(dx=-1)
    const DIRS = [
      { dx: 0, dy: 1, name: '北' },
      { dx: 1, dy: 0, name: '東' },
      { dx: 0, dy: -1, name: '南' },
      { dx: -1, dy: 0, name: '西' }
    ];

    let x = map.start.x;
    let y = map.start.y;
    let dir = map.start.dir; // 0 = North

    const isObstacle = (cx, cy) => {
      return map.obstacles.some(ob => ob.x === cx && ob.y === cy);
    };

    let stepCount = 0;
    for (const item of flatActions) {
      stepCount++;
      const act = item.action;

      if (act === 'TURN_LEFT') {
        dir = (dir + 3) % 4;
      } else if (act === 'TURN_RIGHT') {
        dir = (dir + 1) % 4;
      } else if (act === 'FORWARD') {
        const nx = x + DIRS[dir].dx;
        const ny = y + DIRS[dir].dy;

        // Boundary check
        if (nx < 0 || nx >= map.gridSize.width || ny < 0 || ny >= map.gridSize.height) {
          return {
            pass: false,
            error: `超出迷宮邊界！探測船在第 ${stepCount} 步試圖前進至 (${nx}, ${ny})，掉出探勘平台邊緣！`,
            details: { stepCount, position: { x, y }, attempted: { nx, ny } }
          };
        }

        // Obstacle collision check
        if (isObstacle(nx, ny)) {
          return {
            pass: false,
            error: `撞擊岩石障礙物！探測船在第 ${stepCount} 步撞上了座標 (${nx}, ${ny}) 的能量岩石！請重新規劃路徑。`,
            details: { stepCount, collisionAt: { x: nx, y: ny } }
          };
        }

        x = nx;
        y = ny;
      } else if (act === 'BACKWARD') {
        const nx = x - DIRS[dir].dx;
        const ny = y - DIRS[dir].dy;

        if (nx < 0 || nx >= map.gridSize.width || ny < 0 || ny >= map.gridSize.height) {
          return {
            pass: false,
            error: `超出迷宮邊界！探測船在第 ${stepCount} 步後退至 (${nx}, ${ny})，掉出探勘平台邊緣！`,
            details: { stepCount, position: { x, y } }
          };
        }

        if (isObstacle(nx, ny)) {
          return {
            pass: false,
            error: `後退撞擊障礙物！探測船在第 ${stepCount} 步後退撞上了座標 (${nx}, ${ny}) 的岩石！`,
            details: { stepCount, collisionAt: { x: nx, y: ny } }
          };
        }

        x = nx;
        y = ny;
      }
    }

    // Check Destination Arrival
    if (x === map.target.x && y === map.target.y) {
      let blockCount;
      let isOptimal;
      let stars;
      let feedbackMsg = `🎉 導航成功！探測船成功避開所有障礙物，抵達目的地基地 (4, 4)！`;

      if (fromCode) {
        const forCount = (code.match(/for\s*\(/g) || []).length;
        blockCount = forCount + 2; // 2 turns baseline, loops counted via for
        if (forCount >= 3) {
          isOptimal = true;
          stars = 3;
          feedbackMsg += `\n🌟 卓越評價：用了 ${forCount} 個 for 迴圈，完美達成最優解！（3星）`;
        } else if (forCount >= 1) {
          isOptimal = false;
          stars = 2;
          feedbackMsg += `\n✓ 通關合格！用了 ${forCount} 個 for 迴圈（2星），試著把 3 段直行都包成 for 挑戰 3 星最優解！`;
        } else {
          isOptimal = false;
          stars = 1;
          feedbackMsg += `\n✓ 通關合格！但完全沒用 for 迴圈（1星），把重複前進包成 for 可拿 3 星！`;
        }
      } else {
        blockCount = blocks.length;
        isOptimal = blockCount <= map.optimalBlockCount;
        if (isOptimal) {
          stars = 3;
          feedbackMsg += `\n🌟 卓越評價：僅使用了 ${blockCount} 塊積木，完美達成最優解（${map.optimalBlockCount} 塊）！（3星）`;
        } else if (blockCount <= 7) {
          stars = 2;
          feedbackMsg += `\n✓ 通關合格！目前使用 ${blockCount} 塊積木（2星，最優解只需 ${map.optimalBlockCount} 塊，可用迴圈精簡）。`;
        } else {
          stars = 1;
          feedbackMsg += `\n✓ 通關合格！目前使用 ${blockCount} 塊積木（1星，散裝過關，最優解只需 ${map.optimalBlockCount} 塊）。`;
        }
      }

      return {
        pass: true,
        data: {
          finalPos: { x, y },
          blockCount,
          isOptimal,
          stars,
          fromCode,
          flatActions
        },
        feedback: feedbackMsg
      };
    } else {
      const dist = Math.abs(x - map.target.x) + Math.abs(y - map.target.y);
      return {
        pass: false,
        error: `未抵達目的地！探測船目前停在座標 (${x}, ${y})，距離目標基地 (4, 4) 尚差 ${dist} 格。請繼續拼接路徑！`,
        details: { currentPos: { x, y }, targetPos: map.target, distanceRemaining: dist }
      };
    }
  }
};
