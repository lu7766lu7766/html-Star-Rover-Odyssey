/**
 * Star Rover Odyssey - Scene Manager
 * Controls Three.js lifecycle, rendering loop, lighting, resizing, and scene switching
 */

import * as THREE from 'three';
import { CameraController } from './CameraController.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.cameraController = null;
    this.activeGameScene = null;

    this.clock = new THREE.Clock();
    this.animationFrameId = null;
    this.isContextLost = false;
    this.isLowPerformance = localStorage.getItem('star_rover_low_perf') === 'true';

    this.onContextLostCallback = null;
    this.onContextRestoredCallback = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Scene - Bright Cosmic Dawn Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.01);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 7, 12);

    // 3. Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isLowPerformance,
        powerPreference: 'high-performance',
        alpha: false
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(this.isLowPerformance ? 1.0 : Math.min(window.devicePixelRatio, 2.0));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;

      this.container.appendChild(this.renderer.domElement);
    } catch (err) {
      console.error('[SceneManager] WebGL creation failed:', err);
      if (this.onContextLostCallback) this.onContextLostCallback(err);
      return;
    }

    // 4. Controls
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    // 5. Lighting - Bright, friendly, clean illumination
    this.setupLighting();

    // 6. Ambient Cosmic Dust Motes
    this.setupStarfield();

    // 7. Event Listeners
    this.bindEvents();

    // 8. Start Loop
    this.startLoop();
  }

  setupLighting() {
    // Hemispherical soft sky/ground light
    const hemiLight = new THREE.HemisphereLight(0xeff6ff, 0xf1f5f9, 0.7);
    this.scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Warm sun light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(12, 24, 16);
    this.scene.add(dirLight);

    // Soft lilac-blue fill light
    const fillLight = new THREE.DirectionalLight(0xc4b5fd, 0.5);
    fillLight.position.set(-16, 12, -12);
    this.scene.add(fillLight);
  }

  setupStarfield() {
    const particleCount = this.isLowPerformance ? 150 : 400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 60 - 5;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd, // Soft pastel blue dust particles
      size: 0.9,
      transparent: true,
      opacity: 0.65
    });

    this.starfield = new THREE.Points(geo, mat);
    this.scene.add(this.starfield);
  }

  bindEvents() {
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isContextLost = true;
      if (this.onContextLostCallback) this.onContextLostCallback();
    });

    canvas.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false;
      this.init();
      if (this.onContextRestoredCallback) this.onContextRestoredCallback();
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setLowPerformance(isLow) {
    this.isLowPerformance = isLow;
    if (this.renderer) {
      this.renderer.setPixelRatio(isLow ? 1.0 : Math.min(window.devicePixelRatio, 2.0));
    }
  }

  switchGameScene(gameSceneInstance) {
    if (this.activeGameScene) {
      this.activeGameScene.dispose();
      if (this.activeGameScene.group) {
        this.scene.remove(this.activeGameScene.group);
      }
    }

    this.activeGameScene = gameSceneInstance;
    if (this.activeGameScene) {
      this.cameraController.reset();
      this.activeGameScene.init(this);
      if (this.activeGameScene.group) {
        this.scene.add(this.activeGameScene.group);
      }
    }
  }

  resetCurrentScene() {
    if (this.activeGameScene) {
      this.activeGameScene.reset();
    }
    if (this.cameraController) {
      this.cameraController.reset();
    }
  }

  startLoop() {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent jump

      // Rotate starfield slowly
      if (this.starfield) {
        this.starfield.rotation.y += delta * 0.02;
      }

      // Update camera damping
      if (this.cameraController) {
        this.cameraController.update();
      }

      // Update active game level scene
      if (this.activeGameScene) {
        this.activeGameScene.update(delta);
      }

      // Render
      if (this.renderer && this.scene && this.camera && !this.isContextLost) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }

  stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this.handleResize);

    if (this.activeGameScene) {
      this.activeGameScene.dispose();
    }

    if (this.cameraController) {
      this.cameraController.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
