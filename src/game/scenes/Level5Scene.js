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

    if (this.scannerDish) {
      this.scannerDish.visible = false;
      this.scannerDish.position.y = 3.0; // above for mounting animation
    }

    if (this.rover) {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('SLOT: EMPTY', '#0d1322', '#64748b');
      }
    }
  }

  handleAction(actionType, payload) {
    if (actionType === 'API_INVOKED' && payload.api === 'rover.installModule') {
      const mod = payload.args?.[0];
      if (mod) {
        this.isInstalled = true;
        this.scanRadius = mod.range || 30;
        this.scannerDish.visible = true;
        soundManager.playModuleInstall();

        const { nameLabel } = this.rover.userData;
        if (nameLabel) {
          nameLabel.material.map = createTextTexture(
            `${mod.name || 'MODULE'} [R:${this.scanRadius}]`,
            '#0d1322',
            '#00f2fe'
          );
        }
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isInstalled = true;
      this.scannerDish.visible = true;
      this.scannerDish.position.y = 1.45;
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

      // Expanding scan pulse ring
      const ring = this.scannerDish.userData.pulseRing;
      if (ring) {
        this.scanPulse = (this.scanPulse + delta * 2.0) % 3.0;
        const currentScale = 1 + this.scanPulse * 3;
        ring.scale.set(currentScale, currentScale, currentScale);
        ring.material.opacity = Math.max(0, 1 - this.scanPulse / 3.0) * 0.8;
      }
    }
  }
}
