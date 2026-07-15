const test = require('node:test');
const assert = require('node:assert/strict');
const { findMinimalBulkSpread, rankSpreadsByOverallSurvival, maximizeGenericBulk, categoryOf } = require('../optimize-bulk');

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

test('findMinimalBulkSpread also rejects a multi-hit move threat, not just the ranking mode', () => {
  // Real bug caught while adding the ranking mode: this guard originally
  // only existed in rankSpreadsByOverallSurvival, leaving
  // findMinimalBulkSpread free to silently treat a multi-hit move's
  // per-hit damage as if it were the whole move's total.
  assert.throws(() => findMinimalBulkSpread({
    defender: { species: 'Noivern', ability: 'Infiltrator', nature: 'Timid' },
    budget: 34,
    threats: [
      { attacker: { species: 'Mamoswine', preset: 'Sash Oblivious Offense' }, move: { name: 'Icicle Spear' } },
    ],
  }), /Multi-hit move/);
});

test('rankSpreadsByOverallSurvival treats every spread as equally (not) good against a real, completely unsolvable single threat', () => {
  // Corrected understanding, not the original expectation: an earlier draft
  // of this test asserted SpD should "win" here because it reduces
  // Sylveon's real Moonblast max roll by more than HP does (272 -> 260 vs.
  // only +4 HP of margin) — but that's exactly the mistake the user caught:
  // 0 remaining HP is 0 remaining HP no matter how badly the loss margin
  // looks, and this move is completely unsolvable within this budget
  // regardless of where the SP goes (even max feasible investment doesn't
  // come close). Once remainingHPFraction is correctly clamped to 0 for any
  // lethal-or-worse outcome, every (hp, df, sd) combo ties at
  // weightedRemainingHP = 0 here — there is genuinely no reason to prefer
  // one over another against this single already-lost matchup, and the
  // ranking should reflect that (not quietly prefer whichever reduces the
  // raw overkill number, which doesn't correspond to any real difference
  // in outcome).
  const result = rankSpreadsByOverallSurvival({
    defender: { species: 'Noivern', ability: 'Infiltrator', nature: 'Timid' },
    fixedSp: { sa: 32, sp: 30 },
    budget: 4,
    threats: [
      { attacker: { species: 'Sylveon', preset: 'Fairy Feather Offense' }, move: { name: 'Moonblast' } },
    ],
  });

  assert.equal(result.searchSd, true);
  assert.equal(result.searchDf, false);
  for (const w of result.winners) {
    assert.equal(w.detail[0].remainingHPFraction, 0);
    assert.equal(w.weightedRemainingHP, 0);
  }
  // Every valid (hp, df, sd) combo within budget should tie here — none is
  // actually better than another against an unsolvable single threat.
  assert.ok(result.winners.length > 1, 'expected multiple tied winners, not one arbitrarily "best" spread against an unsolvable threat');
});

test('rankSpreadsByOverallSurvival maximizes weighted remaining-HP across a mixed physical+special threat list, not just one matchup', () => {
  // A broader, more realistic check: give it several real threats spanning
  // both categories (some Noivern resists/is immune to by typing, one it's
  // weak to) and confirm the continuous per-threat remainingHPFraction is
  // computed sensibly across all of them, not just whichever is listed
  // first — immune/resisted matchups should show real positive remaining
  // HP fractions, and the unsolvable one should be clamped to exactly 0
  // (not some large negative "how badly it lost" number).
  const result = rankSpreadsByOverallSurvival({
    defender: { species: 'Noivern', ability: 'Infiltrator', nature: 'Timid' },
    fixedSp: { sa: 32, sp: 30 },
    budget: 4,
    threats: [
      // Ground vs Flying: immune regardless of spread.
      { attacker: { species: 'Excadrill', preset: 'Max Attack Sand Offense' }, move: { name: 'Earthquake' } },
      // Fighting vs Dragon/Flying: resisted (0.5x via Flying half).
      { attacker: { species: 'Sneasler', preset: 'Offensive White Herb Unburden' }, move: { name: 'Close Combat' } },
      // Fairy vs Dragon/Flying: 2x weak, real threat, unsolvable within this budget.
      { attacker: { species: 'Sylveon', preset: 'Fairy Feather Offense' }, move: { name: 'Moonblast' } },
    ],
  });

  assert.equal(result.totalThreats, 3);
  const winner = result.winners[0];
  const excadrill = winner.detail.find((t) => t.attacker === 'Excadrill');
  const sneasler = winner.detail.find((t) => t.attacker === 'Sneasler');
  const sylveon = winner.detail.find((t) => t.attacker === 'Sylveon');
  assert.equal(excadrill.remainingHPFraction, 1, 'immune matchup (0 damage) should show full remaining HP fraction');
  assert.ok(sneasler.remainingHPFraction > 0 && sneasler.remainingHPFraction < 1, 'resisted real matchup should survive with a real, partial margin');
  assert.equal(sylveon.remainingHPFraction, 0, 'unsolvable threat must clamp to exactly 0, not a negative overkill number');
});

test('rankSpreadsByOverallSurvival correctly weights the scoring formula (weightedRemainingHP matches manual recomputation from detail)', () => {
  // Direct math check, independent of any "does this change the real
  // winner" story: for whatever combo wins, weightedRemainingHP must equal
  // the weighted sum of each threat's own remainingHPFraction.
  const result = rankSpreadsByOverallSurvival({
    defender: { species: 'Klefki', ability: 'Prankster', nature: 'Bold' },
    budget: 17,
    threats: [
      { attacker: { species: 'Kingambit', preset: 'Black Glasses Offense' }, move: { name: 'Kowtow Cleave' }, weight: 100 },
      { attacker: { species: 'Sylveon', preset: 'Fairy Feather Offense' }, move: { name: 'Moonblast' }, weight: 1 },
    ],
  });

  const winner = result.winners[0];
  const recomputed = winner.detail.reduce((sum, t) => sum + t.weight * t.remainingHPFraction, 0);
  assert.ok(Math.abs(winner.weightedRemainingHP - recomputed) < 1e-9);
});

test('rankSpreadsByOverallSurvival: a real, verified shift in the winning spread when weight moves from equal to heavily favoring one threat', () => {
  // Klefki vs. Kingambit's Kowtow Cleave (physical) and Sylveon's Moonblast
  // (special) — both real, both meaningfully sensitive to investment
  // within this budget (neither trivially safe nor unsolvable, unlike the
  // Aegislash-Shield case where huge base Def/SpD make almost everything
  // trivially survivable regardless of spread). Confirmed directly via the
  // function before writing this test: unweighted, the true optimum is
  // 17 HP / 0 Def / 0 SpD (HP is dual-purpose and wins outright here);
  // weighting Kowtow Cleave 100x shifts the real winner to 4 HP / 13 Def /
  // 0 SpD, correctly prioritizing the heavily-weighted threat's own
  // improvement over the unweighted one's.
  function winnerFor(weightKowtow) {
    const result = rankSpreadsByOverallSurvival({
      defender: { species: 'Klefki', ability: 'Prankster', nature: 'Bold' },
      budget: 17,
      threats: [
        { attacker: { species: 'Kingambit', preset: 'Black Glasses Offense' }, move: { name: 'Kowtow Cleave' }, weight: weightKowtow },
        { attacker: { species: 'Sylveon', preset: 'Fairy Feather Offense' }, move: { name: 'Moonblast' }, weight: 1 },
      ],
    });
    return result.winners[0];
  }

  const equalWeight = winnerFor(1);
  assert.equal(equalWeight.hp, 17);
  assert.equal(equalWeight.df, 0);
  assert.equal(equalWeight.sd, 0);

  const kowtowWeighted = winnerFor(100);
  assert.equal(kowtowWeighted.hp, 4);
  assert.equal(kowtowWeighted.df, 13);
  assert.equal(kowtowWeighted.sd, 0);
});

test('rankSpreadsByOverallSurvival defaults every threat to weight 1 (backward compatible, unweighted = equal vote)', () => {
  const result = rankSpreadsByOverallSurvival({
    defender: { species: 'Noivern', ability: 'Infiltrator', nature: 'Timid' },
    fixedSp: { sa: 32, sp: 30 },
    budget: 4,
    threats: [
      { attacker: { species: 'Excadrill', preset: 'Max Attack Sand Offense' }, move: { name: 'Earthquake' } },
      { attacker: { species: 'Sneasler', preset: 'Offensive White Herb Unburden' }, move: { name: 'Close Combat' } },
    ],
  });
  assert.equal(result.totalWeight, 2);
});

test('rankSpreadsByOverallSurvival rejects a multi-hit move with a clear error, since per-combo damage would be per-hit only', () => {
  assert.throws(() => rankSpreadsByOverallSurvival({
    defender: { species: 'Noivern', ability: 'Infiltrator', nature: 'Timid' },
    budget: 4,
    threats: [
      { attacker: { species: 'Mamoswine', preset: 'Sash Oblivious Offense' }, move: { name: 'Icicle Spear' } },
    ],
  }), /Multi-hit move/);
});

test('maximizeGenericBulk (move-agnostic, downgraded-status estimate) puts everything into HP for Aegislash-Shield, matching its asymmetric base stats', () => {
  // No move/attacker involved at all — purely base-stat-shape driven. Real
  // output confirmed before writing this test: with base Def already huge
  // (150) and base HP comparatively low (60), the danger-minimizing split
  // dumps the entire budget into HP, consistent with (though independently
  // derived from) findMinimalBulkSpread's real, threat-based finding for
  // the same Pokemon (24 HP/1 Def against actual Kowtow Cleave) — the two
  // methods agreeing here is expected since Aegislash's stat asymmetry is
  // extreme enough that both the crude proxy and the real threat search
  // land in the same neighborhood, not proof the proxy is generally reliable.
  const result = maximizeGenericBulk({
    defender: { species: 'Aegislash-Shield', nature: 'Impish' },
    fixedSp: { sd: 2 },
    budget: 34,
  });

  assert.equal(result.best.hp, 32);
  assert.equal(result.best.df, 0);
});

test('maximizeGenericBulk requires no attacker/move data at all — just base stats, nature, and budget', () => {
  const result = maximizeGenericBulk({
    defender: { species: 'Noivern', nature: 'Timid' },
    fixedSp: { sa: 32, sp: 30 },
    budget: 4,
  });

  assert.equal(result.best.total, 4);
  assert.ok(result.best.HP > 0 && result.best.Def > 0 && result.best.SpD > 0);
});
