const test = require('node:test');
const assert = require('node:assert/strict');
const { getLearnsets } = require('../load-learnsets');
const dex = require('../dex');

test('vendored learnsets load and contain the Champions roster', () => {
  const L = getLearnsets();
  assert.ok(Object.keys(L).length > 200, 'expected 200+ species entries');
  assert.ok(L.altaria, 'altaria should be present');
  assert.ok(L.altaria.learnset, 'entries carry a .learnset map');
});

test('getLearnsets is a cached singleton', () => {
  assert.equal(getLearnsets(), getLearnsets());
});

// ---------------------------------------------------------------------------
// Regression: the worst failure in this repo's history. An entire team premise
// was built on Mega Altaria running Calm Mind, which it cannot learn, and it
// went unnoticed until a final audit. See reference/pitfalls.md (2026-07-14)
// and docs/case-studies.md. This assertion is permanent.
// ---------------------------------------------------------------------------
test('regression: Mega Altaria cannot learn Calm Mind', () => {
  const r = dex.learnset('Mega Altaria', 'Calm Mind');
  assert.equal(r.verdict, 'illegal');
  assert.equal(r.resolvedId, 'altaria');
});

test('regression: Altaria CAN learn the moves its real set runs', () => {
  // The real tournament set is Will-O-Wisp / Protect / Tailwind support.
  for (const mv of ['Will-O-Wisp', 'Tailwind', 'Protect']) {
    assert.equal(dex.learnset('Altaria', mv).verdict, 'legal', `${mv} should be legal`);
  }
});

test('a Mega resolves through formes, not by stripping the prefix', () => {
  // Mega Floette's base is Floette-Eternal. Verified 2026-09-07 against the
  // real baseFormeOf(): it returns "Floette-Eternal", and the naive
  // "strip the Mega prefix" approach returns null here because no species
  // called "Floette" exists on the roster at all. Every one of the 75 Megas
  // resolves to a non-null baseForme; all 315 roster entries resolve.
  assert.equal(dex.learnset('Mega Floette').resolvedId, 'floetteeternal');
  assert.equal(dex.learnset('Mega Charizard Y').resolvedId, 'charizard');
});

test('guard: the Floette edge case is real — bare "Floette" is not a species', () => {
  // This is what makes the formes-walk load-bearing rather than decorative.
  // If a future re-vendor ever adds a bare "Floette" entry, this test fails
  // and the resolver's comment needs revisiting — the trap would have moved.
  const { getVendor } = require('../../damage-calc/load-vendor');
  const roster = getVendor().POKEDEX_CHAMPIONS;
  assert.equal(roster['Floette'], undefined, 'no bare Floette should exist');
  assert.ok(roster['Floette-Eternal'], 'Floette-Eternal is the real base species');
  assert.ok(
    roster['Floette-Eternal'].formes.includes('Mega Floette'),
    'baseFormeOf finds the base by scanning formes — this link is what it walks'
  );
});

test('cosmetic and battle formes share the base learnset', () => {
  assert.equal(dex.learnset('Gourgeist-Small').resolvedId, 'gourgeist');
  assert.equal(dex.learnset('Palafin-Hero').resolvedId, 'palafin');
});

test('hyphenated move names normalise correctly', () => {
  assert.equal(dex.learnset('Altaria', 'Will-O-Wisp').verdict, 'legal');
  assert.equal(dex.learnset('Incineroar', 'U-turn').verdict, 'illegal');
});

test('listing mode returns the full move list', () => {
  const r = dex.learnset('Altaria');
  assert.equal(r.moveCount, r.moves.length);
  assert.ok(r.moves.includes('willowisp'));
  assert.ok(!r.moves.includes('calmmind'));
});

test('an unknown species is unknown, never illegal', () => {
  const r = dex.learnset('Missingno', 'Tackle');
  assert.equal(r.verdict, 'unknown');
  assert.notEqual(r.verdict, 'illegal');
  assert.match(r.note, /verify live/i);
});
