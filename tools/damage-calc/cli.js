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
