# 《Star Rover Odyssey》星際巡航：JavaScript 3D 互動教學平台

專為高中普通班、零程式基礎學生設計的 JavaScript 遊戲化學習平台。

![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen)
![Three.js](https://img.shields.io/badge/Three.js-r170-blue)
![CodeMirror](https://img.shields.io/badge/CodeMirror-6-orange)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## 🌟 核心特色

1. **雙欄式即時沉浸介面**：左側任務指引、CodeMirror 6 程式碼編輯器與 Console；右側 Three.js 3D 渲染視口與虛擬 HUD。
2. **純程序化 3D 場景**：採用 Three.js 原生幾何體與科技感材質建構，零外部 3D 模型檔案下載延遲，針對學校低階電腦最佳化，並具備「低效能模式」切換。
3. **Web Worker 安全隔離沙盒**：
   - 學生程式碼於獨立 Worker 中執行，隔離主線程 DOM 與危險全域物件。
   - 內建 1500ms 超時保護機制，防止無窮迴圈（`while(true)`）凍結瀏覽器。
4. **受限 Mock DOM 雙向同步**：支援第 6 關 `document.getElementById`、`innerText`、`style.color` 與 `addEventListener`，學生可親自點擊虛擬終端面板按鈕測試事件回呼。
5. **Web Audio 程序化音效**：內建純 Web Audio API 合成音效（引擎啟動、火箭噴射、雷達脈衝、礦石採集、氣密門滑動、通關音效），提供一鍵靜音。
6. **進度防抖保存與 JSON 匯入匯出**：LocalStorage 自動存檔，下課可一鍵匯出 `.json` 存檔帶走。
7. **金手指開發者模式**：點擊頂部金手指按鈕或輸入代碼 **`jaccis666`**，即可一鍵解鎖所有關卡，方便教師課堂示範與除錯。

---

## 🚀 七大教學關卡

| 關卡 | 單元主題 | 核心 API / 語法 | 3D 視覺反饋 |
| :--- | :--- | :--- | :--- |
| **01** | **探測船通電自檢** | `let`, 資料型態, `rover.setup(name, battery, isActive)` | 探測船點亮船身標籤、儀表電量填滿、離子引擎點火 |
| **02** | **推進力計算** | 算術運算子, 優先權, `rover.launch(remainingFuel)` | 500-25*8=300 燃料精準計算，探測船全速衝破大氣層 |
| **03** | **雷達自主避障** | `if / else`, 邏輯運算子, `rover.setAutoPilot(fn)` | 雷達波紋掃描，依距離執行煞車、減速或全速避障 |
| **04** | **地表深度鑽探** | `for` 迴圈, 計數器, `drill.dig(depthIndex)` | 機械手臂下潛，逐層採集 5 顆晶瑩能源水晶 |
| **05** | **外掛模組裝載** | Object 字面值, `this`, `rover.installModule(obj)` | 雷達掃描儀組裝上架，全息雷達旋轉並釋放擴充掃描波 |
| **06** | **控制中心面板** | Mock DOM, `addEventListener`, 事件更新 | 點擊面板按鈕解除鎖定，狀態燈轉綠，液壓氣密門滑開 |
| **07** | **無人機編隊** | 物件陣列遍歷, 條件判定, `droneFleet.deploy(drones)` | 4 架無人機座標部署，低電量警示返航，巡邏機組盤旋 |

---

## 🛠️ 本地開發與啟動

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```
瀏覽器訪問：`http://localhost:3000`

### 3. 執行單元測試
```bash
npm run test
```

### 4. 建置生產版本
```bash
npm run build
```
輸出目錄為 `dist/`，可直接部署至任何靜態託管平台（Vercel, Netlify, GitHub Pages）。

---

## 🎮 金手指（教師模式）

在導覽列右上方點擊鑰匙圖標 🔑，輸入：
```text
jaccis666
```
即可切換開發者模式，直接解鎖全 7 個關卡以供教學演示！
