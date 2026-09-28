/**
 * Star Rover Odyssey - Camera Controller
 * Manages PerspectiveCamera and OrbitControls with bounded rotation/zoom
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

    this.initControls();
  }

  initControls() {
    if (!this.domElement) return;

    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    // Boundaries
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 35.0;
    this.controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping beneath ground

    this.reset();
  }

  reset(cameraPos = this.defaultCamPos, targetPos = this.defaultTarget) {
    this.camera.position.copy(cameraPos);
    if (this.controls) {
      this.controls.target.copy(targetPos);
      this.controls.update();
    } else {
      this.camera.lookAt(targetPos);
    }
  }

  update() {
    if (this.controls) {
      this.controls.update();
    }
  }

  dispose() {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }
}
