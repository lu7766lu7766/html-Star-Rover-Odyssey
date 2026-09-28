/**
 * Level 6: 太空艙控制中心
 * 核心概念：事件與 DOM (Events & DOM - addEventListener)
 */

export default {
  id: 6,
  title: '太空艙控制中心',
  subtitle: '事件與 DOM 互動',
  conceptTitle: '使用者與網頁的橋樑：事件驅動',
  concepts: ['DOM 元素選擇', '事件監聽器 (addEventListener)', '狀態回饋'],
  description: `太空主艙發生氣壓與警報誤觸鎖定！控制台的兩枚實體按鈕「解除警報 (#disarm-btn)」與「氣閘閘門 (#airlock-btn)」尚未綁定事件監聽器。請替元素配置正確的事件型別 (click) 與反應動作，隨後親自點擊操作按鈕，解除警報並開啟通往外層空間的氣閘艙門！`,
  targetRequirements: [
    '為 #disarm-btn 綁定 "click" 點擊事件，觸發「解除安全警報」',
    '為 #airlock-btn 綁定 "click" 點擊事件，觸發「解鎖並開啟氣閘」',
    '在操作面板中親自點擊「解除警報」，確認狀態轉為正常',
    '點擊「開啟氣閘」，完成艙門開啟協議'
  ],
  controlType: 'dom-events',
  initialBindings: {
    disarmBtn: { eventType: 'click', action: 'DISARM_ALARM' },
    airlockBtn: { eventType: 'click', action: 'OPEN_AIRLOCK' }
  },
  availableEvents: ['click', 'mouseover', 'dblclick'],
  availableActions: [
    { id: 'DISARM_ALARM', label: '解除安全警報 (disarmAlarm)' },
    { id: 'OPEN_AIRLOCK', label: '開啟氣閘艙門 (openAirlock)' },
    { id: 'EMERGENCY_LOCK', label: '全艙緊急封鎖 (emergencyLock)' }
  ],
  hints: [
    '提示 1：在網頁上，最常見的互動就是「點擊 (click)」。請將兩個按鈕的事件型態皆設定為 "click"。',
    '提示 2：如果警報尚未解除就強行點擊開啟氣閘，防護系統會為了安全拒絕開門。請先點擊解除警報！',
    '提示 3：綁定完成後，控制台上的按鈕將變為可互動狀態，點擊它們即可觀察指示燈與 3D 閘門變化。'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：透過 DOM 監聽使用者點擊事件
const disarmButton = document.querySelector('#disarm-btn');
const airlockButton = document.querySelector('#airlock-btn');
const statusLight = document.querySelector('#status-indicator');

let isAlarmActive = true;

// 1. 綁定解除警報事件
disarmButton.addEventListener('click', () => {
  isAlarmActive = false;
  statusLight.textContent = '系統正常 (NORMAL)';
  console.log('警報已解除！');
});

// 2. 綁定開啟艙門事件
airlockButton.addEventListener('click', () => {
  if (!isAlarmActive) {
    airlockDoor.open();
    console.log('氣閘艙門已順利開啟！');
  } else {
    alert('警報中，安全協議禁止開門！');
  }
});`,
  conceptExplanation: `網頁原本是靜態的文件（**DOM, 文件物件模型**）。當我們要讓網頁能對使用者的滑鼠、鍵盤做出反應時，就要透過 \`addEventListener('click', callback)\`「監聽」使用者的動作。一旦使用者點了按鈕，瀏覽器就會自動執行我們寫好的反應程式碼！`,
  validate: (runResult) => {
    const domState = runResult.domState || {};
    const { bindings = {}, disarmed = false, airlockOpen = false } = domState;

    if (bindings.disarmEvent !== 'click' || bindings.disarmAction !== 'DISARM_ALARM') {
      return {
        pass: false,
        error: '警報按鈕 (#disarm-btn) 的事件綁定不正確！請綁定 "click" 事件以執行「解除安全警報」。'
      };
    }

    if (bindings.airlockEvent !== 'click' || bindings.airlockAction !== 'OPEN_AIRLOCK') {
      return {
        pass: false,
        error: '氣閘按鈕 (#airlock-btn) 的事件綁定不正確！請綁定 "click" 事件以執行「開啟氣閘艙門」。'
      };
    }

    if (!disarmed) {
      return {
        pass: false,
        error: '按鈕事件已綁定，但尚未在控制面板中點擊「解除警報」！請先點擊該按鈕以平息警報。'
      };
    }

    if (!airlockOpen) {
      return {
        pass: false,
        error: '警報已解除，但尚未點擊「開啟氣閘」！請點擊按鈕開啟氣閘閘門以通關。'
      };
    }

    return {
      pass: true,
      data: { disarmed, airlockOpen },
      feedback: `控制中心事件運作完美！警報成功消除，重型氣閘艙門緩緩升起，通往星際的通道已暢通！`
    };
  }
};
