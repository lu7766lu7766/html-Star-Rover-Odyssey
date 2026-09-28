/**
 * Star Rover Odyssey - Procedural 3D Sci-Fi Meshes
 * Built with native Three.js Geometries & Materials
 * 100% offline, zero external downloads, lightweight & beautiful.
 */

import * as THREE from 'three';

/**
 * Creates dynamic text canvas texture for Rover label
 */
export function createTextTexture(text, bgColor = '#0d1322', textColor = '#00f2fe') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 54px Outfit, "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Space Exploration Rover
 */
export function createSciFiRover() {
  const group = new THREE.Group();
  group.name = 'SciFiRover';

  // 1. Chassis
  const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 3.6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3
  });
  const chassis = new THREE.Mesh(bodyGeo, bodyMat);
  chassis.position.y = 0.8;
  group.add(chassis);

  // 2. Cockpit Canopy (Translucent Cyan glass)
  const canopyGeo = new THREE.ConeGeometry(1.0, 1.2, 4);
  canopyGeo.rotateY(Math.PI / 4);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    transmission: 0.8,
    reflectivity: 0.9
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 1.6, 0.4);
  canopy.rotation.x = -Math.PI / 12;
  group.add(canopy);

  // 3. Four Chunky Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8
  });
  const wheelPositions = [
    [-1.3, 0.5, 1.2],
    [1.3, 0.5, 1.2],
    [-1.3, 0.5, -1.2],
    [1.3, 0.5, -1.2]
  ];
  const wheels = [];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(...pos);
    group.add(wheel);
    wheels.push(wheel);
  });
  group.userData.wheels = wheels;

  // 4. Rear Ion Thruster Nozzle & Glow Flame
  const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.6, 16);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.2
  });
  const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
  thruster.position.set(0, 0.8, -1.9);
  group.add(thruster);

  // Thruster Plasma Flame
  const flameGeo = new THREE.ConeGeometry(0.4, 1.5, 16);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.0
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.8, -2.8);
  group.add(flame);
  group.userData.flame = flame;

  // 5. Battery Gauge Bar on Top
  const barBackGeo = new THREE.BoxGeometry(0.8, 0.15, 0.1);
  const barBackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const barBack = new THREE.Mesh(barBackGeo, barBackMat);
  barBack.position.set(0, 1.4, -0.6);
  group.add(barBack);

  const barFillGeo = new THREE.BoxGeometry(0.76, 0.11, 0.12);
  const barFillMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const barFill = new THREE.Mesh(barFillGeo, barFillMat);
  barFill.position.set(0, 1.4, -0.6);
  barFill.scale.x = 0.01; // initial uncharged
  group.add(barFill);
  group.userData.batteryBar = barFill;

  // 6. Name Label Sprite / Plate
  const labelGeo = new THREE.PlaneGeometry(1.6, 0.4);
  const labelMat = new THREE.MeshBasicMaterial({
    map: createTextTexture('OFFLINE', '#0d1322', '#64748b'),
    transparent: true
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 2.2, 0);
  group.add(label);
  group.userData.nameLabel = label;

  return group;
}

/**
 * Creates sci-fi grid floor
 */
export function createSciFiGrid(size = 50, divisions = 50, color = 0x00f2fe) {
  const grid = new THREE.GridHelper(size, divisions, color, 0x1e293b);
  grid.position.y = -0.01;
  return grid;
}

/**
 * Asteroid Field for Level 3
 */
export function createAsteroids() {
  const group = new THREE.Group();
  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true
  });

  const configs = [
    { x: -3.5, y: 1.2, z: 12, scale: 1.2 },
    { x: 3.8, y: 1.5, z: 8, scale: 1.5 },
    { x: -2.0, y: 1.0, z: 4.5, scale: 0.9 }
  ];

  const list = [];
  configs.forEach(cfg => {
    const geo = new THREE.DodecahedronGeometry(cfg.scale, 1);
    const mesh = new THREE.Mesh(geo, asteroidMat);
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    group.add(mesh);
    list.push(mesh);
  });

  group.userData.asteroids = list;
  return group;
}

/**
 * Energy Crystals on Alien Soil for Level 4
 */
export function createCrystalMine() {
  const group = new THREE.Group();
  const crystals = [];

  const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
  const colors = [0x00f2fe, 0xa855f7, 0x10b981, 0xf59e0b, 0x38bdf8];

  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: colors[i % colors.length],
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true
    });
    const crystal = new THREE.Mesh(crystalGeo, mat);
    // Arranged along mining depth trench
    crystal.position.set(0, 0.4, -4 + i * 2);
    group.add(crystal);
    crystals.push(crystal);
  }

  group.userData.crystals = crystals;
  return group;
}

/**
 * Rotating Scanner Radar Dish for Level 5
 */
export function createScannerDish() {
  const group = new THREE.Group();
  group.name = 'ScannerDish';

  // Base mount
  const mountGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 12);
  const mountMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  const mount = new THREE.Mesh(mountGeo, mountMat);
  group.add(mount);

  // Rotating head
  const head = new THREE.Group();
  head.position.y = 0.3;
  group.add(head);

  // Dish bowl
  const dishGeo = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5);
  dishGeo.rotateX(Math.PI / 3);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0x00f2fe,
    metalness: 0.7,
    roughness: 0.2,
    side: THREE.DoubleSide
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  head.add(dish);

  // Feed horn needle
  const needleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  const needleMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.set(0, 0.3, 0.2);
  needle.rotation.x = Math.PI / 3;
  head.add(needle);

  // Pulse scan ring
  const ringGeo = new THREE.RingGeometry(0.5, 0.6, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.1;
  head.add(ring);

  group.userData.head = head;
  group.userData.pulseRing = ring;
  return group;
}

/**
 * Hydraulic Airlock Blast Doors for Level 6
 */
export function createAirlockDoors() {
  const group = new THREE.Group();
  group.name = 'AirlockDoors';

  // Arch frame
  const frameGeo = new THREE.BoxGeometry(7, 4.5, 0.8);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 2.25, 0);
  // Cutout center by creating top/left/right blocks
  group.add(frame);

  // Left door
  const doorGeo = new THREE.BoxGeometry(2.2, 3.8, 0.4);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.3
  });
  const leftDoor = new THREE.Mesh(doorGeo, doorMat);
  leftDoor.position.set(-1.1, 1.9, 0.1);
  group.add(leftDoor);

  // Right door
  const rightDoor = new THREE.Mesh(doorGeo, doorMat);
  rightDoor.position.set(1.1, 1.9, 0.1);
  group.add(rightDoor);

  // Status lights above door
  const lightGeo = new THREE.BoxGeometry(0.8, 0.2, 0.1);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // red locked
  const statusLight = new THREE.Mesh(lightGeo, lightMat);
  statusLight.position.set(0, 3.9, 0.5);
  group.add(statusLight);

  group.userData.leftDoor = leftDoor;
  group.userData.rightDoor = rightDoor;
  group.userData.statusLight = statusLight;
  return group;
}

/**
 * Futuristic Scout Drone for Level 7
 */
export function createDrone(id, x, y, z, battery) {
  const group = new THREE.Group();
  group.name = id;
  group.position.set(x, y, z);

  // Center pod
  const podGeo = new THREE.OctahedronGeometry(0.4, 1);
  const podMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.2
  });
  const pod = new THREE.Mesh(podGeo, podMat);
  group.add(pod);

  // 4 Rotors
  const armPositions = [
    [-0.5, 0, 0.5],
    [0.5, 0, 0.5],
    [-0.5, 0, -0.5],
    [0.5, 0, -0.5]
  ];
  const rotorGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
  rotorGeo.rotateX(Math.PI / 2);
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0x64748b });

  armPositions.forEach(pos => {
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(...pos);
    group.add(rotor);
  });

  // Beacon Light (red or green)
  const isLow = battery < 20;
  const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: isLow ? 0xef4444 : 0x10b981
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 0.45;
  group.add(beacon);

  group.userData = {
    id,
    battery,
    baseY: y,
    beaconMat,
    status: isLow ? 'WARNING' : 'PATROL'
  };

  return group;
}
