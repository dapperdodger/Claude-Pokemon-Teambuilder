#!/usr/bin/env node
'use strict';
const { runDamageCalc } = require('./calc');

// Presence-only field/side flags: take no value, so parseArgs must NOT
// consume the following argv entry as their value (that would silently
// swallow the next real flag/value — e.g. `--reflect --move Earthquake`
// must not read "Earthquake" as --reflect's value).
const BOOLEAN_FLAGS = new Set([
  'reflect', 'light-screen', 'aurora-veil', 'friend-guard', 'helping-hand', 'tailwind',
]);

function parseArgs(argv) {
  const args = {};
  let i = 0;
  while (i < argv.length) {
    const key = argv[i].replace(/^--/, '');
    if (BOOLEAN_FLAGS.has(key)) {
      args[key] = true;
      i += 1;
    } else {
      args[key] = argv[i + 1];
      i += 2;
    }
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

const BOOST_STATS = ['at', 'df', 'sa', 'sd', 'sp'];

function parseBoostAllocation(boostString) {
  // Format: "at:2,sa:-1" — same "stat:value" shape as --*-sp
  // (parseSpAllocation above), for interface consistency. Stat stages run
  // -6..+6 (e.g. Swords Dance is at:2, an Intimidate drop is at:-1).
  //
  // NAMING HAZARD (same one parseSpAllocation already lives with): the
  // vendor dex's "sp" key means Speed. This repo's own vocabulary uses SP
  // for Stat Points (see --*-sp above). "sp" as a *boost* key always means
  // Speed, matching the vendor convention parseSpAllocation already follows
  // for --*-sp — not a new inconsistency, but worth flagging here too since
  // --*-boosts is a new flag a reader hasn't seen this collision on yet.
  if (!boostString) return undefined;
  const boosts = {};
  for (const pair of boostString.split(',')) {
    const [stat, value] = pair.split(':');
    if (!BOOST_STATS.includes(stat)) {
      throw new Error(`Unknown stat in --*-boosts: "${stat}" (use at, df, sa, sd, or sp)`);
    }
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < -6 || n > 6) {
      throw new Error(`Boost out of range in --*-boosts: "${stat}:${value}" (must be an integer from -6 to 6)`);
    }
    boosts[stat] = n;
  }
  return boosts;
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
      boosts: parseBoostAllocation(args['attacker-boosts']),
    },
    defender: {
      species: args['defender'],
      preset: args['defender-preset'],
      ability: args['defender-ability'],
      item: args['defender-item'],
      nature: args['defender-nature'],
      sp: parseSpAllocation(args['defender-sp']),
      boosts: parseBoostAllocation(args['defender-boosts']),
    },
    move: { name: args['move'] },
    field: {
      weather: args['weather'] || '',
      terrain: args['terrain'] || '',
      // Presence-only flags — `true` if passed at all, else `false`.
      reflect: !!args['reflect'],
      lightScreen: !!args['light-screen'],
      auroraVeil: !!args['aurora-veil'],
      friendGuard: !!args['friend-guard'],
      helpingHand: !!args['helping-hand'],
      tailwind: !!args['tailwind'],
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
