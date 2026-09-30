import { describe, it, expect } from 'vitest';
import level1 from '../src/levels/level-1.js';
import level2 from '../src/levels/level-2.js';
import level3 from '../src/levels/level-3.js';
import level4 from '../src/levels/level-4.js';
import level5 from '../src/levels/level-5.js';
import level6 from '../src/levels/level-6.js';
import level7 from '../src/levels/level-7.js';
import level8 from '../src/levels/level-8.js';
import { evaluateTelemetry, resolveJsonPath, BENCHMARK_STATION_DATA, DRONE_FLIGHT_LIMITS } from '../src/services/weatherService.js';

describe('Star Rover Odyssey 2.0 - Level Validation Engine', () => {
  // Level 1: Variable Declaration & Data Types
  it('Level 1: validates rover variable declaration (string, number, boolean)', () => {
    // Valid configuration
    const passRes = level1.validate({
      variables: {
        roverName: '奧德賽號',
        powerLevel: 100,
        shieldActive: true
      }
    });
    expect(passRes.pass).toBe(true);
    expect(passRes.feedback).toContain('通電自檢全部通過');

    // Missing / empty name (String)
    const emptyName = level1.validate({
      variables: {
        roverName: '',
        powerLevel: 100,
        shieldActive: true
      }
    });
    expect(emptyName.pass).toBe(false);
    expect(emptyName.error).toContain('未命名');

    // Insufficient power (< 80)
    const lowPower = level1.validate({
      variables: {
        roverName: '星馳號',
        powerLevel: 60,
        shieldActive: true
      }
    });
    expect(lowPower.pass).toBe(false);
    expect(lowPower.error).toContain('能源不足');

    // Overload power (> 100)
    const overPower = level1.validate({
      variables: {
        roverName: '星馳號',
        powerLevel: 110,
        shieldActive: true
      }
    });
    expect(overPower.pass).toBe(false);
    expect(overPower.error).toContain('電壓超載');

    // Inactive shield (Boolean false)
    const noShield = level1.validate({
      variables: {
        roverName: '星馳號',
        powerLevel: 90,
        shieldActive: false
      }
    });
    expect(noShield.pass).toBe(false);
    expect(noShield.error).toContain('防護力場未啟動');
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

  // Level 4: Loops & Path Puzzle
  it('Level 4: validates obstacle collision, non-optimal pass, and optimal loop solution', () => {
    // 1. Initial state (only 1 step forward) fails
    const initRes = level4.validate({ loopConfig: level4.initialLoopConfig });
    expect(initRes.pass).toBe(false);
    expect(initRes.error).toContain('未抵達目的地');

    // 2. Obstacle collision: straight forward 3 steps hits obstacle at (1, 3)
    const collideRes = level4.validate({
      loopConfig: {
        blocks: [
          { id: '1', type: 'FORWARD' },
          { id: '2', type: 'FORWARD' },
          { id: '3', type: 'FORWARD' }
        ]
      }
    });
    expect(collideRes.pass).toBe(false);
    expect(collideRes.error).toContain('撞擊岩石障礙物');

    // 3. Non-optimal pass without loops (9 individual blocks): reaches (4, 4) and PASSES
    const nonOptimalRes = level4.validate({
      loopConfig: {
        blocks: [
          { id: '1', type: 'FORWARD' },
          { id: '2', type: 'FORWARD' },
          { id: '3', type: 'TURN_RIGHT' },
          { id: '4', type: 'FORWARD' },
          { id: '5', type: 'FORWARD' },
          { id: '6', type: 'FORWARD' },
          { id: '7', type: 'TURN_LEFT' },
          { id: '8', type: 'FORWARD' },
          { id: '9', type: 'FORWARD' }
        ]
      }
    });
    expect(nonOptimalRes.pass).toBe(true);
    expect(nonOptimalRes.data.isOptimal).toBe(false);
    expect(nonOptimalRes.data.blockCount).toBe(9);
    expect(nonOptimalRes.feedback).toContain('通關合格');

    // 4. Optimal pass using loops (5 blocks): reaches (4, 4) and awards optimal status
    const optimalRes = level4.validate({
      loopConfig: {
        blocks: [
          { id: '1', type: 'LOOP', count: 2, action: 'FORWARD' },
          { id: '2', type: 'TURN_RIGHT' },
          { id: '3', type: 'LOOP', count: 3, action: 'FORWARD' },
          { id: '4', type: 'TURN_LEFT' },
          { id: '5', type: 'LOOP', count: 2, action: 'FORWARD' }
        ]
      }
    });
    expect(optimalRes.pass).toBe(true);
    expect(optimalRes.data.isOptimal).toBe(true);
    expect(optimalRes.data.blockCount).toBe(5);
    expect(optimalRes.feedback).toContain('卓越評價');
  });

  // Level 5: Functions & Object Arguments f(x)
  it('Level 5: validates activateScan(scanParams) with range >= 18 and HIGH mode', () => {
    const passRes = level5.validate({
      methodCall: {
        methodId: 'activateScan',
        params: { range: 20, mode: 'HIGH', target: 'FAR-07', power: 80, duration: 1 }
      }
    });
    expect(passRes.pass).toBe(true);
    expect(passRes.data.returns).toBe('SCAN_COMPLETE');

    // Wrong method: focusScan fails even with good params
    const wrongMethod = level5.validate({
      methodCall: {
        methodId: 'focusScan',
        params: { range: 20, mode: 'HIGH', target: 'FAR-07', power: 80, duration: 1 }
      }
    });
    expect(wrongMethod.pass).toBe(false);
    expect(wrongMethod.error).toContain('方法選型錯誤');

    // Wrong method: pingEcho fails
    const pingFail = level5.validate({
      methodCall: {
        methodId: 'pingEcho',
        params: { range: 20, mode: 'HIGH', target: 'NEAR-01', power: 50, duration: 3 }
      }
    });
    expect(pingFail.pass).toBe(false);
    expect(pingFail.error).toContain('方法選型錯誤');

    // Right method, range too short
    const shortRange = level5.validate({
      methodCall: {
        methodId: 'activateScan',
        params: { range: 15, mode: 'HIGH', target: 'FAR-07', power: 80, duration: 1 }
      }
    });
    expect(shortRange.pass).toBe(false);
    expect(shortRange.error).toContain('參數不足');

    // Legacy moduleConfig shape still migrates
    const legacyPass = level5.validate({
      moduleConfig: { moduleId: 'quantum-scanner', range: 20, mode: 'HIGH', isMethodInvoked: true }
    });
    expect(legacyPass.pass).toBe(true);
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
    const tpeJson = BENCHMARK_STATION_DATA['station-tpe'];
    const passRes = level8.validate({
      weatherSession: {
        rawJson: tpeJson,
        paths: {
          windPath: 'current.wind_speed_10m',
          tempPath: 'current.temperature_2m',
          precipPath: 'hourly.precipitation_probability[0]'
        },
        station: { id: 'station-tpe', name: '台北觀測站' },
        launched: true,
        isRealData: false
      }
    });
    expect(passRes.pass).toBe(true);

    // High wind station (Tokyo 38km/h) exceeds 25km/h limit
    const tyoJson = BENCHMARK_STATION_DATA['station-tyo'];
    const highWind = level8.validate({
      weatherSession: {
        rawJson: tyoJson,
        paths: {
          windPath: 'current.wind_speed_10m',
          tempPath: 'current.temperature_2m',
          precipPath: 'hourly.precipitation_probability[0]'
        },
        station: { id: 'station-tyo', name: '東京觀測站' },
        launched: true,
        isRealData: false
      }
    });
    expect(highWind.pass).toBe(false);
    expect(highWind.error).toContain('風速高達');
  });

  it('Weather Service: correctly flags unsafe wind and rain conditions', () => {
    const tpeJson = BENCHMARK_STATION_DATA['station-tpe'];
    const safeResult = evaluateTelemetry(tpeJson, {
      windPath: 'current.wind_speed_10m',
      tempPath: 'current.temperature_2m',
      precipPath: 'hourly.precipitation_probability[0]'
    });
    expect(safeResult.canLaunch).toBe(true);
    expect(safeResult.allSensorsOnline).toBe(true);

    const tyoJson = BENCHMARK_STATION_DATA['station-tyo'];
    const unsafeResult = evaluateTelemetry(tyoJson, {
      windPath: 'current.wind_speed_10m',
      tempPath: 'current.temperature_2m',
      precipPath: 'hourly.precipitation_probability[0]'
    });
    expect(unsafeResult.canLaunch).toBe(false);
    expect(unsafeResult.failReason).toBe('WIND');

    // Bad JSON paths -> sensors offline
    const badPaths = evaluateTelemetry(tpeJson, {
      windPath: 'current.not_exist',
      tempPath: '',
      precipPath: ''
    });
    expect(badPaths.allSensorsOnline).toBe(false);
    expect(badPaths.canLaunch).toBe(false);

    // resolveJsonPath sanity
    expect(resolveJsonPath(tpeJson, 'current.wind_speed_10m')).toBe(14.2);
    expect(resolveJsonPath(tpeJson, 'hourly.precipitation_probability[0]')).toBe(15);
  });

  // Strict Pedagogical Rule: No Level Passes Without Active Student Interaction & Tuning!
  it('Anti-Spoil Audit: verifies that ALL 8 levels fail validation in their initial/unconfigured state', () => {    // Level 1 initial state (empty name, 0 power, false shield) -> FAILS
    expect(level1.validate({ variables: level1.initialVariables }).pass).toBe(false);

    // Level 2 initial state (150 fuel, 30 burn, 3 thrust, 2 speed => distance 6 < 24) -> FAILS
    const l2Res = level2.validate({ params: level2.initialParams });
    expect(l2Res.pass).toBe(false);
    expect(l2Res.error).toContain('推力不足');

    // Level 3 initial state (dangerously rushed condition thresholds) -> FAILS
    const l3Res = level3.validate({ rules: { rule1Threshold: 2, rule1Action: 'FULL_SPEED', rule2Threshold: 8, rule2Action: 'STOP', fallbackAction: 'SLOW_DOWN' } });
    expect(l3Res.pass).toBe(false);

    // Level 4 initial state (only 1 step forward) -> FAILS (stops far short of target)
    const l4Res = level4.validate({ loopConfig: level4.initialLoopConfig });
    expect(l4Res.pass).toBe(false);
    expect(l4Res.error).toContain('未抵達目的地');

    // Level 5 initial state (pingEcho + range 10 < 18) -> FAILS on method selection
    const l5Res = level5.validate({ methodCall: level5.initialMethodCall });
    expect(l5Res.pass).toBe(false);
    expect(l5Res.error).toContain('方法選型錯誤');

    // Level 6 initial state (disarmed false, airlockOpen false) -> FAILS
    const l6Res = level6.validate({ domState: { bindings: { disarmEvent: 'mouseover', airlockEvent: 'dblclick' }, disarmed: false, airlockOpen: false } });
    expect(l6Res.pass).toBe(false);

    // Level 7 initial state (threshold 10% causes low battery drone to crash) -> FAILS
    const l7Res = level7.validate({ fleetConfig: { batteryThreshold: 10, lowBatteryAction: 'PATROL', normalBatteryAction: 'RETURN_BASE', dispatched: true } });
    expect(l7Res.pass).toBe(false);
    expect(l7Res.error).toContain('墜毀');

    // Level 8 initial state (no weather data fetched) -> FAILS
    const l8Res = level8.validate({ weatherSession: { weatherData: null, conditions: { maxWindSpeed: 10, maxPrecipitation: 10 }, launched: false } });
    expect(l8Res.pass).toBe(false);
  });

  // L4 MVP: code-trace validation (Worker apiCalls) + stars
  it('Level 4 code mode: validates apiCalls trace and awards stars by for usage', () => {
    const toCalls = (actions) => actions.map((a) => ({ api: `rover.${a}`, args: [] }));
    // Canonical 2-3-2 path: 2F, R, 3F, L, 2F = 9 calls
    const optimalActions = [
      'moveForward', 'moveForward',
      'turnRight',
      'moveForward', 'moveForward', 'moveForward',
      'turnLeft',
      'moveForward', 'moveForward'
    ];
    const optimalCode = `for (let i = 0; i < 2; i++) { rover.moveForward(); }
rover.turnRight();
for (let j = 0; j < 3; j++) { rover.moveForward(); }
rover.turnLeft();
for (let k = 0; k < 2; k++) { rover.moveForward(); }`;

    const optimalRes = level4.validate({ apiCalls: toCalls(optimalActions), code: optimalCode });
    expect(optimalRes.pass).toBe(true);
    expect(optimalRes.data.stars).toBe(3);
    expect(optimalRes.data.isOptimal).toBe(true);
    expect(optimalRes.data.fromCode).toBe(true);

    // Same arrival without for -> 1 star (discourages hard-coded spam)
    const spamCode = optimalActions.map((a) => `rover.${a}();`).join('\n');
    const spamRes = level4.validate({ apiCalls: toCalls(optimalActions), code: spamCode });
    expect(spamRes.pass).toBe(true);
    expect(spamRes.data.stars).toBe(1);

    // Empty trace -> fail
    const emptyRes = level4.validate({ apiCalls: [], code: '' });
    expect(emptyRes.pass).toBe(false);

    // Crash into rock: 3x forward from start hits (1,3)
    const crashRes = level4.validate({
      apiCalls: toCalls(['moveForward', 'moveForward', 'moveForward']),
      code: 'for (let i = 0; i < 3; i++) { rover.moveForward(); }'
    });
    expect(crashRes.pass).toBe(false);
    expect(crashRes.error).toContain('撞擊岩石');
  });
});
