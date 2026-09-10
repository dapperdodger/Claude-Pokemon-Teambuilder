const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'cli.js');

function run(args) {
  const output = execFileSync('node', [CLI, ...args], { encoding: 'utf8' });
  return JSON.parse(output);
}

function runExpectError(args) {
  try {
    execFileSync('node', [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
    throw new Error('expected CLI to exit non-zero');
  } catch (err) {
    return err.stderr ? err.stderr.toString() : err.message;
  }
}

// --- Screens: direction depends on move category ---

test('--reflect strictly lowers max damage for a physical move', () => {
  const base = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  const withReflect = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake', '--reflect',
  ]);
  assert.ok(withReflect.max < base.max, `expected ${withReflect.max} < ${base.max}`);
});

test('--reflect does not change damage for a special move', () => {
  const base = run([
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Shadow Ball',
  ]);
  const withReflect = run([
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Shadow Ball', '--reflect',
  ]);
  assert.equal(withReflect.max, base.max);
  assert.equal(withReflect.min, base.min);
});

test('--light-screen strictly lowers max damage for a special move', () => {
  const base = run([
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Shadow Ball',
  ]);
  const withLS = run([
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Shadow Ball', '--light-screen',
  ]);
  assert.ok(withLS.max < base.max, `expected ${withLS.max} < ${base.max}`);
});

test('--light-screen does not change damage for a physical move', () => {
  const base = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  const withLS = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake', '--light-screen',
  ]);
  assert.equal(withLS.max, base.max);
  assert.equal(withLS.min, base.min);
});

// --- Friend Guard: reduces damage regardless of category ---

test('--friend-guard lowers max damage', () => {
  const base = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  const withFG = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake', '--friend-guard',
  ]);
  assert.ok(withFG.max < base.max, `expected ${withFG.max} < ${base.max}`);
});

// --- Stat boosts ---

test('--attacker-boosts at:2 raises max damage on a physical move', () => {
  const base = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  const boosted = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake', '--attacker-boosts', 'at:2',
  ]);
  assert.ok(boosted.max > base.max, `expected ${boosted.max} > ${base.max}`);
});

test('--defender-boosts at:-1 (an Intimidate drop) lowers attacker Attack-based damage', () => {
  const base = run([
    '--attacker', 'Incineroar', '--attacker-ability', 'Intimidate', '--attacker-nature', 'Serious',
    '--defender', 'Garchomp', '--defender-ability', 'Rough Skin', '--defender-nature', 'Serious',
    '--move', 'Flare Blitz',
  ]);
  // Apply the drop to the ATTACKER here (Intimidate drops the target's Attack).
  const dropped = run([
    '--attacker', 'Incineroar', '--attacker-ability', 'Intimidate', '--attacker-nature', 'Serious',
    '--attacker-boosts', 'at:-1',
    '--defender', 'Garchomp', '--defender-ability', 'Rough Skin', '--defender-nature', 'Serious',
    '--move', 'Flare Blitz',
  ]);
  assert.ok(dropped.max < base.max, `expected ${dropped.max} < ${base.max}`);
});

test('--defender-boosts at:-1 does NOT change a physical move\'s damage (drop hits Attack, not Defense)', () => {
  const base = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  const withDrop = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake', '--defender-boosts', 'at:-1',
  ]);
  assert.equal(withDrop.max, base.max);
  assert.equal(withDrop.min, base.min);
});

test('unknown stat key in --attacker-boosts throws naming valid keys', () => {
  const stderr = runExpectError([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--attacker-boosts', 'xy:2',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  assert.match(stderr, /Unknown stat/);
  assert.match(stderr, /at, df, sa, sd, or sp/);
});

test('out-of-range boost value throws instead of silently clamping', () => {
  const stderr = runExpectError([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--attacker-boosts', 'at:7',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ]);
  assert.match(stderr, /-6 to 6/);
});

// --- parseArgs: valueless boolean flags must not swallow the next argument ---

test('a valueless flag (--reflect) does not swallow the following --move argument', () => {
  const result = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--reflect', '--move', 'Earthquake',
  ]);
  assert.equal(result.matchedRecords.move.name, 'Earthquake');
});

// --- Output echoes the active conditions ---

test('output JSON echoes resolved boosts and true field flags', () => {
  const result = run([
    '--attacker', 'Garchomp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
    '--attacker-boosts', 'at:2',
    '--defender', 'Incineroar', '--defender-ability', 'Intimidate', '--defender-nature', 'Serious',
    '--defender-boosts', 'df:-1',
    '--move', 'Earthquake', '--friend-guard', '--tailwind',
  ]);
  assert.equal(result.matchedRecords.attacker.boosts.at, 2);
  assert.equal(result.matchedRecords.defender.boosts.df, -1);
  assert.equal(result.matchedRecords.field.friendGuard, true);
  assert.equal(result.matchedRecords.field.tailwind, true);
  assert.equal(result.matchedRecords.field.reflect, false);
});

// --- Existing flags still work unchanged ---

test('existing flags (--weather, --*-sp, --*-preset) still work unchanged', () => {
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');

  const output = run([
    '--attacker', 'Garchomp', '--attacker-preset', presetNames[0],
    '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
    '--defender-sp', 'hp:20,sd:15',
    '--weather', 'Sand',
    '--move', 'Earthquake',
  ]);
  assert.ok(output.min > 0);
  assert.equal(output.matchedRecords.attacker.presetUsed, presetNames[0]);
});
