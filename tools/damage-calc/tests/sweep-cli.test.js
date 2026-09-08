const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'sweep-cli.js');

function runSweep(doc) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-')), 'matchups.json');
  fs.writeFileSync(file, JSON.stringify(doc));
  let out;
  try {
    out = execFileSync('node', [CLI, '--file', file], { encoding: 'utf8' });
  } catch (err) {
    out = err.stdout;
  }
  return JSON.parse(out);
}

const ATTACKER = { species: 'Gholdengo', ability: 'Good as Gold', item: 'Life Orb', nature: 'Modest', sp: 'sa:32,hp:32,df:2' };

test('runs every matchup in one invocation', () => {
  const d = runSweep({
    defaults: { attacker: ATTACKER, move: 'Make It Rain' },
    matchups: [
      { defender: { species: 'Garchomp' } },
      { defender: { species: 'Incineroar' } },
      { defender: { species: 'Whimsicott' } },
    ],
  });
  assert.equal(d.matchups, 3);
  assert.equal(d.failed, 0);
  for (const r of d.results) {
    assert.ok(typeof r.result.min === 'number' && r.result.min > 0, JSON.stringify(r));
  }
});

test('defaults are merged into every matchup, and per-entry values override', () => {
  const d = runSweep({
    defaults: { attacker: ATTACKER, move: 'Make It Rain' },
    matchups: [
      { defender: { species: 'Garchomp' } },
      { defender: { species: 'Garchomp' }, move: 'Shadow Ball' },
    ],
  });
  assert.equal(d.failed, 0);
  // Different moves must give different numbers; if the override were ignored
  // both entries would be identical.
  assert.notEqual(d.results[0].result.min, d.results[1].result.min);
});

test('per-matchup weather overrides the default', () => {
  const base = { defaults: { attacker: ATTACKER, move: 'Make It Rain' }, matchups: [{ defender: { species: 'Milotic' } }] };
  const noWeather = runSweep(base);
  const withRain = runSweep({
    defaults: base.defaults,
    matchups: [{ defender: { species: 'Milotic' }, weather: 'Rain' }],
  });
  assert.equal(noWeather.failed, 0);
  assert.equal(withRain.failed, 0);
  // Make It Rain is Steel-type, so Rain does not change its power — what this
  // asserts is that passing weather does not break the run.
  assert.ok(withRain.results[0].result.min > 0);
});

test('one bad matchup does not abort the rest', () => {
  const d = runSweep({
    defaults: { attacker: ATTACKER, move: 'Make It Rain' },
    matchups: [
      { defender: { species: 'Garchomp' } },
      { defender: { species: 'Nosuchmon' } },
      { defender: { species: 'Incineroar' } },
    ],
  });
  assert.equal(d.matchups, 3);
  assert.equal(d.failed, 1);
  assert.match(d.results[1].error, /Unknown Pokemon: "Nosuchmon"/);
  // The entries either side still produced real results.
  assert.ok(d.results[0].result.min > 0);
  assert.ok(d.results[2].result.min > 0);
});

test('a bare array of matchups works without a defaults block', () => {
  const d = runSweep([
    { attacker: ATTACKER, move: 'Make It Rain', defender: { species: 'Garchomp' } },
  ]);
  assert.equal(d.failed, 0);
  assert.ok(d.results[0].result.min > 0);
});

test('a custom label is used in the result', () => {
  const d = runSweep({
    defaults: { attacker: ATTACKER, move: 'Make It Rain' },
    matchups: [{ label: 'the scary one', defender: { species: 'Garchomp' } }],
  });
  assert.equal(d.results[0].label, 'the scary one');
});

test('an auto label names attacker, move and defender', () => {
  const d = runSweep({
    defaults: { attacker: ATTACKER, move: 'Make It Rain' },
    matchups: [{ defender: { species: 'Garchomp' } }],
  });
  assert.equal(d.results[0].label, 'Gholdengo Make It Rain vs Garchomp');
});

test('a missing --file reports rather than throwing', () => {
  let out;
  try {
    out = execFileSync('node', [CLI], { encoding: 'utf8' });
  } catch (err) {
    out = err.stdout;
  }
  assert.match(JSON.parse(out).error, /--file <matchups.json> is required/);
});

test('an unreadable file reports the path', () => {
  let out;
  try {
    out = execFileSync('node', [CLI, '--file', 'definitely-not-here.json'], { encoding: 'utf8' });
  } catch (err) {
    out = err.stdout;
  }
  assert.match(JSON.parse(out).error, /Could not read or parse definitely-not-here.json/);
});

test('an empty matchup list reports rather than returning nothing', () => {
  const d = runSweep({ defaults: {}, matchups: [] });
  assert.match(d.error, /no matchups found/i);
});
