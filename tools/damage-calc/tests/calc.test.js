const test = require('node:test');
const assert = require('node:assert/strict');
const { runDamageCalc } = require('../calc');

test('Modest 32-SP-SpA Life Orb Gholdengo Make It Rain vs neutral 0-SP Garchomp', () => {
  // Real, verified data (not defaults): Gholdengo base SpA 133, Modest nature
  // (+10% SpA), 32 Stat Points in SpA (the max). Garchomp base HP 108 / SpD 85,
  // Serious (neutral) nature, 0 SP anywhere (bare base stats). This
  // specifically exercises non-default SP allocation and a boosting nature,
  // not base-stat defaults.
  //
  // Item is Life Orb, not Choice Specs — Choice Specs (and Choice Band,
  // Assault Vest, and several other historically-standard items) is
  // confirmed NOT currently available in Pokemon Champions as of this
  // session's live verification (Victory Road VGC community source,
  // cross-checked against ITEMS_CHAMPIONS itself). Life Orb IS confirmed
  // present in ITEMS_CHAMPIONS (added in the Regulation M-B item-pool
  // expansion) and is a universal (not move-category-locked) 1.3x damage
  // boost, so it still exercises "does an item modifier apply" without
  // using an item this format doesn't actually have.
  const result = runDamageCalc({
    attacker: {
      species: 'Gholdengo',
      ability: 'Good as Gold',
      item: 'Life Orb',
      nature: 'Modest',
      sp: { hp: 0, at: 0, df: 0, sa: 32, sd: 0, sp: 0 },
    },
    defender: {
      species: 'Garchomp',
      ability: 'Rough Skin',
      item: '',
      nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Make It Rain' },
    field: {},
  });

  // Sanity bounds, not a bit-exact assertion yet (Task 6 cross-validates
  // exact numbers against the real NCP calculator). Steel vs Dragon/Ground
  // is neutral (1x) per reference/vgc_type_chart_reference.md, Life Orb
  // is a 1.3x boost, so this should be a substantial hit but not a OHKO
  // against Garchomp's ~183 HP (0 SP) — assert plausible bounds only.
  assert.ok(result.min > 0, 'min damage should be positive');
  assert.ok(result.max >= result.min, 'max should be >= min');
  assert.ok(result.max < 1000, 'max damage should be a sane double-digit-to-low-triple-digit number, not garbage');
  assert.equal(result.matchedRecords.attacker.species, 'Gholdengo');
  assert.equal(result.matchedRecords.defender.species, 'Garchomp');
  assert.equal(result.matchedRecords.move.name, 'Make It Rain');
  assert.equal(result.matchedRecords.move.bp, 120);
});

test('runDamageCalc throws a clear error for a misspelled Pokemon name', () => {
  assert.throws(() => runDamageCalc({
    attacker: { species: 'Garchmp', ability: 'Rough Skin', item: '', nature: 'Serious', sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 } },
    defender: { species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious', sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 } },
    move: { name: 'Rock Slide' },
    field: {},
  }), /Unknown Pokemon: "Garchmp"/);
});

test('runDamageCalc: attacker built entirely from a preset (no explicit ability/item/nature/sp)', () => {
  // Garchomp is confirmed (design research) to have at least one entry in
  // vendored SETDEX_GEN10 - use its first available preset by name rather
  // than hardcoding a specific set name here, since presets can be renamed/
  // added/removed on re-vendor and this test shouldn't be tied to one
  // exact name persisting forever. Use lookupPreset(species) (no set name)
  // to list available names, matching lookup.test.js's own pattern.
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');
  const result = runDamageCalc({
    attacker: { species: 'Garchomp', preset: presetNames[0] },
    defender: {
      species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Earthquake' },
    field: {},
  });
  assert.ok(result.min > 0);
  assert.equal(result.matchedRecords.attacker.presetUsed, presetNames[0]);
});

test('runDamageCalc: explicit fields override a preset\'s defaults', () => {
  const { lookupPreset } = require('../lookup');
  const presetNames = lookupPreset('Garchomp');
  const preset = lookupPreset('Garchomp', presetNames[0]);
  const overriddenNature = preset.nature === 'Jolly' ? 'Adamant' : 'Jolly';
  const result = runDamageCalc({
    attacker: { species: 'Garchomp', preset: presetNames[0], nature: overriddenNature },
    defender: {
      species: 'Gholdengo', ability: 'Good as Gold', item: '', nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Earthquake' },
    field: {},
  });
  // Direct, deterministic check that the explicit override actually won
  // over the preset's own nature - not an indirect/weak stat-based guess.
  assert.equal(result.matchedRecords.attacker.nature, overriddenNature);
  assert.notEqual(result.matchedRecords.attacker.nature, preset.nature);
});

test('runDamageCalc: itemChampionsLegal correctly flags a confirmed-unavailable item as false, a confirmed-available one as true', () => {
  // Choice Specs is confirmed NOT currently available in Pokemon Champions
  // (verified this session via live search, cross-checked against
  // ITEMS_CHAMPIONS) - used here deliberately as a NEGATIVE test case for
  // the legality flag, not as an example of a usable build. Life Orb is
  // confirmed available (added in the Regulation M-B item-pool expansion).
  const result = runDamageCalc({
    attacker: {
      species: 'Gholdengo', ability: 'Good as Gold', item: 'Choice Specs', nature: 'Modest',
      sp: { hp: 0, at: 0, df: 0, sa: 32, sd: 0, sp: 0 },
    },
    defender: {
      species: 'Garchomp', ability: 'Rough Skin', item: 'Life Orb', nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Make It Rain' },
    field: {},
  });
  assert.equal(result.matchedRecords.attacker.itemChampionsLegal, false);
  assert.equal(result.matchedRecords.defender.itemChampionsLegal, true);
});

test('runDamageCalc: Parental Bond (Mega Kangaskhan) produces a real finite min/max, not NaN', () => {
  // Regression test for a bug where any Parental Bond attack made
  // runDamageCalc return NaN/NaN silently. Parental Bond makes the
  // vendored engine's GET_DAMAGE_SV return a NESTED damage array (one flat
  // 16-roll array per hit) instead of the ordinary flat 16-roll array —
  // see calc.js's runDamageCalc for the full explanation. Spreading a
  // nested array into Math.min/Math.max coerces each sub-array to NaN via
  // ToNumber, which is exactly what happened before the fix.
  //
  // Real, verified data (via getVendor().POKEDEX_CHAMPIONS['Mega Kangaskhan']):
  // base Attack 125, ability "Parental Bond" (its sole, fixed ability, an
  // isAlternateForme entry off base Kangaskhan). Double-Edge is an
  // ordinary single-hit physical move (no hitRange in MOVES_CHAMPIONS),
  // so this exercises Parental Bond turning an otherwise-single-hit move
  // into the nested-array case, not a move that's independently multi-hit
  // for its own reasons.
  const result = runDamageCalc({
    attacker: {
      species: 'Mega Kangaskhan',
      ability: 'Parental Bond',
      item: '',
      nature: 'Adamant',
      sp: { hp: 0, at: 32, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    defender: {
      species: 'Garchomp',
      ability: 'Rough Skin',
      item: '',
      nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: { name: 'Double-Edge' },
    field: {},
  });

  assert.ok(Number.isFinite(result.min), `min should be a finite number, got ${result.min}`);
  assert.ok(Number.isFinite(result.max), `max should be a finite number, got ${result.max}`);
  assert.ok(result.min > 0, 'min damage should be positive');
  assert.ok(result.max >= result.min, 'max should be >= min');
});
