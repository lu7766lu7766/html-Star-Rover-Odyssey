/**
 * Level 6: 控制中心面板
 */

export default {
  id: 6,
  title: '控制中心面板',
  subtitle: 'DOM 操作與事件監聽',
  concepts: ['document.getElementById', 'innerText', 'style.color', 'addEventListener'],
  description: `太空站主機密門處於緊急鎖定。請獲取控制按鈕 \`btn-unlock\` 與狀態標籤 \`status\`，為按鈕綁定點擊事件 (\`addEventListener\`)。點擊時將狀態文字更新為 "已解鎖" 並將顏色設定為 "green"，開啟液壓氣密門！`,
  targetRequirements: [
    '透過 document.getElementById("btn-unlock") 取得按鈕',
    '透過 document.getElementById("status") 取得狀態顯示元素',
    '使用 btn.addEventListener("click", callback) 綁定點擊事件',
    '點擊觸發時將 status.innerText 改為 "已解鎖" (或包含解鎖)',
    '點擊觸發時將 status.style.color 改為 "green"'
  ],
  starterCode: `// 第 6 關：控制中心面板
// 1. 取得 DOM 控制元素
const unlockButton = document.getElementById("btn-unlock");
const statusLabel = document.getElementById("status");

// TODO: 使用 addEventListener 為 unlockButton 綁定 "click" 點擊事件
// 點擊觸發時：
// 1. 將 statusLabel.innerText 改為 "已解除鎖定"
// 2. 將 statusLabel.style.color 改為 "green"
`,
  availableAPI: [
    'document.getElementById(id: string)',
    'element.innerText: string',
    'element.style.color: string',
    'element.addEventListener("click", callback: Function)'
  ],
  hints: [
    '提示 1：使用 document.getElementById("btn-unlock") 取得按鈕元素。',
    '提示 2：使用 unlockButton.addEventListener("click", function() { ... }) 監聽滑鼠點擊。',
    '提示 3：在點擊函式內，將 statusLabel.innerText 設定為 "已解除鎖定"，並將 statusLabel.style.color = "green"。'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const domState = runResult.domState || {};
    const btn = domState['btn-unlock'];
    const status = domState['status'];

    if (!btn || !btn.hasListener) {
      return { 
        pass: false, 
        error: '未偵測到按鈕點擊監聽器！請為 "btn-unlock" 綁定 addEventListener("click", ...)。' 
      };
    }

    // Now check status after simulated or triggered click
    // Note: status might be modified either by simulated event dispatch or student direct code
    const isUnlockedText = status?.innerText && (
      status.innerText.includes('解鎖') ||
      status.innerText.includes('解除') ||
      status.innerText.includes('開啟') ||
      status.innerText.includes('PASS') ||
      status.innerText.includes('正常')
    );

    const isGreenColor = status?.style?.color && (
      status.style.color.toLowerCase() === 'green' ||
      status.style.color.toLowerCase() === '#10b981' ||
      status.style.color.toLowerCase() === '#00ff00' ||
      status.style.color.toLowerCase() === 'rgb(0, 255, 0)'
    );

    if (!isUnlockedText || !isGreenColor) {
      return {
        pass: false,
        error: `按鈕已註冊監聽，但尚未觸發或文字/顏色不符。目前文字："${status?.innerText}"，顏色："${status?.style?.color}"。請點擊右側面板的按鈕或確認事件處理函式內更新了 innerText 與 style.color = "green"！`
      };
    }

    return {
      pass: true,
      data: { statusText: status.innerText, color: status.style.color },
      feedback: '安全防護解除！狀態指示燈轉綠，液壓氣密門向兩側滑開！'
    };
  }
};
