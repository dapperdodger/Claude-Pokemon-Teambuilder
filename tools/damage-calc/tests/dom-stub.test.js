const test = require('node:test');
const assert = require('node:assert/strict');
const { deepExtend } = require('../dom-stub');

test('deepExtend: scalar overwrite (baseline)', () => {
  const target = { a: { x: 1 } };
  const result = deepExtend(true, target, { a: { x: 2 } });
  assert.deepEqual(result, { a: { x: 2 } });
});

test('deepExtend: array index-wise merge (source shorter than target)', () => {
  const target = { formes: ['A', 'B'] };
  const result = deepExtend(true, target, { formes: ['C'] });
  // Index 0 overwritten to 'C', index 1 'B' preserved from target.
  assert.deepEqual(result.formes, ['C', 'B']);
  // Explicitly rule out the old broken whole-replace behavior...
  assert.notDeepEqual(result.formes, ['C']);
  // ...and rule out naive concatenation.
  assert.notDeepEqual(result.formes, ['A', 'B', 'C']);
});

test('deepExtend: array index-wise merge (source longer than target)', () => {
  const target = { formes: ['A'] };
  const result = deepExtend(true, target, { formes: ['B', 'C'] });
  assert.deepEqual(result.formes, ['B', 'C']);
});

test('deepExtend: regression - real vendored Zygarde formes array across generation layers', () => {
  const { getVendor } = require('../load-vendor');
  const vendor = getVendor();

  assert.ok(!vendor.POKEDEX_CHAMPIONS.Zygarde, 'Zygarde is not in the Champions-curated roster; use the fuller natdex instead');
  assert.ok(vendor.POKEDEX_ZA_NATDEX.Zygarde, 'Zygarde should be present in POKEDEX_ZA_NATDEX');
  assert.deepEqual(
    vendor.POKEDEX_ZA_NATDEX.Zygarde.formes,
    ['Zygarde', 'Zygarde-Complete', 'Mega Zygarde'],
    'Zygarde.formes should accumulate correctly across the layered $.extend(true, ...) generation objects'
  );
});
