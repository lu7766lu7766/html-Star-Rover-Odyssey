/**
 * Level 2: 能源補給站
 * 核心概念：變數與參數 (Variables & Parameters)
 */

export default {
  id: 2,
  title: '能源補給站',
  subtitle: '變數與參數',
  conceptTitle: '變數保存資料，參數決定行為',
  concepts: ['變數宣告 (let/const)', '函式傳參', '數值運算'],
  description: `探測船需要進行長途軌道轉移以抵達懸浮能源站。平台距離為 24 單位。請調整推進器的「初始燃料」、「每次消耗量」、「推進次數」與「推力速度」參數。注意：若推力速度過猛 (> 3) 會撞毀降落架，燃料不足則會半途熄火！`,
  targetRequirements: [
    '設定充足的初始燃料 (建議 >= 300 單位)',
    '推進總位移 (推進次數 × 速度) 必須剛好等於 24 單位',
    '剩餘燃料必須大於等於 0 (不可耗盡熄火)',
    '進入平台時速度必須 <= 3 (平穩安全著陸)'
  ],
  controlType: 'parameter-adjuster',
  initialParams: {
    initialFuel: 150,
    burnPerThrust: 30,
    thrustCount: 3,
    speed: 2
  },
  paramRanges: {
    initialFuel: { min: 100, max: 500, step: 20, unit: '單位' },
    burnPerThrust: { min: 10, max: 50, step: 5, unit: '單位/次' },
    thrustCount: { min: 1, max: 12, step: 1, unit: '次' },
    speed: { min: 1, max: 6, step: 1, unit: '米/次' }
  },
  hints: [
    '提示 1【變數與運算】：在 JavaScript 中，變數可以參與四則運算。例如總位移等於「推進次數 × 推力速度 (thrustCount * speed)」。',
    '提示 2【物理規則觀察】：目標補給平台距離正好為 24 單位。若總位移大於 24 會衝過平台，小於 24 則無法抵達；同時總燃料消耗不可超過初始燃料。',
    '提示 3【引導式思考】：安全著陸規範要求速度必須 <= 3 米/次。試思考：在推力速度為 3 的安全標準下，推進次數需要幾次，相乘才會剛好是 24？'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：變數儲存數值，傳入函式當作參數
let initialFuel = 300;     // 初始燃料變數
const burnRate = 25;       // 每次推進消耗 (常數)
const count = 8;           // 推進次數
const speed = 3;           // 巡航速度

// 計算推進總消耗與總位移
let totalBurn = burnRate * count;
let remainingFuel = initialFuel - totalBurn;
let distance = count * speed; // 8 * 3 = 24

// 將計算好的參數傳入推進控制函式
rover.approachStation({ distance, speed, remainingFuel });`,
  conceptExplanation: `在程式中，**變數 (Variable)** 就像貼有標籤的收納盒，用來暫存各種類型的資料（例如燃料量、速度）。而當我們呼叫功能時，傳入的數值稱為**參數 (Argument / Parameter)**，它會直接影響函式內部的運算結果與角色的物理行為。`,
  validate: (runResult) => {
    const params = runResult.params || {};
    const { initialFuel = 0, burnPerThrust = 0, thrustCount = 0, speed = 0 } = params;

    const totalConsumption = burnPerThrust * thrustCount;
    const remainingFuel = initialFuel - totalConsumption;
    const totalDistance = thrustCount * speed;
    const targetDistance = 24;

    if (totalConsumption > initialFuel) {
      return {
        pass: false,
        error: `燃料耗盡！總消耗 ${totalConsumption} 單位大於初始燃料 ${initialFuel} 單位，推進器在半空中熄火！`,
        details: { remainingFuel, totalDistance }
      };
    }

    if (totalDistance < targetDistance) {
      return {
        pass: false,
        error: `推力不足！目前總位移僅 ${totalDistance} 單位，尚未到達距離 ${targetDistance} 的補給平台。`,
        details: { remainingFuel, totalDistance }
      };
    }

    if (totalDistance > targetDistance) {
      return {
        pass: false,
        error: `推力過多！總位移 ${totalDistance} 單位衝過了補給平台 (${targetDistance} 單位)！`,
        details: { remainingFuel, totalDistance }
      };
    }

    if (speed > 3) {
      return {
        pass: false,
        error: `著陸速度過猛！目前速度為 ${speed}（安全上限為 3），探測船劇烈撞擊停機坪！請降低推力速度並增加次數。`,
        details: { remainingFuel, totalDistance, speed }
      };
    }

    return {
      pass: true,
      data: { remainingFuel, totalDistance, speed },
      feedback: `著陸大成功！推進總位移精準達到 24 單位，剩餘燃料 ${remainingFuel} 單位，平穩降落能源補給平台！`
    };
  }
};
