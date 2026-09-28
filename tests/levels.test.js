import { describe, it, expect } from 'vitest';
import level1 from '../src/levels/level-1.js';
import level2 from '../src/levels/level-2.js';
import level3 from '../src/levels/level-3.js';
import level4 from '../src/levels/level-4.js';
import level5 from '../src/levels/level-5.js';
import level6 from '../src/levels/level-6.js';
import level7 from '../src/levels/level-7.js';

describe('Level Validation Engine', () => {
  // Level 1
  it('Level 1: validates rover.setup correctly', () => {
    // Valid
    const passRes = level1.validate({
      success: true,
      apiCalls: [{ api: 'rover.setup', args: ['奧德賽號', 100, true] }]
    });
    expect(passRes.pass).toBe(true);

    // Missing setup
    const failRes1 = level1.validate({ success: true, apiCalls: [] });
    expect(failRes1.pass).toBe(false);

    // Invalid battery
    const failRes2 = level1.validate({
      success: true,
      apiCalls: [{ api: 'rover.setup', args: ['奧德賽號', 999, true] }]
    });
    expect(failRes2.pass).toBe(false);
  });

  // Level 2
  it('Level 2: validates remaining fuel calculation', () => {
    // 500 - 25 * 8 = 300
    const passRes = level2.validate({
      success: true,
      apiCalls: [{ api: 'rover.launch', args: [300] }]
    });
    expect(passRes.pass).toBe(true);

    // Wrong fuel
    const failRes = level2.validate({
      success: true,
      apiCalls: [{ api: 'rover.launch', args: [400] }]
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 3
  it('Level 3: validates autopilot decision function across test distances', () => {
    const passRes = level3.validate({
      success: true,
      apiCalls: [{
        api: 'rover.setAutoPilot',
        isFunction: true,
        testResults: { 3: 'STOP', 10: 'SLOW_DOWN', 20: 'FULL_SPEED' }
      }]
    });
    expect(passRes.pass).toBe(true);

    // Wrong response
    const failRes = level3.validate({
      success: true,
      apiCalls: [{
        api: 'rover.setAutoPilot',
        isFunction: true,
        testResults: { 3: 'FULL_SPEED', 10: 'SLOW_DOWN', 20: 'STOP' }
      }]
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 4
  it('Level 4: validates sequential drill depths 0 to 4', () => {
    const passRes = level4.validate({
      success: true,
      apiCalls: [
        { api: 'drill.dig', args: [0] },
        { api: 'drill.dig', args: [1] },
        { api: 'drill.dig', args: [2] },
        { api: 'drill.dig', args: [3] },
        { api: 'drill.dig', args: [4] }
      ]
    });
    expect(passRes.pass).toBe(true);

    // Incomplete digging
    const failRes = level4.validate({
      success: true,
      apiCalls: [
        { api: 'drill.dig', args: [0] },
        { api: 'drill.dig', args: [1] }
      ]
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 5
  it('Level 5: validates module install with activate() and this.range', () => {
    const passRes = level5.validate({
      success: true,
      apiCalls: [{
        api: 'rover.installModule',
        args: [{
          name: '星環雷達掃描儀',
          range: 30,
          hasActivate: true,
          activateResult: 30
        }]
      }]
    });
    expect(passRes.pass).toBe(true);

    // activate not returning this.range
    const failRes = level5.validate({
      success: true,
      apiCalls: [{
        api: 'rover.installModule',
        args: [{
          name: '雷達',
          range: 30,
          hasActivate: true,
          activateResult: 10
        }]
      }]
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 6
  it('Level 6: validates Mock DOM event listener and green status update', () => {
    const passRes = level6.validate({
      success: true,
      domState: {
        'btn-unlock': { id: 'btn-unlock', hasListener: true },
        'status': { id: 'status', innerText: '已解除鎖定', style: { color: 'green' } }
      }
    });
    expect(passRes.pass).toBe(true);

    // Missing listener
    const failRes = level6.validate({
      success: true,
      domState: {
        'btn-unlock': { id: 'btn-unlock', hasListener: false },
        'status': { id: 'status', innerText: '鎖定中', style: { color: 'red' } }
      }
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 7
  it('Level 7: validates drone fleet array processing and battery thresholds', () => {
    const processedDrones = [
      { id: "drone-01", x: -6, y: 5, z: 2, battery: 85, status: 'PATROL' },
      { id: "drone-02", x: -2, y: 7, z: -3, battery: 18, status: 'WARNING' },
      { id: "drone-03", x: 3, y: 6, z: 1, battery: 92, status: 'PATROL' },
      { id: "drone-04", x: 7, y: 4, z: -2, battery: 15, status: 'WARNING' }
    ];

    const passRes = level7.validate({
      success: true,
      apiCalls: [{ api: 'droneFleet.deploy', args: [processedDrones] }]
    });
    expect(passRes.pass).toBe(true);

    // Wrong status for low battery drone
    const wrongDrones = [
      { id: "drone-01", battery: 85, status: 'PATROL' },
      { id: "drone-02", battery: 18, status: 'PATROL' }, // Wrong!
      { id: "drone-03", battery: 92, status: 'PATROL' },
      { id: "drone-04", battery: 15, status: 'PATROL' }  // Wrong!
    ];
    const failRes = level7.validate({
      success: true,
      apiCalls: [{ api: 'droneFleet.deploy', args: [wrongDrones] }]
    });
    expect(failRes.pass).toBe(false);
  });
});
