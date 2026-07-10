'use strict';

// Champions Stat Points (SP) formula, Level 50 always.
// Verified against reference/vgc_current_regulation.md's "Stat system"
// section and independently cross-checked against vendored stat_data.js's
// CALC_STAT_CHAMP/CALC_HP_CHAMP (same formula, DOM-coupled — this module
// reimplements it as a pure function instead of calling those).

function computeStat(base, statPoints, alignmentMod) {
  const preAlignment = Math.floor((2 * base + 31) * 50 / 100) + 5 + statPoints;
  return Math.floor(preAlignment * alignmentMod);
}

function computeHP(base, statPoints) {
  if (base === 1) return 1; // Shedinja-style fixed 1 HP, matches CALC_HP_CHAMP
  return Math.floor((2 * base + 31) * 50 / 100) + 50 + 10 + statPoints;
}

module.exports = { computeStat, computeHP };
