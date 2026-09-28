/**
 * Star Rover Odyssey - Web Worker Sandbox
 * Runs student code in an isolated environment with restricted APIs
 */

import { MockDocument } from './mockDOM.js';
import { MSG_TYPE } from './protocol.js';

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
  self.postMessage({
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

self.onmessage = function (e) {
  const { type, payload } = e.data || {};

  if (type === MSG_TYPE.TRIGGER_EVENT) {
    const { targetId, eventType } = payload || {};
    if (currentMockDoc && currentMockDoc.elements[targetId]) {
      currentMockDoc.elements[targetId].dispatchEvent(eventType);
      self.postMessage({
        type: MSG_TYPE.DOM_MUTATION,
        payload: currentMockDoc.getSnapshot()
      });
    }
    return;
  }

  if (type === MSG_TYPE.EXECUTE) {
    const { code, levelId, initialData } = payload;
    recordedAPICalls = [];
    capturedLogs = [];

    currentMockDoc = new MockDocument((mutation) => {
      self.postMessage({
        type: MSG_TYPE.DOM_MUTATION,
        payload: currentMockDoc.getSnapshot()
      });
    });

    // Game APIs exposed to student code
    const rover = {
      setup: (name, battery, isActive) => {
        recordedAPICalls.push({ api: 'rover.setup', args: [name, battery, isActive] });
        self.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.setup', args: [name, battery, isActive] }
        });
      },
      launch: (remainingFuel) => {
        recordedAPICalls.push({ api: 'rover.launch', args: [remainingFuel] });
        self.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'rover.launch', args: [remainingFuel] }
        });
      },
      setAutoPilot: (pilotFn) => {
        let testResults = null;
        let fnError = null;
        if (typeof pilotFn === 'function') {
          try {
            testResults = {
              3: pilotFn(3),
              10: pilotFn(10),
              20: pilotFn(20)
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
        self.postMessage({
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
            activateResult,
            activateError,
            hasActivate: typeof moduleObj?.activate === 'function'
          }]
        });
        self.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: {
            api: 'rover.installModule',
            args: [{
              name: moduleObj?.name,
              range: moduleObj?.range,
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
        self.postMessage({
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
        self.postMessage({
          type: MSG_TYPE.GAME_API_CALL,
          payload: { api: 'droneFleet.deploy', args: [droneList] }
        });
      }
    };

    try {
      // Create execution scope with strict forbidden globals
      const executeFn = new Function(
        'console',
        'assert',
        'rover',
        'drill',
        'document',
        'drones',
        'droneFleet',
        'window',
        'self',
        'globalThis',
        'fetch',
        'XMLHttpRequest',
        'importScripts',
        'eval',
        'Function',
        `"use strict";\n${code}`
      );

      // Execute code
      const result = executeFn(
        sandboxedConsole,
        sandboxedAssert,
        rover,
        drill,
        currentMockDoc,
        drones,
        droneFleet,
        undefined, // window
        undefined, // self
        undefined, // globalThis
        undefined, // fetch
        undefined, // XMLHttpRequest
        undefined, // importScripts
        undefined, // eval
        undefined  // Function
      );

      self.postMessage({
        type: MSG_TYPE.EXECUTION_SUCCESS,
        payload: {
          result,
          logs: capturedLogs,
          apiCalls: recordedAPICalls,
          domState: currentMockDoc.getSnapshot()
        }
      });
    } catch (err) {
      self.postMessage({
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
