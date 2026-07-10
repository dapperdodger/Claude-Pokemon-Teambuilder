const test = require('node:test');
const assert = require('node:assert/strict');
const { getVendor } = require('../load-vendor');

test('vendored files load without throwing and expose Champions data', () => {
  const vendor = getVendor();

  assert.ok(vendor.POKEDEX_CHAMPIONS, 'POKEDEX_CHAMPIONS should be defined');
  assert.ok(vendor.POKEDEX_CHAMPIONS.Garchomp, 'Garchomp should be in POKEDEX_CHAMPIONS');
  assert.equal(vendor.POKEDEX_CHAMPIONS.Garchomp.bs.hp, 108);
  assert.equal(vendor.POKEDEX_CHAMPIONS.Garchomp.bs.at, 130);
  assert.equal(vendor.POKEDEX_CHAMPIONS.Garchomp.bs.sp, 102);
  assert.equal(vendor.POKEDEX_CHAMPIONS.Garchomp.t1, 'Dragon');
  assert.equal(vendor.POKEDEX_CHAMPIONS.Garchomp.t2, 'Ground');

  assert.ok(vendor.POKEDEX_ZA_NATDEX, 'POKEDEX_ZA_NATDEX (fuller dex, for error messages only) should be defined');
  assert.ok(vendor.POKEDEX_ZA_NATDEX.Miraidon, 'Miraidon should be in the full natdex even though not Champions-legal');
  assert.ok(!vendor.POKEDEX_CHAMPIONS.Miraidon, 'Miraidon should NOT be in the Champions-curated roster (confirms the two dexes are genuinely different sizes)');

  assert.ok(vendor.MOVES_CHAMPIONS, 'MOVES_CHAMPIONS should be defined');
  assert.ok(vendor.MOVES_CHAMPIONS['Rock Slide'], 'Rock Slide should be in MOVES_CHAMPIONS');
  assert.equal(vendor.MOVES_CHAMPIONS['Rock Slide'].bp, 75);
  assert.equal(vendor.MOVES_CHAMPIONS['Rock Slide'].type, 'Rock');

  assert.ok(vendor.SETDEX_GEN10, 'SETDEX_GEN10 (preset builds) should be defined');
  assert.ok(vendor.SETDEX_GEN10.Garchomp, 'Garchomp should have at least one preset');

  assert.equal(typeof vendor.GET_DAMAGE_SV, 'function', 'GET_DAMAGE_SV should be a function');
});

test('side.js exports the Side constructor via plain require (real module.exports, unaffected by the vm/global question)', () => {
  const { Side } = require('../vendor/side.js');
  assert.equal(typeof Side, 'function', 'Side should be a function');
  const side = new Side('vgc', 'none', 'none', false, false, 0, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false);
  assert.equal(side.format, 'vgc');
  assert.equal(side.isTailwind, false);
});
