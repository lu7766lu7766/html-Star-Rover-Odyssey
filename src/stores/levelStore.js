/**
 * Star Rover Odyssey - Level Store (Pinia)
 * Manages active level execution, evaluation, console logs, and 3D event triggers
 */

import { defineStore } from 'pinia';
import { getLevelById } from '../levels/index.js';
import { sandboxRuntime } from '../sandbox/runtime.js';
import { useProgressStore } from './progressStore.js';
import { soundManager } from '../game/core/SoundManager.js';

export const useLevelStore = defineStore('level', {
  state: () => ({
    isExecuting: false,
    consoleLogs: [],
    lastRunResult: null,
    mockDomState: null,
    sceneActionTrigger: null, // Callback to trigger scene animations
    isSuccessModalOpen: false,
    successModalTimer: null
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
      this.consoleLogs = [];
      this.lastRunResult = null;
    },

    appendLog(logEntry) {
      if (this.consoleLogs.length < 100) {
        this.consoleLogs.push({
          id: Date.now() + Math.random(),
          type: logEntry.type || 'log',
          args: logEntry.args || [],
          time: new Date().toLocaleTimeString()
        });
      }
    },

    setMockDomState(state) {
      this.mockDomState = state;
    },

    setSceneActionTrigger(triggerFn) {
      this.sceneActionTrigger = triggerFn;
    },

    async runCode(code) {
      const progressStore = useProgressStore();
      const currentLevel = this.currentLevel;

      this.isExecuting = true;
      this.clearLogs();

      try {
        soundManager.playClick();

        const result = await sandboxRuntime.execute({
          code,
          levelId: currentLevel.id,
          initialData: {},
          onLog: (logPayload) => {
            this.appendLog(logPayload);
          },
          onDomMutation: (domSnapshot) => {
            this.setMockDomState(domSnapshot);
          },
          onApiCall: (apiPayload) => {
            // Trigger interactive 3D cues as APIs are invoked
            if (this.sceneActionTrigger) {
              this.sceneActionTrigger('API_INVOKED', apiPayload);
            }
          }
        });

        // Run level evaluation
        const evaluation = currentLevel.validate(result);
        this.lastRunResult = evaluation;

        if (evaluation.pass) {
          // 1. 立即觸發 3D 場景過關動畫
          if (this.sceneActionTrigger) {
            this.sceneActionTrigger('LEVEL_SUCCESS', evaluation);
          }

          // 2. 標記關卡完成並輸出成功訊息至主控台
          progressStore.markLevelCompleted(currentLevel.id);
          this.appendLog({
            type: 'log',
            args: [`🚀 [任務達成] ${evaluation.feedback}`]
          });

          // 3. 延遲彈出獎勵視窗，讓學生先飽覽 3D 太空船發射/通電/避障動畫
          const animationDelay = currentLevel.id === 2 || currentLevel.id === 3 ? 2400 : 1800;
          if (this.successModalTimer) clearTimeout(this.successModalTimer);
          this.successModalTimer = setTimeout(() => {
            soundManager.playSuccess();
            this.isSuccessModalOpen = true;
          }, animationDelay);
        } else {
          soundManager.playError();
          this.appendLog({
            type: 'error',
            args: [`[檢驗未通過] ${evaluation.error}`]
          });

          // Notify 3D scene of failure
          if (this.sceneActionTrigger) {
            this.sceneActionTrigger('LEVEL_FAIL', evaluation);
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
          args: [errResult.error]
        });
        return errResult;
      } finally {
        this.isExecuting = false;
      }
    },

    /**
     * Triggers button click in Level 6 Mock DOM
     */
    triggerMockDomEvent(targetId, eventType = 'click') {
      soundManager.playClick();
      sandboxRuntime.triggerEvent(targetId, eventType);

      // Re-evaluate Level 6 if code has been run
      setTimeout(() => {
        if (this.currentLevel.id === 6) {
          const evalResult = this.currentLevel.validate({
            success: true,
            domState: this.mockDomState
          });
          this.lastRunResult = evalResult;
          if (evalResult.pass) {
            soundManager.playDoorOpen();
            const progress = useProgressStore();
            progress.markLevelCompleted(6);

            if (this.sceneActionTrigger) {
              this.sceneActionTrigger('LEVEL_SUCCESS', evalResult);
            }

            this.appendLog({
              type: 'log',
              args: [`🚀 [任務達成] ${evalResult.feedback}`]
            });

            // 等待氣密門完全滑開 (1.8秒) 後再跳出通關彈窗
            if (this.successModalTimer) clearTimeout(this.successModalTimer);
            this.successModalTimer = setTimeout(() => {
              soundManager.playSuccess();
              this.isSuccessModalOpen = true;
            }, 1800);
          }
        }
      }, 100);
    }
  }
});
