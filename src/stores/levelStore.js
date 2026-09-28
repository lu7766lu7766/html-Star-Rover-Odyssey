/**
 * Star Rover Odyssey 2.0 - Level Store (Pinia)
 * Manages active level execution, evaluation, feedback, and 3D event triggers
 */

import { defineStore } from 'pinia';
import { getLevelById } from '../levels/index.js';
import { useProgressStore } from './progressStore.js';
import { soundManager } from '../game/core/SoundManager.js';

export const useLevelStore = defineStore('level', {
  state: () => ({
    isExecuting: false,
    executionLogs: [],
    lastRunResult: null,
    sceneActionTrigger: null, // Callback to trigger scene 3D animations
    isSuccessModalOpen: false,
    successModalTimer: null,
    isCodePeekOpen: false, // JavaScript peek toggle
    isHintModalOpen: false
  }),

  getters: {
    currentLevel(state) {
      const progress = useProgressStore();
      return getLevelById(progress.currentLevelId);
    }
  },

  actions: {
    clearLogs() {
      if (this.successModalTimer) {
        clearTimeout(this.successModalTimer);
        this.successModalTimer = null;
      }
      this.executionLogs = [];
      this.lastRunResult = null;
    },

    appendLog(logEntry) {
      if (this.executionLogs.length < 50) {
        this.executionLogs.push({
          id: Date.now() + Math.random(),
          type: logEntry.type || 'info',
          message: logEntry.message || '',
          time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    },

    setSceneActionTrigger(triggerFn) {
      this.sceneActionTrigger = triggerFn;
    },

    toggleCodePeek() {
      this.isCodePeekOpen = !this.isCodePeekOpen;
      soundManager.playClick();
    },

    toggleHintModal(open = null) {
      this.isHintModalOpen = open !== null ? open : !this.isHintModalOpen;
      soundManager.playClick();
    },

    resetCurrentLevel() {
      soundManager.playClick();
      this.clearLogs();
      if (this.sceneActionTrigger) {
        this.sceneActionTrigger('RESET', { levelId: this.currentLevel.id });
      }
      this.appendLog({
        type: 'info',
        message: '關卡場景與參數已重置為初始狀態。'
      });
    },

    async executeLevel(payload) {
      const progressStore = useProgressStore();
      const currentLevel = this.currentLevel;

      this.isExecuting = true;
      this.clearLogs();
      soundManager.playLaunch();

      this.appendLog({
        type: 'info',
        message: `開始執行【${currentLevel.title}】任務程序...`
      });

      // Save operation in progress store
      progressStore.saveOperation(currentLevel.id, payload);

      // Notify 3D scene that execution has started
      if (this.sceneActionTrigger) {
        this.sceneActionTrigger('EXECUTE_START', { levelId: currentLevel.id, payload });
      }

      // Allow a brief animation duration for student to observe 3D response
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const evaluation = currentLevel.validate(payload);
        this.lastRunResult = evaluation;

        if (evaluation.pass) {
          // Notify 3D scene of success
          if (this.sceneActionTrigger) {
            this.sceneActionTrigger('LEVEL_SUCCESS', { levelId: currentLevel.id, evaluation });
          }

          progressStore.markLevelCompleted(currentLevel.id);
          this.appendLog({
            type: 'success',
            message: `🌟 [任務通關] ${evaluation.feedback}`
          });

          // Delay success modal to let user watch 3D animation
          if (this.successModalTimer) clearTimeout(this.successModalTimer);
          this.successModalTimer = setTimeout(() => {
            soundManager.playSuccess();
            this.isSuccessModalOpen = true;
          }, 1400);
        } else {
          soundManager.playError();
          this.appendLog({
            type: 'error',
            message: `⚠️ [未通過] ${evaluation.error}`
          });

          if (this.sceneActionTrigger) {
            this.sceneActionTrigger('LEVEL_FAIL', { levelId: currentLevel.id, evaluation });
          }
        }

        return evaluation;
      } catch (err) {
        soundManager.playError();
        const errResult = {
          pass: false,
          error: `執行期異常: ${err.message || String(err)}`
        };
        this.lastRunResult = errResult;
        this.appendLog({
          type: 'error',
          message: errResult.error
        });
        return errResult;
      } finally {
        this.isExecuting = false;
      }
    }
  }
});
