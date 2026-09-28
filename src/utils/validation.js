/**
 * Star Rover Odyssey - Validation Utility
 */

export const CODE_LIMITS = {
  MAX_CODE_LENGTH: 20000,
  MAX_CONSOLE_LOGS: 100,
  MAX_LOG_LENGTH: 2000,
  TIMEOUT_MS: 1500
};

/**
 * Validates student code before sending to worker
 * @param {string} code 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCodeInput(code) {
  if (typeof code !== 'string') {
    return { valid: false, error: '程式碼必須為字串格式' };
  }
  if (code.length > CODE_LIMITS.MAX_CODE_LENGTH) {
    return { 
      valid: false, 
      error: `程式碼長度超出限制（目前 ${code.length} 字元，上限為 ${CODE_LIMITS.MAX_CODE_LENGTH} 字元）` 
    };
  }
  return { valid: true };
}

/**
 * Sanitizes a string for console output display
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeConsoleOutput(str) {
  if (typeof str !== 'string') {
    try {
      str = JSON.stringify(str);
    } catch {
      str = String(str);
    }
  }
  if (str.length > CODE_LIMITS.MAX_LOG_LENGTH) {
    return str.slice(0, CODE_LIMITS.MAX_LOG_LENGTH) + '... (輸出過長已截斷)';
  }
  return str;
}
