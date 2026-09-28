/**
 * Star Rover Odyssey - Worker Message Protocol
 */

export const MSG_TYPE = {
  // Main -> Worker
  EXECUTE: 'EXECUTE',
  TRIGGER_EVENT: 'TRIGGER_EVENT',

  // Worker -> Main
  CONSOLE_LOG: 'CONSOLE_LOG',
  DOM_MUTATION: 'DOM_MUTATION',
  GAME_API_CALL: 'GAME_API_CALL',
  EXECUTION_SUCCESS: 'EXECUTION_SUCCESS',
  EXECUTION_ERROR: 'EXECUTION_ERROR'
};
