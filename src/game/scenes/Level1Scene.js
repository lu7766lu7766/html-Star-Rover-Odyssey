/**
 * Level 1 Scene: 探測船通電自檢
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level1Scene extends BaseGameScene {
  constructor() {
    super(1);
    this.rover = null;
    this.grid = null;
    this.isPowered = false;
    this.targetBattery = 0;
    this.currentBattery = 0;
    this.hoverTime = 0;
  }

  build() {
    this.grid = createSciFiGrid();
    this.group.add(this.grid);

    this.rover = createSciFiRover();
    this.group.add(this.rover);

    this.reset();
  }

  reset() {
    this.isPowered = false;
    this.targetBattery = 0;
    this.currentBattery = 0;
    this.hoverTime = 0;

    if (this.rover) {
      this.rover.position.set(0, 0, 0);
      const { flame, batteryBar, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0;
      if (batteryBar) batteryBar.scale.x = 0.01;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('OFFLINE', '#0d1322', '#64748b');
      }
    }
  }

  handleAction(actionType, payload) {
    if (actionType === 'API_INVOKED' && payload.api === 'rover.setup') {
      const [name, battery, isActive] = payload.args;
      if (isActive && battery > 0) {
        this.isPowered = true;
        this.targetBattery = Math.min(Math.max(battery, 1), 100);
        soundManager.playPowerUp();

        const { flame, nameLabel } = this.rover.userData;
        if (flame) flame.material.opacity = 0.8;
        if (nameLabel && name) {
          nameLabel.material.map = createTextTexture(`[ ${name} ]`, '#0d1322', '#00f2fe');
        }
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isPowered = true;
      const { name, battery } = payload.data || {};
      this.targetBattery = battery || 100;
      const { flame, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.9;
      if (nameLabel && name) {
        nameLabel.material.map = createTextTexture(`[ ${name} ] ONLINE`, '#0d1322', '#10b981');
      }
    }
  }

  update(delta) {
    if (this.isPowered && this.rover) {
      this.hoverTime += delta * 3;
      // Gentle idle hover oscillation
      this.rover.position.y = Math.sin(this.hoverTime) * 0.15;

      // Smooth battery meter fill
      if (this.currentBattery < this.targetBattery) {
        this.currentBattery += delta * 60;
        if (this.currentBattery > this.targetBattery) {
          this.currentBattery = this.targetBattery;
        }
        const { batteryBar } = this.rover.userData;
        if (batteryBar) {
          batteryBar.scale.x = Math.max(0.01, this.currentBattery / 100);
        }
      }

      // Pulse flame
      const { flame } = this.rover.userData;
      if (flame) {
        flame.scale.set(
          1 + Math.sin(this.hoverTime * 4) * 0.15,
          1 + Math.cos(this.hoverTime * 5) * 0.2,
          1 + Math.sin(this.hoverTime * 4) * 0.15
        );
      }
    }
  }
}
