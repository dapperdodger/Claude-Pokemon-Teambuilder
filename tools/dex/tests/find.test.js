'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const dex = require('../dex');

test('find: type filter returns only species carrying that type', () => {
  const r = dex.find({ types: ['Fire'] });
  assert.ok(r.count > 0, 'expected at least one Fire type in the roster');
  for (const m of r.results) {
    assert.ok(m.types.includes('Fire'), `${m.name} has types ${m.types.join('/')} but was returned for Fire`);
  }
});

test('find: two types are an AND, not an OR', () => {
  const r = dex.find({ types: ['Fire', 'Dark'] });
  for (const m of r.results) {
    assert.ok(m.types.includes('Fire') && m.types.includes('Dark'), `${m.name} is not Fire AND Dark`);
  }
  const fireOnly = dex.find({ types: ['Fire'] });
  assert.ok(r.count < fireOnly.count, 'AND of two types must be narrower than one type');
});

test('find: min stat filter uses base Speed, not Stat Points', () => {
  const r = dex.find({ min: { spe: 120 } });
  assert.ok(r.count > 0);
  for (const m of r.results) {
    assert.ok(m.baseStats.spe >= 120, `${m.name} has base Speed ${m.baseStats.spe}, below the 120 floor`);
  }
});

test('find: max stat filter is inclusive and excludes above the bound', () => {
  const r = dex.find({ max: { spe: 30 } });
  assert.ok(r.count > 0, 'expected slow Pokemon in the roster');
  for (const m of r.results) assert.ok(m.baseStats.spe <= 30);
});

test('find: results expose long stat names, never the vendor keys', () => {
  const r = dex.find({ max: { spe: 30 }, limit: 1 });
  const keys = Object.keys(r.results[0].baseStats).sort();
  assert.deepEqual(keys, ['atk', 'def', 'hp', 'spa', 'spd', 'spe']);
});

test('find: learns filter returns only species whose pool has the move', () => {
  const r = dex.find({ learns: ['Trick Room'] });
  assert.ok(r.count > 0);
  for (const m of r.results) {
    const v = dex.learnset(m.name, 'Trick Room');
    assert.equal(v.verdict, 'legal', `${m.name} was returned for Trick Room but learnset() says ${v.verdict}`);
  }
});

test('find: two learns filters are an AND', () => {
  const both = dex.find({ learns: ['Protect', 'Trick Room'] });
  const one = dex.find({ learns: ['Trick Room'] });
  assert.ok(both.count <= one.count);
  for (const m of both.results) {
    assert.equal(dex.learnset(m.name, 'Protect').verdict, 'legal');
    assert.equal(dex.learnset(m.name, 'Trick Room').verdict, 'legal');
  }
});

test('find: an unknown move throws rather than returning an empty list', () => {
  assert.throws(
    () => dex.find({ learns: ['Nonexistent Fake Move'] }),
    /not present anywhere in the vendored learnset table/,
    'an unknown move must fail loudly — an empty result set reads as "nothing learns it"'
  );
});

test('find: reports species it could not check against the learnset table', () => {
  const r = dex.find({ learns: ['Protect'] });
  assert.ok(Array.isArray(r.notInLearnsetTable));
});

test('find: a Mega reports the base species its learnset came from', () => {
  const r = dex.find({ learns: ['Protect'] });
  const mega = r.results.find((m) => m.isMega);
  if (mega) {
    assert.equal(typeof mega.learnsetFrom, 'string');
    assert.ok(mega.learnsetFrom.length > 0);
  }
});

test('find: an ability filter always carries the single-slot caveat', () => {
  const r = dex.find({ ability: 'Prankster' });
  assert.ok(
    r.caveats.some((c) => /one ability per species/i.test(c)),
    'an ability filter must always warn that the roster stores a single ability slot'
  );
});

test('find: sort orders by the named stat, descending', () => {
  const r = dex.find({ types: ['Fire'], sort: 'spe' });
  for (let i = 1; i < r.results.length; i++) {
    assert.ok(r.results[i - 1].baseStats.spe >= r.results[i].baseStats.spe);
  }
});

test('find: limit caps results but count reports the true total', () => {
  const all = dex.find({ types: ['Water'] });
  const capped = dex.find({ types: ['Water'], limit: 3 });
  assert.equal(capped.results.length, 3);
  assert.equal(capped.count, all.count, 'count must be the true match total, not the truncated length');
});

test('find: no filters returns the whole roster', () => {
  const { getVendor } = require('../../damage-calc/load-vendor');
  const r = dex.find({});
  assert.equal(r.count, Object.keys(getVendor().POKEDEX_CHAMPIONS).length);
});
