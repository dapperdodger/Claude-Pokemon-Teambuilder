'use strict';
// Finds the real minimum-SP HP/Def/SpD spread that survives one or more
// named attacks, by brute-forcing the real damage-calc engine over every
// legal combination instead of guessing or hand-deriving an equation.
//
// WHY BRUTE FORCE, NOT A CLOSED-FORM EQUATION: the underlying damage formula
// (see vendor/damage_MASTER.js's calcBaseDamage) makes damage proportional
// to Attack/Defense — so Defense has diminishing returns (each point matters
// less as Defense grows) while HP is flat/linear (each point always absorbs
// exactly one more point of damage, and never gets a nature multiplier).
// That means the right split between HP and Def/SpD depends on the
// defender's OWN base stats and the attack's specific power — there is no
// single universal ratio. Confirmed empirically: for Aegislash-Shield vs.
// Kingambit's Kowtow Cleave, the true minimum-total-SP survival spread is
// 24 HP / 1 Def (Aegislash's base Def is already so high that further Def
// investment barely reduces damage), not an even split and not "max Def."
// A brute-force search over the full (bounded, small) integer grid is the
// only reliable way to get this right per-Pokemon, per-threat.
//
// This directly supports reference/vgc_teambuilding_methodology.md's "SP
// spread allocation" section and is what scripts/check_sp_spread_optimization.js
// expects team files to actually have been run through before a round
// (0/2/32) HP/Def/SpD spread is presented as justified.

const { runDamageCalc, alignmentModFor } = require('./calc');
const { lookupMove, lookupSpecies } = require('./lookup');
const { computeStat, computeHP } = require('./stat-formula');
const { getVendor } = require('./load-vendor');

const DEFAULT_CAP = 32;

function categoryOf(moveName) {
  const move = lookupMove(moveName);
  return move.category; // 'Physical' | 'Special' | 'Status'
}

// Same derivation calc.js's buildMove uses for isVariableMultiHit — lookupMove's
// raw record doesn't carry that field precomputed, only calc.js adds it once
// it builds a move for an actual damage calc, so both optimize functions
// below need to replicate it themselves before trusting result.max as
// "the whole move's damage" (true only for single-hit moves).
function isMultiHitMove(moveName) {
  const move = lookupMove(moveName);
  return !!move.hitRange && !move.isTripleHit;
}

function assertNoMultiHitThreats(threats, callerName) {
  const multiHit = threats.filter((t) => isMultiHitMove(t.move.name));
  if (multiHit.length > 0) {
    throw new Error(
      `Multi-hit move(s) not supported by ${callerName} (per-hit-only damage, see vgc_damage_calc.md): ${multiHit.map((t) => t.move.name).join(', ')}. Evaluate these separately.`
    );
  }
}

function buildDefenderSp(hp, df, sd, fixedSp) {
  return {
    hp,
    at: fixedSp.at || 0,
    df,
    sa: fixedSp.sa || 0,
    sd,
    sp: fixedSp.sp || 0,
  };
}

// Evaluates one (hp, df, sd) candidate against every threat. Returns
// { survivesAll, worstMarginRatio, perThreat: [...] } — worstMarginRatio is
// the highest (damage / hp) ratio seen across threats (>1 means death), used
// to rank non-solving candidates by "how close" when nothing in budget works.
function evaluateCombo(defender, fixedSp, threats, hp, df, sd) {
  const sp = buildDefenderSp(hp, df, sd, fixedSp);
  let worstMarginRatio = 0;
  let hpStat = null;
  const perThreat = [];

  for (const threat of threats) {
    const result = runDamageCalc({
      attacker: threat.attacker,
      defender: {
        species: defender.species,
        ability: defender.ability,
        item: defender.item,
        nature: defender.nature,
        sp,
      },
      move: { name: threat.move.name },
      field: threat.field || {},
    });
    hpStat = result.matchedRecords.defender.rawStats.hp;
    const ratio = result.max / hpStat;
    worstMarginRatio = Math.max(worstMarginRatio, ratio);
    // remainingHPFraction: how much HP is left after the worst-case hit, as
    // a fraction of max HP — clamped at 0 for anything lethal-or-worse.
    // Fainting is fainting: dying by 1% and dying by 500% overkill are the
    // SAME real outcome, so they must score identically, not "less bad" for
    // the smaller overkill. Only the survive side varies continuously.
    const remainingHPFraction = Math.max(0, (hpStat - result.max) / hpStat);
    perThreat.push({
      attacker: threat.attacker.species,
      move: threat.move.name,
      min: result.min,
      max: result.max,
      hp: hpStat,
      survives: result.max < hpStat,
      remainingHPFraction,
      weight: threat.weight === undefined ? 1 : threat.weight,
    });
  }

  return {
    hp: hpStat,
    df: perThreat.length ? undefined : undefined, // filled by caller from rawStats if needed
    survivesAll: perThreat.every((t) => t.survives),
    worstMarginRatio,
    perThreat,
  };
}

// findMinimalBulkSpread({
//   defender: { species, ability, item, nature },
//   fixedSp: { at, sa, sp } (SP already committed elsewhere; default 0 each),
//   budget: number (max additional SP to spend across hp/df/sd),
//   threats: [ { attacker: {species, preset?, ability?, item?, nature?, sp?}, move: {name}, field?: {weather, terrain} }, ... ],
//   capPerStat: default 32,
// })
//
// Returns { solvable, minTotal, winners: [{hp,df,sd,total,detail}], closest }
// - winners: every (hp,df,sd) combo tying the minimum total SP that survives
//   ALL threats (there can be more than one — e.g. HP+1/Def-1 vs HP/Def landing
//   on the same real stat due to flooring).
// - closest: present when !solvable — the combo(s) within budget/caps that
//   come closest to surviving (lowest worstMarginRatio), so a caller can
//   report "not solvable within budget, closest is X" per the methodology
//   file's "some worst cases have no SP-allocation fix at all" guidance,
//   rather than silently picking something that still loses.
function findMinimalBulkSpread({ defender, fixedSp = {}, budget, threats, capPerStat = DEFAULT_CAP }) {
  if (!threats || threats.length === 0) {
    throw new Error('findMinimalBulkSpread requires at least one threat');
  }

  const categories = threats.map((t) => categoryOf(t.move.name));
  if (categories.some((c) => c === 'Status')) {
    throw new Error('One or more threats is a Status move (no damage) — remove it, this tool only optimizes against damaging attacks');
  }
  assertNoMultiHitThreats(threats, 'findMinimalBulkSpread');
  const searchDf = categories.includes('Physical');
  const searchSd = categories.includes('Special');

  const dfMax = searchDf ? Math.min(capPerStat, budget) : 0;
  const sdMax = searchSd ? Math.min(capPerStat, budget) : 0;
  const hpMax = Math.min(capPerStat, budget);

  let winners = [];
  let minTotal = Infinity;
  let closestRatio = Infinity;
  let closest = [];

  for (let hp = 0; hp <= hpMax; hp++) {
    for (let df = 0; df <= dfMax; df++) {
      for (let sd = 0; sd <= sdMax; sd++) {
        const total = hp + df + sd;
        if (total > budget) continue;
        // Once we already have a solution, never bother evaluating a
        // strictly-worse-or-equal total — keeps this fast and simple.
        if (total > minTotal) continue;

        const evalResult = evaluateCombo(defender, fixedSp, threats, hp, df, sd);

        if (evalResult.survivesAll) {
          if (total < minTotal) {
            minTotal = total;
            winners = [];
          }
          if (total === minTotal) {
            winners.push({ hp, df, sd, total, detail: evalResult.perThreat });
          }
        } else if (winners.length === 0) {
          // Only track "closest" while we haven't found a real solution yet —
          // once solved, closest-but-losing candidates are irrelevant.
          if (evalResult.worstMarginRatio < closestRatio) {
            closestRatio = evalResult.worstMarginRatio;
            closest = [{ hp, df, sd, total, detail: evalResult.perThreat, worstMarginRatio: evalResult.worstMarginRatio }];
          } else if (evalResult.worstMarginRatio === closestRatio) {
            closest.push({ hp, df, sd, total, detail: evalResult.perThreat, worstMarginRatio: evalResult.worstMarginRatio });
          }
        }
      }
    }
  }

  if (winners.length > 0) {
    return { solvable: true, minTotal, winners, searchDf, searchSd };
  }
  return { solvable: false, closest, searchDf, searchSd };
}

// rankSpreadsByOverallSurvival({ defender, fixedSp, budget, threats, capPerStat })
//
// Different question from findMinimalBulkSpread: that one solves "what's the
// minimum SP to survive THIS attack" (a hard must-survive constraint).
// This one answers "given a fixed number of leftover points and NO single
// forcing threat, which split is actually best across the realistic threat
// list overall" — picking a split by checking it against only one matchup
// (even a real one) risks optimizing for the wrong thing, since a different
// real attacker in the same format could favor a different split entirely
// (confirmed this session: Noivern's leftover SP was better spent in SpD
// than HP against Sylveon's Moonblast specifically, because Noivern's low
// base SpD sits on the steep part of the diminishing-returns curve — but
// that's a fact about THIS matchup, not a general rule, and a broader
// threat list is needed to check it isn't a fluke of picking one attacker).
//
// WEIGHTING: each threat may carry an optional `weight` (defaults to 1 —
// unweighted, every threat counts equally). Treating a hand-picked threat
// list as equally-weighted votes is itself an arbitrary flattening — a
// 95%-usage staple move and a niche tech pick shouldn't count the same.
// The principled weight is P(this exact attacker+move is what you actually
// face) ≈ (real team-usage % of the attacker) × (real moveset-usage % of
// that move on that attacker) — both real, live-verifiable numbers per
// CLAUDE.md rule 3, not invented. This turns the ranking into an expected-
// value calculation (maximize weighted expected remaining HP, see SCORING
// below) rather than a flat majority vote, though it's still an
// approximation of true survival
// probability — usage stats are ladder-derived (ladder ≠ tournament, see
// vgc_common_pitfalls.md) and don't account for this team's own bring-6-
// pick-4 exposure (a threat this Pokemon is never brought against
// shouldn't count against it at all, regardless of its usage weight).
//
// SCORING: NOT a bit-flip/survival-count problem. Whether a threat is
// survived isn't the only thing that matters — surviving with 60% HP left
// and surviving with 2% HP left are very different real outcomes (the
// latter dies to any follow-up), so "how much HP remains" has to be
// continuous and central, not a tiebreaker behind a binary survived/died
// flag. Conversely, dying by 1% and dying by 500% overkill are the SAME
// real outcome (fainted is fainted) and must score identically — a spread
// that "almost" survives an unsolvable threat is not meaningfully better
// than one that gets crushed by it, so the losing side is clamped flat.
//
// Per threat: remainingHPFraction = max(0, (HP - maxDamage) / HP) — the
// fraction of HP left after the worst-case hit, clamped to 0 for anything
// lethal-or-worse (see evaluateCombo). Every (hp, df, sd) combo with
// hp+df+sd <= budget is scored by, in order:
//   1. weightedRemainingHP = sum of (weight x remainingHPFraction) across
//      all threats — the primary, continuous "how good is this spread
//      overall" measure (maximize).
//   2. worstRemainingHPFraction = the single WORST remainingHPFraction
//      across all threats (maximize) — a secondary tiebreak that prefers a
//      more balanced spread (no single glaring weak matchup) over one with
//      the same total but a worse floor.
// Returns every combo tied on both, sorted best-first.
//
// NOTE: excludes true multi-hit moves (isVariableMultiHit) from the input
// threat list — this tool's per-combo damage check assumes `result.max` is
// the whole hit's damage, which is only valid for single-hit moves (see
// vgc_damage_calc.md's multi-hit caveat). Multi-hit threats (Dual Wingbeat,
// Icicle Spear, etc.) still need the same manual "per-hit x realistic hit
// count" reasoning documented elsewhere in this session's work.
function rankSpreadsByOverallSurvival({ defender, fixedSp = {}, budget, threats, capPerStat = DEFAULT_CAP }) {
  if (!threats || threats.length === 0) {
    throw new Error('rankSpreadsByOverallSurvival requires at least one threat');
  }

  const categories = threats.map((t) => categoryOf(t.move.name));
  if (categories.some((c) => c === 'Status')) {
    throw new Error('One or more threats is a Status move (no damage) — remove it, this tool only ranks against damaging attacks');
  }
  assertNoMultiHitThreats(threats, 'rankSpreadsByOverallSurvival');

  const searchDf = categories.includes('Physical');
  const searchSd = categories.includes('Special');
  const dfMax = searchDf ? Math.min(capPerStat, budget) : 0;
  const sdMax = searchSd ? Math.min(capPerStat, budget) : 0;
  const hpMax = Math.min(capPerStat, budget);
  const totalWeight = threats.reduce((sum, t) => sum + (t.weight === undefined ? 1 : t.weight), 0);

  const scored = [];
  for (let hp = 0; hp <= hpMax; hp++) {
    for (let df = 0; df <= dfMax; df++) {
      for (let sd = 0; sd <= sdMax; sd++) {
        const total = hp + df + sd;
        if (total > budget) continue;
        const evalResult = evaluateCombo(defender, fixedSp, threats, hp, df, sd);
        const weightedRemainingHP = evalResult.perThreat.reduce((sum, t) => sum + t.weight * t.remainingHPFraction, 0);
        const worstRemainingHPFraction = Math.min(...evalResult.perThreat.map((t) => t.remainingHPFraction));
        scored.push({
          hp,
          df,
          sd,
          total,
          weightedRemainingHP,
          totalWeight,
          totalThreats: threats.length,
          worstRemainingHPFraction,
          detail: evalResult.perThreat,
        });
      }
    }
  }

  scored.sort((a, b) => {
    if (a.weightedRemainingHP !== b.weightedRemainingHP) return b.weightedRemainingHP - a.weightedRemainingHP;
    return b.worstRemainingHPFraction - a.worstRemainingHPFraction;
  });

  const best = scored[0];
  const winners = scored.filter(
    (s) => s.weightedRemainingHP === best.weightedRemainingHP && s.worstRemainingHPFraction === best.worstRemainingHPFraction
  );

  return { totalThreats: threats.length, totalWeight, winners, searchDf, searchSd };
}

// maximizeGenericBulk({ defender, fixedSp, budget, capPerStat, physicalWeight, specialWeight })
//
// DOWNGRADED STATUS, READ BEFORE USING: this is a rough theoretical estimate
// ONLY, not a peer of findMinimalBulkSpread/rankSpreadsByOverallSurvival —
// its recommendations should not be given real weight when they disagree
// with either of those. No move, no attacker, no threat list at all — just
// "given this defender's own base stats and nature, what HP/Def/SpD split
// is structurally bulkiest against a hypothetical, generic hit?" This is
// the closed-form continuous math from Jenkins' "How to Optimize Defensive
// Spreads in Pokemon Champions Using Math"
// (https://www.youtube.com/watch?v=FxfI7I_sSnM): damage is proportional to
// Attack/Defense, so the danger from an unknown physical hit is modeled as
// 1/(HP*Def), and from an unknown special hit as 1/(HP*SpD); minimizing the
// weighted sum of both (equal weight by default) is a real, solvable
// Lagrangian problem whose continuous optimum is HP = Def + SpD.
//
// WHY this is downgraded rather than a genuine second opinion: that same
// source's central finding is that this continuous relationship is a poor
// predictor of the REAL, floor-rounded damage-vs-Defense relationship,
// because actual damage calculation chains multiple rounded multipliers
// together (weather/crit/STAB/spread/type-effectiveness/etc.), producing
// irregular "jumps" no smooth formula anticipates. This function's `danger`
// score is exactly that kind of smooth formula — it has no way to know
// where those real jumps fall, because it never computes an actual damage
// roll at all (only real, correctly-floored HP/Def/SpD *stat* values via
// computeHP/computeStat — the SP-to-stat mapping is exact, but the
// *objective being optimized* is still the continuous proxy, disconnected
// from any real move's actual output). So when this disagrees with a real
// threat-based tool (confirmed this session: for Noivern, this function
// recommended dumping leftover SP into HP, while the real specific-threat
// ranking recommended Def, because real threats happened to cluster on the
// physical side), that's not "two valid perspectives to weigh" — the proxy
// is just wrong in the way the source predicts it would be. Use this only
// as a rough starting neighborhood when literally no threat data exists
// yet; always prefer rankSpreadsByOverallSurvival/findMinimalBulkSpread
// once any real threat is known, even one.
function maximizeGenericBulk({ defender, fixedSp = {}, budget, capPerStat = DEFAULT_CAP, physicalWeight = 1, specialWeight = 1 }) {
  const species = lookupSpecies(defender.species);
  const natures = getVendor().NATURES;
  const dfNature = alignmentModFor(defender.nature, 'df', natures);
  const sdNature = alignmentModFor(defender.nature, 'sd', natures);

  const hpMax = Math.min(capPerStat, budget);
  const dfMax = Math.min(capPerStat, budget);
  const sdMax = Math.min(capPerStat, budget);

  let best = null;
  let tied = [];

  for (let hp = 0; hp <= hpMax; hp++) {
    for (let df = 0; df <= dfMax; df++) {
      for (let sd = 0; sd <= sdMax; sd++) {
        if (hp + df + sd > budget) continue;
        const HP = computeHP(species.bs.hp, hp);
        const Def = computeStat(species.bs.df, df, dfNature);
        const SpD = computeStat(species.bs.sd, sd, sdNature);
        // Lower danger = bulkier. This is the quantity Jenkins' derivation
        // minimizes (physicalWeight/(HP*Def) + specialWeight/(HP*SpD)).
        const danger = physicalWeight / (HP * Def) + specialWeight / (HP * SpD);
        if (!best || danger < best.danger) {
          best = { hp, df, sd, total: hp + df + sd, HP, Def, SpD, danger };
          tied = [{ hp, df, sd, total: hp + df + sd, HP, Def, SpD }];
        } else if (danger === best.danger) {
          tied.push({ hp, df, sd, total: hp + df + sd, HP, Def, SpD });
        }
      }
    }
  }

  return { winners: tied, best: { ...best } };
}

module.exports = { findMinimalBulkSpread, rankSpreadsByOverallSurvival, maximizeGenericBulk, categoryOf };
