#!/usr/bin/env node
'use strict';
// CLI for optimize-bulk.js. Two ways to specify threats (--mode solve/rank
// only — --mode generic takes no threats at all, see below):
//   - Single threat via flat flags (mirrors cli.js's style):
//       --attacker, --attacker-preset, --attacker-ability, --attacker-item,
//       --attacker-nature, --attacker-sp, --move, --weather, --terrain,
//       --weight (rank mode only, default 1)
//   - Multiple threats (the "overall survival" case — must survive a named
//     physical AND a named special attack simultaneously, etc.) via
//       --threats-file path/to/threats.json
//     (a JSON array of { attacker: {...}, move: { name }, field?: {...},
//     weight?: number } objects — weight defaults to 1, rank mode only) —
//     avoids shell-quoting a JSON blob inline across bash/PowerShell.
//
// Common flags: --defender, --defender-ability, --defender-item,
// --defender-nature, --defender-fixed-sp "at:32,sa:0,sp:30", --budget N,
// --cap N (default 32).
//
// --mode: "solve" (default) — findMinimalBulkSpread, a hard "must survive
//   ALL given threats" constraint, reports the true minimum SP or the
//   closest non-solution.
// --mode rank — rankSpreadsByOverallSurvival, for when there's no single
//   forcing threat and leftover SP needs to go somewhere: scores every
//   combo within budget by weighted expected remaining-HP fraction across
//   the WHOLE given threat list (continuous, not a survive/die bit-flip —
//   surviving with 60% HP left beats surviving with 2% left, but dying by
//   1% and dying by 500% overkill score identically, since fainted is
//   fainted). Each threat's `weight` (default 1) should come from real
//   usage data (P(attacker present) x P(this move on it)) when precision
//   matters — an unweighted list treats a 95%-usage staple and a niche
//   tech pick as equally important, which is itself an arbitrary flattening.
// --mode generic — maximizeGenericBulk, DOWNGRADED STATUS: a move-agnostic,
//   continuous-math estimate with NO threat data at all (no --attacker/
//   --move/--threats-file needed or used). Treat this as a rough starting
//   neighborhood only, never a peer of solve/rank — see optimize-bulk.js's
//   own header comment on maximizeGenericBulk for why its recommendations
//   can be actively wrong once a real move is checked. Extra flags:
//   --physical-weight, --special-weight (default 1 each).
const fs = require('node:fs');
const { findMinimalBulkSpread, rankSpreadsByOverallSurvival, maximizeGenericBulk } = require('./optimize-bulk');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

function parseSpMap(spString) {
  const sp = {};
  if (!spString) return sp;
  for (const pair of spString.split(',')) {
    const [stat, value] = pair.split(':');
    sp[stat] = parseInt(value, 10);
  }
  return sp;
}

function buildThreatFromFlags(args) {
  return {
    attacker: {
      species: args['attacker'],
      preset: args['attacker-preset'],
      ability: args['attacker-ability'],
      item: args['attacker-item'],
      nature: args['attacker-nature'],
      sp: args['attacker-sp'] ? parseSpMap(args['attacker-sp']) : undefined,
    },
    move: { name: args['move'] },
    field: { weather: args['weather'] || '', terrain: args['terrain'] || '' },
    weight: args['weight'] !== undefined ? parseFloat(args['weight']) : undefined,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args['mode'] || 'solve';

  const budget = parseInt(args['budget'], 10);
  if (Number.isNaN(budget)) {
    throw new Error('--budget is required (max additional SP to spend across HP/Def/SpD)');
  }

  const defender = {
    species: args['defender'],
    ability: args['defender-ability'],
    item: args['defender-item'],
    nature: args['defender-nature'],
  };
  const fixedSp = parseSpMap(args['defender-fixed-sp']);
  const capPerStat = args['cap'] ? parseInt(args['cap'], 10) : undefined;

  let result;
  if (mode === 'generic') {
    result = maximizeGenericBulk({
      defender,
      fixedSp,
      budget,
      capPerStat,
      physicalWeight: args['physical-weight'] !== undefined ? parseFloat(args['physical-weight']) : undefined,
      specialWeight: args['special-weight'] !== undefined ? parseFloat(args['special-weight']) : undefined,
    });
  } else {
    const threats = args['threats-file']
      ? JSON.parse(fs.readFileSync(args['threats-file'], 'utf8'))
      : [buildThreatFromFlags(args)];
    const config = { defender, fixedSp, budget, threats, capPerStat };
    result = mode === 'rank' ? rankSpreadsByOverallSurvival(config) : findMinimalBulkSpread(config);
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
