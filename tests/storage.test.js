import { describe, it, expect } from 'vitest';
import { validateSaveData, DEFAULT_SAVE_DATA } from '../src/utils/storage.js';

describe('Storage & Save Validation', () => {
  it('validates default save data correctly', () => {
    const res = validateSaveData(DEFAULT_SAVE_DATA);
    expect(res.valid).toBe(true);
    expect(res.data.version).toBe(1);
    expect(res.data.unlockedLevels).toContain(1);
  });

  it('rejects save data with unsupported version', () => {
    const res = validateSaveData({ ...DEFAULT_SAVE_DATA, version: 99 });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('不支援的存檔版本');
  });

  it('rejects corrupt non-object data', () => {
    expect(validateSaveData(null).valid).toBe(false);
    expect(validateSaveData('malicious payload').valid).toBe(false);
  });

  it('sanitizes oversized code to prevent memory attacks', () => {
    const hugeCode = 'x'.repeat(60000);
    const res = validateSaveData({
      version: 1,
      currentLevel: 1,
      unlockedLevels: [1],
      completedLevels: [],
      savedCode: { '1': hugeCode }
    });
    expect(res.valid).toBe(true);
    expect(res.data.savedCode['1'].length).toBeLessThanOrEqual(50000);
  });
});
