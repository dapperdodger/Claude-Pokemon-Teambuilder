#!/usr/bin/env node
'use strict';
// CLI for optimize-bulk.js. Two ways to specify threats:
//   - Single threat via flat flags (mirrors cli.js's style):
//       --attacker, --attacker-preset, --attacker-ability, --attacker-item,
//       --attacker-nature, --attacker-sp, --move, --weather, --terrain
//   - Multiple threats (the "overall survival" case — must survive a named
//     physical AND a named special attack simultaneously, etc.) via
//       --threats-file path/to/threats.json
//     (a JSON array of { attacker: {...}, move: { name }, field?: {...} }
//     objects) — avoids shell-quoting a JSON blob inline across bash/PowerShell.
//
// Common flags: --defender, --defender-ability, --defender-item,
// --defender-nature, --defender-fixed-sp "at:32,sa:0,sp:30", --budget N,
// --cap N (default 32).
const fs = require('node:fs');
const { findMinimalBulkSpread } = require('./optimize-bulk');

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
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const threats = args['threats-file']
    ? JSON.parse(fs.readFileSync(args['threats-file'], 'utf8'))
    : [buildThreatFromFlags(args)];

  const budget = parseInt(args['budget'], 10);
  if (Number.isNaN(budget)) {
    throw new Error('--budget is required (max additional SP to spend across HP/Def/SpD)');
  }

  const result = findMinimalBulkSpread({
    defender: {
      species: args['defender'],
      ability: args['defender-ability'],
      item: args['defender-item'],
      nature: args['defender-nature'],
    },
    fixedSp: parseSpMap(args['defender-fixed-sp']),
    budget,
    threats,
    capPerStat: args['cap'] ? parseInt(args['cap'], 10) : undefined,
  });

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
