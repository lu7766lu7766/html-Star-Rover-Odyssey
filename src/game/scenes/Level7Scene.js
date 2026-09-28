/**
 * Level 7 Scene: 無人機編隊
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiGrid, createDrone } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level7Scene extends BaseGameScene {
  constructor() {
    super(7);
    this.drones = [];
    this.isDeployed = false;
    this.hoverTime = 0;
  }

  build() {
    const grid = createSciFiGrid(60, 60, 0x00f2fe);
    this.group.add(grid);

    const initialDrones = [
      { id: "drone-01", x: -6, y: 5, z: 2, battery: 85 },
      { id: "drone-02", x: -2, y: 7, z: -3, battery: 18 },
      { id: "drone-03", x: 3, y: 6, z: 1, battery: 92 },
      { id: "drone-04", x: 7, y: 4, z: -2, battery: 15 }
    ];

    this.drones = [];
    initialDrones.forEach(d => {
      const droneMesh = createDrone(d.id, d.x, d.y, d.z, d.battery);
      this.group.add(droneMesh);
      this.drones.push(droneMesh);
    });

    this.reset();
  }

  reset() {
    this.isDeployed = false;
    this.hoverTime = 0;

    const initialDrones = [
      { id: "drone-01", x: -6, y: 5, z: 2, battery: 85 },
      { id: "drone-02", x: -2, y: 7, z: -3, battery: 18 },
      { id: "drone-03", x: 3, y: 6, z: 1, battery: 92 },
      { id: "drone-04", x: 7, y: 4, z: -2, battery: 15 }
    ];

    this.drones.forEach((mesh, idx) => {
      const cfg = initialDrones[idx];
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.userData.status = cfg.battery < 20 ? 'WARNING' : 'PATROL';
      if (mesh.userData.beaconMat) {
        mesh.userData.beaconMat.color.setHex(cfg.battery < 20 ? 0xef4444 : 0x10b981);
      }
    });
  }

  handleAction(actionType, payload) {
    if (actionType === 'LEVEL_SUCCESS') {
      this.isDeployed = true;
      soundManager.playDroneFly();

      const fleet = payload.data?.fleet || [];
      fleet.forEach(fData => {
        const mesh = this.drones.find(d => d.name === fData.id);
        if (mesh) {
          mesh.userData.status = fData.status;
          const isWarn = fData.status === 'WARNING';
          if (mesh.userData.beaconMat) {
            mesh.userData.beaconMat.color.setHex(isWarn ? 0xef4444 : 0x10b981);
          }
        }
      });
    }
  }

  update(delta) {
    this.hoverTime += delta * 2.5;

    this.drones.forEach((drone, idx) => {
      const { baseY, status } = drone.userData;

      // Bobbing
      drone.position.y = baseY + Math.sin(this.hoverTime + idx) * 0.25;

      if (this.isDeployed) {
        if (status === 'PATROL') {
          // Patrol orbital circular flight
          drone.rotation.y += delta * 1.2;
          drone.position.x += Math.cos(this.hoverTime + idx) * delta * 2;
          drone.position.z += Math.sin(this.hoverTime + idx) * delta * 2;
        } else if (status === 'WARNING') {
          // Low battery warning pulse and descent to deck
          if (drone.position.y > 1.2) {
            drone.userData.baseY = Math.max(1.0, baseY - delta * 2);
          }
          if (drone.userData.beaconMat) {
            const pulse = (Math.sin(this.hoverTime * 8) + 1) / 2;
            drone.userData.beaconMat.color.setRGB(1.0, pulse * 0.2, pulse * 0.2);
          }
        }
      }
    });
  }
}
