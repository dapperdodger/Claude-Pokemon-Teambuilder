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
