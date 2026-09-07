const test = require('node:test');
const assert = require('node:assert/strict');
const dex = require('../dex');

// ---------------------------------------------------------------------------
// Regression tests named for the real sessions they come from. Every case in
// this block is an error this repo actually shipped to the user at least once
// while the correct fact was already written down in reference/. See
// docs/case-studies.md.
// ---------------------------------------------------------------------------

test('regression: Grass resists Electric (claimed otherwise mid-session)', () => {
  const r = dex.typeEffectiveness('Electric', ['Grass']);
  assert.equal(r.multiplier, 0.5);
  assert.equal(r.verdict, 'resisted');
});

test('regression: Mega Raichu Y is No Guard, not the pre-Mega Lightning Rod', () => {
  const m = dex.mon('Mega Raichu Y');
  assert.equal(m.ability, 'No Guard');
  assert.equal(m.abilityIsMegaFixed, true);
  assert.equal(m.baseFormeAbility, 'Lightning Rod');
  // The output must name the wrong answer explicitly, so the trap is visible
  // rather than merely avoided.
  assert.match(m.abilityNote, /PRE-Mega selection \(Lightning Rod\)/);
});

test('regression: Mega Swampert is Swift Swim, not the pre-Mega Torrent', () => {
  const m = dex.mon('Mega Swampert');
  assert.equal(m.ability, 'Swift Swim');
  assert.equal(m.baseFormeAbility, 'Torrent');
});

test('regression: Mega Delphox is Levitate; Mega Blastoise is Mega Launcher', () => {
  assert.equal(dex.mon('Mega Delphox').ability, 'Levitate');
  assert.equal(dex.mon('Mega Blastoise').ability, 'Mega Launcher');
});

test('regression: Mega Staraptor retypes to Fighting/Flying and is Contrary', () => {
  const m = dex.mon('Mega Staraptor');
  assert.deepEqual(m.types, ['Fighting', 'Flying']);
  assert.equal(m.ability, 'Contrary');
  // The base forme is Normal/Flying — the retype is the whole point of the
  // 2026-09-04 case study (Ghost moves whiff on the base, land on the Mega).
  assert.deepEqual(dex.mon('Staraptor').types, ['Normal', 'Flying']);
});

test('Mega Tyranitar keeps Sand Stream, and that is flagged as coincidence', () => {
  const m = dex.mon('Mega Tyranitar');
  assert.equal(m.ability, 'Sand Stream');
  assert.equal(m.baseFormeAbility, 'Sand Stream');
  assert.match(m.abilityNote, /coincidence/);
});

// ---------------------------------------------------------------------------
// Type effectiveness
// ---------------------------------------------------------------------------

test('dual type: both halves are multiplied', () => {
  const r = dex.typeEffectiveness('Fire', ['Rock', 'Flying']);
  assert.deepEqual(r.breakdown, [['Rock', 0.5], ['Flying', 1]]);
  assert.equal(r.multiplier, 0.5);
});

test('dual type: an immune half zeroes the product regardless of the other', () => {
  // Ground is 2x on Steel but 0x on Flying. Reasoning from the Steel half
  // alone gives "super effective"; the real answer is no effect.
  const r = dex.typeEffectiveness('Ground', ['Steel', 'Flying']);
  assert.equal(r.multiplier, 0);
  assert.equal(r.verdict, 'immune');
});

test('direction matters: Ghost/Normal is asymmetric with Fighting/Ghost', () => {
  assert.equal(dex.typeEffectiveness('Ghost', ['Normal']).multiplier, 0);
  assert.equal(dex.typeEffectiveness('Normal', ['Ghost']).multiplier, 0);
  // ...but Fighting->Ghost is 0 while Ghost->Fighting is a plain 1x.
  assert.equal(dex.typeEffectiveness('Fighting', ['Ghost']).multiplier, 0);
  assert.equal(dex.typeEffectiveness('Ghost', ['Fighting']).multiplier, 1);
});

test('4x weakness is reported as such', () => {
  const r = dex.typeEffectiveness('Rock', ['Fire', 'Flying']);
  assert.equal(r.multiplier, 4);
  assert.equal(r.verdict, 'super effective');
});

test('type names are case-insensitive and get canonicalised', () => {
  const r = dex.typeEffectiveness('electric', ['grass']);
  assert.equal(r.attacking, 'Electric');
  assert.deepEqual(r.defending, ['Grass']);
});

test('unknown type errors and lists the valid ones', () => {
  assert.throws(() => dex.typeEffectiveness('Electric', ['Grasss']), /Unknown type: "Grasss".*Valid types/s);
});

test('more than two defending types is rejected', () => {
  assert.throws(() => dex.typeEffectiveness('Fire', ['Rock', 'Flying', 'Steel']), /at most 2 types/);
});

test('engine-internal pseudo-types are not queryable', () => {
  // TYPE_CHART_SV also carries Typeless/???/Stellar. They are not answerable
  // questions about a real matchup and must not leak through.
  assert.throws(() => dex.typeEffectiveness('Normal', ['Typeless']), /Unknown type/);
  assert.throws(() => dex.typeEffectiveness('Stellar', ['Normal']), /Unknown type/);
});

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------

test('non-Mega ability carries the multiple-abilities caveat', () => {
  const m = dex.mon('Maushold');
  assert.equal(m.abilityIsMegaFixed, false);
  // Documented real case: the vendored .ab is Technician, but the actual
  // Follow-Me support preset runs Friend Guard.
  assert.match(m.abilityNote, /2-3 abilities/);
  assert.match(m.abilityNote, /NOT proof it is the only one/);
});

test('unknown species: hint offered only when no Mega is mentioned', () => {
  assert.throws(() => dex.mon('Nosuchmon'), /If you meant the Mega forme.*"Mega Nosuchmon"/s);
  assert.throws(() => dex.mon('Raichu-Mega-Y'), /names Mega formes as "Mega <Species>"/);
  assert.doesNotThrow(() => dex.mon('Mega Raichu Y'));
});

test('base stats and weight come through', () => {
  const g = dex.mon('Garchomp');
  assert.equal(g.baseStats.at, 130);
  assert.deepEqual(g.types, ['Dragon', 'Ground']);
  assert.equal(typeof g.weight, 'number');
});

// ---------------------------------------------------------------------------
// Moves and legality
// ---------------------------------------------------------------------------

test('move lookup returns power/type/category and spread flag', () => {
  const m = dex.move('Rock Slide');
  assert.equal(m.bp, 75);
  assert.equal(m.type, 'Rock');
  assert.equal(m.isSpread, true);
});

test('a missing isPriority flag is reported as unknown, never as "no priority"', () => {
  // MOVES_CHAMPIONS omits isPriority for Follow Me even though it is +2.
  const followMe = dex.move('Follow Me');
  assert.equal(followMe.priorityUnknown, true);
  assert.match(followMe.priorityNote, /NOT proof/);
  // Sucker Punch does carry the flag, so no caveat is attached.
  assert.equal(dex.move('Sucker Punch').isPriority, true);
  assert.equal(dex.move('Sucker Punch').priorityUnknown, undefined);
});

test('item legality reflects the real curated Champions pool', () => {
  // Choice Band is genuinely unavailable in Champions, not a data gap.
  assert.equal(dex.legal('item', 'Choice Band').championsLegal, false);
  assert.equal(dex.legal('item', 'Life Orb').championsLegal, true);
});

test('ability legality lookup works', () => {
  assert.equal(dex.legal('ability', 'No Guard').championsLegal, true);
});

test('legal() rejects an unknown kind', () => {
  assert.throws(() => dex.legal('move', 'Rock Slide'), /must be "item" or "ability"/);
});
