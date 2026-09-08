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
//
// Loading is lazy and memoized rather than run at module-require time: a
// missing or malformed vendor file must surface as this CLI's normal JSON
// error contract, not a raw stack trace thrown while `require('./megas')`
// itself is still resolving, outside any try/catch. Deferring the read to
// the first call that actually needs a lookup (resolve()) keeps it inside
// cli.js's existing try block.
let cachedLookups = null;

// Evaluate already-read vendor source and assert its shape. Split out from
// loadLookups() (which owns the fs read, the path, and the cache) so the
// shape-assertion behaviour — including the "re-vendored with const/let"
// failure mode — is directly unit-testable with synthetic source text and no
// filesystem involved.
function evalLookups(src, sourcePath) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(src, context, { filename: sourcePath });
  const LOCK_ITEM_LOOKUP = context.LOCK_ITEM_LOOKUP;
  const MEGA_STONE_USER_LOOKUP = context.MEGA_STONE_USER_LOOKUP;
  // A re-vendor that switches item_data.js to `const`/`let` (ESM-style)
  // declarations leaves both globals `undefined` here: lexical bindings
  // never attach to the vm context the way `var` does, but vm.runInContext
  // reports no error — the module "loads clean" and only fails later, at a
  // resolve() call, with a bare TypeError naming neither this file nor the
  // fix. Catch that shape mismatch here, at load time, with a message that
  // names the vendored file and the actual cause.
  const lockCount = LOCK_ITEM_LOOKUP && typeof LOCK_ITEM_LOOKUP === 'object'
    ? Object.keys(LOCK_ITEM_LOOKUP).length : 0;
  const stoneCount = MEGA_STONE_USER_LOOKUP && typeof MEGA_STONE_USER_LOOKUP === 'object'
    ? Object.keys(MEGA_STONE_USER_LOOKUP).length : 0;
  if (!lockCount || !stoneCount) {
    throw new Error(
      `"${sourcePath}" loaded but LOCK_ITEM_LOOKUP and/or MEGA_STONE_USER_LOOKUP came back ` +
      `missing or empty. If this file was re-vendored using \`const\`/\`let\` (ESM-style) ` +
      `declarations, they will not attach to the vm context this loader reads from — ` +
      `re-vendor tools/damage-calc with \`var\` declarations, or update megas.js's loader ` +
      `to match the new format.`
    );
  }
  // Case-insensitive index onto LOCK_ITEM_LOOKUP's canonical keys, so a
  // Pikalytics name of any casing ("staraptor-mega", "STARAPTOR-MEGA") still
  // resolves to the correctly-cased dex entry ("Mega Staraptor").
  const lockItemCI = new Map();
  for (const key of Object.keys(LOCK_ITEM_LOOKUP)) lockItemCI.set(key.toLowerCase(), key);
  return { LOCK_ITEM_LOOKUP, MEGA_STONE_USER_LOOKUP, lockItemCI };
}

// `overridePath`, when given, bypasses the memoized cache — it exists so
// tests can exercise the missing-file and bad-shape failure modes against a
// throwaway file without disturbing the real vendored lookups every other
// call in this process relies on.
function loadLookups(overridePath) {
  if (!overridePath && cachedLookups) return cachedLookups;
  const target = overridePath || vendorPath;
  let src;
  try {
    src = fs.readFileSync(target, 'utf8');
  } catch (err) {
    throw new Error(
      `Could not read vendored Mega data at "${target}": ${err.message}. ` +
      `Re-vendor tools/damage-calc if this file is missing or moved.`
    );
  }
  const result = evalLookups(src, target);
  if (!overridePath) cachedLookups = result;
  return result;
}

// "Raichu-Mega-Y" -> "Mega Raichu Y"; "Staraptor-Mega" -> "Mega Staraptor".
// Case-insensitive on "-Mega(-X/Y/Z)" so "staraptor-mega" and
// "STARAPTOR-MEGA" are recognised as Mega names too, not just the exact
// casing Pikalytics happens to render.
function pikaToDex(name) {
  const m = String(name).match(/^(.+)-Mega(?:-([XYZxyz]))?$/i);
  if (!m) return name;
  return `Mega ${m[1]}${m[2] ? ' ' + m[2].toUpperCase() : ''}`;
}

// "Mega Raichu Y" -> "Raichu-Mega-Y"; "Mega Staraptor" -> "Staraptor-Mega".
function dexToPika(name) {
  const m = String(name).match(/^Mega\s+(.+?)(?:\s+([XYZ]))?$/);
  if (!m) return name;
  return `${m[1]}-Mega${m[2] ? '-' + m[2] : ''}`;
}

function resolve(pikaName) {
  const dexNameRaw = pikaToDex(pikaName);
  if (dexNameRaw === pikaName) {
    return { isMega: false, base: pikaName, stone: null, dexName: null };
  }
  const { LOCK_ITEM_LOOKUP, MEGA_STONE_USER_LOOKUP, lockItemCI } = loadLookups();
  const dexName = Object.prototype.hasOwnProperty.call(LOCK_ITEM_LOOKUP, dexNameRaw)
    ? dexNameRaw
    : lockItemCI.get(dexNameRaw.toLowerCase());
  if (!dexName) {
    throw new Error(
      `"${pikaName}" looks like a Mega but no Mega Stone is known for "${dexNameRaw}". ` +
      `Check the name, or re-vendor tools/damage-calc if this is a new Mega.`
    );
  }
  const stone = LOCK_ITEM_LOOKUP[dexName];
  const base = MEGA_STONE_USER_LOOKUP[stone];
  if (!base) {
    throw new Error(`Stone "${stone}" has no base species in MEGA_STONE_USER_LOOKUP.`);
  }
  return { isMega: true, base, stone, dexName };
}

module.exports = { pikaToDex, dexToPika, resolve, loadLookups };
