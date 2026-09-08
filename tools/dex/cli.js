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

const dex = require('./dex');

const USAGE = `Usage:
  node tools/dex/cli.js mon <Species>            types, base stats, ability (Mega-fixed flag)
  node tools/dex/cli.js type <Type> --vs <A[,B]> combined type effectiveness
  node tools/dex/cli.js move <Move>              bp, type, category, spread/priority flags
  node tools/dex/cli.js legal --item <Item>      Champions item-pool legality
  node tools/dex/cli.js legal --ability <Ability>
  node tools/dex/cli.js team <file.md>           validate a team file
  node tools/dex/cli.js team --all               validate every file in teams/

Examples:
  node tools/dex/cli.js mon "Mega Raichu Y"
  node tools/dex/cli.js type Electric --vs Grass
  node tools/dex/cli.js type Fire --vs Rock,Flying`;

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
      const attacking = argv[1];
      if (!attacking) return fail('type: an attacking type is required, e.g. type Electric --vs Grass');
      const vs = flagValue(argv, '--vs');
      if (!vs) return fail('type: --vs is required, e.g. type Fire --vs Rock,Flying (comma-separated for a dual type)');
      const defending = vs.split(',').map((t) => t.trim()).filter(Boolean);
      return ok(dex.typeEffectiveness(attacking, defending));
    }

    if (command === 'move') {
      const name = argv[1];
      if (!name) return fail('move: a move name is required, e.g. move "Rock Slide"');
      return ok(dex.move(name));
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
