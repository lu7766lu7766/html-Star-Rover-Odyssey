/**
 * Level 5 Scene: 外掛模組裝載
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createScannerDish, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level5Scene extends BaseGameScene {
  constructor() {
    super(5);
    this.rover = null;
    this.scannerDish = null;
    this.isInstalled = false;
    this.scanRadius = 0;
    this.scanPulse = 0;
    this.activeMethod = 'activateScan';
  }

  build() {
    const grid = createSciFiGrid(60, 60, 0x00f2fe);
    this.group.add(grid);

    this.rover = createSciFiRover();
    this.group.add(this.rover);

    this.scannerDish = createScannerDish();
    this.scannerDish.position.set(0, 1.45, 0.4);
    this.scannerDish.visible = false;
    this.rover.add(this.scannerDish);

    this.reset();
  }

  reset() {
    this.isInstalled = false;
    this.scanRadius = 0;
    this.scanPulse = 0;
    this.activeMethod = 'activateScan';

    if (this.scannerDish) {
      this.scannerDish.visible = false;
      this.scannerDish.position.y = 3.0; // above for mounting animation
    }

    if (this.rover) {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('SLOT: EMPTY', '#ffffff', '#64748b');
        nameLabel.material.needsUpdate = true;
      }
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_SCENE' || actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.reset();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      this.reset();
      const inner = payload.payload || payload || {};
      // 寫碼模式：Worker 真跑 rover.installModule({ name, range, mode, ... }) 的 trace
      const installCall = inner.apiCalls?.find((c) => c.api === 'rover.installModule');
      const methodCall = inner.methodCall || {};
      const moduleConfig = inner.moduleConfig || {};
      let methodId;
      let params;
      if (installCall) {
        const mod = installCall.args[0] || {};
        methodId = mod.name || 'activateScan';
        params = { range: mod.range, mode: mod.mode };
      } else {
        methodId = methodCall.methodId || 'activateScan';
        params = methodCall.params || {};
      }
      const range = params.range ?? moduleConfig.range ?? 20;
      this.isInstalled = true;
      this.scanRadius = range;
      this.activeMethod = methodId;
      this.scannerDish.visible = true;
      try { soundManager.playModuleInstall(); } catch (e) {}

      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        const tag = methodId === 'activateScan'
          ? `WIDE SCAN [R:${this.scanRadius}]`
          : methodId === 'focusScan'
            ? `FOCUS SCAN [${params.target || 'NEAR-01'}]`
            : `PING ECHO [${params.duration ?? 1}s]`;
        const color = methodId === 'activateScan' ? '#00f2fe' : methodId === 'focusScan' ? '#10b981' : '#f59e0b';
        nameLabel.material.map = createTextTexture(tag, '#ffffff', color);
        nameLabel.material.needsUpdate = true;
      }
      const ring = this.scannerDish.userData.pulseRing;
      if (ring) {
        const color = methodId === 'activateScan' ? 0x00f2fe : methodId === 'focusScan' ? 0x10b981 : 0xf59e0b;
        ring.material.color.setHex(color);
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isInstalled = true;
      this.scannerDish.visible = true;
      this.scannerDish.position.y = 1.45;
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('RADAR LOCK: 100%', '#ffffff', '#10b981');
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_FAIL') {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        const err = payload.evaluation?.error || '';
        const isMethodError = err.includes('方法選型錯誤');
        nameLabel.material.map = createTextTexture(
          isMethodError ? 'WRONG METHOD' : 'SCAN INCOMPLETE',
          '#ffffff',
          '#ef4444'
        );
        nameLabel.material.needsUpdate = true;
      }
    }
  }

  update(delta) {
    if (this.isInstalled && this.scannerDish) {
      // Descend into slot
      if (this.scannerDish.position.y > 1.45) {
        this.scannerDish.position.y = Math.max(1.45, this.scannerDish.position.y - delta * 4);
      }

      // Rotate radar head
      const head = this.scannerDish.userData.head;
      if (head) {
        head.rotation.y += delta * 2.5;
      }

      // Expanding scan pulse ring — wave shape depends on called function
      const ring = this.scannerDish.userData.pulseRing;
      if (ring) {
        if (this.activeMethod === 'focusScan') {
          // 集束直線波：轉得快、環收得緊、不透明度高
          this.scanPulse = (this.scanPulse + delta * 3.5) % 3.0;
          const currentScale = 1 + this.scanPulse * 1.2;
          ring.scale.set(currentScale, currentScale, currentScale);
          ring.material.opacity = Math.max(0, 1 - this.scanPulse / 3.0) * 0.95;
        } else if (this.activeMethod === 'pingEcho') {
          // 短促回波：小而慢的點狀閃爍
          this.scanPulse = (this.scanPulse + delta * 1.0) % 3.0;
          const currentScale = 1 + this.scanPulse * 0.8;
          ring.scale.set(currentScale, currentScale, currentScale);
          ring.material.opacity = Math.max(0, 1 - this.scanPulse / 3.0) * 0.45;
        } else {
          // 廣域環狀波：標準大擴散
          this.scanPulse = (this.scanPulse + delta * 2.0) % 3.0;
          const currentScale = 1 + this.scanPulse * 3;
          ring.scale.set(currentScale, currentScale, currentScale);
          ring.material.opacity = Math.max(0, 1 - this.scanPulse / 3.0) * 0.8;
        }
      }
    }
  }
}
