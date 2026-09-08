'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
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
