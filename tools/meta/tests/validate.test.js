'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const validate = require('../validate');
const parse = require('../parse');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('a real percentage becomes a number', () => {
  assert.deepEqual(validate.toNumber('60.5%', 'x'), { value: 60.5, reason: null });
  assert.deepEqual(validate.toNumber('48.411%', 'x'), { value: 48.411, reason: null });
  assert.deepEqual(validate.toNumber('30%', 'x'), { value: 30, reason: null });
});

test('every known sentinel becomes null WITH the supplied reason', () => {
  for (const s of ['N/A', 'N/A%', 'undefined', 'undefined%', 'NaN%', 'null', 'high%']) {
    const r = validate.toNumber(s, 'ladder carries no usage');
    assert.equal(r.value, null, `${s} must not produce a number`);
    assert.equal(r.reason, 'ladder carries no usage', `${s} must carry a reason`);
  }
});

test('a sentinel never silently becomes zero', () => {
  // The whole point: 0 reads as "unused", null-with-reason reads as "not measured".
  assert.notEqual(validate.toNumber('N/A%', 'r').value, 0);
});

test('an unrecognised non-numeric string is an error, not a silent null', () => {
  assert.throws(() => validate.toNumber('probably high', 'r'), /unparseable/i);
});

test('REGRESSION: the alphabetical empty dataset is rejected', () => {
  // gen9championsvgc2026regmbbo3 returns 50 well-formed rank-ordered rows that
  // are the dex in alphabetical order with N/A in every metric column, plus
  // prose claiming the format "is currently led by Abomasnow". Complete,
  // confident and meaningless — the same shape as a stale slug.
  const rows = parse.parseUsageTable(fx('filler-index.md'));
  assert.equal(rows.length, 50);
  assert.equal(rows[0].species, 'Abomasnow');
  assert.throws(
    () => validate.assertNotFiller(rows, 'gen9championsvgc2026regmbbo3'),
    /empty dataset|alphabetical/i
  );
});

test('a real ranked table passes the filler guard despite N/A usage', () => {
  // The ladder table also has N/A in the usage column. What distinguishes it is
  // that it is NOT alphabetical and its other metrics are real.
  const rows = parse.parseUsageTable(fx('ranked-index.md'));
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'battledataregmbs3'));
});

test('a real tournament table passes the filler guard', () => {
  const rows = parse.parseUsageTable(fx('tournaments-index.md'));
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'championstournaments'));
});

test('alphabetical ordering with real metrics passes the filler guard', () => {
  // This pins the AND condition: real data in alphabetical order must NOT throw.
  // A small format could legitimately return too few Pokemon to violate alphabetical
  // order by chance, but rejecting real data would be worse than the bug this guard
  // exists to catch. The condition requires BOTH alphabetical AND sentinels, so a
  // violation of either must pass.
  const rows = [
    { rank: 1, species: 'Abomasnow', usageRaw: '35.59%', winRateRaw: '51.397%', recordRaw: '100-50' },
    { rank: 2, species: 'Blaziken', usageRaw: '28.12%', winRateRaw: '50.123%', recordRaw: '90-60' },
    { rank: 3, species: 'Charizard', usageRaw: '22.44%', winRateRaw: '48.567%', recordRaw: '80-70' },
  ];
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'test-format-alphabetical-real'));
});

test('non-alphabetical ordering with all sentinel metrics passes the filler guard', () => {
  // This pins the second half of the AND: real usage order (not alphabetical) with
  // all sentinels must also NOT throw, because one condition being false is enough.
  const rows = [
    { rank: 1, species: 'Kingambit', usageRaw: 'N/A%', winRateRaw: 'N/A%', recordRaw: 'N/A' },
    { rank: 2, species: 'Abomasnow', usageRaw: 'N/A%', winRateRaw: 'N/A%', recordRaw: 'N/A' },
    { rank: 3, species: 'Blaziken', usageRaw: 'N/A%', winRateRaw: 'N/A%', recordRaw: 'N/A' },
  ];
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'test-format-non-alphabetical-sentinels'));
});
