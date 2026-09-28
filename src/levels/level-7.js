/**
 * Level 7: 無人機編隊
 */

export default {
  id: 7,
  title: '無人機編隊',
  subtitle: '物件陣列遍歷與狀態判定綜合應用',
  concepts: ['Array 陣列', 'for / forEach 遍歷', '物件屬性修改', '條件式綜合運用'],
  description: `無人機巡邏編隊已傳回遙測數據陣列 \`drones\`（共 4 架）。請遍歷無人機陣列，依據各機電量判定狀態：
- 電量小於 20%：設定 \`status = "WARNING"\`（低電量警示返航）
- 電量大於等於 20%：設定 \`status = "PATROL"\`（進入正常巡邏）
最後呼叫 \`droneFleet.deploy(drones)\` 啟動編隊！`,
  targetRequirements: [
    '讀取系統提供的 drones 無人機陣列 (長度 4)',
    '使用迴圈遍歷每架無人機',
    '若 battery < 20 則賦予屬性 status = "WARNING"',
    '若 battery >= 20 則賦予屬性 status = "PATROL"',
    '呼叫 droneFleet.deploy(drones) 部署陣列'
  ],
  starterCode: `// 第 7 關：無人機編隊
// 系統已注入 drones 陣列，包含 4 架無人機資料

for (let i = 0; i < drones.length; i++) {
  let drone = drones[i];
  
  if (drone.battery < 20) {
    drone.status = "WARNING";
  } else {
    drone.status = "PATROL";
  }
}

// 部署無人機編隊
droneFleet.deploy(drones);
`,
  availableAPI: [
    'drones: Array<{ id: string, x: number, y: number, z: number, battery: number }>',
    'droneFleet.deploy(processedDrones: Array)'
  ],
  hints: [
    '提示 1：使用 for (let i = 0; i < drones.length; i++) 或 drones.forEach(...) 遍歷陣列。',
    '提示 2：判斷 drone.battery < 20，符合時 drone.status = "WARNING"，否則 drone.status = "PATROL"。',
    '提示 3：最後記得呼叫 droneFleet.deploy(drones) 發佈編隊數據。'
  ],
  validate: (runResult) => {
    if (!runResult.success) {
      return { pass: false, error: runResult.error || '程式執行發生錯誤' };
    }

    const deployCall = (runResult.apiCalls || []).find(call => call.api === 'droneFleet.deploy');
    if (!deployCall) {
      return { pass: false, error: '未偵測到 droneFleet.deploy(...) 呼叫！' };
    }

    const fleet = deployCall.args?.[0];
    if (!Array.isArray(fleet) || fleet.length !== 4) {
      return { pass: false, error: 'droneFleet.deploy 傳入的無人機資料必須是長度為 4 的陣列！' };
    }

    // Verify each drone status
    for (const d of fleet) {
      if (!d.status) {
        return { pass: false, error: `無人機【${d.id}】尚未賦予 status 狀態屬性！` };
      }
      const upperStatus = String(d.status).toUpperCase();
      if (d.battery < 20) {
        if (upperStatus !== 'WARNING' && upperStatus !== 'ALERT') {
          return {
            pass: false,
            error: `無人機【${d.id}】電量為 ${d.battery}% (< 20%)，狀態應標記為 "WARNING"，實際為 "${d.status}"！`
          };
        }
      } else {
        if (upperStatus !== 'PATROL' && upperStatus !== 'READY') {
          return {
            pass: false,
            error: `無人機【${d.id}】電量為 ${d.battery}% (>= 20%)，狀態應標記為 "PATROL"，實際為 "${d.status}"！`
          };
        }
      }
    }

    return {
      pass: true,
      data: { fleet },
      feedback: '無人機編隊部署完畢！低電量機組回防補給，巡邏機組展開星域偵察！'
    };
  }
};
