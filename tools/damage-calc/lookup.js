'use strict';
const { getVendor } = require('./load-vendor');

// Per this plan's Global Constraints: the broader natdex is consulted ONLY
// to make error messages more informative. Its data is never returned for
// use in a calculation - a species/move outside the Champions-curated set
// may reflect a different game's balance, and there's no safe EV->SP
// conversion for any reference data attached to it.
function lookupSpecies(name) {
  const v = getVendor();
  const entry = v.POKEDEX_CHAMPIONS[name];
  if (entry) {
    return { name, t1: entry.t1, t2: entry.t2 || null, bs: entry.bs, ab: entry.ab, w: entry.w };
  }
  if (v.POKEDEX_ZA_NATDEX[name]) {
    throw new Error(`"${name}" exists in the broader dex but not in the Champions-legal roster list (vendored POKEDEX_CHAMPIONS) — this may be a genuine Champions restriction, or the vendored roster list may be lagging a recent update. Verify via live search before assuming either way. Not using broader-dex data to compute a result.`);
  }
  throw new Error(`Unknown Pokemon: "${name}" — not found in any vendored dex. Check spelling, or this Pokemon may not exist in any vendored data yet.`);
}

function lookupMove(name) {
  const v = getVendor();
  const entry = v.MOVES_CHAMPIONS[name];
  if (entry) {
    return Object.assign({ name }, entry);
  }
  if (v.MOVES_ZA_NATDEX[name]) {
    throw new Error(`"${name}" exists in the broader move dex but not in the Champions-curated move list (vendored MOVES_CHAMPIONS) — this may mean it's not usable in Champions, or the vendored list may be lagging. Verify via live search. Not using broader-dex move data to compute a result.`);
  }
  throw new Error(`Unknown move: "${name}" — not found in any vendored dex. Check spelling.`);
}

function isKnownAbility(name) {
  const v = getVendor();
  return v.ABILITIES_CHAMPIONS.includes(name);
}

function isKnownItem(name) {
  const v = getVendor();
  return v.ITEMS_CHAMPIONS.includes(name);
}

// lookupPreset(species) -> array of available set names for that species.
// lookupPreset(species, setName) -> { ability, item, nature, sps, moves }
// for that specific named set. SETDEX_GEN10 is best-effort/incomplete by
// design (see this plan's Global Constraints) - a species having zero
// presets is expected, not an error condition to silently swallow.
function lookupPreset(species, setName) {
  const v = getVendor();
  const speciesPresets = v.SETDEX_GEN10[species];
  if (!speciesPresets || Object.keys(speciesPresets).length === 0) {
    throw new Error(`No presets available for "${species}" in the vendored SETDEX_GEN10 data — this is expected for less-common Pokemon (preset coverage is best-effort, not comprehensive), specify --*-ability/--*-item/--*-nature/--*-sp explicitly instead.`);
  }
  if (setName === undefined) {
    return Object.keys(speciesPresets);
  }
  const preset = speciesPresets[setName];
  if (!preset) {
    throw new Error(`"${species}" has presets, but no preset named "${setName}". Available: ${Object.keys(speciesPresets).join(', ')}`);
  }
  return preset;
}

module.exports = { lookupSpecies, lookupMove, isKnownAbility, isKnownItem, lookupPreset };
