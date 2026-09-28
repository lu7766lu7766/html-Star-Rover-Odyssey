/**
 * Level 2 Scene: 推進力計算與大氣層發射
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level2Scene extends BaseGameScene {
  constructor() {
    super(2);
    this.rover = null;
    this.grid = null;
    this.isLaunching = false;
    this.launchSpeed = 0;
    this.fuelRemaining = 0;
    this.success = false;
  }

  build() {
    this.grid = createSciFiGrid(80, 80, 0x38bdf8);
    this.group.add(this.grid);

    this.rover = createSciFiRover();
    this.rover.position.set(0, 0, -5);
    this.group.add(this.rover);

    // Initial label
    const { nameLabel, batteryBar } = this.rover.userData;
    if (nameLabel) {
      nameLabel.material.map = createTextTexture('FUEL: 500', '#0d1322', '#f59e0b');
    }
    if (batteryBar) {
      batteryBar.scale.x = 1.0;
    }

    this.reset();
  }

  reset() {
    this.isLaunching = false;
    this.launchSpeed = 0;
    this.fuelRemaining = 500;
    this.success = false;

    if (this.rover) {
      this.rover.position.set(0, 0, 0);
      const { flame, nameLabel } = this.rover.userData;
      if (flame) {
        flame.material.opacity = 0;
        flame.scale.set(1, 1, 1);
      }
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('FUEL: 500', '#0d1322', '#f59e0b');
      }
    }
  }

  handleAction(actionType, payload) {
    if (actionType === 'API_INVOKED' && payload.api === 'rover.launch') {
      const [fuel] = payload.args;
      this.fuelRemaining = fuel;
      this.isLaunching = true;
      soundManager.playThruster();

      const { flame, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 1.0;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture(`REM: ${fuel}`, '#0d1322', fuel === 300 ? '#10b981' : '#ef4444');
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.success = true;
      this.isLaunching = true;
      this.launchSpeed = 15;
      const { flame } = this.rover.userData;
      if (flame) flame.material.opacity = 1.0;
    } else if (actionType === 'LEVEL_FAIL') {
      this.success = false;
      this.launchSpeed = 0.5; // Stalls
    }
  }

  update(delta) {
    if (this.isLaunching && this.rover) {
      if (this.success) {
        // Accelerate into space
        this.launchSpeed += delta * 25;
        this.rover.position.z += this.launchSpeed * delta;
        this.rover.position.y += this.launchSpeed * delta * 0.4;
        this.rover.rotation.x = -Math.min(this.rover.position.y * 0.05, Math.PI / 6);

        const { flame } = this.rover.userData;
        if (flame) {
          flame.scale.set(1.5, 3 + Math.random() * 0.8, 1.5);
        }
      } else {
        // Stalled flight
        this.rover.position.z += 1 * delta;
        this.rover.position.y = Math.max(0, this.rover.position.y - delta * 2);
        const { flame } = this.rover.userData;
        if (flame) {
          flame.material.opacity = 0.2 + Math.random() * 0.3;
        }
      }
    }
  }
}
