'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const meta = require('../meta');
const formats = require('../formats');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');
const rankedCaps = () => formats.detectCapabilities(fx('ranked-index.md'));

test('REGRESSION: usage from the ladder is null WITH A REASON, never 0', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.equal(out.usage.value, null);
  assert.match(out.usage.reason, /no usage/i);
  assert.notEqual(out.usage.value, 0);
});

test('win rate and record survive as real numbers', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.equal(out.winRate.value, 48.411);
  assert.equal(out.record, '3527-3759-14');
});

test('REGRESSION: a Mega gets base stats plus its stone share', () => {
  // Raichu is 60.5% Raichunite Y, so Mega Raichu Y is 60.5% of all Raichu.
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3',
    capabilities: rankedCaps(),
    megaInfo: { isMega: true, base: 'Raichu', stone: 'Raichunite Y', dexName: 'Mega Raichu Y' },
  });
  assert.equal(out.megaShare.stone, 'Raichunite Y');
  assert.equal(out.megaShare.ofSpecies, 60.5);
  assert.equal(out.resolvedFrom, 'Raichu');
  assert.match(out.megaShare.basis, /item distribution/i);
});

test('REGRESSION: Common Teammates undefined% never becomes a number', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.ok(out.teammates.every((t) => t.percent.value === null));
  assert.ok(out.teammates.every((t) => /upstream/i.test(t.percent.reason)));
});

test('REGRESSION: an off-regulation format is flagged not-current', () => {
  const out = meta.usageFromText(fx('ranked-index.md'), {
    describe: { code: 'x', label: 'l', regulation: 'M-A', current: false, capabilities: rankedCaps() },
  });
  assert.equal(out.current, false);
  assert.ok(out.warnings.some((w) => /previous regulation|not current/i.test(w)));
});
