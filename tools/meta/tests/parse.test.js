'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parse = require('../parse');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('parseQuickInfo reads a real per-Pokemon header', () => {
  const q = parse.parseQuickInfo(fx('ranked-raichu.md'));
  assert.equal(q.formatCode, 'battledataregmbs3');
  assert.equal(q.winRate, '48.411%');
  assert.equal(q.record, '3527-3759-14');
  assert.equal(q.usage, 'N/A');
  assert.equal(q.dataDate, '2026-05');
});

test('parseQuickInfo returns sentinels verbatim rather than cleaning them', () => {
  // The Mega stub carries N/A for everything. Cleaning here would hide it from
  // the validator, which is the layer that must decide what a sentinel means.
  const q = parse.parseQuickInfo(fx('ranked-raichu-mega-y.md'));
  assert.equal(q.winRate, 'N/A');
  assert.equal(q.record, 'N/A');
});

test('parseFormatInfo reads the index header', () => {
  const f = parse.parseFormatInfo(fx('ranked-index.md'));
  assert.equal(f.code, 'battledataregmbs3');
  assert.match(f.label, /M-B S3/);
  assert.equal(f.dataDate, '2026-05');
});

test('parsePercentList reads the item distribution, Mega stones included', () => {
  const items = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Items');
  assert.equal(items[0].name, 'Raichunite Y');
  assert.equal(items[0].percentRaw, '60.5%');
  assert.equal(items[1].name, 'Raichunite X');
  assert.equal(items[1].percentRaw, '18.2%');
  assert.ok(items.length >= 5);
});

test('parsePercentList preserves undefined% rather than dropping the row', () => {
  // Dropping it would make a broken section look like an empty one.
  const mates = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Teammates');
  assert.ok(mates.length > 0);
  assert.ok(mates.every((m) => m.percentRaw === 'undefined%'));
});

test('parsePercentList returns an empty array for an absent section', () => {
  // Floette-Eternal legitimately has no Featured Teams; absence is not an error.
  assert.deepEqual(parse.parsePercentList(fx('ranked-raichu.md'), 'No Such Section'), []);
});

test('parseUsageTable reads the ranked index', () => {
  const rows = parse.parseUsageTable(fx('ranked-index.md'));
  assert.equal(rows.length, 50);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[0].species, 'Garchomp');
  assert.equal(rows[0].usageRaw, 'N/A%');       // ladder carries no usage
  assert.equal(rows[0].winRateRaw, '48.05%');
  assert.equal(rows[0].recordRaw, '10833-11714-41');
});

test('parseUsageTable reads real usage from the tournament index', () => {
  const rows = parse.parseUsageTable(fx('tournaments-index.md'));
  assert.equal(rows[0].species, 'Kingambit');
  assert.equal(rows[0].usageRaw, '35.59%');
  assert.equal(rows[0].winRateRaw, '51.397%');
});

test('parseCores: all three group sizes parse from the real M-B cores section, sizes derived from headings', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  assert.equal(out.reason, null);
  assert.deepEqual(out.groups.map((g) => g.size), [2, 3, 4]);
});

test('parseCores: species are split correctly from the comma-separated Core cell', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  const two = out.groups.find((g) => g.size === 2);
  assert.deepEqual(two.cores[0].species, ['Charizard-Mega-Y', 'Garchomp']);
  const three = out.groups.find((g) => g.size === 3);
  assert.deepEqual(three.cores[0].species, ['Charizard-Mega-Y', 'Garchomp', 'Kingambit']);
});

test('parseCores: team counts and usage come through as raw strings, untouched', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  const two = out.groups.find((g) => g.size === 2);
  assert.equal(two.cores[0].rank, 1);
  assert.equal(two.cores[0].teamsRaw, '2155');
  assert.equal(two.cores[0].usageRaw, '16.3%');
});

test('parseCores: real M-C fixture splits a Mega-named core member using Pikalytics\' own convention', () => {
  // Floette-Eternal-Mega must come through verbatim here — resolving it to
  // the dex form ("Mega Floette Eternal") is a job for whoever consumes this
  // against the dex, via megas.pikaToDex, never a parser-level transform.
  const out = parse.parseCores(fx('ranked-index-mc.md'));
  const three = out.groups.find((g) => g.size === 3);
  assert.deepEqual(three.cores[0].species, ['Floette-Eternal-Mega', 'Incineroar', 'Rillaboom']);
});

test('parseCores: a placeholder "no curated data yet" group is empty with a reason, not a throw', () => {
  const out = parse.parseCores(fx('filler-index.md'));
  assert.equal(out.reason, null);
  assert.deepEqual(out.groups.map((g) => g.size), [2, 3, 4]);
  for (const g of out.groups) {
    assert.deepEqual(g.cores, []);
    assert.match(g.reason, /no curated core data/);
  }
});

test('parseCores: a page with no Common Team Cores section yields an empty result with a reason, not a throw', () => {
  const out = parse.parseCores(fx('ranked-raichu.md'));
  assert.deepEqual(out.groups, []);
  assert.match(out.reason, /no "Common Team Cores" section/);
});

test('parseCores: a group whose heading parses but whose table row does not match must surface, not vanish', () => {
  const text = [
    '## Common Team Cores',
    '',
    '### 2-Pokemon Cores',
    '',
    '| Rank | Core | Teams | Usage |',
    '|------|------|-------|-------|',
    '| 1 | Charizard-Mega-Y, Garchomp | 2155 | 16.3% |',
    '| Charizard-Mega-Y, Garchomp | 2155 | 16.3% |',
    '',
    '## Recent Top Teams',
  ].join('\n');
  assert.throws(() => parse.parseCores(text), /did not match the expected/);
});
