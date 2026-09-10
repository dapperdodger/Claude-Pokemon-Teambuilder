'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fk = require('../format-knowledge');
const meta = require('../meta');
const formats = require('../formats');
const parse = require('../parse');

const FIXTURES = path.join(__dirname, 'fixtures');
const rankedIndex = fs.readFileSync(path.join(FIXTURES, 'ranked-index.md'), 'utf8');

function coresFixture(file) {
  return parse.parseCores(fs.readFileSync(path.join(FIXTURES, file), 'utf8'));
}

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

function monFixture(file, name) {
  const text = fs.readFileSync(path.join(FIXTURES, file), 'utf8');
  return meta.monFromText(text, { lookupName: name, capabilities: { usage: true, winRate: true } });
}

test('distribution: counts how many of the field carry a move', () => {
  const entries = [
    { species: 'Incineroar', usage: 40, mon: monFixture('ranked-incineroar.md', 'Incineroar') },
    { species: 'Whimsicott', usage: 20, mon: monFixture('ranked-whimsicott.md', 'Whimsicott') },
  ];
  const out = fk.distribution(entries, { move: 'Fake Out' });
  assert.equal(out.kind, 'move');
  assert.equal(out.subject, 'Fake Out');
  assert.equal(out.of, 2);
  assert.equal(typeof out.carrying, 'number');
  assert.ok(out.carrying >= 0 && out.carrying <= 2);
  assert.equal(out.share, Math.round((out.carrying / out.of) * 1000) / 10);
});

test('distribution: every row says whether that species carries it, and at what rate', () => {
  const entries = [
    { species: 'Whimsicott', usage: 20, mon: monFixture('ranked-whimsicott.md', 'Whimsicott') },
  ];
  const out = fk.distribution(entries, { ability: 'Prankster' });
  assert.equal(out.kind, 'ability');
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].species, 'Whimsicott');
  assert.equal(typeof out.rows[0].carries, 'boolean');
});

test('distribution: requires exactly one of move or ability', () => {
  assert.throws(() => fk.distribution([], {}), /exactly one of/);
  assert.throws(() => fk.distribution([], { move: 'a', ability: 'b' }), /exactly one of/);
});

test('distribution: matching is case- and punctuation-insensitive', () => {
  const entries = [
    { species: 'Whimsicott', usage: 20, mon: monFixture('ranked-whimsicott.md', 'Whimsicott') },
  ];
  const loose = fk.distribution(entries, { ability: 'prankster' });
  const exact = fk.distribution(entries, { ability: 'Prankster' });
  assert.equal(loose.carrying, exact.carrying);
});

test('cores: all three group sizes come through, carrying format and regulation from opts', () => {
  const parsed = coresFixture('ranked-index.md');
  const out = fk.cores(parsed, { format: 'battledataregmbs3', regulation: 'M-B', top: 5 });
  assert.equal(out.format, 'battledataregmbs3');
  assert.equal(out.regulation, 'M-B');
  assert.equal(out.reason, null);
  assert.deepEqual(out.groups.map((g) => g.size), [2, 3, 4]);
});

test('cores: usage and teams arrive as validate.toNumber envelopes, not bare numbers', () => {
  const parsed = coresFixture('ranked-index.md');
  const out = fk.cores(parsed, { format: 'x', regulation: 'M-B', top: 5 });
  const two = out.groups.find((g) => g.size === 2);
  assert.equal(two.cores[0].usage.value, 16.3);
  assert.equal(two.cores[0].usage.reason, null);
  assert.equal(two.cores[0].teams.value, 2155);
  assert.deepEqual(two.cores[0].species, ['Charizard-Mega-Y', 'Garchomp']);
});

test('cores: --top bounds each group\'s own list', () => {
  const parsed = coresFixture('ranked-index.md');
  const out = fk.cores(parsed, { format: 'x', regulation: 'M-B', top: 2 });
  for (const g of out.groups) {
    assert.ok(g.cores.length <= 2, `group ${g.size} has ${g.cores.length} cores, expected <= 2`);
  }
});

test('cores: a missing/empty cores section yields an empty result with a reason, not a throw', () => {
  const parsed = coresFixture('filler-index.md');
  const out = fk.cores(parsed, { format: 'x', regulation: 'M-B', top: 5 });
  assert.equal(out.reason, null);
  assert.ok(out.groups.length > 0);
  for (const g of out.groups) {
    assert.deepEqual(g.cores, []);
    assert.match(g.reason, /no curated core data/);
  }
});

test('cores: a page with no cores section at all yields an empty result with a top-level reason', () => {
  const parsed = { groups: [], reason: 'no "Common Team Cores" section in this page' };
  const out = fk.cores(parsed, { format: 'x', regulation: 'M-B', top: 5 });
  assert.deepEqual(out.groups, []);
  assert.match(out.reason, /no "Common Team Cores" section/);
});

test('render: emits a Common team cores section with real data and no [object Object]', () => {
  const u = usageFixture();
  const tiers = fk.speedTiers(u, { top: 5 });
  const distributions = [fk.distribution([], { move: 'Fake Out' })];
  const cores = fk.cores(coresFixture('ranked-index.md'), { format: u.format, regulation: u.regulation, top: 5 });
  const body = fk.render(tiers, distributions, cores);
  assert.match(body, /## Common team cores/i);
  assert.match(body, /Charizard-Mega-Y, Garchomp/);
  assert.ok(!body.includes('[object Object]'), 'render() must not stringify the {value, reason} envelope');
});
