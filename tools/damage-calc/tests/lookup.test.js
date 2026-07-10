const test = require('node:test');
const assert = require('node:assert/strict');
const { lookupSpecies, lookupMove, isKnownAbility, isKnownItem, lookupPreset } = require('../lookup');

test('lookupSpecies: finds Garchomp with correct base stats and types', () => {
  const g = lookupSpecies('Garchomp');
  assert.equal(g.t1, 'Dragon');
  assert.equal(g.t2, 'Ground');
  assert.equal(g.bs.hp, 108);
  assert.equal(g.bs.at, 130);
  assert.equal(g.bs.sp, 102);
});

test('lookupSpecies: finds Gholdengo', () => {
  const g = lookupSpecies('Gholdengo');
  assert.equal(g.t1, 'Steel');
  assert.equal(g.t2, 'Ghost');
  assert.equal(g.bs.sa, 133);
});

test('lookupSpecies: throws "not in any vendored dex" for a total misspelling', () => {
  assert.throws(() => lookupSpecies('Garchmp'), /not found in any vendored dex/);
});

test('lookupSpecies: throws a DIFFERENT, more specific error for a real Pokemon that exists but is not Champions-legal', () => {
  // Miraidon is a real, correctly-spelled Pokemon (confirmed present in the
  // broader vendored natdex during design research) but is NOT in
  // POKEDEX_CHAMPIONS as of the vendored commit. This must not throw the
  // same generic message as a misspelling - the two failure modes are
  // different and the caller needs to know which one happened.
  assert.throws(() => lookupSpecies('Miraidon'), /exists in the broader dex.*not.*Champions-legal roster/);
  // NOTE: case-insensitive here. The brief's Step 1 test text used a
  // lowercase-only /verify via live search/, but the brief's own Step 3
  // error message capitalizes "Verify" because it starts a new sentence -
  // verified empirically that the literal lowercase regex does not match
  // the literal brief-specified message. Using /i preserves the intent
  // (that this phrase appears) without altering the safety-relevant
  // message wording from Step 3.
  assert.throws(() => lookupSpecies('Miraidon'), /verify via live search/i);
});

test('lookupMove: finds Rock Slide with correct power and type', () => {
  const m = lookupMove('Rock Slide');
  assert.equal(m.bp, 75);
  assert.equal(m.type, 'Rock');
  assert.equal(m.category, 'Physical');
  assert.equal(m.isSpread, true);
});

test('lookupMove: finds Make It Rain', () => {
  const m = lookupMove('Make It Rain');
  assert.equal(m.bp, 120);
  assert.equal(m.type, 'Steel');
  assert.equal(m.category, 'Special');
});

test('lookupMove: throws "not in any vendored dex" for a total misspelling', () => {
  assert.throws(() => lookupMove('Rock Slid'), /not found in any vendored dex/);
});

test('isKnownAbility: true for a real Champions-legal ability', () => {
  assert.equal(isKnownAbility('Rough Skin'), true);
});

test('isKnownAbility: false for a made-up name', () => {
  assert.equal(isKnownAbility('Rough Skinn'), false);
});

test('isKnownItem: true for a real item, false for a made-up one', () => {
  // NOTE: the brief's Step 1 text used 'Choice Specs' as the true-case
  // example. Verified empirically against the real vendored ITEMS_CHAMPIONS
  // array (tools/damage-calc/vendor/item_data.js) that "Choice Specs" (and
  // "Choice Band") are NOT present in it, while "Choice Scarf" is. Cross-
  // checked every item actually used across all SETDEX_GEN10 presets: all
  // are members of ITEMS_CHAMPIONS, confirming the array is internally
  // consistent and this is real vendored data, not a loader bug. Swapped
  // the true-case example to 'Choice Scarf' accordingly.
  assert.equal(isKnownItem('Choice Scarf'), true);
  assert.equal(isKnownItem('Choice Speks'), false);
});

test('lookupPreset: finds a real Garchomp preset with sps/nature/ability/item/moves', () => {
  const presets = lookupPreset('Garchomp'); // no set name -> list available set names
  assert.ok(Array.isArray(presets) && presets.length > 0, 'Garchomp should have at least one preset name');
  const preset = lookupPreset('Garchomp', presets[0]);
  assert.ok(preset.sps, 'preset should include an sps allocation');
  assert.ok(preset.nature, 'preset should include a nature');
  assert.ok(Array.isArray(preset.moves), 'preset should include a moves array');
  // NOTE: 'ability' is intentionally NOT asserted on the Garchomp preset
  // above. Empirically, most vendored SETDEX_GEN10 presets (98 of 123,
  // including both of Garchomp's: "Scarf Offense" and "Max Speed LOrb")
  // omit an explicit ability field in the vendored source file itself
  // (tools/damage-calc/vendor/setdex_ncp-g10.js) - often because the
  // ability is implied by a listed Mega Stone item, or is the species'
  // sole practical ability. lookupPreset is a raw pass-through of the
  // vendored preset object per the brief's Step 3 implementation (it does
  // not synthesize a missing field), so callers must treat `ability` as
  // optional. Verified separately, using a preset that DOES specify one,
  // that lookupPreset correctly passes an ability through unchanged:
  const venusaurPreset = lookupPreset('Venusaur', 'Sun Sleep Offense');
  assert.equal(venusaurPreset.ability, 'Chlorophyll', 'when a preset specifies an ability, lookupPreset should pass it through');
});

test('lookupPreset: throws a clear "no presets at all" error for a Champions-legal Pokemon with none', () => {
  // Vileplume is Champions-legal (POKEDEX_CHAMPIONS has it, per the
  // "Regulation M-B additions" list) but was confirmed during design
  // research to have NO entry in SETDEX_GEN10 - this is expected/normal,
  // not a bug, and must produce a distinct message from "not Champions-legal."
  // NOTE: /i for the same reason as the Miraidon case above - the brief's
  // Step 3 message capitalizes "No" because it starts the sentence, but the
  // brief's Step 1 test text used a lowercase-only regex.
  assert.throws(() => lookupPreset('Vileplume'), /no presets available for "Vileplume"/i);
});

test('lookupPreset: throws a clear "no such named preset" error for a real species with a different set name', () => {
  assert.throws(() => lookupPreset('Garchomp', 'Definitely Not A Real Set Name'), /no preset named "Definitely Not A Real Set Name"/);
});
