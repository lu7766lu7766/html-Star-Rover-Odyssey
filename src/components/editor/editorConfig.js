/**
 * Star Rover Odyssey - CodeMirror 6 Configuration & Level Autocompletions
 */

import { autocompletion } from '@codemirror/autocomplete';

/**
 * Custom level-specific completions for high school students
 */
export function createLevelCompletions(levelId) {
  const commonCompletions = [
    { label: 'console.log', type: 'function', detail: '(data) 印出除錯訊息', apply: 'console.log();' },
    { label: 'let', type: 'keyword', detail: '宣告變數' },
    { label: 'const', type: 'keyword', detail: '宣告常數' },
    { label: 'for', type: 'keyword', detail: '迴圈控制', apply: 'for (let i = 0; i < 5; i++) {\n  \n}' },
    { label: 'if', type: 'keyword', detail: '條件判斷', apply: 'if () {\n  \n}' }
  ];

  const levelSpecific = {
    1: [
      { label: 'rover.setup', type: 'function', detail: '(name, battery, isActive) 探測船通電開機', apply: 'rover.setup(shipName, battery, isActive);' }
    ],
    2: [
      { label: 'rover.launch', type: 'function', detail: '(remainingFuel) 推進發射', apply: 'rover.launch(remainingFuel);' }
    ],
    3: [
      { label: 'rover.setAutoPilot', type: 'function', detail: '(callback) 註冊避障邏輯函式', apply: 'rover.setAutoPilot(autoPilot);' },
      { label: 'distance', type: 'variable', detail: '雷達探測之障礙物距離' },
      { label: '"STOP"', type: 'constant', detail: '煞車停止' },
      { label: '"SLOW_DOWN"', type: 'constant', detail: '減速通過' },
      { label: '"FULL_SPEED"', type: 'constant', detail: '全速前進' }
    ],
    4: [
      { label: 'drill.dig', type: 'function', detail: '(depthIndex) 執行指定深度鑽探', apply: 'drill.dig(i);' }
    ],
    5: [
      { label: 'rover.installModule', type: 'function', detail: '(moduleObject) 安裝科技模組', apply: 'rover.installModule(scanModule);' },
      { label: 'this.range', type: 'property', detail: '存取模組掃描半徑' }
    ],
    6: [
      { label: 'document.getElementById', type: 'function', detail: '(id) 取得指定 DOM 元素', apply: 'document.getElementById("");' },
      { label: 'addEventListener', type: 'method', detail: '("click", callback) 綁定事件監聽器', apply: 'addEventListener("click", function() {\n  \n});' },
      { label: 'innerText', type: 'property', detail: '設定或讀取元素文字內容' },
      { label: 'style.color', type: 'property', detail: '設定元素文字顏色' }
    ],
    7: [
      { label: 'drones', type: 'variable', detail: 'Array<Drone> 無人機遙測資料陣列' },
      { label: 'droneFleet.deploy', type: 'function', detail: '(drones) 部署無人機編隊', apply: 'droneFleet.deploy(drones);' },
      { label: 'drone.battery', type: 'property', detail: '無人機電量百分比' },
      { label: 'drone.status', type: 'property', detail: '設定為 "PATROL" 或 "WARNING"' }
    ]
  };

  const currentLevelOptions = levelSpecific[levelId] || [];

  return autocompletion({
    override: [
      (context) => {
        const word = context.matchBefore(/[\w.]*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        return {
          from: word.from,
          options: [...currentLevelOptions, ...commonCompletions]
        };
      }
    ]
  });
}
