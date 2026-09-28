import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLevelStore } from '../src/stores/levelStore.js';
import { useProgressStore } from '../src/stores/progressStore.js';
import { Level2Scene } from '../src/game/scenes/Level2Scene.js';
import { Level1Scene } from '../src/game/scenes/Level1Scene.js';
import { Level3Scene } from '../src/game/scenes/Level3Scene.js';

const mockStorage = {};
globalThis.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

describe('Star Rover Odyssey 2.0 - Failure Alert Modal & Vehicle Restore Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.localStorage.clear();
    vi.useFakeTimers();
  });

  it('LevelStore: opens failure alert modal on level test failure (UX consistency with success modal)', async () => {
    const levelStore = useLevelStore();
    const progressStore = useProgressStore();
    progressStore.goToLevel(1);

    expect(levelStore.isFailModalOpen).toBe(false);
    expect(levelStore.isSuccessModalOpen).toBe(false);

    // Execute with failing parameters (empty name, 0 power)
    const execPromise = levelStore.executeLevel({
      variables: { roverName: '', powerLevel: 0, shieldActive: false }
    });

    // Fast-forward animation & evaluation timer
    await vi.runAllTimersAsync();
    const res = await execPromise;

    expect(res.pass).toBe(false);
    expect(levelStore.isFailModalOpen).toBe(true);
    expect(levelStore.isSuccessModalOpen).toBe(false);

    // Close fail modal
    levelStore.closeFailModal();
    expect(levelStore.isFailModalOpen).toBe(false);
  });

  it('LevelStore: opens success milestone modal on valid level completion', async () => {
    const levelStore = useLevelStore();
    const progressStore = useProgressStore();
    progressStore.goToLevel(1);

    // Execute with passing parameters
    const execPromise = levelStore.executeLevel({
      variables: { roverName: '奧德賽號', powerLevel: 90, shieldActive: true }
    });

    await vi.runAllTimersAsync();
    const res = await execPromise;

    expect(res.pass).toBe(true);
    expect(levelStore.isSuccessModalOpen).toBe(true);
    expect(levelStore.isFailModalOpen).toBe(false);

    levelStore.closeSuccessModal();
    expect(levelStore.isSuccessModalOpen).toBe(false);
  });

  it('LevelStore: restoreVehiclePosition triggers RESET_POSITION and closes failure modal', async () => {
    const levelStore = useLevelStore();
    const mockTrigger = vi.fn();
    levelStore.setSceneActionTrigger(mockTrigger);

    levelStore.isFailModalOpen = true;
    levelStore.restoreVehiclePosition();

    expect(levelStore.isFailModalOpen).toBe(false);
    expect(mockTrigger).toHaveBeenCalledWith('RESET_POSITION', expect.any(Object));
  });

  it('Level2Scene: properly resets rover position to starting pad (0, 0.1, 0) on RESET_POSITION', () => {
    const scene = new Level2Scene();
    scene.build();

    // Move rover forward down the runway
    scene.rover.position.set(0, 0.1, 15);
    scene.isLaunching = true;
    scene.currentDistance = 15;

    // Dispatch RESET_POSITION
    scene.handleAction('RESET_POSITION');

    expect(scene.rover.position.x).toBe(0);
    expect(scene.rover.position.y).toBeCloseTo(0.1);
    expect(scene.rover.position.z).toBe(0);
    expect(scene.isLaunching).toBe(false);
    expect(scene.currentDistance).toBe(0);
  });

  it('Level2Scene: automatically resets rover to start line before EXECUTE_START', () => {
    const scene = new Level2Scene();
    scene.build();

    // Simulate rover stuck at 18m from a previous run
    scene.rover.position.set(0, 0.1, 18);
    scene.currentDistance = 18;

    // Dispatch new test launch
    scene.handleAction('EXECUTE_START', {
      params: { initialFuel: 150, burnPerThrust: 30, thrustCount: 3, speed: 2 }
    });

    // Must have immediately restored to 0 before advancing
    expect(scene.targetDistance).toBe(6); // 3 * 2 = 6
    expect(scene.currentDistance).toBe(0);
    expect(scene.rover.position.z).toBe(0);
    expect(scene.isLaunching).toBe(true);
  });

  it('Level3Scene: automatically resets rover to start coordinate (0, 0, -12) on retry and RESET_POSITION', () => {
    const scene = new Level3Scene();
    scene.build();

    // Simulate rover stopped at collision/avoidance coordinate
    scene.rover.position.set(0, 0, 2);

    scene.handleAction('RESET_POSITION');
    expect(scene.rover.position.z).toBe(-12);

    // Simulate another run
    scene.rover.position.set(0, 0, 1.5);
    scene.handleAction('EXECUTE_START');
    expect(scene.rover.position.z).toBe(-12);
  });
});
