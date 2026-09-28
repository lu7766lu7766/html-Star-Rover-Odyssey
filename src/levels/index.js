/**
 * Star Rover Odyssey - Level Registry
 */

import level1 from './level-1.js';
import level2 from './level-2.js';
import level3 from './level-3.js';
import level4 from './level-4.js';
import level5 from './level-5.js';
import level6 from './level-6.js';
import level7 from './level-7.js';

export const ALL_LEVELS = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7
];

export const LEVEL_MAP = ALL_LEVELS.reduce((acc, lvl) => {
  acc[lvl.id] = lvl;
  return acc;
}, {});

export function getLevelById(id) {
  return LEVEL_MAP[id] || ALL_LEVELS[0];
}
