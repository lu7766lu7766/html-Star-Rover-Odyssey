/**
 * Star Rover Odyssey 2.0 - Procedural 3D Sci-Fi Meshes
 * Built with native Three.js Geometries & Materials
 * 100% offline, zero external downloads, lightweight, optimized & designed for bright aesthetics.
 */

import * as THREE from 'three';

/**
 * Creates dynamic high-res text canvas texture for Rover label and beacons
 */
export function createTextTexture(text, bgColor = '#ffffff', textColor = '#2563eb') {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 50px Outfit, "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Space Exploration Rover (Bright, Friendly Futuristic Aesthetic)
 */
export function createSciFiRover() {
  const group = new THREE.Group();
  group.name = 'SciFiRover';

  // 1. Aerodynamic White Chassis
  const bodyGeo = new THREE.BoxGeometry(2.2, 0.85, 3.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.15
  });
  const chassis = new THREE.Mesh(bodyGeo, bodyMat);
  chassis.position.y = 0.8;
  group.add(chassis);

  // Sporty Cobalt Blue Stripe Accent
  const stripeGeo = new THREE.BoxGeometry(0.5, 0.86, 3.42);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.3
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 0.8;
  group.add(stripe);

  // 2. Cockpit Canopy (Translucent Cyan glass)
  const canopyGeo = new THREE.ConeGeometry(0.95, 1.15, 4);
  canopyGeo.rotateY(Math.PI / 4);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    transmission: 0.8,
    reflectivity: 0.9
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 1.5, 0.35);
  canopy.rotation.x = -Math.PI / 12;
  group.add(canopy);

  // 3. Four Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8
  });
  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.8,
    roughness: 0.2
  });

  const wheelPositions = [
    [-1.25, 0.48, 1.1],
    [1.25, 0.48, 1.1],
    [-1.25, 0.48, -1.1],
    [1.25, 0.48, -1.1]
  ];
  const wheels = [];
  wheelPositions.forEach(pos => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(...pos);

    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, wheelRimMat);
    wheelGroup.add(rim);

    group.add(wheelGroup);
    wheels.push(wheelGroup);
  });
  group.userData.wheels = wheels;

  // 4. Rear Ion Thruster Nozzle
  const thrusterGeo = new THREE.CylinderGeometry(0.32, 0.46, 0.5, 16);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
    roughness: 0.3
  });
  const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
  thruster.position.set(0, 0.8, -1.8);
  group.add(thruster);

  // Thruster Plasma Flame
  const flameGeo = new THREE.ConeGeometry(0.35, 1.6, 16);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.8, -2.6);
  group.add(flame);
  group.userData.flame = flame;

  // 5. Battery Gauge Bar on Top
  const barBackGeo = new THREE.BoxGeometry(0.8, 0.15, 0.1);
  const barBackMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const barBack = new THREE.Mesh(barBackGeo, barBackMat);
  barBack.position.set(0, 1.35, -0.6);
  group.add(barBack);

  const barFillGeo = new THREE.BoxGeometry(0.76, 0.11, 0.12);
  const barFillMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const barFill = new THREE.Mesh(barFillGeo, barFillMat);
  barFill.position.set(0, 1.35, -0.6);
  barFill.scale.x = 0.01;
  group.add(barFill);
  group.userData.batteryBar = barFill;

  // 6. Name Label Plate
  const labelGeo = new THREE.PlaneGeometry(1.5, 0.38);
  const labelMat = new THREE.MeshBasicMaterial({
    map: createTextTexture('STAR ROVER', '#ffffff', '#2563eb'),
    transparent: true
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 2.1, 0);
  group.add(label);
  group.userData.nameLabel = label;

  return group;
}

/**
 * Creates sci-fi grid floor with bright, gentle pastel tones
 */
export function createSciFiGrid(size = 50, divisions = 50, primaryColor = 0x93c5fd, secondaryColor = 0xe2e8f0) {
  const grid = new THREE.GridHelper(size, divisions, primaryColor, secondaryColor);
  grid.position.y = -0.01;
  return grid;
}

/**
 * Glowing Landing Pad / Destination Target
 */
export function createLandingPad(radius = 1.4, color = 0x10b981) {
  const group = new THREE.Group();
  group.name = 'LandingPad';

  // Base disc
  const discGeo = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.05;
  group.add(disc);

  // Outer glowing ring
  const ringGeo = new THREE.RingGeometry(radius * 0.8, radius * 1.05, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.11;
  group.add(ring);

  // Center beacon light pulse cylinder
  const beaconGeo = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, 3, 32, 1, true);
  const beaconMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 1.5;
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * Obstacle Rocks / Asteroids
 */
export function createAsteroids(positions = null) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true
  });

  const defaultPositions = positions || [
    { x: -3.5, y: 1.2, z: 12, scale: 1.2 },
    { x: 3.8, y: 1.5, z: 8, scale: 1.5 },
    { x: -2.0, y: 1.0, z: 4.5, scale: 0.9 }
  ];

  const list = [];
  defaultPositions.forEach(cfg => {
    const geo = new THREE.DodecahedronGeometry(cfg.scale || 1.0, 1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    group.add(mesh);
    list.push(mesh);
  });

  group.userData.asteroids = list;
  return group;
}

/**
 * Energy Crystals Mine for Level 4
 */
export function createCrystalMine() {
  const group = new THREE.Group();
  const crystals = [];

  const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
  const colors = [0x06b6d4, 0x8b5cf6, 0x10b981, 0xf59e0b, 0x3b82f6];

  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: colors[i % colors.length],
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.65,
      opacity: 0.95,
      transparent: true
    });
    const crystal = new THREE.Mesh(crystalGeo, mat);
    crystal.position.set(0, 0.5, -4 + i * 2);
    group.add(crystal);
    crystals.push(crystal);
  }

  group.userData.crystals = crystals;
  return group;
}

/**
 * Mechanical Arm for Level 4
 */
export function createRoboticArm() {
  const group = new THREE.Group();
  group.name = 'RoboticArm';

  // Base swivel
  const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  group.add(base);

  // Arm segments
  const upperGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5 });
  const upperArm = new THREE.Mesh(upperGeo, armMat);
  upperArm.position.set(0, 0.7, 0);
  group.add(upperArm);

  const clawGeo = new THREE.ConeGeometry(0.25, 0.4, 4);
  clawGeo.rotateX(Math.PI);
  const clawMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
  const claw = new THREE.Mesh(clawGeo, clawMat);
  claw.position.set(0, 1.4, 0);
  group.add(claw);

  group.userData.upperArm = upperArm;
  group.userData.claw = claw;
  return group;
}

/**
 * Scanner Dish & Radar Pulse for Level 5
 */
export function createScannerDish() {
  const group = new THREE.Group();
  group.name = 'ScannerDish';

  const mountGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 16);
  const mountMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 });
  const mount = new THREE.Mesh(mountGeo, mountMat);
  group.add(mount);

  const head = new THREE.Group();
  head.position.y = 0.4;
  group.add(head);

  const dishGeo = new THREE.SphereGeometry(0.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.3);
  dishGeo.rotateX(Math.PI / 3);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.7,
    roughness: 0.2,
    side: THREE.DoubleSide
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  head.add(dish);

  // Expandable Pulse Scan Ring
  const ringGeo = new THREE.RingGeometry(0.6, 0.75, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.2;
  head.add(ring);

  group.userData.head = head;
  group.userData.pulseRing = ring;
  return group;
}

/**
 * Hydraulic Airlock Doors for Level 6
 */
export function createAirlockDoors() {
  const group = new THREE.Group();
  group.name = 'AirlockDoors';

  const frameGeo = new THREE.BoxGeometry(7.2, 4.8, 0.8);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 2.4, 0);
  group.add(frame);

  const doorGeo = new THREE.BoxGeometry(2.3, 4.0, 0.4);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    metalness: 0.6,
    roughness: 0.25
  });

  const leftDoor = new THREE.Mesh(doorGeo, doorMat);
  leftDoor.position.set(-1.15, 2.0, 0.1);
  group.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeo, doorMat);
  rightDoor.position.set(1.15, 2.0, 0.1);
  group.add(rightDoor);

  // Status Indicator Light
  const lightGeo = new THREE.BoxGeometry(0.9, 0.25, 0.15);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // red when locked
  const statusLight = new THREE.Mesh(lightGeo, lightMat);
  statusLight.position.set(0, 4.2, 0.5);
  group.add(statusLight);

  group.userData.leftDoor = leftDoor;
  group.userData.rightDoor = rightDoor;
  group.userData.statusLight = statusLight;
  return group;
}

/**
 * Patrol Drone for Level 7 & 8
 */
export function createPatrolDrone(name = 'DRONE', color = 0x2563eb) {
  const group = new THREE.Group();
  group.name = `Drone_${name}`;

  // Fuselage
  const bodyGeo = new THREE.SphereGeometry(0.45, 16, 12);
  bodyGeo.scale(1.2, 0.5, 1.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Wings / Rotor arms
  const armGeo = new THREE.BoxGeometry(1.8, 0.08, 0.15);
  const armMat = new THREE.MeshStandardMaterial({ color });
  const arm1 = new THREE.Mesh(armGeo, armMat);
  arm1.rotateY(Math.PI / 4);
  group.add(arm1);

  const arm2 = new THREE.Mesh(armGeo, armMat);
  arm2.rotateY(-Math.PI / 4);
  group.add(arm2);

  // Rotors
  const rotorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8);
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
  const rotors = [];
  const rPositions = [
    [0.7, 0.1, 0.7],
    [-0.7, 0.1, 0.7],
    [0.7, 0.1, -0.7],
    [-0.7, 0.1, -0.7]
  ];
  rPositions.forEach(p => {
    const r = new THREE.Mesh(rotorGeo, rotorMat);
    r.position.set(...p);
    group.add(r);
    rotors.push(r);
  });
  group.userData.rotors = rotors;

  return group;
}

/**
 * Drone with coordinates and battery telemetry for Level 7
 */
export function createDrone(id, x = 0, y = 0, z = 0, battery = 100) {
  const color = battery < 20 ? 0xf59e0b : 0x2563eb;
  const drone = createPatrolDrone(id, color);
  drone.position.set(x, y, z);
  drone.userData.droneId = id;
  drone.userData.battery = battery;
  drone.userData.initialPos = new THREE.Vector3(x, y, z);
  return drone;
}

