/**
 * Level 8 Scene: 星際氣象站 (Open-Meteo Weather API & Drone Flight Dynamics)
 * Renders Weather Station Tower, radar dish, atmospheric clouds, and probe drone launch
 * with distinctive animations for success (piercing clouds) and failures (wind buffeting, icing stall, rain short-circuit, disconnect).
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiGrid, createPatrolDrone, createScannerDish } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level8Scene extends BaseGameScene {
  constructor() {
    super(8);
    this.grid = null;
    this.stationTower = null;
    this.drone = null;
    this.radarDish = null;
    this.clouds = [];
    this.isLaunching = false;
    this.launchHeight = 0;
    this.failMode = null; // 'WIND' | 'TEMP' | 'PRECIP' | 'DISCONNECT'
    this.failAnimTimer = 0;
  }

  build() {
    this.grid = createSciFiGrid(60, 20, 0x38bdf8, 0x475569);
    this.group.add(this.grid);

    // Weather Station Base Tower — 深 slate 塔身，在淺色天空與深色地板上都清晰
    this.stationTower = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(1.2, 1.8, 3.5, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 1.75;
    this.stationTower.add(tower);

    // Weather radar dish on tower
    this.radarDish = createScannerDish();
    this.radarDish.position.set(0, 3.6, 0);
    this.stationTower.add(this.radarDish);
    this.stationTower.position.set(-4, 0, 0);
    this.group.add(this.stationTower);

    // Launch Pad for Probe Drone
    const padGeo = new THREE.CylinderGeometry(1.8, 2.0, 0.3, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(4, 0.15, 0);
    this.group.add(pad);

    // Probe Drone
    this.drone = createPatrolDrone('WEATHER_PROBE', 0x10b981);
    this.drone.position.set(4, 0.6, 0);
    this.group.add(this.drone);

    // Fluffy Atmospheric Clouds — 淺灰藍雲體 + 深色描邊，在淺色天空下仍可辨識
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.92,
      roughness: 0.9
    });
    const cloudEdgeMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.55
    });

    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puffGeo = new THREE.DodecahedronGeometry(1.8, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(j * 1.5, Math.sin(j) * 0.5, 0);
        cloud.add(puff);
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(puffGeo),
          cloudEdgeMat
        );
        edges.position.copy(puff.position);
        cloud.add(edges);
      }
      cloud.position.set((i - 2.5) * 6, 8 + Math.sin(i) * 2, -10 + i * 3);
      this.group.add(cloud);
      this.clouds.push(cloud);
    }

    this.reset();
  }

  reset() {
    this.isLaunching = false;
    this.launchHeight = 0;
    this.failMode = null;
    this.failAnimTimer = 0;
    if (this.drone) {
      this.drone.position.set(4, 0.6, 0);
      this.drone.rotation.set(0, 0, 0);
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_SCENE' || actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.reset();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      this.reset();
      try { soundManager.playThrust(); } catch (e) {}
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.failMode = null;
      this.isLaunching = true;
      try { soundManager.playLaunch(); } catch (e) {}
    } else if (actionType === 'LEVEL_FAIL') {
      this.isLaunching = false;
      this.failAnimTimer = 0;
      this.failMode = payload.evaluation?.failReason || 'WIND';
      try { soundManager.playError(); } catch (e) {}
    }
  }

  update(delta) {
    // Spin radar dish continuously
    if (this.radarDish && this.radarDish.userData.head) {
      this.radarDish.userData.head.rotation.y += delta * 1.5;
    }

    // Spin drone rotors (unless frozen in icing fail mode)
    const rotorSpeed = this.failMode === 'TEMP' ? Math.max(0, 25 - this.failAnimTimer * 15) : 25;
    if (this.drone && this.drone.userData.rotors) {
      this.drone.userData.rotors.forEach(r => {
        r.rotation.y += delta * rotorSpeed;
      });
    }

    // 1. Success Animation: Drone launches up smoothly into clouds
    if (this.isLaunching && this.drone) {
      this.launchHeight += delta * 9;
      this.drone.position.y = 0.6 + this.launchHeight;
      this.drone.rotation.x = Math.sin(this.launchHeight * 0.4) * 0.1;
      this.drone.rotation.z = Math.cos(this.launchHeight * 0.3) * 0.05;

      // Gentle cloud drift
      this.clouds.forEach(c => {
        c.position.x += delta * 0.5;
        if (c.position.x > 20) c.position.x = -20;
      });
    }

    // 2. Failure Animations
    if (this.failMode && this.drone) {
      this.failAnimTimer += delta;

      if (this.failMode === 'WIND') {
        // Drone lifts off slightly, wobbles violently in high wind, then tilts and crashes down
        if (this.failAnimTimer < 1.2) {
          this.drone.position.y = 0.6 + Math.sin(this.failAnimTimer * Math.PI) * 1.8;
          this.drone.rotation.z = Math.sin(this.failAnimTimer * 18) * 0.55;
          this.drone.rotation.x = Math.cos(this.failAnimTimer * 12) * 0.4;
          this.drone.position.x = 4 + Math.sin(this.failAnimTimer * 8) * 0.8;
        } else {
          // Lands back on pad tilted
          this.drone.position.set(4.3, 0.6, 0);
          this.drone.rotation.set(0.1, 0, 0.4);
        }
      } else if (this.failMode === 'TEMP') {
        // Jitters due to freezing, rotors slow down, drops onto pad
        if (this.failAnimTimer < 1.5) {
          const jitter = (Math.random() - 0.5) * 0.08;
          this.drone.position.y = 0.6 + Math.min(this.failAnimTimer * 0.4, 0.5) + jitter;
          this.drone.position.x = 4 + jitter;
        } else {
          this.drone.position.set(4, 0.6, 0);
          this.drone.rotation.set(0, 0, 0);
        }
      } else if (this.failMode === 'PRECIP') {
        // Rotor twitching / descending in rain
        if (this.failAnimTimer < 1.2) {
          this.drone.position.y = 0.6 + Math.sin(this.failAnimTimer * 2) * 0.6;
          this.drone.rotation.z = Math.sin(this.failAnimTimer * 25) * 0.2;
        } else {
          this.drone.position.set(4, 0.6, 0);
          this.drone.rotation.set(0, 0, 0);
        }
      } else if (this.failMode === 'DISCONNECT') {
        // Drone remains grounded, slight vibration then stops
        if (this.failAnimTimer < 0.6) {
          this.drone.position.y = 0.6 + (Math.random() - 0.5) * 0.04;
        } else {
          this.drone.position.set(4, 0.6, 0);
          this.drone.rotation.set(0, 0, 0);
        }
      }
    }
  }
}
