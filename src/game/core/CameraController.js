/**
 * Star Rover Odyssey - Camera Controller (B-scheme)
 * OrbitControls with damping + impact shake + smooth target follow
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.controls = null;
    this.defaultCamPos = new THREE.Vector3(0, 5, 10);
    this.defaultTarget = new THREE.Vector3(0, 1, 0);

    this.shakeStrength = 0;
    this.shakeOffset = new THREE.Vector3();

    this.initControls();
  }

  initControls() {
    if (!this.domElement) return;

    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.6;

    // Boundaries tuned for classroom touchpads
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 35.0;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minPolarAngle = Math.PI / 8;

    this.reset();
  }

  reset(cameraPos = this.defaultCamPos, targetPos = this.defaultTarget) {
    this.shakeStrength = 0;
    this.camera.position.copy(cameraPos);
    if (this.controls) {
      this.controls.target.copy(targetPos);
      this.controls.update();
    } else {
      this.camera.lookAt(targetPos);
    }
  }

  /** Small cinematic kick on success / fail */
  kick(strength = 0.25) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  smoothFollow(worldPos, lerp = 0.06) {
    if (!this.controls) return;
    this.controls.target.lerp(worldPos, lerp);
  }

  update(delta = 0.016) {
    if (this.controls) {
      this.controls.update();
    }
    if (this.shakeStrength > 0.001) {
      const s = this.shakeStrength;
      this.shakeOffset.set(
        (Math.random() - 0.5) * s,
        (Math.random() - 0.5) * s * 0.6,
        (Math.random() - 0.5) * s
      );
      this.camera.position.add(this.shakeOffset);
      this.shakeStrength *= Math.pow(0.02, delta);
      if (this.shakeStrength < 0.002) this.shakeStrength = 0;
    }
  }

  dispose() {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }
}
