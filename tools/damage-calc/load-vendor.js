'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadVendorUncached() {
  const sandbox = { console, gen: 10 };
  // setHasTypeFunc: damage_MASTER.js calls `mon.hasType(...)` as an
  // instance method on Pokemon objects (e.g. pIsGrounded, canBeBurned) and
  // also re-attaches it by bare-global reference after a JSON deep-copy
  // strips functions (`nextAttacker.hasType = setHasTypeFunc`, see
  // damage_MASTER.js's additionalDamageCalcs). The function itself lives in
  // the un-vendored ap_calc.js (DOM-coupled, excluded per
  // VENDOR_MANIFEST.md), inside its Pokemon constructor
  // (`this.hasType = setHasTypeFunc`) — discovered via Task 4's TDD loop
  // (`mon.hasType is not a function` at damage_MASTER.js:1299) and
  // confirmed byte-for-byte against the pinned-commit upstream source
  // (https://raw.githubusercontent.com/nerd-of-now/NCP-VGC-Damage-Calculator/dfbf020d4ed7df8921c6e11bbaa23410f6ca1448/script_res/ap_calc.js)
  // rather than reconstructed from call-site guessing alone.
  sandbox.setHasTypeFunc = function setHasTypeFunc(...types) {
    for (const type of types) {
      if ([this.type1, this.type2].includes(type)) {
        return true;
      }
    }
    return false;
  };
  const realGlobalDollar = global.$;
  require('./dom-stub').installDomStub();
  sandbox.$ = global.$;
  global.$ = realGlobalDollar; // don't leak the stub into the real global scope

  // stat_data.js: Task 1's own manifest called this "reference only, not
  // required at runtime" (assuming Task 2's pure computeStat/computeHP would
  // fully replace it). Task 4's TDD loop discovered that assumption was
  // wrong — damage_MASTER.js's getFinalSpeed (and potentially other engine
  // functions) reads `pokemon.rawStats[SP]`/`pokemon.boosts[SP]` etc. using
  // the bare top-level `AT`/`DF`/`SA`/`SD`/`SP`/`SL` string-constant
  // shorthands that stat_data.js declares at its top (line 1) — without
  // this file loaded, those are ReferenceErrors inside the sandbox. Loading
  // the whole file is safe: everything below line 3 is a DOM-coupled
  // function *declaration* (CALC_STAT_CHAMP etc., using jQuery's
  // `poke.find(...)`), never invoked by anything else in this vendored file
  // set, so defining it has no DOM side effects — only the top-level `var`
  // constants actually execute at load time.
  const files = ['nature_data.js', 'type_data.js', 'stat_data.js', 'pokedex.js', 'move_data.js',
    'ability_data.js', 'item_data.js', 'damage_MASTER.js', 'damage_SV.js', 'setdex_ncp-g10.js'];
  vm.createContext(sandbox);
  for (const f of files) {
    const code = fs.readFileSync(path.join(__dirname, 'vendor', f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }

  // typeChart: damage_MASTER.js's getSingleTypeEffectiveness reads a bare
  // top-level `typeChart` global (`typeChart[move.type][type]`) that is
  // never assigned anywhere in the vendored file set — type_data.js only
  // *defines* TYPE_CHART_RBY/GSC/BW/XY/SV, it never picks one. In the real
  // (un-vendored, DOM-coupled) ap_calc.js, `typeChart` is set inside a
  // gen-select switch statement; discovered via Task 4's TDD loop
  // (`typeChart is not defined` at damage_MASTER.js:251) and confirmed
  // byte-for-byte against the same pinned-commit upstream source used for
  // setHasTypeFunc above — its `case 9`/`case 9.5`/`case 10` branches (SV,
  // SV VGC, and "Scarlet/Violet DLC" respectively — the closest upstream
  // analog to Champions) all assign `typeChart = TYPE_CHART_SV`. Since
  // `gen` is fixed to 10 in this sandbox and no newer type chart constant
  // exists in the vendored data (Champions hasn't added new types), this
  // is the one correct value, not a guess.
  sandbox.typeChart = sandbox.TYPE_CHART_SV;

  // resultDisplayMode: another bare global read only at gen>=10
  // (damage_MASTER.js's getHPInfo/getAttackDescription/getDefenseDescription
  // pick between a pokemon's `.sps`/`.evs`/`.rawStats` fields for
  // human-readable description text based on this string — "SPs", "EVs", or
  // "raw"). Discovered via Task 4's TDD loop
  // (`resultDisplayMode is not defined` at damage_MASTER.js:303). In the
  // real ap_calc.js this is driven by a UI dropdown; we have no UI, so we
  // choose "SPs" deliberately (not arbitrarily) — this project's whole data
  // model is the Champions Stat Points system (see
  // reference/vgc_current_regulation.md), so "SPs" is the one mode whose
  // backing fields (`.sps`/`.HPSPs`) we can populate with real, meaningful
  // values rather than needing to fake `.evs`/`.HPraw`. This only affects
  // cosmetic description strings, never the computed damage numbers
  // themselves (confirmed by reading the call sites — see calc.js's
  // buildPokemon comment for the `.sps`/`.ivs` fields this choice requires).
  sandbox.resultDisplayMode = 'SPs';

  // moves: basePowerFunc reads a bare top-level `moves` global
  // (`moves[move.name].bp`, comparing a move's post-modifier basePower back
  // against its own dex default to decide whether to annotate
  // description.moveBP) — never assigned in the vendored file set for the
  // same reason as `typeChart`/`resultDisplayMode` above: the real
  // ap_calc.js's gen-select switch normally does `moves = MOVES_SV` (or an
  // equivalent per-gen dex) but that assignment lives in the excluded,
  // DOM-coupled file. Discovered via Task 4's TDD loop (`moves is not
  // defined` at damage_MASTER.js:1557). MOVES_CHAMPIONS (not MOVES_SV or
  // MOVES_ZA_NATDEX) is the correct choice here, not a guess: it's the same
  // Champions-curated move dex lookup.js (Task 3) already treats as
  // canonical for gen 10, and this task's own move data (`buildMove`, via
  // `lookupMove`) is drawn from that same MOVES_CHAMPIONS object — so
  // `moves[move.name].bp` here resolves to the exact same record already in
  // use, not a different/inconsistent one.
  sandbox.moves = sandbox.MOVES_CHAMPIONS;

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
