/**
 * Level 6: 太空艙控制中心
 * 核心概念：事件與 DOM (Events & DOM - addEventListener)
 */

export const LEVEL_6_STARTER_CODE = `// 太空艙控制中心：把下面 ___ 補完，再按「執行 JS 並模擬點擊」
// ------------------------------------------------------------
// 【情境】2D 儀表板網頁上有 4 個元素：解除警報按鈕、氣閘按鈕、狀態燈、氣閘艙門
//  每個元素的 id 都寫在 2D 網頁該元素上方的 <code> 標籤裡，右側 DevTools 也有 DOM TREE 即時預覽
// 【驗證】系統自動兩路點擊：(1)先解除警報再開門→艙門必須滑開；(2)警報中直接開門→艙門必須保持關閉（守衛判斷）
// 【觀念】querySelector 選元素；addEventListener 接事件線；回呼裡用 textContent / style / classList 改寫畫面
// 【找答案】正確字串都不用背，都藏在 2D 網頁裡：元素 id、含 NORMAL 的狀態文字、正常燈號顏色、艙門的 class 提示

// —— 第 1 步：選取 4 個元素 ——
// TODO: 把 4 個 ___ 換成對應的 CSS 選擇器（字串加引號，id 前面加 #）
//  - 去 2D 網頁找：每顆按鈕／狀態燈／艙門上方都有 <code> 標籤寫著它的 id
//  - 順序不可調換：第 1 行必須是解除警報按鈕，第 2 行是氣閘按鈕，第 3 行是狀態燈，第 4 行是艙門

const disarmButton = document.querySelector(___);
const airlockButton = document.querySelector(___);
const statusEl = document.querySelector(___);
const doorEl = document.querySelector(___);

let isAlarmActive = true;

// —— 第 2 步：解除警報回呼 ——
// TODO: 把 3 個 ___ 補完
//  - 事件：日常按鈕最直覺的是哪一種？（三選一：click / mouseover / dblclick）
//  - 狀態文字：改成「正常」的顯示（去 2D 網頁狀態燈找含 NORMAL 的那一行，整行照抄，含中文與括號）
//  - 燈號顏色：警報是紅燈，正常應該轉什麼顏色的燈？（去 2D 網頁狀態燈或 DevTools 找）

disarmButton.addEventListener(___, () => {
  isAlarmActive = false;
  statusEl.textContent = ___;
  statusEl.style.color = ___;
});

// —— 第 3 步：氣閘開門回呼（含守衛判斷） ——
// TODO: 把 4 個 ___ 補完
//  - 事件：跟第 2 步一樣，日常按鈕用哪一種？
//  - if 條件：只有「警報已經解除」才能開門。isAlarmActive 為 true 表示警報中，為 false 表示已解除，條件該怎麼寫才會在「已解除」時放行？
//  - 艙門 class：加上讓門滑開的 CSS class（去 2D 艙門區找「classList 已加 …」的提示，或看 DevTools DOM TREE 裡艙門的 class）
//  - 艙門文字：改成「已開啟」的顯示（去 2D 網頁找含 OPEN 的那一行，整行照抄）

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
    '用 querySelector 選取 4 個元素：解除警報按鈕、氣閘按鈕、狀態燈 #status-indicator、艙門 #airlock-door（id 寫在 2D 網頁各元素上方）',
    '為兩顆按鈕接回 "click" 事件（日常按鈕最直覺的選擇，mouseover / dblclick 不算）',
    '解除警報回呼：把 isAlarmActive 改為 false，並改寫狀態燈文字與顏色（正常顯示去 2D 網頁找）',
    '氣閘回呼：先用 if 守衛判斷「警報已解除」才放行，再為艙門加上滑開用的 CSS class 並改寫門文字（class 名去 2D 艙門區找）',
    '通過兩路驗證：正常順序（先解除再開門）艙門滑開；警報中直接開門，艙門必須保持關閉'
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
    '提示 1【DOM 與事件】：addEventListener(事件, 回呼) 只是「先幫按鈕接好電線」。querySelector 則是用 CSS 選擇器把元素選出來，id 選擇器寫法是加引號、# 開頭，id 本尊寫在 2D 網頁每個元素上方的 <code> 標籤裡。',
    '提示 2【動手實驗】：故意把事件改成 mouseover 或 dblclick 再執行，看看報錯怎麼說。日常網頁按鈕最直覺的就是 click，驗證只認 click。',
    '提示 3【順序有意義】：開門的 JS 裡有 if (!isAlarmActive) 守衛判斷。警報沒解除（變數仍為 true）就開門會被擋下，先解除警報讓變數變 false 再開門才是正確流程。',
    '提示 4【字串去哪找】：狀態燈文字、燈號顏色、艙門 class 名都不用背——2D 網頁上都寫著：狀態卡顯示正常時的文字與顏色，氣閘按鈕下方小字會顯示「classList 已加 …」的提示，右側 DevTools 的 DOM TREE 也會即時顯示艙門目前的 class。照著填進 ___ 即可。'
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
