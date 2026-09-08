const test = require('node:test');
const assert = require('node:assert/strict');
const { getLearnsets } = require('../load-learnsets');

test('vendored learnsets load and contain the Champions roster', () => {
  const L = getLearnsets();
  assert.ok(Object.keys(L).length > 200, 'expected 200+ species entries');
  assert.ok(L.altaria, 'altaria should be present');
  assert.ok(L.altaria.learnset, 'entries carry a .learnset map');
});

test('getLearnsets is a cached singleton', () => {
  assert.equal(getLearnsets(), getLearnsets());
});
