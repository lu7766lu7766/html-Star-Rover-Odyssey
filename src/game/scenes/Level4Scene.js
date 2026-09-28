/**
 * Level 4 Scene: 地表深度鑽探
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createCrystalMine, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level4Scene extends BaseGameScene {
  constructor() {
    super(4);
    this.rover = null;
    this.crystals = [];
    this.mineGroup = null;
    this.drillArm = null;
    this.collectedCount = 0;
  }

  build() {
    const grid = createSciFiGrid(60, 60, 0x10b981);
    this.group.add(grid);

    this.rover = createSciFiRover();
    this.rover.position.set(-2.5, 0, 0);
    this.group.add(this.rover);

    // Drill mechanical arm attached to front
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    armGeo.rotateZ(Math.PI / 4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    this.drillArm = new THREE.Mesh(armGeo, armMat);
    this.drillArm.position.set(1.2, 0.8, 1.0);
    this.rover.add(this.drillArm);

    // Crystal mine
    this.mineGroup = createCrystalMine();
    this.mineGroup.position.set(0, 0, 0);
    this.crystals = this.mineGroup.userData.crystals;
    this.group.add(this.mineGroup);

    this.reset();
  }

  reset() {
    this.collectedCount = 0;
    if (this.crystals) {
      this.crystals.forEach((c) => {
        c.visible = true;
        c.scale.set(1, 1, 1);
      });
    }
    if (this.rover) {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('CRYSTALS: 0/5', '#0d1322', '#10b981');
      }
    }
  }

  handleAction(actionType, payload) {
    if (actionType === 'API_INVOKED' && payload.api === 'drill.dig') {
      const [depth] = payload.args;
      if (typeof depth === 'number' && depth >= 0 && depth < this.crystals.length) {
        const targetCrystal = this.crystals[depth];
        if (targetCrystal && targetCrystal.visible) {
          targetCrystal.visible = false;
          this.collectedCount++;
          soundManager.playDrill();
          soundManager.playCrystalCollect();

          const { nameLabel } = this.rover.userData;
          if (nameLabel) {
            nameLabel.material.map = createTextTexture(
              `CRYSTALS: ${this.collectedCount}/5`,
              '#0d1322',
              this.collectedCount === 5 ? '#10b981' : '#f59e0b'
            );
          }
        }
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.collectedCount = 5;
      this.crystals.forEach(c => c.visible = false);
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('ALL 5 COLLECTED!', '#0d1322', '#10b981');
      }
    }
  }

  update(delta) {
    // Idle rotation for remaining visible crystals
    if (this.crystals) {
      this.crystals.forEach(c => {
        if (c.visible) {
          c.rotation.y += delta * 1.5;
          c.rotation.x += delta * 0.8;
        }
      });
    }

    if (this.drillArm) {
      this.drillArm.rotation.y += delta * 4;
    }
  }
}
