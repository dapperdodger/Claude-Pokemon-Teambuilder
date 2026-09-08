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
