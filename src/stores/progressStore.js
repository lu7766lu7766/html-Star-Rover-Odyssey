/**
 * Star Rover Odyssey - Progress Store (Pinia)
 * Manages player progression, saved student code, level unlocking,
 * and the developer cheat mode "jaccis666".
 */

import { defineStore } from 'pinia';
import { loadSaveData, saveSaveData, exportSaveFile, importSaveFile, DEFAULT_SAVE_DATA } from '../utils/storage.js';
import { ALL_LEVELS } from '../levels/index.js';

let debounceSaveTimer = null;

export const useProgressStore = defineStore('progress', {
  state: () => {
    const loaded = loadSaveData();
    return {
      currentLevelId: loaded.currentLevel || 1,
      unlockedLevels: loaded.unlockedLevels || [1],
      completedLevels: loaded.completedLevels || [],
      savedCode: loaded.savedCode || {},
      isDeveloperMode: false,
      isLowPerformanceMode: localStorage.getItem('star_rover_low_perf') === 'true'
    };
  },

  getters: {
    isLevelUnlocked: (state) => (levelId) => {
      if (state.isDeveloperMode) return true;
      return state.unlockedLevels.includes(levelId);
    },
    isLevelCompleted: (state) => (levelId) => {
      return state.completedLevels.includes(levelId);
    },
    getCodeForLevel: (state) => (levelId) => {
      if (state.savedCode[levelId]) {
        return state.savedCode[levelId];
      }
      const lvl = ALL_LEVELS.find(l => l.id === levelId);
      return lvl ? lvl.starterCode : '';
    },
    totalLevels: () => ALL_LEVELS.length,
    progressPercentage: (state) => {
      return Math.round((state.completedLevels.length / ALL_LEVELS.length) * 100);
    }
  },

  actions: {
    setCurrentLevel(id) {
      if (this.isLevelUnlocked(id)) {
        this.currentLevelId = id;
        this.persist();
      }
    },

    saveCode(levelId, code) {
      this.savedCode[levelId] = code;
      // Debounce writing to localStorage
      if (debounceSaveTimer) clearTimeout(debounceSaveTimer);
      debounceSaveTimer = setTimeout(() => {
        this.persist();
      }, 500);
    },

    markLevelCompleted(levelId) {
      if (!this.completedLevels.includes(levelId)) {
        this.completedLevels.push(levelId);
      }
      // Unlock next level if available
      const nextId = levelId + 1;
      if (nextId <= ALL_LEVELS.length && !this.unlockedLevels.includes(nextId)) {
        this.unlockedLevels.push(nextId);
      }
      this.persist();
    },

    resetCurrentLevelCode(levelId) {
      const lvl = ALL_LEVELS.find(l => l.id === levelId);
      if (lvl) {
        this.savedCode[levelId] = lvl.starterCode;
        this.persist();
        return lvl.starterCode;
      }
      return '';
    },

    /**
     * Secret Cheat Code: "jaccis666"
     * Toggles Developer Mode and unlocks all levels!
     */
    applyCheatCode(code) {
      if (code && code.trim() === 'jaccis666') {
        this.isDeveloperMode = !this.isDeveloperMode;
        if (this.isDeveloperMode) {
          // Unlock all 7 levels
          this.unlockedLevels = ALL_LEVELS.map(l => l.id);
        }
        return {
          success: true,
          mode: this.isDeveloperMode,
          message: this.isDeveloperMode 
            ? '🚀 金手指【jaccis666】啟動！已開啟開發者/教師模式，全關卡解鎖！' 
            : '🔒 開發者模式已關閉，恢復正常學生闖關模式。'
        };
      }
      return { success: false, message: '無效的指令代碼。' };
    },

    toggleLowPerformanceMode() {
      this.isLowPerformanceMode = !this.isLowPerformanceMode;
      localStorage.setItem('star_rover_low_perf', String(this.isLowPerformanceMode));
      return this.isLowPerformanceMode;
    },

    persist() {
      saveSaveData({
        version: 1,
        currentLevel: this.currentLevelId,
        unlockedLevels: this.unlockedLevels,
        completedLevels: this.completedLevels,
        savedCode: this.savedCode
      });
    },

    exportSave() {
      exportSaveFile({
        version: 1,
        currentLevel: this.currentLevelId,
        unlockedLevels: this.unlockedLevels,
        completedLevels: this.completedLevels,
        savedCode: this.savedCode
      });
    },

    async importSave(file) {
      const result = await importSaveFile(file);
      if (!result.valid) {
        return { success: false, error: result.error };
      }
      this.currentLevelId = result.data.currentLevel;
      this.unlockedLevels = result.data.unlockedLevels;
      this.completedLevels = result.data.completedLevels;
      this.savedCode = result.data.savedCode;
      this.persist();
      return { success: true };
    }
  }
});
