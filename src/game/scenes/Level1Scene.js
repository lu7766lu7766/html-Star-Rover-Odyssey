/**
 * Level 1 Scene: 探測船啟航
 * Renders Rover, obstacles, glowing landing pad, and animates command execution sequence step-by-step.
 */

import * as THREE from 'three';
import { BaseGameScene } from './BaseGameScene.js';
import { createSciFiRover, createSciFiGrid, createLandingPad, createAsteroids, createTextTexture } from '../models/ProceduralMeshes.js';
import { soundManager } from '../core/SoundManager.js';

export class Level1Scene extends BaseGameScene {
  constructor() {
    super(1);
    this.rover = null;
    this.grid = null;
    this.landingPad = null;
    this.obstacles = null;

    this.isPowered = false;
    this.isAnimating = false;
    this.animationQueue = [];
    this.currentStep = null;
    this.stepProgress = 0;

    // Grid coordinates: 1 unit in logic = 3.0 units in 3D space
    this.stepSize = 3.0;
    this.roverFacing = 0; // 0: +Z (forward), 1: +X (right), 2: -Z (backward), 3: -X (left)
  }

  build() {
    this.grid = createSciFiGrid(60, 20);
    this.group.add(this.grid);

    // Glowing target pad at logic (0, 3) => 3D (0, 0, 9)
    this.landingPad = createLandingPad(1.8, 0x10b981);
    this.landingPad.position.set(0, 0, 9);
    this.group.add(this.landingPad);

    // Obstacles at logic (0, 1) and (0, 2) => 3D (0, 0, 3) and (0, 0, 6)
    this.obstacles = createAsteroids([
      { x: 0, y: 1.0, z: 3.0, scale: 1.2 },
      { x: 0, y: 1.0, z: 6.0, scale: 1.3 }
    ]);
    this.group.add(this.obstacles);

    this.rover = createSciFiRover();
    this.group.add(this.rover);

    this.reset();
  }

  resetCamera() {
    if (this.sceneManager && this.sceneManager.cameraController) {
      this.sceneManager.cameraController.reset(
        new THREE.Vector3(0, 10, -6),
        new THREE.Vector3(0, 1, 5)
      );
    }
  }

  init(sceneManager) {
    this.sceneManager = sceneManager;
    this.build();
    this.resetCamera();
  }

  reset() {
    this.isPowered = false;
    this.isAnimating = false;
    this.animationQueue = [];
    this.currentStep = null;
    this.stepProgress = 0;
    this.roverFacing = 0;

    if (this.rover) {
      this.rover.position.set(0, 0, 0);
      this.rover.rotation.set(0, 0, 0);
      const { flame, batteryBar, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0;
      if (batteryBar) batteryBar.scale.x = 0.01;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('OFFLINE', '#ffffff', '#64748b');
        nameLabel.material.needsUpdate = true;
      }
    }
  }

  handleAction(actionType, payload = {}) {
    if (actionType === 'EXECUTE_START') {
      const sequence = payload.payload?.sequence || payload.sequence || [];
      this.startSequenceAnimation(sequence);
    } else if (actionType === 'LEVEL_SUCCESS') {
      if (this.rover) {
        const { flame, nameLabel } = this.rover.userData;
        if (flame) flame.material.opacity = 0.85;
        if (nameLabel) {
          nameLabel.material.map = createTextTexture('MISSION COMPLETE', '#ffffff', '#10b981');
          nameLabel.material.needsUpdate = true;
        }
      }
    } else if (actionType === 'LEVEL_FAIL') {
      if (this.rover) {
        const { flame, nameLabel } = this.rover.userData;
        if (flame) flame.material.opacity = 0.2;
        if (nameLabel) {
          nameLabel.material.map = createTextTexture('MISSION HALTED', '#ffffff', '#ef4444');
          nameLabel.material.needsUpdate = true;
        }
      }
    } else if (actionType === 'RESET') {
      this.reset();
      this.resetCamera();
    }
  }

  startSequenceAnimation(sequence) {
    this.reset();
    if (!sequence || sequence.length === 0) return;
    this.animationQueue = [...sequence];
    this.isAnimating = true;
    this.prepareNextStep();
  }

  prepareNextStep() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      this.currentStep = null;
      return;
    }

    const cmd = this.animationQueue.shift();
    this.stepProgress = 0;

    if (cmd === 'START_ENGINE') {
      this.isPowered = true;
      try { soundManager.playPowerUp(); } catch (e) {}
      const { flame, batteryBar, nameLabel } = this.rover.userData;
      if (flame) flame.material.opacity = 0.6;
      if (batteryBar) batteryBar.scale.x = 1.0;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('ONLINE', '#ffffff', '#2563eb');
        nameLabel.material.needsUpdate = true;
      }
      this.currentStep = { type: 'START_ENGINE', duration: 0.45 };
    } else if (!this.isPowered) {
      // Cannot move or turn without powering on first!
      const { nameLabel } = this.rover.userData;
      if (nameLabel) {
        nameLabel.material.map = createTextTexture('NO POWER!', '#ffffff', '#ef4444');
        nameLabel.material.needsUpdate = true;
      }
      try { soundManager.playError(); } catch (e) {}
      this.isAnimating = false;
      this.currentStep = null;
      return;
    } else if (cmd === 'TURN_RIGHT') {
      try { soundManager.playThrust(); } catch (e) {}
      const startRot = this.rover.rotation.y;
      const targetRot = startRot + Math.PI / 2; // +PI/2 rotates towards +X (Right on screen)
      this.roverFacing = (this.roverFacing + 1) % 4;
      this.currentStep = { type: 'ROTATE', startRot, targetRot, duration: 0.4 };
    } else if (cmd === 'TURN_LEFT') {
      try { soundManager.playThrust(); } catch (e) {}
      const startRot = this.rover.rotation.y;
      const targetRot = startRot - Math.PI / 2; // -PI/2 rotates towards -X (Left on screen)
      this.roverFacing = (this.roverFacing + 3) % 4;
      this.currentStep = { type: 'ROTATE', startRot, targetRot, duration: 0.4 };
    } else if (cmd === 'MOVE_FORWARD') {
      try { soundManager.playThrust(); } catch (e) {}
      const startX = this.rover.position.x;
      const startZ = this.rover.position.z;
      let dx = 0;
      let dz = 0;
      if (this.roverFacing === 0) dz = this.stepSize;
      else if (this.roverFacing === 1) dx = this.stepSize;
      else if (this.roverFacing === 2) dz = -this.stepSize;
      else if (this.roverFacing === 3) dx = -this.stepSize;

      this.currentStep = {
        type: 'MOVE',
        startX,
        startZ,
        targetX: startX + dx,
        targetZ: startZ + dz,
        duration: 0.5
      };
    } else if (cmd === 'STOP') {
      try { soundManager.playClick(); } catch (e) {}
      const { flame } = this.rover.userData;
      if (flame) flame.material.opacity = 0.1;
      this.currentStep = { type: 'STOP', duration: 0.35 };
    } else {
      this.currentStep = { type: 'NOOP', duration: 0.2 };
    }
  }

  update(delta) {
    // Subtle idle hover oscillation
    if (this.isPowered && this.rover) {
      this.rover.position.y = 0.05 + Math.sin(Date.now() * 0.005) * 0.05;
    }

    if (this.isAnimating && this.currentStep) {
      this.stepProgress += delta / this.currentStep.duration;

      if (this.currentStep.type === 'ROTATE') {
        const t = Math.min(this.stepProgress, 1.0);
        this.rover.rotation.y = THREE.MathUtils.lerp(this.currentStep.startRot, this.currentStep.targetRot, t);
      } else if (this.currentStep.type === 'MOVE') {
        const t = Math.min(this.stepProgress, 1.0);
        this.rover.position.x = THREE.MathUtils.lerp(this.currentStep.startX, this.currentStep.targetX, t);
        this.rover.position.z = THREE.MathUtils.lerp(this.currentStep.startZ, this.currentStep.targetZ, t);

        // Rotate wheels during movement
        if (this.rover.userData.wheels) {
          this.rover.userData.wheels.forEach(w => {
            w.children.forEach(c => c.rotation.x += delta * 12);
          });
        }

        // Thruster flame flicker
        if (this.rover.userData.flame) {
          this.rover.userData.flame.scale.y = 0.9 + Math.random() * 0.5;
        }

        // Check obstacle collision
        if (Math.abs(this.rover.position.x) < 0.8 && (Math.abs(this.rover.position.z - 3.0) < 0.9 || Math.abs(this.rover.position.z - 6.0) < 0.9)) {
          this.isAnimating = false;
          this.currentStep = null;
          const { nameLabel, flame } = this.rover.userData;
          if (nameLabel) {
            nameLabel.material.map = createTextTexture('CRASH!', '#ffffff', '#ef4444');
            nameLabel.material.needsUpdate = true;
          }
          if (flame) flame.material.opacity = 0;
          try { soundManager.playError(); } catch (e) {}
          return;
        }
      }

      if (this.stepProgress >= 1.0) {
        this.prepareNextStep();
      }
    }
  }
}
