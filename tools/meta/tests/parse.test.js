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
