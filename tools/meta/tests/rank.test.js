'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const meta = require('../meta');
const formats = require('../formats');
const { rankFromUsage, ANCHOR_THRESHOLD } = require('../rank');

// ranked-index-mc.md: 50 rows. Verified 2026-09-14: Rillaboom #1,
// Incineroar #3, Floette-Eternal #11, Froslass #34; Pikachu is in the dex but
// not in the table.
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures', 'ranked-index-mc.md'), 'utf8');

function usage() {
  return meta.usageFromText(FIXTURE, { describe: formats.describe(FIXTURE, 'gen9championsvgc2026regmc') });
}

function rank(names) {
  return rankFromUsage(usage(), names);
}

test('rank: a plain species reports its own row', () => {
  const r = rank(['Rillaboom']).rows[0];
  assert.equal(r.rank, 1);
  assert.equal(r.isMega, false);
  assert.equal(r.usageSpecies, 'Rillaboom');
  assert.equal(r.reason, null);
  assert.equal(r.note, undefined);
  assert.equal(typeof r.usage.value, 'number');
});

test('rank: a Mega in dex naming resolves to its base species row, with a note', () => {
  const r = rank(['Mega Froslass']).rows[0];
  assert.equal(r.dexName, 'Mega Froslass');
  assert.equal(r.usageSpecies, 'Froslass');
  assert.equal(r.isMega, true);
  assert.equal(r.rank, 34);
  assert.match(r.note, /base species' row/);
});

test('rank: a Mega in Pikalytics naming resolves the same way', () => {
  const r = rank(['Froslass-Mega']).rows[0];
  assert.equal(r.dexName, 'Mega Froslass');
  assert.equal(r.rank, 34);
});

test('rank: a Mega whose base has a forme name uses that forme row', () => {
  const r = rank(['Mega Floette']).rows[0];
  assert.equal(r.usageSpecies, 'Floette-Eternal');
  assert.equal(r.rank, 11);
});

test('rank: a real species outside the table is rank null with a reason', () => {
  const r = rank(['Pikachu']).rows[0];
  assert.equal(r.rank, null);
  assert.match(r.reason, /outside the top 50/);
});

test('rank: a misspelled name is a row error, never "outside the top 50"', () => {
  const r = rank(['Frosslass']).rows[0];
  assert.match(r.error, /Unknown Pokemon/);
  assert.equal(r.rank, undefined);
});

test('rank: rows keep input order', () => {
  const out = rank(['Pikachu', 'Rillaboom', 'Frosslass']);
  assert.deepEqual(out.rows.map((r) => r.query), ['Pikachu', 'Rillaboom', 'Frosslass']);
});

test('rank: anchoring fires only when every resolved option is inside the threshold', () => {
  assert.equal(ANCHOR_THRESHOLD, 10);

  const all = rank(['Rillaboom', 'Incineroar']).anchoring;
  assert.equal(all.threshold, 10);
  assert.equal(all.allWithinThreshold, true);
  assert.match(all.message, /top 10/);

  const mixed = rank(['Rillaboom', 'Mega Froslass']).anchoring;
  assert.equal(mixed.allWithinThreshold, false);
  assert.equal(mixed.message, null);

  const outside = rank(['Pikachu']).anchoring;
  assert.equal(outside.allWithinThreshold, false);
});

test('rank: errored rows are excluded from anchoring, and all-errors never fires', () => {
  assert.equal(rank(['Rillaboom', 'Frosslass']).anchoring.allWithinThreshold, true);
  const none = rank(['Frosslass']).anchoring;
  assert.equal(none.allWithinThreshold, false);
  assert.equal(none.message, null);
});
