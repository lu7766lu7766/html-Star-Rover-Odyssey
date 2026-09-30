/**
 * Level 6: 太空艙控制中心
 * 核心概念：事件與 DOM (Events & DOM - addEventListener)
 */

export const LEVEL_6_STARTER_CODE = `// 太空艙控制中心：把 ___ 補完，再按執行
// 系統會自動依序點擊驗證：先解除警報，再開氣閘
// （也會偷測：警報沒解除就開門，門必須保持關閉！）

const disarmButton = document.querySelector(___);
const airlockButton = document.querySelector(___);
const statusEl = document.querySelector(___);
const doorEl = document.querySelector(___);

let isAlarmActive = true;

disarmButton.addEventListener(___, () => {
  isAlarmActive = false;
  statusEl.textContent = ___;
  statusEl.style.color = ___;
});

airlockButton.addEventListener(___, () => {
  if (!___) {
    doorEl.classList.add(___);
    doorEl.textContent = ___;
  }
});
`;

export default {
  id: 6,
  title: '太空艙控制中心',
  subtitle: '2D 網頁修復任務 · 事件與 DOM',
  conceptTitle: '使用者與網頁的橋樑：事件驅動',
  concepts: ['DOM 元素選擇', '事件監聽器 (addEventListener)', 'textContent / style 即時改寫'],
  description: `太空艙的控制「網頁」當機了！上方 2D 視窗就是一整個故障中的儀表板網頁：警報燈狂閃、氣閘門鎖死。兩顆按鈕「#disarm-btn」與「#airlock-btn」的電線（addEventListener）被拔掉了。請在下方操作區幫它們接回正確的事件（click）與動作，然後親自到 2D 網頁上點擊按鈕，看著 textContent、顏色、艙門 class 即時被你的 JS 改寫！`,
  targetRequirements: [
    '為 #disarm-btn 接回 "click" 事件，觸發「解除安全警報」',
    '為 #airlock-btn 接回 "click" 事件，觸發「解鎖並開啟氣閘」',
    '到上方 2D 網頁親自點擊「解除警報」，看 #status-indicator 轉綠色正常',
    '再點擊「開啟氣閘」，看 #airlock-door 滑開並完成驗證'
  ],
  controlType: 'dom-events',
  initialBindings: {
    disarmBtn: { eventType: 'mouseover', action: 'EMERGENCY_LOCK' },
    airlockBtn: { eventType: 'dblclick', action: 'DISARM_ALARM' }
  },
  availableEvents: ['click', 'mouseover', 'dblclick'],
  availableActions: [
    { id: 'DISARM_ALARM', label: '解除安全警報 (disarmAlarm)' },
    { id: 'OPEN_AIRLOCK', label: '開啟氣閘艙門 (openAirlock)' },
    { id: 'EMERGENCY_LOCK', label: '全艙緊急封鎖 (emergencyLock)' }
  ],
  hints: [
    '提示 1【DOM 與事件】：addEventListener(事件, 回呼) 只是「先幫按鈕接好電線」。上方 2D 網頁按鈕上的 👂 徽章就是目前接的線。',
    '提示 2【動手實驗】：故意把事件改成 mouseover 或 dblclick，再去 2D 網頁懸停 / 雙擊按鈕，看看 click 為何是日常網頁最直覺的選擇。',
    '提示 3【順序有意義】：開門的 JS 裡有 if (!isAlarmActive) 判斷。警報沒解除就開門會被擋下，先解除警報再開門才是正確流程。'
  ],
  jsCodeExample: `// 💡 JavaScript 對照：你在下方接的線，就是這段程式碼
const disarmButton = document.querySelector('#disarm-btn');
const airlockButton = document.querySelector('#airlock-btn');
const statusEl = document.querySelector('#status-indicator');
const doorEl = document.querySelector('#airlock-door');

let isAlarmActive = true;

// 1. 接線：解除警報按鈕
disarmButton.addEventListener('click', () => {
  isAlarmActive = false;
  statusEl.textContent = '系統正常 (NORMAL)'; // ← 直接改網頁文字！
  statusEl.style.color = 'green';             // ← 直接改網頁樣式！
});

// 2. 接線：氣閘門按鈕（含安全判斷）
airlockButton.addEventListener('click', () => {
  if (!isAlarmActive) {
    doorEl.classList.add('open');             // ← 加上 CSS class，門就滑開！
    doorEl.textContent = '氣閘已開啟 (OPEN)';
  } else {
    alert('警報中，安全協議禁止開門！');
  }
});`,
  conceptExplanation: `網頁就是一棵 DOM 樹，每個按鈕、文字、艙門都是一個節點。addEventListener('click', callback) 是「幫節點接電線」：先接好，之後使用者一點擊，瀏覽器就自動跑回呼。本關上方就是一個真的 2D 網頁，你親手接線、親手點擊，親眼看到 textContent、style、class 被改寫——這就是前端工程師每天在做的事！`,
  starterCode: LEVEL_6_STARTER_CODE,
  validate: (runResult) => {
    // 新鏈路：Worker 真跑接線＋模擬兩路點擊的快照
    if (runResult.domWiring) {
      const code = runResult.code || '';
      const wiring = runResult.domWiring || {};
      const correct = runResult.domCorrect;
      const wrong = runResult.domWrong;

      const listensTo = (snap, id, ev) => {
        const types = snap?.[id]?.listenerTypes || [];
        return types.includes(ev);
      };

      if (!listensTo(wiring, 'disarm-btn', 'click')) {
        return {
          pass: false,
          error: '#disarm-btn 沒有接上 click 監聽！請寫 disarmButton.addEventListener(\'click\', ...)（mouseover / dblclick 不算，日常按鈕用點擊）。'
        };
      }
      if (!listensTo(wiring, 'airlock-btn', 'click')) {
        return {
          pass: false,
          error: '#airlock-btn 沒有接上 click 監聽！請寫 airlockButton.addEventListener(\'click\', ...)。'
        };
      }
      if (!correct || !wrong) {
        return {
          pass: false,
          error: '模擬點擊沒有回傳 DOM 快照，請重試一次。'
        };
      }

      const doorOf = (snap) => snap?.['airlock-door'] || {};
      const statusOf = (snap) => snap?.['status-indicator'] || {};
      const isDoorOpen = (door) =>
        (door.classes || []).includes('open') || /OPEN|開啟/.test(door.innerText || '');
      const isStatusNormal = (st) =>
        /NORMAL|正常/.test(st.innerText || '') || /green/i.test(st.style?.color || '');

      // 錯誤順序先驗：警報中開門必須被擋下（守衛判斷）
      if (isDoorOpen(doorOf(wrong))) {
        return {
          pass: false,
          error: '安全協議被繞過！警報還沒解除時點擊開門，門竟然開了。氣閘回呼裡必須先判斷警報狀態（例如 if (!isAlarmActive)），警報中禁止開門！'
        };
      }
      if (!isStatusNormal(statusOf(correct))) {
        return {
          pass: false,
          error: '解除警報沒生效！點擊 #disarm-btn 後，#status-indicator 應該轉為正常（改 textContent 和 style.color 試試）。'
        };
      }
      if (!isDoorOpen(doorOf(correct))) {
        return {
          pass: false,
          error: '氣閘沒開！解除警報後點擊 #airlock-btn，#airlock-door 應該滑開（加上 open class、改文字）。'
        };
      }

      // 星級：用了幾種 DOM 手法
      const apis = ['querySelector', 'getElementById', 'addEventListener', 'textContent', 'style', 'classList']
        .filter((api) => code.includes(api)).length;
      let stars, suffix;
      if (apis >= 4) {
        stars = 3;
        suffix = '（3星：選擇＋監聽＋改寫全用上，完整前端流程！）';
      } else if (apis >= 2) {
        stars = 2;
        suffix = '（2星：過關！再用上 textContent / style / classList 改寫畫面拿 3 星！）';
      } else {
        stars = 1;
        suffix = '（1星：過關但 DOM 手法太少，多用選擇器與改寫 API 拿 3 星！）';
      }
      return {
        pass: true,
        data: { disarmed: true, airlockOpen: true, stars, fromCode: true },
        feedback: `2D 網頁修復成功！接線、點擊、改寫一次到位，警報解除、氣閘滑開，錯誤順序也被安全協議擋下！${suffix}`
      };
    }

    const domState = runResult.domState || {};
    const { bindings = {}, disarmed = false, airlockOpen = false } = domState;

    if (bindings.disarmEvent !== 'click' || bindings.disarmAction !== 'DISARM_ALARM') {
      return {
        pass: false,
        error: '警報按鈕 (#disarm-btn) 的線接錯了！請接回 "click" 事件＋「解除安全警報」，再去 2D 網頁試試點擊 / 懸停的差別。'
      };
    }

    if (bindings.airlockEvent !== 'click' || bindings.airlockAction !== 'OPEN_AIRLOCK') {
      return {
        pass: false,
        error: '氣閘按鈕 (#airlock-btn) 的線接錯了！請接回 "click" 事件＋「開啟氣閘艙門」。'
      };
    }

    if (!disarmed) {
      return {
        pass: false,
        error: '線接對了，但你還沒親手觸發事件！請到上方 2D 網頁點擊「解除警報」，看 #status-indicator 轉綠燈。'
      };
    }

    if (!airlockOpen) {
      return {
        pass: false,
        error: '警報已解除，很棒！但還沒開門。請到上方 2D 網頁點擊「開啟氣閘」，看 #airlock-door 滑開後再提交。'
      };
    }

    return {
      pass: true,
      data: { disarmed, airlockOpen, stars: 2, fromCode: false },
      feedback: `2D 網頁修復成功！你親手接好 addEventListener、親手點擊觸發，#status-indicator 轉綠、#airlock-door 滑開——這就是 JS 操控 DOM 的完整流程！（2星：表單模式上限，切「寫碼」手寫接線拿 3 星）`
    };
  }
};
