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
    isFailModalOpen: false,
    failModalTimer: null,
    isCodePeekOpen: false, // JavaScript peek toggle
    isHintModalOpen: false,
    resetNonce: 0
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
      if (this.failModalTimer) {
        clearTimeout(this.failModalTimer);
        this.failModalTimer = null;
      }
      this.isSuccessModalOpen = false;
      this.isFailModalOpen = false;
      this.executionLogs = [];
      this.lastRunResult = null;
    },

    closeSuccessModal() {
      this.isSuccessModalOpen = false;
      if (this.successModalTimer) {
        clearTimeout(this.successModalTimer);
        this.successModalTimer = null;
      }
    },

    closeFailModal() {
      this.isFailModalOpen = false;
      if (this.failModalTimer) {
        clearTimeout(this.failModalTimer);
        this.failModalTimer = null;
      }
    },

    restoreScene() {
      try {
        soundManager.playClick();
      } catch (e) {}
      this.isFailModalOpen = false;
      if (this.sceneActionTrigger) {
        this.sceneActionTrigger('RESET_SCENE', { levelId: this.currentLevel.id });
        this.sceneActionTrigger('RESET_POSITION', { levelId: this.currentLevel.id });
      }
      this.appendLog({
        type: 'info',
        message: '3D 場景實體與機器已還原至初始整備點。'
      });
    },

    restoreVehiclePosition() {
      this.restoreScene();
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
      const progressStore = useProgressStore();
      soundManager.playClick();
      this.clearLogs();
      progressStore.clearSavedOperation(this.currentLevel.id);
      this.resetNonce++;
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
      try {
        soundManager.playLaunch();
      } catch (e) {
        console.warn('[Sound] Audio playback ignored:', e);
      }

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

      // Calculate realistic animation duration for each level
      let animDuration = 600;
      if (currentLevel.id === 1 && payload.sequence) {
        animDuration = Math.max(800, payload.sequence.length * 520);
      } else if (currentLevel.id === 2) {
        animDuration = 1600;
      } else if (currentLevel.id === 3) {
        animDuration = 2000;
      } else if (currentLevel.id === 4) {
        const blocks = payload.loopConfig?.blocks || [];
        let totalSteps = 0;
        for (const b of blocks) {
          totalSteps += (b.type === 'LOOP' ? (b.count || 2) : 1);
        }
        animDuration = Math.max(1200, Math.min(totalSteps * 420, 5000));
      } else if (currentLevel.id === 5) {
        animDuration = 1500;
      } else if (currentLevel.id === 7) {
        animDuration = 1800;
      } else if (currentLevel.id === 8) {
        animDuration = 2000;
      }

      // Allow 3D animation to play out
      await new Promise(resolve => setTimeout(resolve, animDuration));

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

          if (this.failModalTimer) clearTimeout(this.failModalTimer);
          this.isFailModalOpen = false;

          // Delay success modal to let user enjoy the final victory animation
          if (this.successModalTimer) clearTimeout(this.successModalTimer);
          this.successModalTimer = setTimeout(() => {
            try {
              soundManager.playSuccess();
            } catch (e) {}
            this.isSuccessModalOpen = true;
          }, 800);
        } else {
          try {
            soundManager.playError();
          } catch (e) {}
          this.appendLog({
            type: 'error',
            message: `⚠️ [未通過] ${evaluation.error}`
          });

          if (this.sceneActionTrigger) {
            this.sceneActionTrigger('LEVEL_FAIL', { levelId: currentLevel.id, evaluation });
          }

          // Delay fail modal to let user see 3D fail state / car stop
          if (this.failModalTimer) clearTimeout(this.failModalTimer);
          this.failModalTimer = setTimeout(() => {
            this.isFailModalOpen = true;
          }, 750);
        }

        return evaluation;
      } catch (err) {
        try {
          soundManager.playError();
        } catch (e) {}
        const errResult = {
          pass: false,
          error: `執行期異常: ${err.message || String(err)}`
        };
        this.lastRunResult = errResult;
        this.appendLog({
          type: 'error',
          message: errResult.error
        });

        if (this.failModalTimer) clearTimeout(this.failModalTimer);
        this.failModalTimer = setTimeout(() => {
          this.isFailModalOpen = true;
        }, 750);

        return errResult;
      } finally {
        this.isExecuting = false;
      }
    }
  }
});

