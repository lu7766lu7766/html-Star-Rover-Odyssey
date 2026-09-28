/**
 * Level 6 Scene: 控制中心氣密門
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiGrid, createAirlockDoors } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level6Scene extends BaseGameScene {
  constructor() {
    super(6);
    this.doors = null;
    this.isUnlocked = false;
    this.doorOpenProgress = 0;
  }

  build() {
    const grid = createSciFiGrid(50, 50, 0xef4444);
    this.group.add(grid);

    this.doors = createAirlockDoors();
    this.doors.position.set(0, 0, 0);
    this.group.add(this.doors);

    this.reset();
  }

  reset() {
    this.isUnlocked = false;
    this.doorOpenProgress = 0;

    if (this.doors) {
      const { leftDoor, rightDoor, statusLight } = this.doors.userData;
      if (leftDoor) leftDoor.position.x = -1.1;
      if (rightDoor) rightDoor.position.x = 1.1;
      if (statusLight) statusLight.material.color.setHex(0xef4444); // red locked
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_SCENE' || actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.reset();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      this.reset();
      const domState = payload.payload?.domState || payload.domState || {};
      if (domState.isAlarmActive === false && domState.isAirlockOpen) {
        this.isUnlocked = true;
        try { soundManager.playDoorOpen(); } catch (e) {}
        const { statusLight } = this.doors.userData;
        if (statusLight) {
          statusLight.material.color.setHex(0x10b981); // green unlocked
        }
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isUnlocked = true;
      try { soundManager.playDoorOpen(); } catch (e) {}

      const { statusLight } = this.doors.userData;
      if (statusLight) {
        statusLight.material.color.setHex(0x10b981); // green unlocked
      }
    }
  }

  update(delta) {
    if (this.isUnlocked && this.doors) {
      if (this.doorOpenProgress < 1.0) {
        this.doorOpenProgress = Math.min(1.0, this.doorOpenProgress + delta * 0.8);
        const offset = this.doorOpenProgress * 2.2;
        const { leftDoor, rightDoor } = this.doors.userData;
        if (leftDoor) leftDoor.position.x = -1.1 - offset;
        if (rightDoor) rightDoor.position.x = 1.1 + offset;
      }
    }
  }
}
