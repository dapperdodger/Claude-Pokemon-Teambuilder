# Local Damage Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, Bash-invokable damage calculator for VGC/Pokémon Champions that uses vendored, actively-maintained real game data and the actual NCP damage-calculation engine (not a hand-rolled reimplementation), with a documented safety net for staleness and correctness.

**Architecture:** Vendor the NCP-VGC-Damage-Calculator's data files and calculation engine (`damage_MASTER.js`/`damage_SV.js`) unmodified into `tools/damage-calc/vendor/`. These files were confirmed during design research to be almost entirely DOM-free — the actual math is a plain function, `GET_DAMAGE_SV(attacker, defender, move, field)`, taking plain JS objects. Write our own small glue layer (`tools/damage-calc/calc.js`) that builds those objects from vendored Pokémon/move/ability/item data plus caller-supplied SP allocation/nature/item/ability — replacing the original's DOM-reading `ap_calc.js` orchestration layer, not its math. A CLI wrapper (`cli.js`) makes it Bash-invokable with structured JSON output that shows exactly which data records were matched.

**Tech Stack:** Node.js (v22.19.0 confirmed available, no version floor issues), Node's built-in `node:test` module (no test framework dependency needed), Playwright via `npx` (one-off, not a project dependency) for offline fixture validation only.

## Global Constraints

- Vendored files must be copied byte-for-byte unmodified from commit `dfbf020d4ed7df8921c6e11bbaa23410f6ca1448` of `https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator` (confirmed current `main` HEAD during design research on 2026-07-09) — this exact SHA goes in `VENDOR_MANIFEST.md`.
- Exception: `tools/damage-calc/vendor/side.js` contains a **verbatim extract** of just the `Side` function from that commit's `script_res/ap_calc.js` (lines 2148-2174) — not the whole file, since the rest of `ap_calc.js` has top-level DOM/jQuery side effects that would throw outside a browser. This must be documented as a verbatim extract (not a rewrite) in `VENDOR_MANIFEST.md`, with the exact source line range.
- Champions mode in this codebase is `gen = 10`, using `POKEDEX_CHAMPIONS`, `MOVES_CHAMPIONS`, `ABILITIES_CHAMPIONS`, `ITEMS_CHAMPIONS`, `TYPE_CHART_SV` — confirmed from `script_res/ap_calc.js`'s gen-dispatch switch statement (`case 10: //Champions`) during design research. Every task that selects data must use exactly these four variables, not `POKEDEX_SV`/`MOVES_SV`/etc. (those are Gen 9 SV, a different roster).
- The Stat Points formula (already verified and documented in `reference/vgc_current_regulation.md`) is: `floor(((floor((base*2+31)*50/100)+5)+SP)*alignmentMod)` for non-HP stats, `floor((base*2+31)*50/100)+50+10+SP` for HP. Level is always 50.
- No RBY/GSC/ADV/DPP/BW/XY/SM/SS/LGPE generation logic — Champions (`gen=10`) only.
- Every reference file this plan touches (`reference/vgc_damage_calc.md`) keeps the existing `## Changelog` convention: `Date | Change | Source` table, dated 2026-07-09.
- `tools/damage-calc/vendor/` files are vendored copies, not symlinks or git submodules — re-vendoring is a manual, explicit step (per the approved design spec's Section 6, Layer 1).
- **No natdex fallback for missing Pokémon/moves.** If a species/move isn't in `POKEDEX_CHAMPIONS`/`MOVES_CHAMPIONS`, do NOT silently compute a result from `POKEDEX_ZA_NATDEX`/`MOVES_ZA_NATDEX` data — a Pokémon or move outside the Champions-curated set may reflect a different game's balance (different base stats, different move power/effects) that Champions-specific patches never touched, and there is no reliable way to convert an older-generation EV-denominated reference spread into the Stat Points system. The full natdex may ONLY be consulted to make the resulting "not found" error message more informative (distinguishing "doesn't exist in any vendored dex" from "exists in the broader dex but not in Champions' curated roster — could be a genuine restriction or a stale roster list, verify via live search"). Never use natdex stats/movedata to compute an actual damage number.
- **Preset builds (`SETDEX_GEN10`) are optional and best-effort, not comprehensive.** Not every Champions-legal Pokémon has a curated preset (e.g. newer Regulation M-B additions may have no entry yet) — a missing preset is expected, not a bug, and must produce a clear "no preset for X" error distinct from "X is not Champions-legal," not a crash.

---

### Task 1: Vendor NCP data/engine files and build a DOM/jQuery stub

**Files:**
- Create: `tools/damage-calc/vendor/pokedex.js` (copy of `script_res/pokedex.js`)
- Create: `tools/damage-calc/vendor/move_data.js` (copy of `script_res/move_data.js`)
- Create: `tools/damage-calc/vendor/ability_data.js` (copy of `script_res/ability_data.js`)
- Create: `tools/damage-calc/vendor/item_data.js` (copy of `script_res/item_data.js`)
- Create: `tools/damage-calc/vendor/type_data.js` (copy of `script_res/type_data.js`)
- Create: `tools/damage-calc/vendor/nature_data.js` (copy of `script_res/nature_data.js`)
- Create: `tools/damage-calc/vendor/stat_data.js` (copy of `script_res/stat_data.js`, kept for provenance/reference only — not required at runtime, see Task 2)
- Create: `tools/damage-calc/vendor/damage_MASTER.js` (copy of `script_res/damage_MASTER.js`)
- Create: `tools/damage-calc/vendor/damage_SV.js` (copy of `script_res/damage_SV.js`)
- Create: `tools/damage-calc/vendor/setdex_ncp-g10.js` (copy of `script_res/setdex_ncp-g10.js` — Champions preset builds, `SETDEX_GEN10`, confirmed the only setdex source `gen=10` uses)
- Create: `tools/damage-calc/vendor/side.js` (verbatim extract of the `Side` function only, from `script_res/ap_calc.js` lines 2148-2174)
- Create: `tools/damage-calc/dom-stub.js`
- Create: `tools/damage-calc/VENDOR_MANIFEST.md`
- Test: `tools/damage-calc/tests/vendor-loads.test.js`

**Interfaces:**
- Produces: a global `$` function (jQuery-shaped stub) that `tools/damage-calc/dom-stub.js` exports as `installDomStub()`, which — when called — assigns `global.$` before any vendored file is `require`d.
- Produces: after `require`-ing all vendor files in order, these globals exist and are usable: `POKEDEX_CHAMPIONS`, `POKEDEX_ZA_NATDEX`, `MOVES_CHAMPIONS`, `MOVES_ZA_NATDEX`, `ABILITIES_CHAMPIONS`, `ITEMS_CHAMPIONS`, `TYPE_CHART_SV`, `NATURES`, `SETDEX_GEN10`, `GET_DAMAGE_SV`, `Side`. (`POKEDEX_ZA_NATDEX`/`MOVES_ZA_NATDEX` — the fuller, non-Champions-curated dex — are consumed only for improving error messages in Task 3, per this plan's Global Constraints section; never for computing a real damage number.)
- Consumes: nothing from earlier tasks (this is the first task).

- [ ] **Step 1: Download the exact vendored commit's files**

Run (from the repo root):

```bash
mkdir -p tools/damage-calc/vendor tools/damage-calc/tests
SHA=dfbf020d4ed7df8921c6e11bbaa23410f6ca1448
BASE="https://raw.githubusercontent.com/nerd-of-now/NCP-VGC-Damage-Calculator/$SHA/script_res"
for f in pokedex.js move_data.js ability_data.js item_data.js type_data.js nature_data.js stat_data.js damage_MASTER.js damage_SV.js setdex_ncp-g10.js; do
  curl -sL "$BASE/$f" -o "tools/damage-calc/vendor/$f"
done
curl -sL "https://raw.githubusercontent.com/nerd-of-now/NCP-VGC-Damage-Calculator/$SHA/script_res/ap_calc.js" -o /tmp/ap_calc_reference.js
```

Expected: ten files created under `tools/damage-calc/vendor/`, each non-empty. Verify with:

```bash
wc -l tools/damage-calc/vendor/*.js
```

Expected: line counts roughly matching `pokedex.js` ~18433, `move_data.js` ~5826, `damage_MASTER.js` ~2631, `damage_SV.js` ~192, others smaller.

- [ ] **Step 2: Extract the `Side` function verbatim into its own vendor file**

Open `/tmp/ap_calc_reference.js`, find the `function Side(...)` block (starts with `function Side(format, terrain, weather, ...)`, ends at its matching closing `}` — confirmed during design research to run from source line 2148 to 2174 at the pinned commit, but re-locate it by searching for `function Side(` since line numbers can shift by a line or two between fetches). Copy that function, byte-for-byte, into a new file:

`tools/damage-calc/vendor/side.js`:
```javascript
// Verbatim extract of the `Side` function from
// https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator/blob/dfbf020d4ed7df8921c6e11bbaa23410f6ca1448/script_res/ap_calc.js
// (source lines ~2148-2174 at that commit). Extracted (not rewritten) because
// the rest of ap_calc.js has top-level DOM/jQuery side effects that throw
// outside a browser; this one function has none.
module.exports.Side = function Side(format, terrain, weather, isGravity, isSR, spikes, isReflect, isLightScreen, isForesight, isHelpingHand, isFriendGuard, isBattery, isProtect, isPowerSpot, isSteelySpirit, isNeutralizingGas, isGmaxField, isFlowerGiftSpD, isFlowerGiftAtk, isTailwind, isSaltCure, isAuroraVeil, isSwamp, isSeaFire, isRedItem, isBlueItem, isCharge) {
    this.format = format;
    this.terrain = terrain;
    this.weather = weather;
    this.isGravity = isGravity;
    this.isSR = isSR;
    this.spikes = spikes;
    this.isReflect = isReflect;
    this.isLightScreen = isLightScreen;
    this.isForesight = isForesight;
    this.isHelpingHand = isHelpingHand;
    this.isFriendGuard = isFriendGuard;
    this.isBattery = isBattery;
    this.isProtect = isProtect;
    this.isPowerSpot = isPowerSpot;
    this.isSteelySpirit = isSteelySpirit;
    this.isNeutralizingGas = isNeutralizingGas;
    this.isGMaxField = isGmaxField;
    this.isFlowerGiftSpD = isFlowerGiftSpD;
    this.isFlowerGiftAtk = isFlowerGiftAtk;
    this.isTailwind = isTailwind;
    this.isSaltCure = isSaltCure;
    this.isAuroraVeil = isAuroraVeil;
    this.isSwamp = isSwamp;
    this.isSeaFire = isSeaFire;
    this.isRedItem = isRedItem;
    this.isBlueItem = isBlueItem;
    this.isCharge = isCharge;
};
```

Before saving, diff this against `/tmp/ap_calc_reference.js`'s actual `Side` function body to confirm it's an exact match (the only change allowed is wrapping it in `module.exports.Side = ...` instead of a bare `function Side(...)` declaration).

- [ ] **Step 3: Write the DOM/jQuery stub**

The vendored data files call `$.extend(true, {}, ...)` at module-load time to build layered generation data (this must be a REAL deep merge, not a stub, since it's how `POKEDEX_CHAMPIONS` etc. actually get built). `damage_MASTER.js` separately makes ~14 narrow `$(selector).is(...)`/`.prop(...)`/`.val()` calls for rare edge-case UI toggles (Ruin abilities, Aura abilities, a couple of evolution-line interactions) — these are safe to default to "off/unchecked" since none of them are the base mechanics this calculator needs to get right by default.

Create `tools/damage-calc/dom-stub.js`:
```javascript
'use strict';

function deepExtend(deep, target, ...sources) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (deep && value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = deepExtend(true, (target[key] && typeof target[key] === 'object') ? target[key] : {}, value);
      } else {
        target[key] = value;
      }
    }
  }
  return target;
}

function fakeJQueryElement() {
  return {
    is: () => false,
    prop: () => false,
    val: () => undefined,
    find: () => fakeJQueryElement(),
    text: () => undefined,
    attr: () => undefined,
    length: 0,
  };
}

function installDomStub() {
  function dollar(_selector) {
    return fakeJQueryElement();
  }
  dollar.extend = function (...args) {
    if (typeof args[0] === 'boolean') {
      const [deep, target, ...sources] = args;
      return deepExtend(deep, target, ...sources);
    }
    const [target, ...sources] = args;
    return deepExtend(false, target, ...sources);
  };
  dollar.isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;
  global.$ = dollar;
}

module.exports = { installDomStub, deepExtend };
```

- [ ] **Step 4: Write the vendor-loading smoke test**

`tools/damage-calc/tests/vendor-loads.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { installDomStub } = require('../dom-stub');

test('vendored files load without throwing and expose Champions data', () => {
  installDomStub();
  global.gen = 10;

  require(path.join(__dirname, '..', 'vendor', 'nature_data.js'));
  require(path.join(__dirname, '..', 'vendor', 'type_data.js'));
  require(path.join(__dirname, '..', 'vendor', 'pokedex.js'));
  require(path.join(__dirname, '..', 'vendor', 'move_data.js'));
  require(path.join(__dirname, '..', 'vendor', 'ability_data.js'));
  require(path.join(__dirname, '..', 'vendor', 'item_data.js'));
  require(path.join(__dirname, '..', 'vendor', 'damage_MASTER.js'));
  require(path.join(__dirname, '..', 'vendor', 'damage_SV.js'));
  require(path.join(__dirname, '..', 'vendor', 'setdex_ncp-g10.js'));

  assert.ok(global.POKEDEX_CHAMPIONS, 'POKEDEX_CHAMPIONS should be defined');
  assert.ok(global.POKEDEX_CHAMPIONS.Garchomp, 'Garchomp should be in POKEDEX_CHAMPIONS');
  assert.equal(global.POKEDEX_CHAMPIONS.Garchomp.bs.hp, 108);
  assert.equal(global.POKEDEX_CHAMPIONS.Garchomp.bs.at, 130);
  assert.equal(global.POKEDEX_CHAMPIONS.Garchomp.bs.sp, 102);
  assert.equal(global.POKEDEX_CHAMPIONS.Garchomp.t1, 'Dragon');
  assert.equal(global.POKEDEX_CHAMPIONS.Garchomp.t2, 'Ground');

  assert.ok(global.POKEDEX_ZA_NATDEX, 'POKEDEX_ZA_NATDEX (fuller dex, for error messages only) should be defined');
  assert.ok(global.POKEDEX_ZA_NATDEX.Miraidon, 'Miraidon should be in the full natdex even though not Champions-legal');
  assert.ok(!global.POKEDEX_CHAMPIONS.Miraidon, 'Miraidon should NOT be in the Champions-curated roster (confirms the two dexes are genuinely different sizes)');

  assert.ok(global.MOVES_CHAMPIONS, 'MOVES_CHAMPIONS should be defined');
  assert.ok(global.MOVES_CHAMPIONS['Rock Slide'], 'Rock Slide should be in MOVES_CHAMPIONS');
  assert.equal(global.MOVES_CHAMPIONS['Rock Slide'].bp, 75);
  assert.equal(global.MOVES_CHAMPIONS['Rock Slide'].type, 'Rock');

  assert.ok(global.SETDEX_GEN10, 'SETDEX_GEN10 (preset builds) should be defined');
  assert.ok(global.SETDEX_GEN10.Garchomp, 'Garchomp should have at least one preset');

  assert.equal(typeof global.GET_DAMAGE_SV, 'function', 'GET_DAMAGE_SV should be a function');
});
```

**Note on vendored files being non-module scripts:** the vendored `.js` files declare bare `var X = ...` at top level, not `module.exports`. `require()`-ing them in Node still runs them and (because Node wraps modules but `var` at a file's top level does NOT create a global) their variables will NOT automatically appear on `global`. Before running the test, check this assumption: run `node -e "require('./tools/damage-calc/vendor/pokedex.js'); console.log(typeof POKEDEX_CHAMPIONS)"` from the repo root. If it prints `undefined` instead of `object`, the vendored files need one addition **at the bottom of each vendored data/engine file** (not a modification of their logic, an append): a line like `if (typeof module !== 'undefined') module.exports = { POKEDEX_CHAMPIONS, POKEDEX_SV, ... };` is fragile given how many variables each file defines — instead, prefer running each vendored file through Node's `vm` module with a shared context object so their top-level `var` declarations land as properties on one shared object accessible to the rest of the tool. Rewrite Task 1 Steps 3-4 using this approach if the plain-`require` assumption fails:

```javascript
// tools/damage-calc/load-vendor.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadVendorUncached() {
  const sandbox = { console, gen: 10 };
  const realGlobalDollar = global.$;
  require('./dom-stub').installDomStub();
  sandbox.$ = global.$;
  global.$ = realGlobalDollar; // don't leak the stub into the real global scope

  const files = ['nature_data.js', 'type_data.js', 'pokedex.js', 'move_data.js',
    'ability_data.js', 'item_data.js', 'damage_MASTER.js', 'damage_SV.js', 'setdex_ncp-g10.js'];
  vm.createContext(sandbox);
  for (const f of files) {
    const code = fs.readFileSync(path.join(__dirname, 'vendor', f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }
  return sandbox;
}

let cached = null;
// Cached singleton — every caller (lookup.js, calc.js, tests) shares one
// loaded vendor context instead of each re-running ~28,000 lines of setup.
function getVendor() {
  if (!cached) cached = loadVendorUncached();
  return cached;
}

module.exports = { getVendor };
```

This `load-vendor.js` file, and its `getVendor()` export, are ONLY created if the plain-`require` check above fails. If plain `require()` DOES populate `global.POKEDEX_CHAMPIONS` etc. directly, skip `load-vendor.js` entirely — Tasks 3 and 4 then `require('./vendor/...')` files directly (Node caches each file's execution automatically, so no duplicate-loading concern either way) and read off `global.*` instead of calling `getVendor()`. Whichever branch is used, Tasks 3 and 4 MUST use the same one — do not mix plain-global reads in one file and `getVendor()` in another.

Verify which approach (plain `require` vs. `vm` context) actually works by running the `node -e` check above FIRST, before writing the test file, and use whichever one actually makes `POKEDEX_CHAMPIONS` accessible. Update `tools/damage-calc/tests/vendor-loads.test.js` to match whichever approach is used (import `getVendor()` and read properties off its returned object instead of `global.*` if the `vm` approach is needed).

- [ ] **Step 5: Run the test and confirm it passes**

Run: `node --test tools/damage-calc/tests/vendor-loads.test.js`
Expected: 1 test passing, 0 failing. If it fails on the `require`-vs-`vm` question from Step 4's note, apply that fix and re-run before proceeding.

- [ ] **Step 6: Write the vendor manifest**

`tools/damage-calc/VENDOR_MANIFEST.md`:
```markdown
# Vendor Manifest — NCP VGC Damage Calculator

Source: https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator
License: MIT (see upstream LICENSE)

## Vendored files (unmodified, byte-for-byte)

Commit: `dfbf020d4ed7df8921c6e11bbaa23410f6ca1448` (main branch HEAD, 2026-07-09)

- `pokedex.js` <- `script_res/pokedex.js`
- `move_data.js` <- `script_res/move_data.js`
- `ability_data.js` <- `script_res/ability_data.js`
- `item_data.js` <- `script_res/item_data.js`
- `type_data.js` <- `script_res/type_data.js`
- `nature_data.js` <- `script_res/nature_data.js`
- `stat_data.js` <- `script_res/stat_data.js` (reference only, not required at runtime — see calc.js's own stat formula module)
- `damage_MASTER.js` <- `script_res/damage_MASTER.js`
- `damage_SV.js` <- `script_res/damage_SV.js`
- `setdex_ncp-g10.js` <- `script_res/setdex_ncp-g10.js` (`SETDEX_GEN10` —
  Champions preset builds, used only for the CLI's optional `--*-preset`
  flag, Task 5. Best-effort community-curated coverage, not comprehensive —
  e.g. Vileplume is Champions-legal per `POKEDEX_CHAMPIONS` but has no
  preset entry here as of this vendoring; that's expected.)

## Vendored files (verbatim extract, not the whole source file)

- `side.js` <- the `Side` function only, from `script_res/ap_calc.js` (source
  lines ~2148-2174 at the pinned commit). Extracted rather than the whole
  file because the rest of `ap_calc.js` has top-level DOM/jQuery side effects
  (event bindings, `localStorage` reads) that throw outside a browser. The
  `Side` function itself has none.

## Not vendored

- `ap_calc.js` (except the `Side` extract above) — DOM-orchestration layer,
  replaced by this repo's own `calc.js`/`cli.js`.
- `ko_chance.js`, `statuscalc.js` — not used by this tool's initial scope.
- `damage_xy.js`, `damage_dpp.js`, `damage_rse.js`, `damage_gsc.js`,
  `damage_rby.js` — legacy-generation calculators, out of scope (Champions/
  gen 10 only, per this repo's own scope boundaries).

## Re-vendoring

This is a deliberate, manual step — not automated. To re-sync:
1. Check the current upstream commit: `curl -s https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main | grep sha`
2. Re-download each file listed above at the new commit.
3. Re-extract `Side` from the new commit's `ap_calc.js` if it changed.
4. Update the commit SHA in this file and add a changelog row below.
5. Run the full test suite (`node --test tools/damage-calc/tests/`) before committing.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Initial vendor from commit dfbf020d4ed7df8921c6e11bbaa23410f6ca1448 | https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator |
```

- [ ] **Step 7: Commit**

```bash
git add tools/damage-calc/vendor/ tools/damage-calc/dom-stub.js tools/damage-calc/VENDOR_MANIFEST.md tools/damage-calc/tests/vendor-loads.test.js tools/damage-calc/load-vendor.js
git commit -m "Vendor NCP VGC Damage Calculator data/engine files"
```
(Include `load-vendor.js` in the add only if Step 4's `vm`-based approach ended up being needed.)

---

### Task 2: Champions Stat Points formula module

**Files:**
- Create: `tools/damage-calc/stat-formula.js`
- Test: `tools/damage-calc/tests/stat-formula.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 directly (this is a standalone pure-math module, deliberately not dependent on the vendored `stat_data.js` since that file's functions are DOM-coupled).
- Produces: `computeStat(base, statPoints, alignmentMod)` and `computeHP(base, statPoints)`, both pure functions returning integers. Task 4 imports these.

- [ ] **Step 1: Write the failing tests**

`tools/damage-calc/tests/stat-formula.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStat, computeHP } = require('../stat-formula');

test('computeStat: Garchomp base 130 Attack, 0 SP, neutral nature', () => {
  // Garchomp base Attack 130, 0 SP, alignment mod 1.0 (neutral)
  assert.equal(computeStat(130, 0, 1.0), 130);
});

test('computeStat: Gholdengo base 133 Sp.Atk, 32 SP (max), Modest (+10%)', () => {
  // floor(((floor((133*2+31)*50/100)+5)+32)*1.1)
  // = floor(((floor(297*0.5)+5)+32)*1.1) = floor(((148+5)+32)*1.1) = floor(185*1.1) = floor(203.5) = 203
  assert.equal(computeStat(133, 32, 1.1), 203);
});

test('computeStat: Garchomp base 102 Speed, 0 SP, neutral nature', () => {
  // floor(((floor((102*2+31)*50/100)+5)+0)*1.0)
  // = floor(((floor(235*0.5)+5))*1) = floor((117+5)) = 122
  assert.equal(computeStat(102, 0, 1.0), 122);
});

test('computeHP: Garchomp base 108 HP, 0 SP', () => {
  // floor((108*2+31)*50/100)+50+10+0 = floor(247*0.5)+60 = 123+60 = 183
  assert.equal(computeHP(108, 0), 183);
});

test('computeHP: Gholdengo base 87 HP, 0 SP', () => {
  // floor((87*2+31)*50/100)+50+10+0 = floor(205*0.5)+60 = 102+60 = 162
  assert.equal(computeHP(87, 0), 162);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tools/damage-calc/tests/stat-formula.test.js`
Expected: FAIL — `Cannot find module '../stat-formula'`

- [ ] **Step 3: Write the implementation**

`tools/damage-calc/stat-formula.js`:
```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tools/damage-calc/tests/stat-formula.test.js`
Expected: 5 tests passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add tools/damage-calc/stat-formula.js tools/damage-calc/tests/stat-formula.test.js
git commit -m "Add Champions Stat Points formula module"
```

---

### Task 3: Data lookup module

**Files:**
- Create: `tools/damage-calc/lookup.js`
- Test: `tools/damage-calc/tests/lookup.test.js`

**Interfaces:**
- Consumes: the vendor-loading mechanism from Task 1 (`getVendor()` if the `vm` approach was used, or direct `require`s if plain `require` worked — match whichever Task 1 actually settled on).
- Produces: `lookupSpecies(name)` -> `{name, t1, t2, bs: {hp,at,df,sa,sd,sp}, ab, w}` or throws `Error` with a message distinguishing "not in any vendored dex" from "exists in the broader dex but not Champions-legal" (see Step 3 for exact wording — per this plan's Global Constraints, the broader-dex lookup is for the error message only, never for returning usable data); `lookupMove(name)` -> `{name, bp, type, category, isSpread, ...rest}` or throws a similarly-distinguished `Error`; `isKnownAbility(name)` -> boolean; `isKnownItem(name)` -> boolean; `lookupPreset(species, setName)` -> `{ability, item, nature, sps: {hp,at,df,sa,sd,sp}, moves}` or throws `Error` with a message distinguishing "no presets exist for this species at all" from "this species has presets, but none named exactly that." Task 4 and Task 5 both import this module.

- [ ] **Step 1: Write the failing tests**

`tools/damage-calc/tests/lookup.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { lookupSpecies, lookupMove, isKnownAbility, isKnownItem, lookupPreset } = require('../lookup');

test('lookupSpecies: finds Garchomp with correct base stats and types', () => {
  const g = lookupSpecies('Garchomp');
  assert.equal(g.t1, 'Dragon');
  assert.equal(g.t2, 'Ground');
  assert.equal(g.bs.hp, 108);
  assert.equal(g.bs.at, 130);
  assert.equal(g.bs.sp, 102);
});

test('lookupSpecies: finds Gholdengo', () => {
  const g = lookupSpecies('Gholdengo');
  assert.equal(g.t1, 'Steel');
  assert.equal(g.t2, 'Ghost');
  assert.equal(g.bs.sa, 133);
});

test('lookupSpecies: throws "not in any vendored dex" for a total misspelling', () => {
  assert.throws(() => lookupSpecies('Garchmp'), /not found in any vendored dex/);
});

test('lookupSpecies: throws a DIFFERENT, more specific error for a real Pokemon that exists but is not Champions-legal', () => {
  // Miraidon is a real, correctly-spelled Pokemon (confirmed present in the
  // broader vendored natdex during design research) but is NOT in
  // POKEDEX_CHAMPIONS as of the vendored commit. This must not throw the
  // same generic message as a misspelling - the two failure modes are
  // different and the caller needs to know which one happened.
  assert.throws(() => lookupSpecies('Miraidon'), /exists in the broader dex.*not.*Champions-legal roster/);
  assert.throws(() => lookupSpecies('Miraidon'), /verify via live search/);
});

test('lookupMove: finds Rock Slide with correct power and type', () => {
  const m = lookupMove('Rock Slide');
  assert.equal(m.bp, 75);
  assert.equal(m.type, 'Rock');
  assert.equal(m.category, 'Physical');
  assert.equal(m.isSpread, true);
});

test('lookupMove: finds Make It Rain', () => {
  const m = lookupMove('Make It Rain');
  assert.equal(m.bp, 120);
  assert.equal(m.type, 'Steel');
  assert.equal(m.category, 'Special');
});

test('lookupMove: throws "not in any vendored dex" for a total misspelling', () => {
  assert.throws(() => lookupMove('Rock Slid'), /not found in any vendored dex/);
});

test('isKnownAbility: true for a real Champions-legal ability', () => {
  assert.equal(isKnownAbility('Rough Skin'), true);
});

test('isKnownAbility: false for a made-up name', () => {
  assert.equal(isKnownAbility('Rough Skinn'), false);
});

test('isKnownItem: true for a real item, false for a made-up one', () => {
  assert.equal(isKnownItem('Choice Specs'), true);
  assert.equal(isKnownItem('Choice Speks'), false);
});

test('lookupPreset: finds a real Garchomp preset with sps/nature/ability/item/moves', () => {
  const presets = lookupPreset('Garchomp'); // no set name -> list available set names
  assert.ok(Array.isArray(presets) && presets.length > 0, 'Garchomp should have at least one preset name');
  const preset = lookupPreset('Garchomp', presets[0]);
  assert.ok(preset.sps, 'preset should include an sps allocation');
  assert.ok(preset.nature, 'preset should include a nature');
  assert.ok(preset.ability, 'preset should include an ability');
  assert.ok(Array.isArray(preset.moves), 'preset should include a moves array');
});

test('lookupPreset: throws a clear "no presets at all" error for a Champions-legal Pokemon with none', () => {
  // Vileplume is Champions-legal (POKEDEX_CHAMPIONS has it, per the
  // "Regulation M-B additions" list) but was confirmed during design
  // research to have NO entry in SETDEX_GEN10 - this is expected/normal,
  // not a bug, and must produce a distinct message from "not Champions-legal."
  assert.throws(() => lookupPreset('Vileplume'), /no presets available for "Vileplume"/);
});

test('lookupPreset: throws a clear "no such named preset" error for a real species with a different set name', () => {
  assert.throws(() => lookupPreset('Garchomp', 'Definitely Not A Real Set Name'), /no preset named "Definitely Not A Real Set Name"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tools/damage-calc/tests/lookup.test.js`
Expected: FAIL — `Cannot find module '../lookup'`

- [ ] **Step 3: Write the implementation**

Write `tools/damage-calc/lookup.js` using whichever vendor-loading mechanism Task 1 settled on. If Task 1 used the `vm`-context approach (`load-vendor.js` exporting a cached `getVendor()`):

```javascript
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
```

If Task 1 instead found that plain `require()` populates real Node globals (the simpler outcome), replace `getVendor()`'s body with direct references to the global `POKEDEX_CHAMPIONS`/`POKEDEX_ZA_NATDEX`/`MOVES_CHAMPIONS`/`MOVES_ZA_NATDEX`/`ABILITIES_CHAMPIONS`/`ITEMS_CHAMPIONS`/`SETDEX_GEN10` (populated once via a `require('./vendor/...')` chain at the top of this file, matching Task 1's smoke test), dropping the `getVendor` import entirely.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tools/damage-calc/tests/lookup.test.js`
Expected: 13 tests passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add tools/damage-calc/lookup.js tools/damage-calc/tests/lookup.test.js
git commit -m "Add Champions Pokemon/move/ability/item data lookup module"
```

---

### Task 4: Build calc.js via TDD discovery loop

This task is inherently exploratory — `GET_DAMAGE_SV`'s exact required object shape was only partially confirmed during design research (dispatch, top-level property reads) and not exhaustively verified against its deeper helper functions (`calcAtMods`, `calcDefMods`, `calcBPMods`, `calcGeneralMods`, `calcFinalMods`, `basePowerFunc` — none of these bodies were read in full during planning). Rather than guessing at the complete shape, this task starts from a well-grounded first attempt and iterates against real thrown errors.

**Files:**
- Create: `tools/damage-calc/calc.js`
- Test: `tools/damage-calc/tests/calc.test.js`

**Interfaces:**
- Consumes: `computeStat`, `computeHP` from Task 2 (`../stat-formula`); `lookupSpecies`, `lookupMove` from Task 3 (`../lookup`); `Side` from Task 1's `vendor/side.js`; `GET_DAMAGE_SV` and helper functions (`getModifiedStat`, `getFinalSpeed`, `checkIntimidate`, etc.) from the vendored `damage_MASTER.js`/`damage_SV.js` via Task 1's loading mechanism.
- Produces: `runDamageCalc(input)` where `input` is:
  ```javascript
  {
    attacker: { species, preset /* optional set name, see resolvePresetDefaults */, ability, item, nature, sp: {hp,at,df,sa,sd,sp}, boosts: {at,df,sa,sd,sp} /* optional, default 0 */ },
    defender: { species, preset, ability, item, nature, sp: {hp,at,df,sa,sd,sp}, boosts: {} },
    move: { name },
    field: { weather /* optional */, terrain /* optional */ }
  }
  ```
  returning `{ min, max, description, matchedRecords: { attacker: {...}, defender: {...}, move: {...} } }` (exact shape of `description`/the numeric range depends on what `GET_DAMAGE_SV`'s return value actually looks like — confirm and document in Step 5 below; `matchedRecords` is this module's own addition for the transparency requirement, not from the vendored code).

- [ ] **Step 1: Write the target test case using real, verified data**

`tools/damage-calc/tests/calc.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { runDamageCalc } = require('../calc');

test('Modest 32-SP-SpA Choice Specs Gholdengo Make It Rain vs neutral 0-SP Garchomp', () => {
  // Real, verified data (not defaults): Gholdengo base SpA 133, Modest nature
  // (+10% SpA), 32 Stat Points in SpA (the max). Garchomp base HP 108 / SpD 85,
  // Serious (neutral) nature, 0 SP anywhere (bare base stats). This
  // specifically exercises non-default SP allocation and a boosting nature,
  // not base-stat defaults.
  const result = runDamageCalc({
    attacker: {
      species: 'Gholdengo',
      ability: 'Good as Gold',
      item: 'Choice Specs',
      nature: 'Modest',
      sp: { hp: 0, at: 0, df: 0, sa: 32, sd: 0, sp: 0 },
    },
    defender: {
      species: 'Garchomp',
      ability: 'Rough Skin',
      item: '',
      nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Make It Rain' },
    field: {},
  });

  // Sanity bounds, not a bit-exact assertion yet (Task 6 cross-validates
  // exact numbers against the real NCP calculator). Steel vs Dragon/Ground
  // is neutral (1x) per reference/vgc_type_chart_reference.md, Choice Specs
  // is a 1.5x boost, so this should be a substantial hit but not a OHKO
  // against Garchomp's ~183 HP (0 SP) — assert plausible bounds only.
  assert.ok(result.min > 0, 'min damage should be positive');
  assert.ok(result.max >= result.min, 'max should be >= min');
  assert.ok(result.max < 1000, 'max damage should be a sane double-digit-to-low-triple-digit number, not garbage');
  assert.equal(result.matchedRecords.attacker.species, 'Gholdengo');
  assert.equal(result.matchedRecords.defender.species, 'Garchomp');
  assert.equal(result.matchedRecords.move.name, 'Make It Rain');
  assert.equal(result.matchedRecords.move.bp, 120);
});

test('runDamageCalc throws a clear error for a misspelled Pokemon name', () => {
  assert.throws(() => runDamageCalc({
    attacker: { species: 'Garchmp', ability: 'Rough Skin', item: '', nature: 'Serious', sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 } },
    defender: { species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious', sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 } },
    move: { name: 'Rock Slide' },
    field: {},
  }), /Unknown Pokemon: "Garchmp"/);
});

test('runDamageCalc: attacker built entirely from a preset (no explicit ability/item/nature/sp)', () => {
  // Garchomp is confirmed (design research) to have at least one entry in
  // vendored SETDEX_GEN10 - use its first available preset by name rather
  // than hardcoding a specific set name here, since presets can be renamed/
  // added/removed on re-vendor and this test shouldn't be tied to one
  // exact name persisting forever. Use lookupPreset(species) (no set name)
  // to list available names, matching lookup.test.js's own pattern.
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');
  const result = runDamageCalc({
    attacker: { species: 'Garchomp', preset: presetNames[0] },
    defender: {
      species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Earthquake' },
    field: {},
  });
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.presetUsed, presetNames[0]);
});

test('runDamageCalc: explicit fields override a preset\'s defaults', () => {
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');
  const preset = lookupPreset('Garchomp', presetNames[0]);
  const overriddenNature = preset.nature === 'Jolly' ? 'Adamant' : 'Jolly';
  const result = runDamageCalc({
    attacker: { species: 'Garchomp', preset: presetNames[0], nature: overriddenNature },
    defender: {
      species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Earthquake' },
    field: {},
  });
  // Direct, deterministic check that the explicit override actually won
  // over the preset's own nature - not an indirect/weak stat-based guess.
  assert.equal(result.matchedRecords.attacker.nature, overriddenNature);
  assert.notEqual(result.matchedRecords.attacker.nature, preset.nature);
});
```

- [ ] **Step 2: Run the test to confirm it fails on a missing module**

Run: `node --test tools/damage-calc/tests/calc.test.js`
Expected: FAIL — `Cannot find module '../calc'`

- [ ] **Step 3: Write a first-attempt implementation from what's already confirmed**

This is the well-grounded starting point from design research — expect Step 4's iteration to add fields this version is missing.

`tools/damage-calc/calc.js` (shown using the `vm`-context branch — `require('./load-vendor').getVendor()`. If Task 1 found plain `require()` populates real Node globals instead, replace every `vendor.X` reference below with the corresponding global `X`, and drop the `getVendor` import — match whatever Task 3's `lookup.js` ended up doing, the two files must agree):

```javascript
'use strict';
const { computeStat, computeHP } = require('./stat-formula');
const { lookupSpecies, lookupMove, lookupPreset } = require('./lookup');
const { getVendor } = require('./load-vendor');
const { Side } = require('./vendor/side.js');

const ALIGNMENT_NEUTRAL = 1.0;
const ALIGNMENT_BOOST = 1.1;
const ALIGNMENT_CUT = 0.9;

function alignmentModFor(nature, stat, natures) {
  const mods = natures[nature];
  if (!mods) throw new Error(`Unknown nature/Stat Alignment: "${nature}"`);
  if (mods[0] === stat) return ALIGNMENT_BOOST;
  if (mods[1] === stat) return ALIGNMENT_CUT;
  return ALIGNMENT_NEUTRAL;
}

// If input.preset (a set name string, e.g. "Fast Offense Mega Y") is given,
// pulls ability/item/nature/sp from SETDEX_GEN10 as DEFAULTS ONLY - any of
// those fields the caller also specified explicitly on `input` wins. The
// move being tested is deliberately NOT auto-filled from a preset's move
// list (a preset has 4 moves, --move always says which one this specific
// calculation is testing - auto-picking one would be ambiguous).
function resolvePresetDefaults(input) {
  if (!input.preset) return input;
  const preset = lookupPreset(input.species, input.preset);
  return {
    species: input.species,
    preset: input.preset,
    ability: input.ability !== undefined ? input.ability : preset.ability,
    item: input.item !== undefined ? input.item : preset.item,
    nature: input.nature !== undefined ? input.nature : preset.nature,
    sp: input.sp !== undefined ? input.sp : preset.sps,
    boosts: input.boosts,
    status: input.status,
  };
}

function buildPokemon(rawInput, natures) {
  const input = resolvePresetDefaults(rawInput);
  // Final fallbacks AFTER preset resolution, not before it (see
  // resolvePresetDefaults - the CLI layer must NOT apply these first, or a
  // preset's own values would never be reachable). Ability has no safe
  // neutral default and must come from either an explicit flag or a
  // preset. Item/nature/SP have legitimate neutral defaults (no item,
  // neutral nature, zero investment) and are allowed to fall back silently
  // - unlike ability, "no item" and "no SP investment" are real, common
  // builds, not signs of a forgotten input.
  if (!input.ability) {
    throw new Error(`Ability is required for "${input.species}" — pass --*-ability explicitly or --*-preset a set that includes one.`);
  }
  input.item = input.item !== undefined ? input.item : '';
  input.nature = input.nature !== undefined ? input.nature : 'Serious';
  input.sp = input.sp !== undefined ? input.sp : { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };

  const species = lookupSpecies(input.species);
  const rawStats = {
    hp: computeHP(species.bs.hp, input.sp.hp),
    at: computeStat(species.bs.at, input.sp.at, alignmentModFor(input.nature, 'at', natures)),
    df: computeStat(species.bs.df, input.sp.df, alignmentModFor(input.nature, 'df', natures)),
    sa: computeStat(species.bs.sa, input.sp.sa, alignmentModFor(input.nature, 'sa', natures)),
    sd: computeStat(species.bs.sd, input.sp.sd, alignmentModFor(input.nature, 'sd', natures)),
    sp: computeStat(species.bs.sp, input.sp.sp, alignmentModFor(input.nature, 'sp', natures)),
  };
  const boosts = Object.assign({ at: 0, df: 0, sa: 0, sd: 0, sp: 0 }, input.boosts || {});
  return {
    name: species.name,
    type1: species.t1,
    type2: species.t2,
    level: 50,
    ability: input.ability,
    item: input.item || '',
    status: input.status || '',
    isDynamax: false,
    isTerastalize: false,
    tera_type: species.t1,
    rawStats,
    boosts,
    stats: {},
    nature: input.nature,
    curHP: rawStats.hp,
    maxHP: rawStats.hp,
    weight: species.w || 0,
    canEvolve: false,
    isTransformed: false,
  };
}

function buildMove(input) {
  const move = lookupMove(input.name);
  return Object.assign({}, move, {
    isCrit: false,
    isZ: false,
    isSignatureZ: false,
    hits: 1,
    isPlusMove: false,
  });
}

function runDamageCalc(input) {
  const vendor = getVendor();
  // Note: if Task 1 used the plain-`require` branch instead of `vm`, `gen`
  // is a real Node global that must be set to 10 (Champions) before this
  // point — `getVendor()` doesn't exist in that branch, so set it via
  // `global.gen = 10;` here instead, mirroring how Task 1's own
  // vendor-loads.test.js sets it before requiring the vendor files. In the
  // `vm` branch shown here, `gen` already lives inside the sandbox
  // (`load-vendor.js` initializes it to 10) and needs no action here.

  const natures = vendor.NATURES;
  const attacker = buildPokemon(input.attacker, natures);
  const defender = buildPokemon(input.defender, natures);
  const move = buildMove(input.move);

  // Field setup — Side constructor: (format, terrain, weather, isGravity,
  // isSR, spikes, isReflect, isLightScreen, isForesight, isHelpingHand,
  // isFriendGuard, isBattery, isProtect, isPowerSpot, isSteelySpirit,
  // isNeutralizingGas, isGmaxField, isFlowerGiftSpD, isFlowerGiftAtk,
  // isTailwind, isSaltCure, isAuroraVeil, isSwamp, isSeaFire, isRedItem,
  // isBlueItem, isCharge)
  const side = new Side(
    'Doubles', input.field.terrain || '', input.field.weather || '',
    false, false, 0, false, false, false, false, false, false, false,
    false, false, false, false, false, false, false, false, false,
    false, false, false, false, false
  );

  // Stat-stage/ability/Speed setup that CALCULATE_ALL_MOVES_SV does before
  // calling GET_DAMAGE_SV, minus its DOM writes ($(".p1-speed-mods").text(...)).
  attacker.stats.at = vendor.getModifiedStat(attacker.rawStats.at, attacker.boosts.at);
  attacker.stats.df = vendor.getModifiedStat(attacker.rawStats.df, attacker.boosts.df);
  attacker.stats.sa = vendor.getModifiedStat(attacker.rawStats.sa, attacker.boosts.sa);
  attacker.stats.sd = vendor.getModifiedStat(attacker.rawStats.sd, attacker.boosts.sd);
  attacker.stats.sp = vendor.getFinalSpeed(attacker, side.weather, false, false, side.terrain);
  defender.stats.at = vendor.getModifiedStat(defender.rawStats.at, defender.boosts.at);
  defender.stats.df = vendor.getModifiedStat(defender.rawStats.df, defender.boosts.df);
  defender.stats.sa = vendor.getModifiedStat(defender.rawStats.sa, defender.boosts.sa);
  defender.stats.sd = vendor.getModifiedStat(defender.rawStats.sd, defender.boosts.sd);
  defender.stats.sp = vendor.getFinalSpeed(defender, side.weather, false, false, side.terrain);

  const rawResult = vendor.GET_DAMAGE_SV(attacker, defender, move, side);

  return {
    min: null, // TODO(discovery): extract from rawResult's actual shape, see Step 4
    max: null, // TODO(discovery): extract from rawResult's actual shape, see Step 4
    description: rawResult,
    matchedRecords: {
      attacker: { species: attacker.name, ability: attacker.ability, item: attacker.item, nature: attacker.nature, rawStats: attacker.rawStats, presetUsed: input.attacker.preset || null },
      defender: { species: defender.name, ability: defender.ability, item: defender.item, nature: defender.nature, rawStats: defender.rawStats, presetUsed: input.defender.preset || null },
      move: { name: move.name, bp: move.bp, type: move.type, category: move.category },
    },
  };
}

module.exports = { runDamageCalc };
```

- [ ] **Step 4: Run the test, read the actual error, fix, repeat**

Run: `node --test tools/damage-calc/tests/calc.test.js`

This will almost certainly fail on the first run — possibly on `require('./load-vendor')` if Task 1 didn't actually produce a `getVendorGlobal` export by that name (reconcile naming with whatever Task 1 settled on), then likely on a missing/undefined property read somewhere inside `GET_DAMAGE_SV`'s call chain (a `TypeError: Cannot read properties of undefined`, naming the exact property in the stack trace).

For each failure:
1. Read the exact error message and stack trace — it names the missing property or the file/line inside `damage_MASTER.js`/`damage_SV.js` that failed.
2. Open that vendored file at that line to see what it expects (e.g., if it reads `move.dealsPhysicalDamage`, add that field to `buildMove`'s returned object with a sane default; if it reads `field.isForesight`, confirm the `Side` instance already exposes that via its constructor and check the property name matches).
3. Add the missing field to `buildPokemon`/`buildMove`/the `Side` call in `calc.js`, with a comment noting it was discovered via this loop (not guessed).
4. Re-run the test.
5. Repeat until the test reaches the `assert.ok(result.min > 0, ...)` line rather than throwing.

Once it stops throwing, inspect what `GET_DAMAGE_SV` actually returned (`rawResult` in `calc.js`) — add a temporary `console.log(JSON.stringify(rawResult, null, 2))` in a scratch script if needed to see its real shape (likely an object with a `damage` array of 16 possible rolls, or similar, based on how community damage calculators typically expose "16 damage rolls" — but confirm from the actual returned object rather than assuming). Update `runDamageCalc`'s `min`/`max` computation to `Math.min(...rawResult.damage)` / `Math.max(...rawResult.damage)` (or whatever the real property name is) instead of the `null` placeholders, and remove the two `TODO(discovery)` comments once resolved.

(The `weight: 0` TODO is already resolved in Step 3's code above — `lookup.js`'s `lookupSpecies` already returns `w: entry.w`, and `buildPokemon` already uses `species.w || 0`. No further action needed here unless discovery reveals the weight field name/shape differs from what Step 3 assumed.)

- [ ] **Step 5: Run the full test file to confirm all tests pass**

Run: `node --test tools/damage-calc/tests/calc.test.js`
Expected: 4 tests passing, 0 failing.

- [ ] **Step 6: Document what was discovered**

Add a comment block at the top of `calc.js` summarizing which `GET_DAMAGE_SV` properties were required beyond the initial well-grounded guess (a short bullet list of "discovered via TDD: X, Y, Z"), so a future reader understands which parts of this file are verified-by-research vs. verified-by-running.

- [ ] **Step 7: Commit**

```bash
git add tools/damage-calc/calc.js tools/damage-calc/tests/calc.test.js tools/damage-calc/lookup.js
git commit -m "Add calc.js: build attacker/defender/field objects and call GET_DAMAGE_SV"
```

---

### Task 5: CLI wrapper

**Files:**
- Create: `tools/damage-calc/cli.js`
- Test: `tools/damage-calc/tests/cli.test.js`

**Interfaces:**
- Consumes: `runDamageCalc` from Task 4 (`./calc`).
- Produces: a Bash-invokable script printing one JSON object to stdout, or a non-zero exit with a clear error message on stderr for bad input.

- [ ] **Step 1: Write the failing test**

`tools/damage-calc/tests/cli.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'cli.js');

test('cli.js prints structured JSON for a valid matchup', () => {
  const output = execFileSync('node', [
    CLI,
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-item', 'Choice Specs',
    '--attacker-nature', 'Modest', '--attacker-sp', 'sa:32',
    '--defender', 'Garchomp', '--defender-ability', 'Rough Skin', '--defender-nature', 'Serious',
    '--move', 'Make It Rain',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output);
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.species, 'Gholdengo');
  assert.equal(result.matchedRecords.move.name, 'Make It Rain');
});

test('cli.js exits non-zero with a clear message for an unknown Pokemon', () => {
  assert.throws(() => {
    execFileSync('node', [
      CLI,
      '--attacker', 'Garchmp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
      '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
      '--move', 'Rock Slide',
    ], { encoding: 'utf8', stdio: 'pipe' });
  }, /Unknown Pokemon: "Garchmp"/);
});

test('cli.js: --attacker-preset fills ability/item/nature/sp, --move still explicit', () => {
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');

  const output = execFileSync('node', [
    CLI,
    '--attacker', 'Garchomp', '--attacker-preset', presetNames[0],
    '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output);
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.presetUsed, presetNames[0]);
});

test('cli.js exits non-zero with a clear message when ability is missing and no preset is given', () => {
  assert.throws(() => {
    execFileSync('node', [
      CLI,
      '--attacker', 'Garchomp',
      '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
      '--move', 'Earthquake',
    ], { encoding: 'utf8', stdio: 'pipe' });
  }, /Ability is required for "Garchomp"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/damage-calc/tests/cli.test.js`
Expected: FAIL — `cli.js` does not exist (ENOENT from `execFileSync`).

- [ ] **Step 3: Write the CLI**

`tools/damage-calc/cli.js`:
```javascript
#!/usr/bin/env node
'use strict';
const { runDamageCalc } = require('./calc');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

function parseSpAllocation(spString) {
  // Format: "sa:32,hp:0" — unspecified stats default to 0 WITHIN a given
  // string. Returns undefined (not a default object) when no --*-sp flag
  // was passed at all, so calc.js's resolvePresetDefaults can tell "not
  // given, check the preset" apart from "explicitly given as all-zero."
  if (!spString) return undefined;
  const sp = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
  for (const pair of spString.split(',')) {
    const [stat, value] = pair.split(':');
    if (!(stat in sp)) throw new Error(`Unknown stat in --*-sp: "${stat}" (use hp, at, df, sa, sd, or sp)`);
    sp[stat] = parseInt(value, 10);
  }
  return sp;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  // NOTE: deliberately no `|| 'Serious'` / `|| ''` fallbacks here — if a
  // flag wasn't passed, its value must stay undefined so calc.js's
  // resolvePresetDefaults can fall through to a --*-preset's own value
  // first. buildPokemon (Task 4) applies the final neutral defaults only
  // after preset resolution has already had a chance to fill them in.
  const input = {
    attacker: {
      species: args['attacker'],
      preset: args['attacker-preset'],
      ability: args['attacker-ability'],
      item: args['attacker-item'],
      nature: args['attacker-nature'],
      sp: parseSpAllocation(args['attacker-sp']),
    },
    defender: {
      species: args['defender'],
      preset: args['defender-preset'],
      ability: args['defender-ability'],
      item: args['defender-item'],
      nature: args['defender-nature'],
      sp: parseSpAllocation(args['defender-sp']),
    },
    move: { name: args['move'] },
    field: {
      weather: args['weather'] || '',
      terrain: args['terrain'] || '',
    },
  };

  const result = runDamageCalc(input);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tools/damage-calc/tests/cli.test.js`
Expected: 4 tests passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add tools/damage-calc/cli.js tools/damage-calc/tests/cli.test.js
git commit -m "Add Bash-invokable CLI wrapper for the damage calculator"
```

---

### Task 6: Cross-validation fixtures via headless NCP calculator

**Files:**
- Create: `tools/damage-calc/tests/fixtures/gholdengo-vs-garchomp.json`
- Create: `tools/damage-calc/scripts/generate-fixture.js`
- Test: `tools/damage-calc/tests/fixture-validation.test.js`

**Interfaces:**
- Consumes: `runDamageCalc` from Task 4.
- Produces: a documented, repeatable process for regenerating ground-truth fixtures from the real NCP calculator via Playwright, plus a test asserting `calc.js`'s output matches the saved fixture.

- [ ] **Step 1: Write the one-off fixture-generation script**

This script is NOT run as part of the normal test suite (it needs network access and downloads a headless browser) — it's run manually to (re)generate fixtures, per the design spec's Layer 2 safety net.

`tools/damage-calc/scripts/generate-fixture.js`:
```javascript
#!/usr/bin/env node
'use strict';
// One-off script: drives the real NCP calculator (GitHub Pages, since it's
// a static site and needs no server) headlessly via Playwright to capture
// ground-truth output for a known matchup, saved as a fixture that
// tests/fixture-validation.test.js checks calc.js against.
//
// Run manually (not part of `node --test`): node tools/damage-calc/scripts/generate-fixture.js
// Requires: npx playwright (auto-installs on first run, downloads a headless
// Chromium — this is why it's not part of the normal test suite).

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/');

  // Select Champions mode, gen 10, per the confirmed gen dispatch in
  // script_res/ap_calc.js ("case 10: //Champions").
  // NOTE: exact selector names for the generation dropdown, Pokemon
  // selectors, ability/item/nature dropdowns, and SP input fields must be
  // discovered by inspecting the live page (not guessed) — use
  // page.locator(...) with Playwright's own element inspector
  // (`npx playwright codegen https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/`)
  // to record the exact interaction sequence for setting up the
  // Gholdengo (Modest, 32 SP SpA, Choice Specs, Good as Gold) vs Garchomp
  // (Serious, 0 SP, Rough Skin, no item) Make It Rain matchup used in
  // tools/damage-calc/tests/calc.test.js, then replace this comment block
  // with the recorded steps.

  throw new Error('Fill in the real page-interaction steps using playwright codegen before running this script.');

  // After filling in the real interaction: read the computed damage output
  // (min/max) from the page, then:
  //
  // const fixture = { attacker: {...}, defender: {...}, move: 'Make It Rain', field: {}, expected: { min: ..., max: ... }, capturedAt: new Date().toISOString().slice(0, 10), sourceUrl: 'https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/' };
  // fs.writeFileSync(
  //   path.join(__dirname, '..', 'tests', 'fixtures', 'gholdengo-vs-garchomp.json'),
  //   JSON.stringify(fixture, null, 2) + '\n'
  // );

  await browser.close();
}

main();
```

- [ ] **Step 2: Run the script interactively to record real selectors and capture a fixture**

Run: `npx playwright codegen https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/`

This opens a browser window and records your interactions as Playwright code. Manually set up: generation = Champions, attacker = Gholdengo with ability Good as Gold, item Choice Specs, nature Modest, 32 Stat Points in Sp. Atk (0 elsewhere); defender = Garchomp with ability Rough Skin, no item, nature Serious, 0 Stat Points everywhere; move = Make It Rain. Read the resulting damage percentage/range shown on the page.

Copy the recorded selector interactions from the codegen output into `generate-fixture.js`, replacing the `throw new Error(...)` placeholder. Convert the page's displayed damage percentage into HP numbers using Garchomp's 0-SP HP stat (183, per Task 2's verified formula: `computeHP(108, 0)` = 183) if the page shows percentages rather than raw numbers — document which one the page actually shows and keep the fixture in whichever unit `calc.js`'s `min`/`max` are already in (HP points, per `GET_DAMAGE_SV`'s typical convention — confirm against Task 4's discovery).

Run: `node tools/damage-calc/scripts/generate-fixture.js`
Expected: writes `tools/damage-calc/tests/fixtures/gholdengo-vs-garchomp.json` with real captured `expected.min`/`expected.max` values.

- [ ] **Step 3: Write the validation test using the captured fixture**

`tools/damage-calc/tests/fixture-validation.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDamageCalc } = require('../calc');

test('calc.js matches the real NCP calculator for the Gholdengo vs Garchomp fixture', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'gholdengo-vs-garchomp.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const result = runDamageCalc({
    attacker: fixture.attacker,
    defender: fixture.defender,
    move: { name: fixture.move },
    field: fixture.field,
  });

  assert.equal(result.min, fixture.expected.min,
    `min damage mismatch vs real NCP calculator (captured ${fixture.capturedAt} from ${fixture.sourceUrl}) — calc.js may have a porting bug, or the fixture is stale`);
  assert.equal(result.max, fixture.expected.max,
    `max damage mismatch vs real NCP calculator (captured ${fixture.capturedAt} from ${fixture.sourceUrl})`);
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/damage-calc/tests/fixture-validation.test.js`
Expected: 1 test passing. If it fails, the mismatch is either a real bug in `calc.js` (fix it, re-run Tasks 4's tests too) or a sign the fixture needs regenerating — do not adjust the fixture to match `calc.js`'s output without re-confirming against the live page first, that would defeat the point of this test.

- [ ] **Step 5: Commit**

```bash
git add tools/damage-calc/scripts/generate-fixture.js tools/damage-calc/tests/fixtures/gholdengo-vs-garchomp.json tools/damage-calc/tests/fixture-validation.test.js
git commit -m "Add Playwright-based fixture cross-validation against real NCP calculator"
```

---

### Task 7: Vendor-staleness check

**Files:**
- Create: `scripts/check_damage_calc_vendor_staleness.sh`
- Modify: `.claude/settings.json:8-14` (add a second hook entry to the existing `SessionStart` array)

**Interfaces:**
- Consumes: `tools/damage-calc/VENDOR_MANIFEST.md`'s recorded commit SHA (Task 1).
- Produces: a SessionStart hook warning (same JSON-output convention as `scripts/check_regulation_staleness.sh`) when the vendored commit is behind the NCP repo's current upstream HEAD.

- [ ] **Step 1: Write the script**

`scripts/check_damage_calc_vendor_staleness.sh`:
```bash
#!/usr/bin/env bash
# Warns if tools/damage-calc's vendored NCP-VGC-Damage-Calculator commit is
# behind the upstream repo's current main HEAD. Run as a SessionStart hook.
# No jq dependency (matches check_regulation_staleness.sh's approach) - uses
# grep on the GitHub API's JSON response instead.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
manifest="$repo_root/tools/damage-calc/VENDOR_MANIFEST.md"

[ -f "$manifest" ] || exit 0

vendored_sha="$(grep -oE 'Commit: `[0-9a-f]{40}`' "$manifest" | head -1 | grep -oE '[0-9a-f]{40}')"
[ -n "$vendored_sha" ] || exit 0

upstream_json="$(curl -s --max-time 5 "https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main" 2>/dev/null || true)"
[ -n "$upstream_json" ] || exit 0

upstream_sha="$(printf '%s' "$upstream_json" | grep -m1 -oE '"sha": ?"[0-9a-f]{40}"' | grep -oE '[0-9a-f]{40}')"
[ -n "$upstream_sha" ] || exit 0

if [ "$vendored_sha" != "$upstream_sha" ]; then
  body="tools/damage-calc's vendored NCP-VGC-Damage-Calculator data is behind upstream.\\nVendored: ${vendored_sha}\\nUpstream main: ${upstream_sha}\\nRe-vendor per tools/damage-calc/VENDOR_MANIFEST.md's 'Re-vendoring' section if the gap looks significant (new Pokemon, balance changes) - a few commits behind on typo fixes is not urgent."
  escaped="$(printf '%b' "$body" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}')"
  escaped="${escaped%\\n}"
  printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$escaped" "$escaped"
fi
exit 0
```

- [ ] **Step 2: Make it executable and pipe-test it**

Run: `chmod +x scripts/check_damage_calc_vendor_staleness.sh && echo '{}' | bash scripts/check_damage_calc_vendor_staleness.sh`
Expected: no output (exit 0) if the just-vendored SHA in `VENDOR_MANIFEST.md` still matches upstream `main`'s current HEAD (likely true, vendored moments ago in Task 1). To verify the warning path works, temporarily edit a scratch copy of `VENDOR_MANIFEST.md` with a fake old SHA (e.g. `0000000000000000000000000000000000000000`) in a temp directory (same technique as `check_regulation_staleness.sh`'s own test — copy the script and a modified manifest into a temp dir, run it there, confirm JSON output appears), then discard the temp copy — do not modify the real `VENDOR_MANIFEST.md`.

- [ ] **Step 3: Add it to the SessionStart hook array**

Read the current `.claude/settings.json` (created in an earlier session for `check_regulation_staleness.sh`) and add a second entry to the same `SessionStart` array — do not replace the existing regulation-staleness hook entry:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/check_regulation_staleness.sh 2>/dev/null || true",
            "statusMessage": "Checking regulation staleness..."
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/check_damage_calc_vendor_staleness.sh 2>/dev/null || true",
            "statusMessage": "Checking damage calculator vendor staleness..."
          }
        ]
      }
    ]
  }
}
```

Validate JSON syntax: `python -c "import json; json.load(open('.claude/settings.json')); print('VALID JSON')"`
Expected: `VALID JSON`

- [ ] **Step 4: Commit**

```bash
git add scripts/check_damage_calc_vendor_staleness.sh .claude/settings.json
git commit -m "Add damage-calc vendor staleness check to SessionStart hook"
```

---

### Task 8: Documentation updates

**Files:**
- Modify: `reference/vgc_damage_calc.md` (full rewrite of the tool section, keep the formula-fundamentals section)
- Modify: `README.md:33` (update the damage-calc row description)
- Modify: `CLAUDE.md:35-36` (update rule 4's damage-calc pointer)

**Interfaces:**
- Consumes: nothing new (documentation only).

- [ ] **Step 1: Rewrite the tool section of vgc_damage_calc.md**

Read the current `reference/vgc_damage_calc.md` first. Replace the `## Tool` section (currently describing Pikalytics as the only option and stating Claude Code can't drive it interactively — no longer accurate) with:

```markdown
## Tool

**Local calculator**: `tools/damage-calc/cli.js` — a Bash-invokable CLI
vendoring the real NCP-VGC-Damage-Calculator engine (see
`tools/damage-calc/VENDOR_MANIFEST.md` for provenance). Run directly:

```bash
node tools/damage-calc/cli.js \
  --attacker Gholdengo --attacker-ability "Good as Gold" --attacker-item "Choice Specs" \
  --attacker-nature Modest --attacker-sp sa:32 \
  --defender Garchomp --defender-ability "Rough Skin" --defender-nature Serious \
  --move "Make It Rain"
```

Prints structured JSON including the exact matched Pokémon/move records used
(base stats, computed stats, type, power) so a wrong name match is visible
in the output, not hidden. Real, current-regulation data — not recalled
from training data — since it comes from the vendored files, which are
periodically re-synced against the upstream project (see the vendor
staleness check in `scripts/check_damage_calc_vendor_staleness.sh`).

**Optional presets**: `--attacker-preset "<set name>"` /
`--defender-preset "<set name>"` pull ability/item/nature/SP from the
vendored `SETDEX_GEN10` community preset data as defaults — any of those
you also pass explicitly (e.g. `--attacker-nature`) still overrides the
preset. Coverage is best-effort, not comprehensive — many Champions-legal
Pokémon (e.g. Vileplume) have no preset yet, which produces a clear error
naming that, not a crash. Presets are a starting point, not an
authoritative "current meta" claim — cross-check against a live source
before treating one as the build for a real recommendation (see
`vgc_teambuilding_methodology.md`'s "Live meta lookup" section).

If a Pokémon or move isn't in the vendored Champions-curated data at all,
the CLI's error message says so explicitly, and separately flags whether
it exists in the broader (non-Champions-specific) vendored dex — that
broader data is NEVER used to compute a result, only to make the error
more informative (see this tool's own `VENDOR_MANIFEST.md` for why).

**Web alternative**: Pikalytics' damage calculator
(https://www.pikalytics.com/damage-calculator) remains a browser-based
option covering the same ground, useful as a second opinion or if the
local tool's vendored data looks stale before a re-vendor happens.
```

- [ ] **Step 2: Update README.md's damage-calc row**

In `README.md`, find the table row for `reference/vgc_damage_calc.md` and update its description column to: `Local damage-calculator CLI (tools/damage-calc/) plus formula fundamentals for manual sanity-checks.`

- [ ] **Step 3: Update CLAUDE.md rule 4**

In `CLAUDE.md`, find rule 4's `damage rolls vs. relevant threats` clause and update the parenthetical from `(see reference/vgc_damage_calc.md for the tool and formula fundamentals)` to `(see reference/vgc_damage_calc.md — run tools/damage-calc/cli.js for a real calculation rather than hand-computing one)`.

- [ ] **Step 4: Add changelog rows**

Add a new row to `reference/vgc_damage_calc.md`'s `## Changelog` table: `| 2026-07-09 | Replaced Pikalytics-only guidance with a local CLI tool (tools/damage-calc/) vendoring the real NCP-VGC-Damage-Calculator engine | tools/damage-calc/VENDOR_MANIFEST.md |`

- [ ] **Step 5: Commit**

```bash
git add reference/vgc_damage_calc.md README.md CLAUDE.md
git commit -m "Point documentation at the new local damage-calc CLI"
```

---

### Task 9: Final verification and push

**Files:** none created/modified — verification and push only.

- [ ] **Step 1: Run the full test suite**

Run: `node --test tools/damage-calc/tests/`
Expected: all tests across all files passing, 0 failing (fixture-validation test included, so Task 6 must be complete first).

- [ ] **Step 2: Verify the staleness hooks are both valid**

Run: `echo '{}' | bash scripts/check_regulation_staleness.sh` and `echo '{}' | bash scripts/check_damage_calc_vendor_staleness.sh`
Expected: both exit 0, no unexpected errors (empty output is fine if nothing is currently stale).

- [ ] **Step 3: Confirm git log shows the expected commit sequence**

Run: `git log --oneline -12`
Expected: commits for Task 1 through Task 8 in order, on top of the prior session's history.

- [ ] **Step 4: Push to origin/main**

```bash
git push origin main
```

- [ ] **Step 5: Confirm clean working tree**

Run: `git status`
Expected: `nothing to commit, working tree clean`, `Your branch is up to date with 'origin/main'.`
