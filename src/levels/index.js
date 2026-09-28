/**
 * Star Rover Odyssey 2.0 - All 8 Levels Registry
 */

import level1 from './level-1.js';
import level2 from './level-2.js';
import level3 from './level-3.js';
import level4 from './level-4.js';
import level5 from './level-5.js';
import level6 from './level-6.js';
import level7 from './level-7.js';
import level8 from './level-8.js';

export const ALL_LEVELS = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8
];

export function getLevelById(id) {
  const numericId = parseInt(id, 10);
  return ALL_LEVELS.find(lvl => lvl.id === numericId) || ALL_LEVELS[0];
}

export {
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8
};
