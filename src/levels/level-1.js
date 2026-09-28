/**
 * Level 1: 探測船啟航
 * 核心概念：指令與執行順序 (Sequencing & Commands)
 */

export default {
  id: 1,
  title: '探測船啟航',
  subtitle: '指令與執行順序',
  conceptTitle: '程式的本質：依序執行的指令序列',
  concepts: ['指令調用', '執行順序', '演算法步驟'],
  description: `歡迎來到奧德賽基地！探測船目前靜止在停機坪上。請從指令庫中挑選合適的指令，依照正確的步驟順序排入執行隊列，操作探測船啟動引擎、避開前方障礙物並安全抵達目標站點。`,
  targetRequirements: [
    '第一步必須「啟動引擎」讓動力上線',
    '規劃路徑避開中途碎石屏障',
    '順利抵達發光的目標停機坪',
    '最後呼叫「停止」以鎖定泊位'
  ],
  controlType: 'command-sequence',
  availableCommands: [
    { id: 'START_ENGINE', label: '啟動引擎', icon: 'Power', description: '激活主發電機與推進器' },
    { id: 'MOVE_FORWARD', label: '前進一格', icon: 'ArrowUp', description: '沿當前朝向前進一個座標單位' },
    { id: 'TURN_LEFT', label: '向左轉', icon: 'RotateCcw', description: '逆時針旋轉 90 度' },
    { id: 'TURN_RIGHT', label: '向右轉', icon: 'RotateCw', description: '順時針旋轉 90 度' },
    { id: 'STOP', label: '停止', icon: 'Square', description: '切斷動力煞停在泊位' }
  ],
  hints: [
    '提示 1：任何機械運作前，都必須先「啟動引擎」！若未啟動就下達移動指令，探測船將無法動彈。',
    '提示 2：正前方 (0, 1) 有巨大隕石！起跑後不要直接前進，請先「向右轉」再前進以繞行。',
    '提示 3：一組標準通關序列：啟動引擎 ➔ 向右轉 ➔ 前進 ➔ 向左轉 ➔ 前進 ➔ 前進 ➔ 前進 ➔ 向左轉 ➔ 前進 ➔ 停止。',
    '提示 4：抵達終點 (0, 3) 後，務必加上「停止」指令才能穩固停靠！'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：函式呼叫順序
// 每一行程式碼都會由上而下依序執行

engine.start();       // 1. 啟動引擎
rover.turnRight();    // 2. 向右轉 (避開前方障礙)
rover.moveForward();  // 3. 前進到旁道
rover.turnLeft();     // 4. 向左轉 (面朝目標方向)
rover.moveForward();  // 5. 前進
rover.moveForward();  // 6. 前進
rover.moveForward();  // 7. 前進到目標同緯度
rover.turnLeft();     // 8. 向左轉 (面朝目標)
rover.moveForward();  // 9. 切入目標泊位
rover.stop();         // 10. 停靠目的地`,
  conceptExplanation: `在電腦科學中，**演算法 (Algorithm)** 是一系列明確且有順序的運算步驟。電腦非常嚴謹，會忠實地由上而下「依序」執行我們給它的每一個指令。如果順序顛倒（例如還沒開引擎就踩油門），程式便無法如期運作。`,
  validate: (runResult) => {
    const sequence = runResult.sequence || [];
    if (!sequence || sequence.length === 0) {
      return { pass: false, error: '執行隊列中沒有任何指令，請點擊或拖曳指令卡排入隊列！' };
    }

    if (sequence[0] !== 'START_ENGINE') {
      return { pass: false, error: '探測船未開機！第一個指令必須是「啟動引擎」。' };
    }

    // Grid simulation
    let x = 0;
    let y = 0;
    let dir = 0; // 0: +Y (forward), 1: +X (right), 2: -Y (backward), 3: -X (left)
    const obstacles = [{ x: 0, y: 1 }, { x: 0, y: 2 }];
    const target = { x: 0, y: 3 };

    let crashed = false;
    let crashPos = null;

    for (let i = 1; i < sequence.length; i++) {
      const cmd = sequence[i];
      if (cmd === 'TURN_LEFT') {
        dir = (dir + 3) % 4;
      } else if (cmd === 'TURN_RIGHT') {
        dir = (dir + 1) % 4;
      } else if (cmd === 'MOVE_FORWARD') {
        if (dir === 0) y += 1;
        else if (dir === 1) x += 1;
        else if (dir === 2) y -= 1;
        else if (dir === 3) x -= 1;

        if (obstacles.some(o => o.x === x && o.y === y)) {
          crashed = true;
          crashPos = { x, y };
          break;
        }
      } else if (cmd === 'STOP') {
        break;
      }
    }

    if (crashed) {
      return {
        pass: false,
        error: `撞上碎石障礙區 (座標: ${crashPos.x}, ${crashPos.y})！請及早轉彎繞行。`,
        details: { finalPos: crashPos, crashed: true }
      };
    }

    const reachedTarget = (x === target.x && y === target.y);
    const hasStop = sequence.includes('STOP');

    if (!reachedTarget) {
      return {
        pass: false,
        error: `探測船停在座標 (${x}, ${y})，尚未抵達目標停機坪 (座標: ${target.x}, ${target.y})。請檢查路徑步數！`,
        details: { finalPos: { x, y }, reachedTarget: false }
      };
    }

    if (!hasStop) {
      return {
        pass: false,
        error: '已抵達停機坪，但隊列末尾缺少「停止」指令，探測船無法鎖定泊位！',
        details: { finalPos: { x, y }, reachedTarget: true }
      };
    }

    return {
      pass: true,
      data: { finalPos: { x, y }, steps: sequence.length },
      feedback: `啟航任務大成功！探測船順利避開障礙物，精準停靠目標泊位 (${x}, ${y})！`
    };
  }
};
