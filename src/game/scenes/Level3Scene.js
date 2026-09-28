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
        nameLabel.material.map = createTextTexture('RADAR: STANDBY', '#ffffff', '#2563eb');
        nameLabel.material.needsUpdate = true;
      }
      if (flame) flame.material.opacity = 0.5;
    }

    if (this.radarRing) {
      this.radarRing.scale.set(1, 1, 1);
      this.radarRing.position.set(0, 0.2, -12);
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.reset();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      this.reset();
      this.simulating = true;
      this.simStep = 1;
      this.stepTimer = 0;
      try { soundManager.playRadarPing(); } catch (e) {}
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.simulating = true;
      if (this.simStep < 2) this.simStep = 2;
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('AVOIDANCE VERIFIED', '#ffffff', '#10b981');
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_FAIL') {
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('COLLISION ALERT!', '#ffffff', '#ef4444');
        nameLabel.material.needsUpdate = true;
      }
      try { soundManager.playError(); } catch (e) {}
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
        if (nameLabel) {
          nameLabel.material.map = createTextTexture('SPEED: FULL_SPEED', '#ffffff', '#10b981');
          nameLabel.material.needsUpdate = true;
        }
        if (this.rover.position.z >= -4) {
          this.simStep = 2;
          this.stepTimer = 0;
          try { soundManager.playRadarPing(); } catch (e) {}
        }
      }
      // Stage 2: Slow Down (5 <= Distance <= 15)
      else if (this.simStep === 2) {
        this.rover.position.z += delta * 2.5;
        if (nameLabel) {
          nameLabel.material.map = createTextTexture('SPEED: SLOW_DOWN', '#ffffff', '#f59e0b');
          nameLabel.material.needsUpdate = true;
        }
        if (this.rover.position.z >= 1.5) {
          this.simStep = 3;
          this.stepTimer = 0;
          try { soundManager.playRadarPing(); } catch (e) {}
        }
      }
      // Stage 3: Stop safely before closest obstacle (Distance < 5)
      else if (this.simStep === 3) {
        if (nameLabel) {
          nameLabel.material.map = createTextTexture('SPEED: STOP (SAFE)', '#ffffff', '#2563eb');
          nameLabel.material.needsUpdate = true;
        }
        if (this.stepTimer > 1.5) {
          this.simulating = false;
        }
      }
    }
  }
}
