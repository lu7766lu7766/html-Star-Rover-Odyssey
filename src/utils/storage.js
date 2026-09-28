/**
 * Star Rover Odyssey - Storage Utility
 * Manages LocalStorage persistence and JSON import/export
 */

const STORAGE_KEY = 'star_rover_odyssey_save_v2';

export const DEFAULT_SAVE_DATA = {
  version: 1,
  currentLevel: 1,
  unlockedLevels: [1],
  savedCode: {},
  completedLevels: [],
  timestamp: Date.now()
};

/**
 * Validates the save data structure
 * @param {any} data 
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
export function validateSaveData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '存檔內容非有效 JSON 物件' };
  }
  if (data.version !== 1) {
    return { valid: false, error: `不支援的存檔版本: ${data.version}` };
  }
  if (!Array.isArray(data.unlockedLevels) || data.unlockedLevels.length === 0) {
    return { valid: false, error: '存檔缺少解鎖關卡列表' };
  }
  if (!Array.isArray(data.completedLevels)) {
    return { valid: false, error: '存檔缺少完成關卡列表' };
  }
  if (!data.savedCode || typeof data.savedCode !== 'object') {
    return { valid: false, error: '存檔缺少程式碼紀錄' };
  }

  // Ensure currentLevel is valid number
  const currentLevel = typeof data.currentLevel === 'number' ? data.currentLevel : 1;

  // Sanitize savedCode: ensure all values are strings
  const sanitizedCode = {};
  for (const [lvl, code] of Object.entries(data.savedCode)) {
    if (typeof code === 'string') {
      sanitizedCode[lvl] = code.slice(0, 50000); // Prevent overflow
    }
  }

  return {
    valid: true,
    data: {
      version: 1,
      currentLevel,
      unlockedLevels: Array.from(new Set(data.unlockedLevels.map(Number))).filter(n => n >= 1 && n <= 7),
      completedLevels: Array.from(new Set(data.completedLevels.map(Number))).filter(n => n >= 1 && n <= 7),
      savedCode: sanitizedCode,
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now()
    }
  };
}

/**
 * Loads save data from LocalStorage
 * @returns {object} Valid save data
 */
export function loadSaveData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw);
    const result = validateSaveData(parsed);
    if (result.valid) {
      return result.data;
    }
    console.warn('[Storage] Invalid saved data, falling back to default', result.error);
    return { ...DEFAULT_SAVE_DATA };
  } catch (err) {
    console.error('[Storage] Failed to read from localStorage:', err);
    return { ...DEFAULT_SAVE_DATA };
  }
}

/**
 * Saves data to LocalStorage
 * @param {object} data 
 * @returns {boolean}
 */
export function saveSaveData(data) {
  try {
    const payload = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('[Storage] Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Exports save data as a downloadable JSON file
 * @param {object} data 
 */
export function exportSaveFile(data) {
  const payload = {
    ...data,
    timestamp: Date.now()
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `star-rover-save-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads and validates an imported JSON file
 * @param {File} file 
 * @returns {Promise<{ valid: boolean, data?: object, error?: string }>}
 */
export function importSaveFile(file) {
  return new Promise((resolve) => {
    if (!file || !file.name.endsWith('.json')) {
      return resolve({ valid: false, error: '請選擇 .json 格式的存檔檔案' });
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        const validated = validateSaveData(parsed);
        resolve(validated);
      } catch (err) {
        resolve({ valid: false, error: '存檔解析失敗，非合法 JSON 內容' });
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: '讀取檔案失敗' });
    };
    reader.readAsText(file);
  });
}
