const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'cli.js');

test('cli.js prints structured JSON for a valid matchup', () => {
  const output = execFileSync('node', [
    CLI,
    '--attacker', 'Gholdengo', '--attacker-ability', 'Good as Gold', '--attacker-item', 'Life Orb',
    '--attacker-nature', 'Modest', '--attacker-sp', 'sa:32',
    '--defender', 'Garchomp', '--defender-ability', 'Rough Skin', '--defender-nature', 'Serious',
    '--move', 'Make It Rain',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output);
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.species, 'Gholdengo');
  assert.equal(result.matchedRecords.move.name, 'Make It Rain');
});

test('cli.js exits non-zero with a clear message for an unknown Pokemon', () => {
  assert.throws(() => {
    execFileSync('node', [
      CLI,
      '--attacker', 'Garchmp', '--attacker-ability', 'Rough Skin', '--attacker-nature', 'Serious',
      '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
      '--move', 'Rock Slide',
    ], { encoding: 'utf8', stdio: 'pipe' });
  }, /Unknown Pokemon: "Garchmp"/);
});

test('cli.js: --attacker-preset fills ability/item/nature/sp, --move still explicit', () => {
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');

  const output = execFileSync('node', [
    CLI,
    '--attacker', 'Garchomp', '--attacker-preset', presetNames[0],
    '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output);
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.presetUsed, presetNames[0]);
});

test('cli.js auto-fills ability from species data when not explicitly given', () => {
  const output = execFileSync('node', [
    CLI,
    '--attacker', 'Garchomp',
    '--defender', 'Gholdengo', '--defender-ability', 'Good as Gold', '--defender-nature', 'Serious',
    '--move', 'Earthquake',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output);
  assert.ok(result.min > 0);
  // Garchomp's default ability from POKEDEX_CHAMPIONS
  assert.equal(result.matchedRecords.attacker.ability, 'Rough Skin');
});
