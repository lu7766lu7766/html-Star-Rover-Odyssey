/**
 * Level 8 Scene: 星際氣象站 (Open-Meteo Weather API)
 * Renders Weather Station Tower, radar dish, atmospheric clouds, and probe drone launch.
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
  }

  build() {
    this.grid = createSciFiGrid(60, 20);
    this.group.add(this.grid);

    // Weather Station Base Tower
    this.stationTower = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(1.2, 1.8, 3.5, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
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

    // Fluffy Atmospheric Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      roughness: 0.9
    });

    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), cloudMat);
        puff.position.set(j * 1.5, Math.sin(j) * 0.5, 0);
        cloud.add(puff);
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
    if (this.drone) {
      this.drone.position.set(4, 0.6, 0);
      this.drone.rotation.set(0, 0, 0);
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'EXECUTE_START') {
      soundManager.playThrust();
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isLaunching = true;
      soundManager.playLaunch();
    } else if (actionType === 'RESET') {
      this.reset();
    }
  }

  update(delta) {
    // Spin radar dish continuously
    if (this.radarDish && this.radarDish.userData.head) {
      this.radarDish.userData.head.rotation.y += delta * 1.5;
    }

    // Spin drone rotors
    if (this.drone && this.drone.userData.rotors) {
      this.drone.userData.rotors.forEach(r => {
        r.rotation.y += delta * 25;
      });
    }

    // Animate Drone Launch Lift-off
    if (this.isLaunching && this.drone) {
      this.launchHeight += delta * 8;
      this.drone.position.y = 0.6 + this.launchHeight;
      this.drone.rotation.x = Math.sin(this.launchHeight * 0.5) * 0.15;

      // Gentle cloud drift
      this.clouds.forEach(c => {
        c.position.x += delta * 0.5;
        if (c.position.x > 20) c.position.x = -20;
      });
    }
  }
}
