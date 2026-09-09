'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fk = require('../format-knowledge');
const meta = require('../meta');
const formats = require('../formats');

const FIXTURES = path.join(__dirname, 'fixtures');
const rankedIndex = fs.readFileSync(path.join(FIXTURES, 'ranked-index.md'), 'utf8');

function usageFixture() {
  const describe = formats.describe(rankedIndex, 'battledataregmbs3');
  return meta.usageFromText(rankedIndex, { describe });
}

test('speedTiers: every tier carries a real base Speed from the dex', () => {
  const out = fk.speedTiers(usageFixture(), { top: 10 });
  assert.ok(out.tiers.length > 0);
  for (const t of out.tiers) {
    assert.equal(typeof t.baseSpeed, 'number');
    assert.ok(t.baseSpeed > 0, `${t.species} has base Speed ${t.baseSpeed}`);
  }
});

test('speedTiers: sorted fastest first', () => {
  const out = fk.speedTiers(usageFixture(), { top: 20 });
  for (let i = 1; i < out.tiers.length; i++) {
    assert.ok(out.tiers[i - 1].baseSpeed >= out.tiers[i].baseSpeed);
  }
});

test('speedTiers: reports Scarf and Tailwind thresholds per entry', () => {
  const out = fk.speedTiers(usageFixture(), { top: 5 });
  for (const t of out.tiers) {
    assert.equal(t.scarfed, Math.floor(t.baseSpeed * 1.5));
    assert.equal(t.tailwind, t.baseSpeed * 2);
  }
});

test('speedTiers: a species the dex cannot resolve is reported, never dropped silently', () => {
  const fake = { format: 'x', regulation: 'M-B', rows: [{ rank: 1, species: 'Notarealmon', usage: 9 }] };
  const out = fk.speedTiers(fake, { top: 5 });
  assert.deepEqual(out.tiers, []);
  assert.deepEqual(out.unresolved, ['Notarealmon']);
});

test('speedTiers: honours top and never exceeds it', () => {
  const out = fk.speedTiers(usageFixture(), { top: 3 });
  assert.ok(out.tiers.length + out.unresolved.length <= 3);
});

test('speedTiers: carries the format and regulation through from the usage result', () => {
  const u = usageFixture();
  const out = fk.speedTiers(u, { top: 5 });
  assert.equal(out.format, u.format);
  assert.equal(out.regulation, u.regulation);
});
