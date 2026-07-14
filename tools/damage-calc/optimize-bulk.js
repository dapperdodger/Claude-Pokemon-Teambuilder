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

const { runDamageCalc } = require('./calc');
const { lookupMove } = require('./lookup');

const DEFAULT_CAP = 32;

function categoryOf(moveName) {
  const move = lookupMove(moveName);
  return move.category; // 'Physical' | 'Special' | 'Status'
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
    perThreat.push({
      attacker: threat.attacker.species,
      move: threat.move.name,
      min: result.min,
      max: result.max,
      hp: hpStat,
      survives: result.max < hpStat,
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

module.exports = { findMinimalBulkSpread, categoryOf };
