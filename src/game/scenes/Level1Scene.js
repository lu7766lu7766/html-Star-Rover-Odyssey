/**
 * Level 1 Scene: 探測船通電自檢
 * Visualizes variables directly into 3D:
 * - roverName => 3D Holographic Nameplate
 * - powerLevel => Reactor Core Glow & Energy Bar
 * - shieldActive => Shimmering Quantum Plasma Shield Bubble
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createLandingPad, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level1Scene extends BaseGameScene {
  constructor() {
    super(1);
    this.rover = null;
    this.grid = null;
    this.dockPad = null;
    this.shieldMesh = null;
    this.dockBeacons = [];

    this.isDiagnosing = false;
    this.diagnosticTimer = 0;
    this.currentPower = 0;
    this.targetPower = 0;
    this.isShieldOn = false;
  }

  build() {
    // 1. Clean grid floor
    this.grid = createSciFiGrid(60, 20, 0x38bdf8, 0xe2e8f0);
    this.group.add(this.grid);

    // 2. High-tech Maintenance Dock Platform
    this.dockPad = createLandingPad(2.8, 0x2563eb);
    this.dockPad.position.set(0, 0, 0);
    this.group.add(this.dockPad);

    // 3. Dock Corner Diagnostic Beacons
    const beaconCoords = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
    beaconCoords.forEach(([bx, bz]) => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 12);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(bx, 0.6, bz);

      const bulbGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 0.6;
      pole.add(bulb);

      this.group.add(pole);
      this.dockBeacons.push(bulb);
    });

    // 4. SciFi Rover
    this.rover = createSciFiRover();
    this.rover.position.set(0, 0, 0);
    this.group.add(this.rover);

    // 5. Plasma Shield Bubble (Sphere around rover)
    const shieldGeo = new THREE.SphereGeometry(2.4, 32, 24);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      reflectivity: 0.9,
      wireframe: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 1.0, 0);
    this.group.add(this.shieldMesh);

    this.reset();
  }

  resetCamera() {
    if (this.sceneManager && this.sceneManager.cameraController) {
      this.sceneManager.cameraController.reset(
        new THREE.Vector3(0, 4.5, 7.5),
        new THREE.Vector3(0, 1.0, 0)
      );
    }
  }

  init(sceneManager) {
    this.sceneManager = sceneManager;
    this.build();
    this.resetCamera();
  }

  reset() {
    this.isDiagnosing = false;
    this.diagnosticTimer = 0;
    this.currentPower = 0;
    this.targetPower = 0;
    this.isShieldOn = false;

    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0;
    }

    if (this.rover) {
      this.rover.position.set(0, 0, 0);
      this.rover.rotation.set(0, 0, 0);
      const { flame, batteryBar, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0;
      if (batteryBar) batteryBar.scale.x = 0.01;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('OFFLINE · UNCONFIGURED', '#ffffff', '#64748b');
        nameLabel.material.needsUpdate = true;
      }
    }

    this.dockBeacons.forEach(b => {
      b.material.color.setHex(0x93c5fd);
    });
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'RESET_SCENE' || actionType === 'RESET_POSITION' || actionType === 'RESET') {
      this.reset();
      this.resetCamera();
      return;
    }

    if (actionType === 'EXECUTE_START') {
      this.reset();
      const inner = payload.payload || payload || {};
      let vars = inner.variables || {};
      // 寫碼模式：Worker 真跑 rover.setup(name, battery, isActive) 的 trace
      const setupCall = inner.apiCalls?.find((c) => c.api === 'rover.setup');
      if (setupCall) {
        const [roverName, powerLevel, shieldActive] = setupCall.args;
        vars = { roverName, powerLevel, shieldActive };
      }
      const { roverName = '奧德賽號', powerLevel = 0, shieldActive = false } = vars;

      this.isDiagnosing = true;
      this.diagnosticTimer = 0;
      this.targetPower = Math.min(Math.max(powerLevel, 0), 100);
      this.isShieldOn = !!shieldActive;

      try { soundManager.playPowerUp(); } catch (e) {}

      // Update nameplate immediately to show configured variable
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture(
          roverName ? `SHIP: ${roverName.toUpperCase()}` : 'UNNAMED',
          '#ffffff',
          '#2563eb'
        );
        nameLabel.material.needsUpdate = true;
      }
    } else if (actionType === 'LEVEL_SUCCESS') {
      this.isDiagnosing = false;
      const { flame, flameGlow, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.75;
      if (flameGlow) flameGlow.material.opacity = 0.7;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('ALL SYSTEMS ONLINE ✓', '#ffffff', '#10b981');
        nameLabel.material.needsUpdate = true;
      }
      this.dockBeacons.forEach(b => b.material.color.setHex(0x10b981));
    } else if (actionType === 'LEVEL_FAIL') {
      this.isDiagnosing = false;
      const { flame, flameGlow, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0;
      if (flameGlow) flameGlow.material.opacity = 0;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('CHECK FAILED ⚠️', '#ffffff', '#ef4444');
        nameLabel.material.needsUpdate = true;
      }
      this.dockBeacons.forEach(b => b.material.color.setHex(0xef4444));
      try { soundManager.playError(); } catch (e) {}
    }
  }

  update(delta) {
    // Subtle idle hover oscillation if power is active
    if (this.currentPower > 20 && this.rover) {
      this.rover.position.y = 0.05 + Math.sin(Date.now() * 0.004) * 0.04;
    }

    // Diagnostic Power Charging Animation
    if (this.isDiagnosing) {
      this.diagnosticTimer += delta;

      // Charge power up smoothly to targetPower
      if (this.currentPower < this.targetPower) {
        this.currentPower = Math.min(this.targetPower, this.currentPower + delta * 60);
      } else if (this.currentPower > this.targetPower) {
        this.currentPower = Math.max(this.targetPower, this.currentPower - delta * 60);
      }

      // Update battery bar in 3D
      if (this.rover && this.rover.userData.batteryBar) {
        const pct = Math.max(0.01, this.currentPower / 100);
        this.rover.userData.batteryBar.scale.x = pct;
        this.rover.userData.batteryBar.material.color.setHex(
          this.currentPower < 80 ? 0xf59e0b : 0x10b981
        );
      }

      // Flash dock beacons
      const beaconColor = (Math.sin(this.diagnosticTimer * 10) > 0) ? 0x38bdf8 : 0x2563eb;
      this.dockBeacons.forEach(b => b.material.color.setHex(beaconColor));

      // Thruster flame warmup + glow sprite
      if (this.rover && this.rover.userData.flame) {
        this.rover.userData.flame.material.opacity = (this.currentPower / 100) * 0.45;
        if (this.rover.userData.flameGlow) {
          this.rover.userData.flameGlow.material.opacity = (this.currentPower / 100) * 0.5;
        }
      }

      // Antenna heartbeat
      if (this.rover?.userData?.antennaTip) {
        const pulse = 1.6 + Math.sin(this.diagnosticTimer * 6) * 0.9;
        this.rover.userData.antennaTip.material.emissiveIntensity = pulse;
      }
    } else if (this.rover?.userData?.flameGlow) {
      this.rover.userData.flameGlow.material.opacity = THREE.MathUtils.lerp(
        this.rover.userData.flameGlow.material.opacity, 0, delta * 5
      );
    }

    // Shield Shimmering Animation
    if (this.shieldMesh) {
      if (this.isShieldOn && this.currentPower >= 50) {
        // Fade in shield
        this.shieldMesh.material.opacity = THREE.MathUtils.lerp(this.shieldMesh.material.opacity, 0.42, delta * 3);
        // Gentle pulse scale
        const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.03;
        this.shieldMesh.scale.set(s, s, s);
        this.shieldMesh.rotation.y += delta * 0.4;
      } else {
        // Fade out shield
        this.shieldMesh.material.opacity = THREE.MathUtils.lerp(this.shieldMesh.material.opacity, 0, delta * 6);
      }
    }
  }
}
