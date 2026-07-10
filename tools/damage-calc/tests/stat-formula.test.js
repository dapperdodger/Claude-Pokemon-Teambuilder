const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStat, computeHP } = require('../stat-formula');

test('computeStat: Garchomp base 130 Attack, 0 SP, neutral nature', () => {
  // floor(((floor((130*2+31)*50/100)+5)+0)*1.0)
  // = floor(((floor(291*0.5)+5))*1) = floor((145+5)) = 150
  assert.equal(computeStat(130, 0, 1.0), 150);
});

test('computeStat: Gholdengo base 133 Sp.Atk, 32 SP (max), Modest (+10%)', () => {
  // floor(((floor((133*2+31)*50/100)+5)+32)*1.1)
  // = floor(((floor(297*0.5)+5)+32)*1.1) = floor(((148+5)+32)*1.1) = floor(185*1.1) = floor(203.5) = 203
  assert.equal(computeStat(133, 32, 1.1), 203);
});

test('computeStat: Garchomp base 102 Speed, 0 SP, neutral nature', () => {
  // floor(((floor((102*2+31)*50/100)+5)+0)*1.0)
  // = floor(((floor(235*0.5)+5))*1) = floor((117+5)) = 122
  assert.equal(computeStat(102, 0, 1.0), 122);
});

test('computeHP: Garchomp base 108 HP, 0 SP', () => {
  // floor((108*2+31)*50/100)+50+10+0 = floor(247*0.5)+60 = 123+60 = 183
  assert.equal(computeHP(108, 0), 183);
});

test('computeHP: Gholdengo base 87 HP, 0 SP', () => {
  // floor((87*2+31)*50/100)+50+10+0 = floor(205*0.5)+60 = 102+60 = 162
  assert.equal(computeHP(87, 0), 162);
});
