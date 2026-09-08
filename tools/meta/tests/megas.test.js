'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const megas = require('../megas');

test('Pikalytics and dex Mega naming convert both ways', () => {
  assert.equal(megas.pikaToDex('Raichu-Mega-Y'), 'Mega Raichu Y');
  assert.equal(megas.pikaToDex('Staraptor-Mega'), 'Mega Staraptor');
  assert.equal(megas.dexToPika('Mega Raichu Y'), 'Raichu-Mega-Y');
  assert.equal(megas.dexToPika('Mega Staraptor'), 'Staraptor-Mega');
});

test('a hyphenated non-Mega name is left alone', () => {
  // Floette-Eternal and Rotom-Wash must not be mangled by the -Mega- rule.
  assert.equal(megas.pikaToDex('Floette-Eternal'), 'Floette-Eternal');
  assert.equal(megas.pikaToDex('Rotom-Wash'), 'Rotom-Wash');
  assert.equal(megas.resolve('Rotom-Wash').isMega, false);
  assert.equal(megas.resolve('Rotom-Wash').base, 'Rotom-Wash');
});

test('REGRESSION: a Mega resolves to its base species and stone', () => {
  const r = megas.resolve('Raichu-Mega-Y');
  assert.equal(r.isMega, true);
  assert.equal(r.base, 'Raichu');
  assert.equal(r.stone, 'Raichunite Y');
  assert.equal(r.dexName, 'Mega Raichu Y');
});

test('REGRESSION: Staraptor-Mega resolves, the near-universal-Mega case', () => {
  const r = megas.resolve('Staraptor-Mega');
  assert.equal(r.base, 'Staraptor');
  assert.equal(r.stone, 'Staraptite');
});

test('X and Y variants resolve to different stones', () => {
  assert.equal(megas.resolve('Raichu-Mega-X').stone, 'Raichunite X');
  assert.equal(megas.resolve('Raichu-Mega-Y').stone, 'Raichunite Y');
});

test('an unknown Mega name throws rather than guessing a stone', () => {
  assert.throws(() => megas.resolve('Notamon-Mega'), /no Mega Stone/i);
});

// FIX 2(a): matching was case-sensitive on "-Mega", so any casing variant
// Pikalytics itself never uses but a caller might type (lowercase, all-caps)
// silently fell through to isMega:false and a direct fetch of the stub page.
test('REGRESSION: Mega name matching is case-insensitive', () => {
  const lower = megas.resolve('staraptor-mega');
  assert.equal(lower.isMega, true);
  assert.equal(lower.base, 'Staraptor');
  assert.equal(lower.stone, 'Staraptite');
  assert.equal(lower.dexName, 'Mega Staraptor', 'must resolve to the canonically-cased dex name');

  const upper = megas.resolve('RAICHU-MEGA-Y');
  assert.equal(upper.isMega, true);
  assert.equal(upper.base, 'Raichu');
  assert.equal(upper.stone, 'Raichunite Y');
  assert.equal(upper.dexName, 'Mega Raichu Y');

  const mixed = megas.resolve('Raichu-mega-y');
  assert.equal(mixed.stone, 'Raichunite Y');
});

// FIX 5: two verified re-vendor failure modes for the vm-loaded vendor file.
test('REGRESSION: loadLookups() names the file and says to re-vendor when it is missing', () => {
  const missing = path.join(os.tmpdir(), `meta-megas-test-missing-${Date.now()}.js`);
  assert.throws(() => megas.loadLookups(missing), (err) => {
    assert.match(err.message, /re-vendor/i);
    assert.ok(err.message.includes(missing), 'must name the path that was missing');
    return true;
  });
});

test('REGRESSION: loadLookups() rejects a const/let-declared vendor file instead of loading undefined tables silently', () => {
  // A re-vendor using `const`/ESM syntax never attaches to the vm context
  // this loader reads from — the module "loads clean" with both tables
  // undefined, and previously only failed later with a bare TypeError.
  const badFile = path.join(os.tmpdir(), `meta-megas-test-const-${Date.now()}.js`);
  fs.writeFileSync(badFile, 'const LOCK_ITEM_LOOKUP = {}; const MEGA_STONE_USER_LOOKUP = {};\n');
  try {
    assert.throws(() => megas.loadLookups(badFile), (err) => {
      assert.match(err.message, /const|let|missing or empty/i);
      assert.ok(err.message.includes(badFile), 'must name the vendored file');
      return true;
    });
  } finally {
    fs.unlinkSync(badFile);
  }
});

test('REGRESSION: loadLookups() rejects an empty-but-present LOCK_ITEM_LOOKUP the same way', () => {
  // var-declared but genuinely empty tables (e.g. a botched re-vendor) must
  // fail the same non-empty assertion, not just the const/let case.
  const emptyFile = path.join(os.tmpdir(), `meta-megas-test-empty-${Date.now()}.js`);
  fs.writeFileSync(emptyFile, 'var LOCK_ITEM_LOOKUP = {}; var MEGA_STONE_USER_LOOKUP = {};\n');
  try {
    assert.throws(() => megas.loadLookups(emptyFile), /missing or empty/i);
  } finally {
    fs.unlinkSync(emptyFile);
  }
});

test('loadLookups() with an override path does not disturb the real cached vendor lookups', () => {
  // Sanity check that the override path used for the failure-mode tests
  // above is a bypass, not a poisoned cache: the real vendor file must still
  // resolve real Pokemon correctly afterward.
  const r = megas.resolve('Staraptor-Mega');
  assert.equal(r.base, 'Staraptor');
});
