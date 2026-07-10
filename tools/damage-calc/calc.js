'use strict';
// Wires this project's own attacker/defender/move construction to the real
// vendored GET_DAMAGE_SV engine (damage_MASTER.js/damage_SV.js), rather than
// reimplementing damage math by hand. Built via Task 4's TDD discovery loop
// against the actual vendored source — the well-grounded first-attempt
// shape from design research (Pokemon object fields, Side constructor args,
// pre-GET_DAMAGE_SV stat-stage setup) needed the following ADDITIONAL
// fixes, none of which were assumed in advance, each confirmed by reading
// the vendored file at the line a real thrown error named:
//
//  - `attacker.hasType`/`defender.hasType` must be set to the vendored
//    `setHasTypeFunc` (an instance method the real, un-vendored, DOM-coupled
//    Pokemon constructor normally attaches) — TypeError `mon.hasType is not
//    a function` at damage_MASTER.js:1299. Fixed in load-vendor.js (Task 1
//    file) by exposing `setHasTypeFunc` on the sandbox, confirmed
//    byte-for-byte against the pinned-commit upstream ap_calc.js source.
//  - `stat_data.js` (previously considered reference-only/not required at
//    runtime) actually must be loaded — its bare top-level `AT`/`DF`/`SA`/
//    `SD`/`SP`/`SL` string-constant shorthands are read by `getFinalSpeed`
//    and friends; without it, ReferenceErrors. Fixed in load-vendor.js.
//  - `typeChart` (bare global, `typeChart[move.type][type]` in
//    getSingleTypeEffectiveness) is never assigned anywhere in the vendored
//    file set — only in the excluded, DOM-coupled ap_calc.js's gen-select
//    switch. Fixed in load-vendor.js: `typeChart = TYPE_CHART_SV`, matching
//    upstream's own `case 9`/`9.5`/`10` branches (confirmed against the
//    pinned-commit source, not guessed).
//  - `resultDisplayMode` (bare global gating gen>=10 description-string
//    logic in getHPInfo/getAttackDescription/getDefenseDescription) is
//    likewise never assigned outside the excluded UI-dropdown code. Fixed
//    in load-vendor.js: `resultDisplayMode = 'SPs'`, deliberately chosen
//    (not arbitrary) since this project's whole data model is the
//    Champions Stat Points system — the one display mode whose backing
//    fields (`.sps`/`.HPSPs`) this module can populate with real values.
//  - `moves` (bare global, `moves[move.name].bp` in basePowerFunc) is
//    likewise never assigned outside the excluded gen-select switch. Fixed
//    in load-vendor.js: `moves = MOVES_CHAMPIONS`, the same Champions-
//    curated move dex lookup.js (Task 3) already treats as canonical.
//  - Pokemon objects need `.sps` (= the same `sp` Stat Points object
//    already used for `computeStat`/`computeHP`), `.HPSPs` (= `sp.hp`), and
//    `.ivs` (all-31, the pre-Champions system's max/"perfect" value — a
//    leftover the description-string code reads unconditionally even under
//    the SPs display mode). All three feed ONLY cosmetic description text
//    (`description.attackEVs` etc.), never the actual numeric damage
//    calculation — confirmed by reading each call site, not assumed.
//  - Ability fallback: the brief's first-attempt code hard-errored when no
//    ability was given via explicit input or preset, reasoning "no safe
//    neutral default". Real vendored SETDEX_GEN10 presets for Garchomp
//    omit `ability` entirely, so that would make a valid preset-only build
//    unusable. Since Pokemon Champions fixes exactly one ability per
//    species (confirmed by inspecting POKEDEX_CHAMPIONS directly across a
//    sample of species — a single non-array string, unlike mainline VGC's
//    2-3 ability slots), falling back to the species' own vendored `ab` is
//    the objectively correct value, not a guess.
//  - `rawResult`'s real shape (confirmed via a scratch
//    `console.log(JSON.stringify(rawResult, null, 2))`, since removed) is
//    `{ damage: [16 numeric rolls], description: "<human-readable string>" }`
//    — `min`/`max` are `Math.min(...rawResult.damage)`/`Math.max(...)`.
const { computeStat, computeHP } = require('./stat-formula');
const { lookupSpecies, lookupMove, lookupPreset, isKnownAbility, isKnownItem } = require('./lookup');
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
  const species = lookupSpecies(input.species);
  // Final fallbacks AFTER preset resolution, not before it (see
  // resolvePresetDefaults - the CLI layer must NOT apply these first, or a
  // preset's own values would never be reachable).
  //
  // DISCOVERED VIA TDD (not the brief's original assumption): the brief's
  // first-attempt code treated "no ability from explicit input or preset"
  // as a hard error, reasoning "ability has no safe neutral default".
  // Running the "attacker built entirely from a preset" test against real
  // vendored SETDEX_GEN10 data showed Garchomp's actual presets ("Scarf
  // Offense", "Max Speed LOrb") both omit `ability` entirely (matching
  // Task 3's own documented caveat that some real presets lack it) — so
  // that hard-error path would make a fully-valid preset-only build
  // unusable. Inspecting vendored POKEDEX_CHAMPIONS directly
  // (`v.POKEDEX_CHAMPIONS['Garchomp'].ab === "Rough Skin"`, confirmed a
  // single non-array string, same shape across a sample of 15 other
  // species) showed Pokemon Champions format fixes exactly one ability per
  // species, unlike mainline VGC's 2-3 ability slots — there is no
  // ambiguity to guess at, so falling back to the species' own vendored
  // `ab` is the objectively correct value, not a game-mechanics guess.
  if (!input.ability) input.ability = species.ab;
  if (!input.ability) {
    throw new Error(`Ability is required for "${input.species}" — pass --*-ability explicitly, --*-preset a set that includes one, or ensure vendored POKEDEX_CHAMPIONS has an "ab" entry for this species.`);
  }
  input.item = input.item !== undefined ? input.item : '';
  input.nature = input.nature !== undefined ? input.nature : 'Serious';
  input.sp = input.sp !== undefined ? input.sp : { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };

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
    // DISCOVERED VIA TDD: getAttackDescription/getDefenseDescription/getHPInfo
    // (damage_MASTER.js) build cosmetic description strings (e.g.
    // description.attackEVs) by reading `.sps`/`.HPSPs` (gated on the
    // resultDisplayMode = "SPs" choice made in load-vendor.js) — these are
    // the same real Stat Points values already computed above, just under
    // the field names this vendored code expects. None of this feeds the
    // actual numeric damage calculation (confirmed by reading the call
    // sites: `attack`/`defense` are computed separately from `.rawStats`/
    // `.stats`/`.boosts`, never from `.sps`).
    sps: input.sp,
    HPSPs: input.sp.hp,
    // DISCOVERED VIA TDD: the same description-string code unconditionally
    // reads `.ivs[stat]` (`attackSource.ivs[attackStat] < 31 ? ...`) even
    // under the SPs display mode — a leftover from the pre-Champions
    // EV/IV system this vendored engine was originally written for.
    // Champions has no IV concept (see reference/vgc_current_regulation.md);
    // 31 (the old system's max/"perfect" value) is used here purely so this
    // cosmetic string reads as "no IV penalty" rather than crashing on
    // `undefined[stat]` — again, this never reaches the actual computed
    // damage numbers.
    ivs: { hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31 },
  };
}

function buildMove(input) {
  const move = lookupMove(input.name);
  // FIX (post-Task-4 code review): `hits` was previously hardcoded to 1 for
  // every move. That's wrong for genuinely multi-hit moves — their real
  // vendored data (MOVES_CHAMPIONS, see vendor/move_data.js) carries a
  // `hitRange` field: either a fixed number for a fixed-count multi-hit
  // move (e.g. 'Double Hit': hitRange: 2, 'Dual Wingbeat': hitRange: 2), or
  // a [min, max] array for a variable/probabilistic one (e.g.
  // 'Bullet Seed'/'Icicle Spear': hitRange: [2, 5], 'Triple Axel':
  // hitRange: [1, 3] with isTripleHit: true). Hardcoding hits: 1 silently
  // suppressed all of that real hit-count behavior.
  //
  // Derive hits from hitRange instead:
  //  - no hitRange -> 1 (ordinary single-hit move, e.g. Make It Rain,
  //    Earthquake, Double-Edge — all confirmed via `getVendor()` to have no
  //    `hitRange` key, so this branch still yields hits: 1 for them,
  //    unchanged from before).
  //  - hitRange is a plain number -> that fixed hit count.
  //  - hitRange is a [min, max] array -> the max, matching the vendored
  //    engine's own convention of computing against the highest realistic
  //    hit count in a multi-hit chain (see additionalDamageCalcs setting
  //    move.hits = 2 for Parental Bond's fixed 2-hit case, and
  //    checkAddCalcQualifications's addQualList['triple'] branch using
  //    move.hits directly as the number of Triple Axel hits to simulate —
  //    both in vendor/damage_MASTER.js).
  //
  // This also matters for correctness of the Parental Bond gate itself:
  // checkAddCalcQualifications's `parentalBond` flag
  // (damage_MASTER.js ~line 2457) is
  // `attacker.ability === "Parental Bond" && move.hits === 1 && !move.hitRange`
  // — with hits previously forced to 1 for every move, a real multi-hit
  // move (which DOES carry `hitRange`) still correctly failed that gate
  // only because of the `!move.hitRange` half of the check, not because of
  // an honest hits value. Deriving hits properly here doesn't change that
  // outcome, but removes the "right answer for an accidental reason" state.
  let hits = 1;
  if (typeof move.hitRange === 'number') {
    hits = move.hitRange;
  } else if (Array.isArray(move.hitRange)) {
    hits = move.hitRange[move.hitRange.length - 1];
  }
  return Object.assign({}, move, {
    isCrit: false,
    isZ: false,
    isSignatureZ: false,
    hits,
    isPlusMove: false,
  });
}

function runDamageCalc(input) {
  const vendor = getVendor();
  // gen is already initialized to 10 inside the vm sandbox by load-vendor.js
  // (Task 1) — no action needed here.

  const natures = vendor.NATURES;
  const attacker = buildPokemon(input.attacker, natures);
  const defender = buildPokemon(input.defender, natures);
  const move = buildMove(input.move);

  // DISCOVERED VIA TDD: damage_MASTER.js calls `mon.hasType(...)` as an
  // instance method (pIsGrounded, canBeBurned, STAB checks, etc.) — our
  // plain-object attacker/defender don't have it since they never go
  // through ap_calc.js's real (un-vendored) Pokemon constructor. Reuse the
  // exact same `setHasTypeFunc` the vendored code itself re-attaches after
  // its own internal deep-copies, see load-vendor.js.
  attacker.hasType = vendor.setHasTypeFunc;
  defender.hasType = vendor.setHasTypeFunc;

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

  // DISCOVERED VIA TDD: inspected rawResult with a scratch
  // `console.log(JSON.stringify(rawResult, null, 2))` once the call chain
  // stopped throwing. Real shape is `{ damage: [16 numeric rolls, low to
  // high], description: "<human-readable summary string>" }` — not the
  // `{damage: [...]}`-with-a-different-key or nested-object shape guessed
  // at in the brief. `damage` is already sorted ascending in every sample
  // observed, but Math.min/Math.max is used rather than trusting that
  // ordering, since nothing in the vendored code documents it as guaranteed.
  //
  // FIX (post-Task-4 code review): the above is only true when the attack
  // is a single hit. `rawResult.damage` can also come back NESTED — one
  // flat 16-roll array PER HIT — for any attack that goes through
  // calcGeneralMods's "additional damage" path (vendor/damage_MASTER.js).
  // Concretely: calcGeneralMods (~line 2290-2312) builds `allDamage` as
  // `allDamage[0] = damage` (the first hit's own 16-roll array) then
  // `allDamage[i + 1] = additionalDamage[i]` for each further hit, where
  // `additionalDamage` comes from `additionalDamageCalcs` (~line 2487-2631)
  // recursively calling `GET_DAMAGE_HANDLER(...).damage` once per extra hit
  // (each such recursive call sets `nextMove.isNextMove = true`, which
  // forces that inner call down calcGeneralMods's `else allDamage = damage`
  // branch, so each per-hit entry is guaranteed flat — nesting is always
  // exactly one level deep, never deeper). This path is reached whenever
  // `checkAddCalcQualifications` (~line 2451-2478) finds a qualifying
  // condition — the one most relevant to this project is Parental Bond
  // (`addQualList['parentalBond']`, ~line 2457: any attacker with ability
  // "Parental Bond" — e.g. the real, currently Champions-legal Mega
  // Kangaskhan — hitting with an ordinarily-single-hit move), but the same
  // shape also covers genuinely multi-hit moves like Triple Axel
  // (`addQualList['triple']`) once `buildMove` derives a real `hits` value
  // (see buildMove above) instead of always hardcoding 1.
  //
  // Correct combination logic: sum the MIN of each hit's own roll array for
  // the overall min, and sum the MAX of each hit's own roll array for the
  // overall max — NOT "sum same-index rolls across hits". Each hit's 85-100%
  // damage roll is an independent random event (calcGeneralMods's own
  // per-hit loop, ~line 2249, re-rolls 85-100% fresh for every hit/call), so
  // the true worst-case total is every hit simultaneously landing its own
  // worst roll, and the true best-case total is every hit simultaneously
  // landing its own best roll. Because summation is monotonic per term,
  // summing each hit's independent min (or max) always yields the actual
  // extremum of the total — pairing by array index would just be an
  // arbitrary (and generally wrong, since a index-0-with-index-0 pairing
  // isn't a privileged combination of two independent rolls) alternative
  // that happens to coincide with this one only in the single-hit case.
  // Math.min/Math.max (not index [0]/[last]) is used per hit for the same
  // "don't trust an unguaranteed sort order" reason as the single-hit case
  // above.
  const isMultiHit = Array.isArray(rawResult.damage[0]);
  const min = isMultiHit
    ? rawResult.damage.reduce((sum, hitRolls) => sum + Math.min(...hitRolls), 0)
    : Math.min(...rawResult.damage);
  const max = isMultiHit
    ? rawResult.damage.reduce((sum, hitRolls) => sum + Math.max(...hitRolls), 0)
    : Math.max(...rawResult.damage);

  return {
    min,
    max,
    description: rawResult.description,
    matchedRecords: {
      // itemChampionsLegal/abilityChampionsLegal: computed via Task 3's
      // isKnownItem/isKnownAbility against the vendored ITEMS_CHAMPIONS/
      // ABILITIES_CHAMPIONS lists, which reflect real current Champions
      // restrictions (e.g. Choice Specs is a real move-legal item the
      // engine can still compute damage for, but it is not currently
      // available in Champions — confirmed via live search this session).
      // itemChampionsLegal is null (not false) when no item is held at
      // all, since "no item" isn't an illegal item, it's the absence of one.
      attacker: {
        species: attacker.name, ability: attacker.ability, item: attacker.item, nature: attacker.nature,
        rawStats: attacker.rawStats, presetUsed: input.attacker.preset || null,
        abilityChampionsLegal: isKnownAbility(attacker.ability),
        itemChampionsLegal: attacker.item ? isKnownItem(attacker.item) : null,
      },
      defender: {
        species: defender.name, ability: defender.ability, item: defender.item, nature: defender.nature,
        rawStats: defender.rawStats, presetUsed: input.defender.preset || null,
        abilityChampionsLegal: isKnownAbility(defender.ability),
        itemChampionsLegal: defender.item ? isKnownItem(defender.item) : null,
      },
      move: { name: move.name, bp: move.bp, type: move.type, category: move.category },
    },
  };
}

module.exports = { runDamageCalc };
