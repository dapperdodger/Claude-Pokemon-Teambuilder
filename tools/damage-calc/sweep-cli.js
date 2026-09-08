#!/usr/bin/env node
'use strict';
// Runs many damage calculations in one invocation.
//
// Why: cli.js is one attacker/defender/move per call, so checking one move
// against ten threats meant ten separate calls — ten agent round-trips for
// what is one question ("how does this matchup spread look"). Per-call time
// is not the issue; turn count is. optimize-bulk-cli.js already takes a
// --threats-file, so this matches that idiom rather than inventing another.
//
// Usage:
//   node tools/damage-calc/sweep-cli.js --file matchups.json
//
// The file is either a JSON array of matchup objects, or an object with a
// `defaults` key merged into every entry:
//
//   {
//     "defaults": { "attacker": { "species": "Gholdengo", "attacker-sp": ... },
//                   "move": "Make It Rain", "weather": "Rain" },
//     "matchups": [ { "defender": { "species": "Garchomp" } },
//                   { "defender": { "species": "Incineroar" }, "move": "Shadow Ball" } ]
//   }
//
// Each entry uses the same field names as cli.js's flags without the `--`
// prefix, grouped under `attacker` / `defender`, plus top-level `move`,
// `weather`, `terrain`, and an optional `label`.
//
// One failing matchup does not abort the sweep: its entry carries an `error`
// field and the rest still run. A sweep that dies on entry 3 of 10 wastes the
// whole call, and a partial answer with a named failure is more useful than
// none.

const fs = require('node:fs');
const { runDamageCalc } = require('./calc');

function fail(message) {
  process.stdout.write(JSON.stringify({ error: message }, null, 2) + '\n');
  process.exit(1);
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

// "sa:32,hp:2" -> { hp: 2, at: 0, ..., sa: 32 }. Same format as cli.js's
// --*-sp flags, so a spread can be copied between the two without translation.
function parseSp(spec) {
  if (spec === undefined || spec === null) return undefined;
  if (typeof spec === 'object') return spec;
  const sp = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
  for (const pair of String(spec).split(',')) {
    const [stat, value] = pair.split(':');
    if (!(stat in sp)) throw new Error(`Unknown stat in sp allocation: "${stat}" (use hp, at, df, sa, sd, sp)`);
    sp[stat] = parseInt(value, 10);
  }
  return sp;
}

function side(spec = {}) {
  return {
    species: spec.species,
    preset: spec.preset,
    ability: spec.ability,
    item: spec.item,
    nature: spec.nature,
    sp: parseSp(spec.sp),
  };
}

function mergeSide(base = {}, over = {}) {
  return Object.assign({}, base, over);
}

function main() {
  const argv = process.argv.slice(2);
  const file = flagValue(argv, '--file');
  if (!file) {
    return fail('sweep-cli: --file <matchups.json> is required. See the header of this file for the format.');
  }

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fail(`Could not read or parse ${file}: ${err.message}`);
  }

  const defaults = Array.isArray(doc) ? {} : (doc.defaults || {});
  const matchups = Array.isArray(doc) ? doc : doc.matchups;
  if (!Array.isArray(matchups) || matchups.length === 0) {
    return fail('sweep-cli: no matchups found. Provide a JSON array, or an object with a "matchups" array.');
  }

  const results = matchups.map((m, i) => {
    const label = m.label || `${(m.attacker || defaults.attacker || {}).species || '?'} ${m.move || defaults.move || '?'} vs ${(m.defender || defaults.defender || {}).species || '?'}`;
    try {
      const input = {
        attacker: side(mergeSide(defaults.attacker, m.attacker)),
        defender: side(mergeSide(defaults.defender, m.defender)),
        move: { name: m.move || defaults.move },
        field: {
          weather: m.weather !== undefined ? m.weather : (defaults.weather || ''),
          terrain: m.terrain !== undefined ? m.terrain : (defaults.terrain || ''),
        },
      };
      const result = runDamageCalc(input);
      return { index: i, label, result };
    } catch (err) {
      return { index: i, label, error: err.message };
    }
  });

  const failed = results.filter((r) => r.error).length;
  process.stdout.write(JSON.stringify({
    matchups: results.length,
    failed,
    results,
  }, null, 2) + '\n');
}

try {
  main();
} catch (err) {
  fail(err.message);
}
