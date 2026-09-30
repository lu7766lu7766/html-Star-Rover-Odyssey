/**
 * Star Rover Odyssey - Web Worker Sandbox
 * Runs student code in an isolated environment with restricted APIs
 */

import { MockDocument, MockElement } from './mockDOM.js';
import { MSG_TYPE } from './protocol.js';
import { BENCHMARK_STATION_DATA } from '../services/weatherService.js';

const workerSelf = self;

// Global state within worker instance
let currentMockDoc = null;
let recordedAPICalls = [];
let capturedLogs = [];

function postLog(type, args) {
  if (capturedLogs.length >= 100) return;
  const serialized = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return arg;
  });
  capturedLogs.push({ type, args: serialized, time: Date.now() });
  workerSelf.postMessage({
    type: MSG_TYPE.CONSOLE_LOG,
    payload: { type, args: serialized }
  });
}

// Sandboxed console
const sandboxedConsole = {
  log: (...args) => postLog('log', args),
  warn: (...args) => postLog('warn', args),
  error: (...args) => postLog('error', args),
  info: (...args) => postLog('log', args)
};

// Safe assert function
function sandboxedAssert(condition, message = '斷言失敗') {
  if (!condition) {
    throw new Error(`[AssertionError] ${message}`);
  }
}

workerSelf.onmessage = function (e) {
  const { type, payload } = e.data || {};

  if (type === MSG_TYPE.TRIGGER_EVENT) {
    const { targetId, eventType } = payload || {};
    if (currentMockDoc && currentMockDoc.elements[targetId]) {
      currentMockDoc.elements[targetId].dispatchEvent(eventType);
      workerSelf.postMessage({
        type: MSG_TYPE.DOM_MUTATION,
        payload: currentMockDoc.getSnapshot()
      });
    }
    return;
  }

  if (type === MSG_TYPE.GET_SNAPSHOT) {
    workerSelf.postMessage({
      type: MSG_TYPE.DOM_SNAPSHOT,
      payload: currentMockDoc ? currentMockDoc.getSnapshot() : null
    });
    return;
  }

  if (type === MSG_TYPE.EXECUTE) {
    const { code, levelId, initialData } = payload;
    recordedAPICalls = [];
    capturedLogs = [];

    currentMockDoc = new MockDocument((mutation) => {
      workerSelf.postMessage({
        type: MSG_TYPE.DOM_MUTATION,
        payload: currentMockDoc.getSnapshot()
      });
    });

    // L6 太空艙儀表板：預埋兩顆按鈕＋狀態燈＋氣閘門
    if (levelId === 6) {
      const seed = (id, tag, text, color) => {
        currentMockDoc.elements[id] = new MockElement(id, tag, text, color, currentMockDoc._onMutation);
      };
      seed('disarm-btn', 'button', '解除警報', '#00f2fe');
      seed('airlock-btn', 'button', '開啟氣閘', '#00f2fe');
      seed('status-indicator', 'div', '警報中 (ALARM)', 'red');
      seed('airlock-door', 'div', '氣閘關閉 (LOCKED)', 'gray');
    }

    // Game APIs exposed to student code
    const rover = {
      setup: (name, battery, isActive) => {
        recordedAPICalls.push({ api: 'rover.setup', args: [name, battery, isActive] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.setup', args: [name, battery, isActive] }
        });
      },
      // L4 maze navigation (records trace for level-4 validate)
      moveForward: () => {
        recordedAPICalls.push({ api: 'rover.moveForward', args: [] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.moveForward', args: [] }
        });
      },
      moveBackward: () => {
        recordedAPICalls.push({ api: 'rover.moveBackward', args: [] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.moveBackward', args: [] }
        });
      },
      turnLeft: () => {
        recordedAPICalls.push({ api: 'rover.turnLeft', args: [] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.turnLeft', args: [] }
        });
      },
      turnRight: () => {
        recordedAPICalls.push({ api: 'rover.turnRight', args: [] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.turnRight', args: [] }
        });
      },
      launch: (remainingFuel) => {
        recordedAPICalls.push({ api: 'rover.launch', args: [remainingFuel] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.launch', args: [remainingFuel] }
        });
      },
      // L2 orbital transfer (records full flight params for level-2 validate)
      approachStation: (flightPlan) => {
        recordedAPICalls.push({ api: 'rover.approachStation', args: [flightPlan] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.approachStation', args: [flightPlan] }
        });
      },
      setAutoPilot: (pilotFn) => {
        let testResults = null;
        let fnError = null;
        if (typeof pilotFn === 'function') {
          try {
            // 可見情境 3/10/20 + 隱藏邊界 5/7/15/30（驗 </<= 觀念）
            testResults = {
              3: pilotFn(3),
              5: pilotFn(5),
              7: pilotFn(7),
              10: pilotFn(10),
              15: pilotFn(15),
              20: pilotFn(20),
              30: pilotFn(30)
            };
          } catch (e) {
            fnError = e.message;
          }
        }
        recordedAPICalls.push({
          api: 'rover.setAutoPilot',
          args: [typeof pilotFn === 'function' ? '[Function]' : pilotFn],
          testResults,
          fnError,
          isFunction: typeof pilotFn === 'function'
        });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.setAutoPilot', testResults, isFunction: typeof pilotFn === 'function' }
        });
      },
      installModule: (moduleObj) => {
        let activateResult = null;
        let activateError = null;
        if (moduleObj && typeof moduleObj.activate === 'function') {
          try {
            activateResult = moduleObj.activate();
          } catch (e) {
            activateError = e.message;
          }
        }
        recordedAPICalls.push({
          api: 'rover.installModule',
          args: [{
            name: moduleObj?.name,
            range: moduleObj?.range,
            mode: moduleObj?.mode,
            activateResult,
            activateError,
            hasActivate: typeof moduleObj?.activate === 'function'
          }]
        });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: {
            api: 'rover.installModule',
            args: [{
              name: moduleObj?.name,
              range: moduleObj?.range,
              mode: moduleObj?.mode,
              activateResult,
              hasActivate: typeof moduleObj?.activate === 'function'
            }]
          }
        });
      }
    };

    const drill = {
      dig: (depthIndex) => {
        recordedAPICalls.push({ api: 'drill.dig', args: [depthIndex] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'drill.dig', args: [depthIndex] }
        });
      }
    };

    // Level 7 drone fleet initial dataset
    const drones = initialData?.drones || [
      { id: "drone-01", x: -6, y: 5, z: 2, battery: 85 },
      { id: "drone-02", x: -2, y: 7, z: -3, battery: 18 },
      { id: "drone-03", x: 3, y: 6, z: 1, battery: 92 },
      { id: "drone-04", x: 7, y: 4, z: -2, battery: 15 }
    ];

    const droneFleet = {
      deploy: (droneList) => {
        recordedAPICalls.push({ api: 'droneFleet.deploy', args: [droneList] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'droneFleet.deploy', args: [droneList] }
        });
      }
    };

    // Level 8 simulated weather API (teaches async/await + JSON paths offline)
    const fetchStation = async (stationId) => {
      recordedAPICalls.push({ api: 'fetchStation', args: [stationId] });
      workerSelf.postMessage({
        type: MSG_TYPE.GAME_API_CALL,
        payload: { api: 'fetchStation', args: [stationId] }
      });
      const bench = BENCHMARK_STATION_DATA[stationId];
      if (!bench) {
        throw new Error(`未知觀測站 "${stationId}"！可用：station-tpe / station-tyo / station-lon / station-dxb / station-rkv`);
      }
      return JSON.parse(JSON.stringify(bench));
    };

    // Level 8 drone launch control
    const drone = {
      launch: (stationId) => {
        recordedAPICalls.push({ api: 'drone.launch', args: [stationId] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'drone.launch', args: [stationId] }
        });
      },
      abortMission: () => {
        recordedAPICalls.push({ api: 'drone.abortMission', args: [] });
        workerSelf.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'drone.abortMission', args: [] }
        });
      }
    };

    try {
      // Create execution scope with strict forbidden globals
      // NOTE: 'eval' and 'arguments' are NOT allowed as formal parameter names in strict mode!
      const executeFn = new Function(
        'console',
        'assert',
        'rover',
        'drill',
        'document',
        'drones',
        'droneFleet',
        'fetchStation',
        'drone',
        'window',
        'self',
        'globalThis',
        'fetch',
        'XMLHttpRequest',
        'importScripts',
        'Function',
        `"use strict";\n${code}`
      );

      // Execute student code
      const result = executeFn(
        sandboxedConsole,
        sandboxedAssert,
        rover,
        drill,
        currentMockDoc,
        drones,
        droneFleet,
        fetchStation,
        drone,
        undefined, // window
        undefined, // self
        undefined, // globalThis
        undefined, // fetch
        undefined, // XMLHttpRequest
        undefined, // importScripts
        undefined  // Function
      );

      // Execute student code, then flush async continuations (L8 async/await):
      // floating promises (e.g. evaluateAndLaunch()) resolve as microtasks,
      // so wait a macrotask beat before snapshotting apiCalls/logs.
      Promise.resolve(result)
        .catch(() => {})
        .then(() => new Promise((res) => setTimeout(res, 400)))
        .then(() => {
          workerSelf.postMessage({
            type: MSG_TYPE.EXECUTION_SUCCESS,
            payload: {
              result: null,
              logs: capturedLogs,
              apiCalls: recordedAPICalls,
              domState: currentMockDoc.getSnapshot()
            }
          });
        });
    } catch (err) {
      workerSelf.postMessage({
        type: MSG_TYPE.EXECUTION_ERROR,
        payload: {
          error: err.message || String(err),
          stack: err.stack,
          logs: capturedLogs,
          apiCalls: recordedAPICalls
        }
      });
    }
  }
};
