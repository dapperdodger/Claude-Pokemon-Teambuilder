#!/usr/bin/env node
'use strict';
// CLI over tools/dex/dex.js. Prints one JSON object per invocation.
//
// Usage:
//   node tools/dex/cli.js mon "Mega Raichu Y"
//   node tools/dex/cli.js type Electric --vs Grass
//   node tools/dex/cli.js type Fire --vs Rock,Flying
//   node tools/dex/cli.js move "Rock Slide"
//   node tools/dex/cli.js legal --item "Choice Band"
//   node tools/dex/cli.js legal --ability "No Guard"
//   node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"

const dex = require('./dex');

const USAGE = `Usage:
  node tools/dex/cli.js mon <Species>            types, base stats, ability (Mega-fixed flag)
  node tools/dex/cli.js type <Type> --vs <A[,B]> one attacker vs one defender
  node tools/dex/cli.js type --vs <A[,B]>        defender's full 18-type profile
  node tools/dex/cli.js type --vs-mon <Species>  same, typing read from the dex
  node tools/dex/cli.js move <Move>              bp, type, category, spread/priority flags
  node tools/dex/cli.js legal --item <Item>      Champions item-pool legality
  node tools/dex/cli.js legal --ability <Ability>
  node tools/dex/cli.js learnset <Species> [--move <Move>]  move legality
  node tools/dex/cli.js team <file.md>           validate a team file
  node tools/dex/cli.js team --all               validate every file in teams/

Examples:
  node tools/dex/cli.js mon "Mega Raichu Y"
  node tools/dex/cli.js type Electric --vs Grass
  node tools/dex/cli.js type Fire --vs Rock,Flying
  node tools/dex/cli.js type --vs-mon "Mega Froslass"

"What is X weak to" is one call, not a shell loop over 18 types: use
--vs-mon (or --vs) with no attacking type. Never loop this CLI and grep its
JSON — a bad type then prints a blank line and the pipeline still exits 0.`;

function fail(message) {
  process.stdout.write(JSON.stringify({ error: message }, null, 2) + '\n');
  process.exit(1);
}

function ok(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(USAGE + '\n');
    process.exit(command ? 0 : 1);
  }

  try {
    if (command === 'mon') {
      const name = argv[1];
      if (!name) return fail('mon: a species name is required, e.g. mon "Mega Raichu Y"');
      return ok(dex.mon(name));
    }

    if (command === 'type') {
      const vs = flagValue(argv, '--vs');
      const vsMon = flagValue(argv, '--vs-mon');
      if (vs !== undefined && vsMon !== undefined) {
        return fail('type: pass --vs or --vs-mon, not both');
      }

      // Resolve the defender first. --vs-mon exists so the defender's typing
      // is read out of the dex instead of being typed in from recall — the
      // failure mode a Mega makes likely (Mega Staraptor retypes to
      // Fighting/Flying), and one that silently corrupts every row at once.
      let defending;
      let defendingFrom;
      if (vsMon !== undefined) {
        if (!vsMon) return fail('type: --vs-mon requires a species, e.g. type --vs-mon "Mega Froslass"');
        const defender = dex.mon(vsMon);
        defending = defender.types;
        defendingFrom = defender.name;
      } else if (vs !== undefined) {
        if (!vs) return fail('type: --vs requires a value, e.g. type Fire --vs Rock,Flying');
        defending = vs.split(',').map((t) => t.trim()).filter(Boolean);
      } else {
        return fail('type: --vs <A[,B]> or --vs-mon <Species> is required, e.g. type Fire --vs Rock,Flying');
      }

      // A leading non-flag argument means the single-pair question. Without
      // one, the question is the defender's whole profile.
      const attacking = argv[1] && !argv[1].startsWith('--') ? argv[1] : undefined;
      if (attacking) return ok(dex.typeEffectiveness(attacking, defending));

      const { defending: resolved, ...profile } = dex.defensiveProfile(defending);
      return ok(defendingFrom
        ? { defending: resolved, defendingFrom, ...profile }
        : { defending: resolved, ...profile });
    }

    if (command === 'move') {
      const name = argv[1];
      if (!name) return fail('move: a move name is required, e.g. move "Rock Slide"');
      return ok(dex.move(name));
    }

    if (command === 'learnset') {
      const name = argv[1];
      if (!name) return fail('learnset: a species name is required, e.g. learnset "Mega Altaria" --move "Calm Mind"');
      if (argv.includes('--move') && flagValue(argv, '--move') === undefined) {
        return fail('learnset: --move requires a value, e.g. learnset "Altaria" --move "Calm Mind"');
      }
      const mv = flagValue(argv, '--move');
      return ok(dex.learnset(name, mv));
    }

    if (command === 'team') {
      const team = require('./team');
      const fs = require('node:fs');
      const path = require('node:path');
      let files;
      if (argv.includes('--all')) {
        const dir = path.join(__dirname, '..', '..', 'teams');
        files = fs.readdirSync(dir)
          .filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md' && f !== 'README.md')
          .map((f) => path.join(dir, f));
      } else {
        if (!argv[1]) return fail('team: a file path is required, e.g. team teams/my-team.md (or --all)');
        files = [argv[1]];
      }
      const results = files.map((f) => team.validateTeamFile(f));
      const errorCount = results.reduce((a, r) => a + r.errors.length, 0);
      const payload = {
        activeRegulation: team.currentRegulation(),
        files: results.length,
        errors: errorCount,
        warnings: results.reduce((a, r) => a + r.warnings.length, 0),
        results,
      };
      ok(payload);
      process.exit(errorCount > 0 ? 1 : 0);
    }

    if (command === 'legal') {
      const item = flagValue(argv, '--item');
      const ability = flagValue(argv, '--ability');
      if (item && ability) return fail('legal: pass --item or --ability, not both');
      if (item) return ok(dex.legal('item', item));
      if (ability) return ok(dex.legal('ability', ability));
      return fail('legal: --item <Item> or --ability <Ability> is required');
    }

    return fail(`Unknown command: "${command}".\n\n${USAGE}`);
  } catch (err) {
    return fail(err.message);
  }
}

main();
