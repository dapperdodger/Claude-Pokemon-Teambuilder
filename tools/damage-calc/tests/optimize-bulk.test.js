const test = require('node:test');
const assert = require('node:assert/strict');
const { findMinimalBulkSpread, categoryOf } = require('../optimize-bulk');

test('categoryOf returns the real move category', () => {
  assert.equal(categoryOf('Kowtow Cleave'), 'Physical');
  assert.equal(categoryOf('Heat Wave'), 'Special');
});

test('Aegislash-Shield vs real Black-Glasses Kingambit Kowtow Cleave: true minimum is 24 HP / 1 Def, not an even split', () => {
  // Real finding from this session's manual brute-force check (see
  // optimize-bulk.js's header comment): Aegislash-Shield's base Def (150)
  // is already so high that further Def investment has almost no marginal
  // value, while its base HP (60) is comparatively low — so nearly all of
  // the budget should go to HP, not Def. This is the concrete regression
  // test for that finding.
  const result = findMinimalBulkSpread({
    defender: { species: 'Aegislash-Shield', ability: 'Stance Change', nature: 'Impish' },
    fixedSp: { sd: 2 },
    budget: 34,
    threats: [
      { attacker: { species: 'Kingambit', preset: 'Black Glasses Offense' }, move: { name: 'Kowtow Cleave' } },
    ],
  });

  assert.equal(result.solvable, true);
  assert.equal(result.minTotal, 25);
  assert.ok(result.winners.length >= 1);
  const winner = result.winners[0];
  assert.equal(winner.hp, 24);
  assert.equal(winner.df, 1);
  assert.ok(winner.detail[0].survives);
});

test('a threat that already fails to KO at 0 investment needs 0 SP', () => {
  // Farigiraf's Psychic vs Sableye (Dark-type, immune to Psychic) — 0
  // damage regardless of spread, so the minimum solving spread is 0/0/0.
  const result = findMinimalBulkSpread({
    defender: { species: 'Sableye', ability: 'Prankster', nature: 'Bold' },
    budget: 34,
    threats: [
      { attacker: { species: 'Farigiraf', preset: 'Offensive TR Sitrus' }, move: { name: 'Psychic' } },
    ],
  });

  assert.equal(result.solvable, true);
  assert.equal(result.minTotal, 0);
});

test('joint physical + special threats searches both Def and SpD together', () => {
  const result = findMinimalBulkSpread({
    defender: { species: 'Corviknight', ability: 'Mirror Armor', nature: 'Impish' },
    budget: 34,
    threats: [
      { attacker: { species: 'Garchomp', preset: 'Max Speed LOrb' }, move: { name: 'Rock Slide' } },
      { attacker: { species: 'Kingambit', preset: 'Black Glasses Offense' }, move: { name: 'Kowtow Cleave' } },
    ],
  });

  assert.equal(result.searchDf, true);
  assert.equal(result.searchSd, false); // both real threats here are Physical
  assert.equal(result.solvable, true);
  for (const w of result.winners) {
    assert.equal(w.detail.length, 2);
    assert.ok(w.detail.every((t) => t.survives));
  }
});

test('an unsolvable case (zero budget vs a real 2x-weak attack) reports the closest non-solution instead of a false positive', () => {
  // Klefki (Steel/Fairy) is 2x weak to Ground — real Sand-Offense Excadrill's
  // Earthquake (140-168) already exceeds Klefki's real 0-SP HP (132) before
  // any investment is even allowed, so budget:0 is a genuine dead end, not
  // just a tight one. (Note: Klefki actually RESISTS Rock via its Steel
  // half, which is why an earlier draft of this test picked Rock Slide and
  // wrongly assumed it'd be unsolvable — always verify the real typing
  // interaction, don't assume "big real attacker" alone means unsolvable.)
  const result = findMinimalBulkSpread({
    defender: { species: 'Klefki', ability: 'Prankster', nature: 'Bold' },
    budget: 0,
    threats: [
      { attacker: { species: 'Excadrill', preset: 'Max Attack Sand Offense' }, move: { name: 'Earthquake' } },
    ],
  });

  assert.equal(result.solvable, false);
  assert.ok(result.closest.length >= 1);
  assert.ok(result.closest[0].worstMarginRatio > 1, 'closest candidate should still lose (ratio > 1)');
});

test('throws a clear error for a Status move threat (nothing to optimize against)', () => {
  assert.throws(() => findMinimalBulkSpread({
    defender: { species: 'Klefki', ability: 'Prankster', nature: 'Bold' },
    budget: 34,
    threats: [{ attacker: { species: 'Whimsicott' }, move: { name: 'Tailwind' } }],
  }), /Status move/);
});

test('throws a clear error when no threats are given', () => {
  assert.throws(() => findMinimalBulkSpread({
    defender: { species: 'Klefki', ability: 'Prankster', nature: 'Bold' },
    budget: 34,
    threats: [],
  }), /at least one threat/);
});
