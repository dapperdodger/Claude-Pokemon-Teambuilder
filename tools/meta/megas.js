'use strict';
// Pikalytics' ladder upstream aggregates by BASE species and encodes the Mega
// as a held item, so "Raichu" + "Raichunite Y" IS Mega Raichu Y. The
// "Raichu-Mega-Y" page is generated from the dex and has no rows behind it:
// N/A win rate, undefined% items. Asking it makes a Pokemon that is 60.5% of
// all Raichu look unused.
//
// NOTE THE INVERSION: tools/damage-calc requires the OPPOSITE convention —
// there you must pass "Mega Staraptor" and passing base + stone silently
// computes the base form (reference/pitfalls.md, 2026-09-04). Same repo,
// opposite entity rules, both failing confidently when crossed.
//
// The two lookups below are already vendored, so no name-guessing is needed.

const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const vendorPath = path.join(__dirname, '..', 'damage-calc', 'vendor', 'item_data.js');

// item_data.js is a plain script of `var X = {...}` declarations with no
// exports of its own. Evaluate it in a fresh context and read the two
// globals we need off that context afterward, rather than trying to graft a
// module.exports assignment onto the end of foreign source (which collides
// with `sandbox` being declared both outer and inner in the brief's original
// wiring — reassigning a const from inside the function it closes over
// throws "Assignment to constant variable").
function loadLookups() {
  const src = fs.readFileSync(vendorPath, 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(src, context, { filename: vendorPath });
  return {
    LOCK_ITEM_LOOKUP: context.LOCK_ITEM_LOOKUP,
    MEGA_STONE_USER_LOOKUP: context.MEGA_STONE_USER_LOOKUP,
  };
}

const { LOCK_ITEM_LOOKUP, MEGA_STONE_USER_LOOKUP } = loadLookups();

// "Raichu-Mega-Y" -> "Mega Raichu Y"; "Staraptor-Mega" -> "Mega Staraptor".
function pikaToDex(name) {
  const m = String(name).match(/^(.+)-Mega(?:-([XYZ]))?$/);
  if (!m) return name;
  return `Mega ${m[1]}${m[2] ? ' ' + m[2] : ''}`;
}

// "Mega Raichu Y" -> "Raichu-Mega-Y"; "Mega Staraptor" -> "Staraptor-Mega".
function dexToPika(name) {
  const m = String(name).match(/^Mega\s+(.+?)(?:\s+([XYZ]))?$/);
  if (!m) return name;
  return `${m[1]}-Mega${m[2] ? '-' + m[2] : ''}`;
}

function resolve(pikaName) {
  const dexName = pikaToDex(pikaName);
  if (dexName === pikaName) {
    return { isMega: false, base: pikaName, stone: null, dexName: null };
  }
  const stone = LOCK_ITEM_LOOKUP[dexName];
  if (!stone) {
    throw new Error(
      `"${pikaName}" looks like a Mega but no Mega Stone is known for "${dexName}". ` +
      `Check the name, or re-vendor tools/damage-calc if this is a new Mega.`
    );
  }
  const base = MEGA_STONE_USER_LOOKUP[stone];
  if (!base) {
    throw new Error(`Stone "${stone}" has no base species in MEGA_STONE_USER_LOOKUP.`);
  }
  return { isMega: true, base, stone, dexName };
}

module.exports = { pikaToDex, dexToPika, resolve };
