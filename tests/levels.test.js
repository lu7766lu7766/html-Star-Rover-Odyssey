import { describe, it, expect } from 'vitest';
import level1 from '../src/levels/level-1.js';
import level2 from '../src/levels/level-2.js';
import level3 from '../src/levels/level-3.js';
import level4 from '../src/levels/level-4.js';
import level5 from '../src/levels/level-5.js';
import level6 from '../src/levels/level-6.js';
import level7 from '../src/levels/level-7.js';
import level8 from '../src/levels/level-8.js';
import { evaluateFlightSafety } from '../src/services/weatherService.js';

describe('Star Rover Odyssey 2.0 - Level Validation Engine', () => {
  // Level 1: Command sequence
  it('Level 1: validates correct navigation around obstacle to target with stop', () => {
    // Valid path: Start -> Turn Right -> Forward -> Turn Left -> Forward x3 -> Turn Left -> Forward -> Stop
    const passRes = level1.validate({
      sequence: [
        'START_ENGINE',
        'TURN_RIGHT',
        'MOVE_FORWARD',
        'TURN_LEFT',
        'MOVE_FORWARD',
        'MOVE_FORWARD',
        'MOVE_FORWARD',
        'TURN_LEFT',
        'MOVE_FORWARD',
        'STOP'
      ]
    });
    expect(passRes.pass).toBe(true);

    // Missing engine start
    const noStart = level1.validate({
      sequence: ['MOVE_FORWARD', 'STOP']
    });
    expect(noStart.pass).toBe(false);
    expect(noStart.error).toContain('啟動引擎');

    // Crash directly into obstacle at (0, 1)
    const crashRes = level1.validate({
      sequence: ['START_ENGINE', 'MOVE_FORWARD', 'STOP'] // (0, 1) is obstacle
    });
    expect(crashRes.pass).toBe(false);
    expect(crashRes.error).toContain('撞上');
  });

  // Level 2: Variables & Parameters
  it('Level 2: validates fuel calculation, distance, and landing speed', () => {
    // 8 thrusts * 3 speed = 24 distance, total burn = 8 * 25 = 200 <= 300
    const passRes = level2.validate({
      params: {
        initialFuel: 300,
        burnPerThrust: 25,
        thrustCount: 8,
        speed: 3
      }
    });
    expect(passRes.pass).toBe(true);

    // Excessive speed (> 3)
    const crashLanding = level2.validate({
      params: {
        initialFuel: 300,
        burnPerThrust: 25,
        thrustCount: 6,
        speed: 4 // 6 * 4 = 24 but speed > 3
      }
    });
    expect(crashLanding.pass).toBe(false);
    expect(crashLanding.error).toContain('著陸速度過猛');

    // Fuel depletion
    const fuelOut = level2.validate({
      params: {
        initialFuel: 100,
        burnPerThrust: 25,
        thrustCount: 8,
        speed: 3
      }
    });
    expect(fuelOut.pass).toBe(false);
    expect(fuelOut.error).toContain('燃料耗盡');
  });

  // Level 3: Conditionals
  it('Level 3: validates distance decision boundaries (stop < 5, slow < 15, else full speed)', () => {
    const passRes = level3.validate({
      rules: {
        rule1Threshold: 5,
        rule1Action: 'STOP',
        rule2Threshold: 15,
        rule2Action: 'SLOW_DOWN',
        fallbackAction: 'FULL_SPEED'
      }
    });
    expect(passRes.pass).toBe(true);

    // Inverted logic
    const failRes = level3.validate({
      rules: {
        rule1Threshold: 5,
        rule1Action: 'FULL_SPEED',
        rule2Threshold: 15,
        rule2Action: 'SLOW_DOWN',
        fallbackAction: 'STOP'
      }
    });
    expect(failRes.pass).toBe(false);
  });

  // Level 4: Loops
  it('Level 4: validates exact 5 harvests loop count', () => {
    const passRes = level4.validate({
      loopConfig: {
        loopCount: 5,
        action: 'HARVEST_CRYSTAL'
      }
    });
    expect(passRes.pass).toBe(true);

    // Insufficient harvests
    const underRes = level4.validate({
      loopConfig: { loopCount: 3, action: 'HARVEST_CRYSTAL' }
    });
    expect(underRes.pass).toBe(false);
    expect(underRes.error).toContain('採集數量不足');

    // Excessive harvests
    const overRes = level4.validate({
      loopConfig: { loopCount: 7, action: 'HARVEST_CRYSTAL' }
    });
    expect(overRes.pass).toBe(false);
    expect(overRes.error).toContain('次數過多');
  });

  // Level 5: Objects & Methods
  it('Level 5: validates quantum scanner selection, range >= 18, and activate method', () => {
    const passRes = level5.validate({
      moduleConfig: {
        moduleId: 'quantum-scanner',
        range: 20,
        mode: 'HIGH',
        isMethodInvoked: true
      }
    });
    expect(passRes.pass).toBe(true);

    // Wrong module
    const wrongMod = level5.validate({
      moduleConfig: {
        moduleId: 'basic-sensor',
        range: 20,
        mode: 'HIGH',
        isMethodInvoked: true
      }
    });
    expect(wrongMod.pass).toBe(false);

    // Range too short
    const shortRange = level5.validate({
      moduleConfig: {
        moduleId: 'quantum-scanner',
        range: 15,
        mode: 'HIGH',
        isMethodInvoked: true
      }
    });
    expect(shortRange.pass).toBe(false);
  });

  // Level 6: DOM Events
  it('Level 6: validates click events, alarm disarm, and airlock open', () => {
    const passRes = level6.validate({
      domState: {
        bindings: {
          disarmEvent: 'click',
          disarmAction: 'DISARM_ALARM',
          airlockEvent: 'click',
          airlockAction: 'OPEN_AIRLOCK'
        },
        disarmed: true,
        airlockOpen: true
      }
    });
    expect(passRes.pass).toBe(true);

    // Not yet disarmed
    const notDisarmed = level6.validate({
      domState: {
        bindings: {
          disarmEvent: 'click',
          disarmAction: 'DISARM_ALARM',
          airlockEvent: 'click',
          airlockAction: 'OPEN_AIRLOCK'
        },
        disarmed: false,
        airlockOpen: false
      }
    });
    expect(notDisarmed.pass).toBe(false);
  });

  // Level 7: Arrays & Fleet
  it('Level 7: validates array threshold filtering for low battery drones', () => {
    const passRes = level7.validate({
      fleetConfig: {
        batteryThreshold: 20,
        lowBatteryAction: 'RETURN_BASE',
        normalBatteryAction: 'PATROL',
        dispatched: true
      }
    });
    expect(passRes.pass).toBe(true);

    // Threshold too low (drone with 15% battery crashes)
    const lowThresh = level7.validate({
      fleetConfig: {
        batteryThreshold: 10,
        lowBatteryAction: 'RETURN_BASE',
        normalBatteryAction: 'PATROL',
        dispatched: true
      }
    });
    expect(lowThresh.pass).toBe(false);
    expect(lowThresh.error).toContain('墜毀');
  });

  // Level 8: Open-Meteo Weather API
  it('Level 8: validates weather safety evaluation and flight dispatch', () => {
    const passRes = level8.validate({
      weatherSession: {
        weatherData: {
          stationName: '台北觀測站',
          windSpeed: 16.5,
          precipitationProbability: 10,
          temperature: 22,
          isRealData: true
        },
        conditions: {
          maxWindSpeed: 25,
          maxPrecipitation: 30
        },
        launched: true
      }
    });
    expect(passRes.pass).toBe(true);

    // Exceeding student threshold
    const highWind = level8.validate({
      weatherSession: {
        weatherData: {
          stationName: '台北觀測站',
          windSpeed: 28,
          precipitationProbability: 10,
          temperature: 22,
          isRealData: true
        },
        conditions: {
          maxWindSpeed: 25,
          maxPrecipitation: 30
        },
        launched: true
      }
    });
    expect(highWind.pass).toBe(false);
    expect(highWind.error).toContain('超過你設定的容許上限');
  });

  it('Weather Service: correctly flags unsafe wind and rain conditions', () => {
    const safeResult = evaluateFlightSafety(
      { windSpeed: 15, precipitationProbability: 10, temperature: 20 },
      { maxWindSpeed: 25, maxPrecipitation: 30 }
    );
    expect(safeResult.canLaunch).toBe(true);

    const unsafeResult = evaluateFlightSafety(
      { windSpeed: 35, precipitationProbability: 60, temperature: 20 },
      { maxWindSpeed: 25, maxPrecipitation: 30 }
    );
    expect(unsafeResult.canLaunch).toBe(false);
    expect(unsafeResult.issues.length).toBe(2);
  });
});
