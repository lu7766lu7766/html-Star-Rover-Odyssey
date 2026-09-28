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
    this.group.add(this.rover);

    this.reset();
  }

  reset() {
    this.isLaunching = false;
    this.launchSpeed = 0;
    this.fuelRemaining = 300;
    this.success = false;

    if (this.rover) {
      this.rover.position.set(0, 0, 0);
      this.rover.rotation.set(0, 0, 0);
      const { flame, nameLabel, batteryBar } = this.rover.userData;
      if (flame) {
        flame.material.opacity = 0;
        flame.scale.set(1, 1, 1);
      }
      if (batteryBar) {
        batteryBar.scale.x = 1.0;
      }
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('FUEL: 300', '#ffffff', '#2563eb');
        nameLabel.material.needsUpdate = true;
      }
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'EXECUTE_START') {
      const params = payload.payload?.params || payload.params || {};
      const { initialFuel = 300, burnPerThrust = 25, thrustCount = 6, speed = 4 } = params;
      const remainingFuel = initialFuel - (burnPerThrust * thrustCount);
      this.fuelRemaining = remainingFuel;
      this.isLaunching = true;
      this.launchSpeed = Math.min(speed * 2.5, 12);
      try { soundManager.playThruster(); } catch (e) {}

      const { flame, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.9;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture(`SPEED: ${speed} | REM: ${remainingFuel}`, '#ffffff', remainingFuel >= 0 ? '#2563eb' : '#ef4444');
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.success = true;
      this.isLaunching = true;
      this.launchSpeed = 16;
      const { flame, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 1.0;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('DOCKING ACCOMPLISHED', '#ffffff', '#10b981');
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_FAIL') {
      this.success = false;
      this.launchSpeed = 0.6; // Stalls
      const { flame, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.25;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('TRAJECTORY FAILED', '#ffffff', '#ef4444');
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'RESET') {
      this.reset();
    }
  }

  update(delta) {
    if (this.isLaunching && this.rover) {
      if (this.success) {
        // Accelerate into space
        this.launchSpeed += delta * 20;
        this.rover.position.z += this.launchSpeed * delta;
        this.rover.position.y += this.launchSpeed * delta * 0.35;
        this.rover.rotation.x = -Math.min(this.rover.position.y * 0.05, Math.PI / 6);

        const { flame } = this.rover.userData;
        if (flame) {
          flame.scale.set(1.5, 3 + Math.random() * 0.8, 1.5);
        }
      } else {
        // Slow or stalled flight
        this.rover.position.z += this.launchSpeed * delta;
        this.rover.position.y = Math.max(0, this.rover.position.y - delta * 0.5);
        const { flame } = this.rover.userData;
        if (flame) {
          flame.material.opacity = 0.2 + Math.random() * 0.25;
        }
      }
    }
  }
}
