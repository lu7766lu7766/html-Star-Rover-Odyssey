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

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);

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
      this.renderer.toneMappingExposure = 1.2;

      this.container.appendChild(this.renderer.domElement);
    } catch (err) {
      console.error('[SceneManager] WebGL creation failed:', err);
      if (this.onContextLostCallback) this.onContextLostCallback(err);
      return;
    }

    // 4. Controls
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    // 5. Lighting
    this.setupLighting();

    // 6. Ambient Starfield
    this.setupStarfield();

    // 7. Event Listeners
    this.bindEvents();

    // 8. Start Loop
    this.startLoop();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    const accentLight = new THREE.DirectionalLight(0xa855f7, 0.8);
    accentLight.position.set(-15, 10, -10);
    this.scene.add(accentLight);
  }

  setupStarfield() {
    const starCount = this.isLowPerformance ? 300 : 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 200;
      starPositions[i + 1] = Math.random() * 80 - 10;
      starPositions[i + 2] = (Math.random() - 0.5) * 200;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.8,
      transparent: true,
      opacity: 0.8
    });

    this.starfield = new THREE.Points(starGeo, starMat);
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
      this.activeGameScene.init(this);
      if (this.activeGameScene.group) {
        this.scene.add(this.activeGameScene.group);
      }
      this.cameraController.reset();
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
