/**
 * Level 2 Scene: 推進力計算與大氣層發射
 * 特色：直觀的 3D 太空發射跑道、24 米軌道補給站、精確距離停靠物理與自動位置還原機制
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
    this.runway = null;
    this.spaceStation = null;
    this.stationRing = null;
    this.stationLights = [];
    
    // Physics and simulation state
    this.isLaunching = false;
    this.currentDistance = 0;
    this.targetDistance = 0;
    this.launchSpeed = 0;
    this.fuelRemaining = 150;
    this.success = false;
    this.settled = false;
  }

  init(sceneManager) {
    this.sceneManager = sceneManager;
    this.build();
    this.resetCamera();
  }

  resetCamera() {
    if (this.sceneManager && this.sceneManager.cameraController) {
      // Perspective: Behind and slightly to the left, looking down the runway towards +Z
      this.sceneManager.cameraController.reset(
        new THREE.Vector3(-10, 8, -6),
        new THREE.Vector3(0, 1.8, 12)
      );
    }
  }

  build() {
    // 1. Grid Ground
    this.grid = createSciFiGrid(100, 100, 0x38bdf8);
    this.group.add(this.grid);

    // 2. High-Tech Launch Runway
    this.buildRunway();

    // 3. Target Orbital Space Station at z = 24
    this.buildSpaceStation();

    // 4. Sci-Fi Rover
    this.rover = createSciFiRover();
    this.rover.position.set(0, 0.1, 0);
    this.group.add(this.rover);

    this.reset();
  }

  buildRunway() {
    this.runway = new THREE.Group();
    this.runway.name = 'LaunchRunway';

    // Main Runway Slab (Length: 36m from z = -4 to z = 32)
    const slabGeo = new THREE.BoxGeometry(4.4, 0.25, 36);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, 0.12, 14);
    this.runway.add(slab);

    // Glowing Neon Rails (Left & Right)
    const railGeo = new THREE.BoxGeometry(0.12, 0.18, 36);
    const railMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-2.2, 0.3, 14);
    this.runway.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(2.2, 0.3, 14);
    this.runway.add(rightRail);

    // Distance Markers every 4 meters (0m, 4m, 8m, 12m, 16m, 20m, 24m)
    const markers = [
      { z: 0, label: 'START 0m', color: '#10b981', stripeColor: 0x10b981 },
      { z: 4, label: '4m', color: '#94a3b8', stripeColor: 0x64748b },
      { z: 8, label: '8m', color: '#94a3b8', stripeColor: 0x64748b },
      { z: 12, label: '12m', color: '#94a3b8', stripeColor: 0x64748b },
      { z: 16, label: '16m', color: '#94a3b8', stripeColor: 0x64748b },
      { z: 20, label: '20m', color: '#94a3b8', stripeColor: 0x64748b },
      { z: 24, label: '★ TARGET 24m', color: '#f59e0b', stripeColor: 0xf59e0b }
    ];

    markers.forEach(m => {
      // Cross stripe across runway
      const stripeGeo = new THREE.BoxGeometry(4.2, 0.02, 0.3);
      const stripeMat = new THREE.MeshBasicMaterial({ color: m.stripeColor });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.26, m.z);
      this.runway.add(stripe);

      // Metric Sign Pillar on the right side
      const signPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
      const signPostMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const signPost = new THREE.Mesh(signPostGeo, signPostMat);
      signPost.position.set(2.8, 0.6, m.z);
      this.runway.add(signPost);

      const signBoardGeo = new THREE.PlaneGeometry(1.6, 0.5);
      const signBoardMat = new THREE.MeshBasicMaterial({
        map: createTextTexture(m.label, '#ffffff', m.color),
        side: THREE.DoubleSide
      });
      const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
      signBoard.position.set(2.8, 1.3, m.z);
      signBoard.rotation.y = -Math.PI / 3;
      this.runway.add(signBoard);
    });

    this.group.add(this.runway);
  }

  buildSpaceStation() {
    this.spaceStation = new THREE.Group();
    this.spaceStation.name = 'OrbitalSpaceStation';
    this.spaceStation.position.set(0, 2.5, 24);

    // Outer Docking Torus Ring
    const torusGeo = new THREE.TorusGeometry(3.6, 0.32, 16, 48);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });
    this.stationRing = new THREE.Mesh(torusGeo, torusMat);
    this.spaceStation.add(this.stationRing);

    // Inner Glowing Docking Field
    const fieldGeo = new THREE.RingGeometry(1.2, 3.2, 32);
    const fieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    this.spaceStation.add(field);

    // Solar Wings (Left & Right)
    const wingGeo = new THREE.BoxGeometry(4.5, 0.1, 1.4);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-6.2, 0, 0);
    this.spaceStation.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(6.2, 0, 0);
    this.spaceStation.add(rightWing);

    // Docking Guide Light Beacons
    [-2, 2].forEach(x => {
      const beaconGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(x, -2, 0);
      this.spaceStation.add(beacon);
      this.stationLights.push(beacon);
    });

    // Space Station Banner
    const bannerGeo = new THREE.PlaneGeometry(3.2, 0.7);
    const bannerMat = new THREE.MeshBasicMaterial({
      map: createTextTexture('★ 軌道補給站 DOCKING BAY', '#ffffff', '#2563eb'),
      side: THREE.DoubleSide
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 4.4, 0);
    this.spaceStation.add(banner);

    this.group.add(this.spaceStation);
  }

  resetRoverPosition() {
    this.isLaunching = false;
    this.launchSpeed = 0;
    this.currentDistance = 0;
    this.targetDistance = 0;
    this.settled = true;

    if (this.rover) {
      this.rover.position.set(0, 0.1, 0);
      this.rover.rotation.set(0, 0, 0);
      const { flame, nameLabel, batteryBar } = this.rover.userData;
      if (flame) {
        flame.material.opacity = 0;
        flame.scale.set(1, 1, 1);
      }
      if (batteryBar) {
        batteryBar.scale.x = 1.0;
        batteryBar.material.color.setHex(0x10b981);
      }
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('起點 READY · 0m', '#ffffff', '#2563eb');
        nameLabel.material.needsUpdate = true;
      }
    }

    this.resetCamera();
  }

  reset() {
    this.resetRoverPosition();
    this.fuelRemaining = 150;
    this.success = false;
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_SCENE' || actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.resetRoverPosition();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      // 1. Immediately restore rover to start pad before launching
      this.resetRoverPosition();

      const params = payload.payload?.params || payload.params || {};
      const { initialFuel = 150, burnPerThrust = 30, thrustCount = 3, speed = 2 } = params;
      
      const totalBurn = thrustCount * burnPerThrust;
      const remainingFuel = initialFuel - totalBurn;
      this.fuelRemaining = remainingFuel;

      // Calculate total displacement = thrustCount * speed
      this.targetDistance = thrustCount * speed;
      this.currentDistance = 0;
      this.launchSpeed = Math.max(speed * 3.2, 4);
      this.isLaunching = true;
      this.settled = false;
      this.success = false;

      try { soundManager.playThruster(); } catch (e) {}

      const { flame, flameGlow, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.9;
      if (flameGlow) flameGlow.material.opacity = 0.75;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture(
          `推進中: ${speed} 格/次 | 目標: ${this.targetDistance}m`,
          '#ffffff',
          '#0284c7'
        );
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.success = true;
      const { flame, flameGlow, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.5;
      if (flameGlow) flameGlow.material.opacity = 0.45;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('★ 成功入軌！完美對接 24m', '#ffffff', '#10b981');
        nameLabel.material.needsUpdate = true;
      }
      this.stationLights.forEach(b => b.material.color.setHex(0x10b981));
    } else if (actionType === 'LEVEL_FAIL') {
      this.success = false;
      const { flame, flameGlow, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0;
      if (flameGlow) flameGlow.material.opacity = 0;
      if (nameLabel) {
        if (this.fuelRemaining < 0) {
          nameLabel.material.map = createTextTexture('⚠️ 燃料耗盡！半途熄火', '#ffffff', '#ef4444');
        } else if (this.targetDistance < 24) {
          nameLabel.material.map = createTextTexture(`⚠️ 推力不足！停於 ${this.targetDistance}m (缺 ${24 - this.targetDistance}m)`, '#ffffff', '#f59e0b');
        } else if (this.targetDistance > 24) {
          nameLabel.material.map = createTextTexture(`⚠️ 超速衝出！${this.targetDistance}m (+${this.targetDistance - 24}m)`, '#ffffff', '#ef4444');
        } else {
          nameLabel.material.map = createTextTexture('軌道計算未達標', '#ffffff', '#ef4444');
        }
        nameLabel.material.needsUpdate = true;
      }
      this.stationLights.forEach(b => b.material.color.setHex(0xef4444));
      try { soundManager.playError(); } catch (e) {}
    }
  }

  update(delta) {
    // Rotate Space Station Ring
    if (this.stationRing) {
      this.stationRing.rotation.z += delta * 0.4;
    }

    // Launch Physics Simulation
    if (this.isLaunching && this.rover) {
      if (this.currentDistance < this.targetDistance) {
        const step = this.launchSpeed * delta;
        this.currentDistance = Math.min(this.targetDistance, this.currentDistance + step);
        this.rover.position.z = this.currentDistance;

        // Subtle wheel roll
        if (this.rover.userData.wheels) {
          this.rover.userData.wheels.forEach(w => {
            w.children[0].rotation.x += step * 2.0;
          });
        }

        // Camera smoothly follows rover forward
        if (this.sceneManager && this.sceneManager.cameraController && this.sceneManager.cameraController.controls) {
          const targetZ = Math.min(this.currentDistance + 3.0, 24);
          this.sceneManager.cameraController.controls.target.z = targetZ;
        }

        // Dynamic 3D distance readout during travel
        const { nameLabel, flame } = this.rover.userData;
        if (nameLabel) {
          nameLabel.material.map = createTextTexture(
            `航行中: ${this.currentDistance.toFixed(1)}m / 目標: ${this.targetDistance}m`,
            '#ffffff',
            '#0284c7'
          );
          nameLabel.material.needsUpdate = true;
        }

        if (flame) {
          flame.scale.set(1.2, 1.8 + Math.random() * 0.6, 1.2);
        }
      } else {
        // Reached calculated target distance -> Stop immediately!
        this.isLaunching = false;
        this.rover.position.z = this.targetDistance;

        const { flame, flameGlow, nameLabel } = this.rover.userData;
        if (flame) flame.material.opacity = 0;
        if (flameGlow) flameGlow.material.opacity = 0;

        if (nameLabel) {
          if (this.targetDistance === 24 && this.fuelRemaining >= 0) {
            nameLabel.material.map = createTextTexture('★ 24m 對接完成！', '#ffffff', '#10b981');
          } else if (this.targetDistance < 24) {
            nameLabel.material.map = createTextTexture(
              `停靠於 ${this.targetDistance}m (未達 24m 補給站)`,
              '#ffffff',
              '#f59e0b'
            );
          } else {
            nameLabel.material.map = createTextTexture(
              `衝出補給站！${this.targetDistance}m`,
              '#ffffff',
              '#ef4444'
            );
          }
          nameLabel.material.needsUpdate = true;
        }
      }
    }
  }
}
