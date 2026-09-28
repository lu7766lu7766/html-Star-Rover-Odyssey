/**
 * Level 3 Scene: 雷達自主避障
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createAsteroids, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level3Scene extends BaseGameScene {
  constructor() {
    super(3);
    this.rover = null;
    this.asteroids = null;
    this.radarRing = null;
    this.statusText = 'STANDBY';
    this.simulating = false;
    this.simStep = 0;
    this.stepTimer = 0;
  }

  build() {
    this.grid = createSciFiGrid(60, 60, 0xa855f7);
    this.group.add(this.grid);

    this.rover = createSciFiRover();
    this.rover.position.set(0, 0, -12);
    this.group.add(this.rover);

    this.asteroids = createAsteroids();
    this.group.add(this.asteroids);

    // Radar scan ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.radarRing = new THREE.Mesh(ringGeo, ringMat);
    this.radarRing.position.set(0, 0.2, -12);
    this.group.add(this.radarRing);

    this.reset();
  }

  reset() {
    this.simulating = false;
    this.simStep = 0;
    this.stepTimer = 0;
    this.statusText = 'STANDBY';

    if (this.rover) {
      this.rover.position.set(0, 0, -12);
      const { nameLabel, flame } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('RADAR: STANDBY', '#0d1322', '#38bdf8');
      }
      if (flame) flame.material.opacity = 0.5;
    }

    if (this.radarRing) {
      this.radarRing.scale.set(1, 1, 1);
      this.radarRing.position.set(0, 0.2, -12);
    }
  }

  handleAction(actionType, payload) {
    if (actionType === 'LEVEL_SUCCESS') {
      this.simulating = true;
      this.simStep = 1;
      this.stepTimer = 0;
      soundManager.playRadarPing();
    } else if (actionType === 'LEVEL_FAIL') {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('COLLISION ALERT!', '#0d1322', '#ef4444');
      }
    }
  }

  update(delta) {
    // Pulse radar ring
    if (this.radarRing && this.rover) {
      this.radarRing.position.x = this.rover.position.x;
      this.radarRing.position.z = this.rover.position.z;
      const s = (this.radarRing.scale.x + delta * 3) % 6;
      this.radarRing.scale.set(s, s, s);
      this.radarRing.material.opacity = Math.max(0, 1 - s / 6);
    }

    // Step-by-step autopilot simulation
    if (this.simulating && this.rover) {
      this.stepTimer += delta;
      const { nameLabel } = this.rover.userData;

      // Stage 1: Full Speed (Distance > 15)
      if (this.simStep === 1) {
        this.rover.position.z += delta * 6;
        if (nameLabel) nameLabel.material.map = createTextTexture('SPEED: FULL_SPEED', '#0d1322', '#10b981');
        if (this.rover.position.z >= -4) {
          this.simStep = 2;
          this.stepTimer = 0;
          soundManager.playRadarPing();
        }
      }
      // Stage 2: Slow Down (5 <= Distance <= 15)
      else if (this.simStep === 2) {
        this.rover.position.z += delta * 2.5;
        if (nameLabel) nameLabel.material.map = createTextTexture('SPEED: SLOW_DOWN', '#0d1322', '#f59e0b');
        if (this.rover.position.z >= 1.5) {
          this.simStep = 3;
          this.stepTimer = 0;
          soundManager.playRadarPing();
        }
      }
      // Stage 3: Stop safely before closest obstacle (Distance < 5)
      else if (this.simStep === 3) {
        if (nameLabel) nameLabel.material.map = createTextTexture('SPEED: STOP (SAFE)', '#0d1322', '#00f2fe');
        if (this.stepTimer > 1.5) {
          this.simulating = false;
        }
      }
    }
  }
}
