const test = require('node:test');
const assert = require('node:assert/strict');
const dex = require('../dex');

// Hand-verified type chart, transcribed from the reference/ markdown chart
// that this tool replaced (itself cross-checked cell-by-cell against
// pokemondb.net/type and Bulbapedia during the 2026-07-09 migration, then
// re-verified during the 2026-08-19 reformat).
//
// Why this is kept after the markdown was deleted: the markdown was the only
// independent check on the vendored TYPE_CHART_SV. All 324 cells were
// confirmed identical before deletion. Keeping the transcription here as a
// test preserves that independence — a re-vendor (see
// tools/damage-calc/VENDOR_MANIFEST.md) that changes type effectiveness now
// fails loudly instead of silently becoming the new truth.
//
// Anything not listed for an attacking type is 1x.
const HAND_VERIFIED = {
  Normal: {
    x0_5: ['Rock', 'Steel'],
    x0: ['Ghost'],
  },
  Fire: {
    x2: ['Grass', 'Ice', 'Bug', 'Steel'],
    x0_5: ['Fire', 'Water', 'Rock', 'Dragon'],
  },
  Water: {
    x2: ['Fire', 'Ground', 'Rock'],
    x0_5: ['Water', 'Grass', 'Dragon'],
  },
  Electric: {
    x2: ['Water', 'Flying'],
    x0_5: ['Electric', 'Grass', 'Dragon'],
    x0: ['Ground'],
  },
  Grass: {
    x2: ['Water', 'Ground', 'Rock'],
    x0_5: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'],
  },
  Ice: {
    x2: ['Grass', 'Ground', 'Flying', 'Dragon'],
    x0_5: ['Fire', 'Water', 'Ice', 'Steel'],
  },
  Fighting: {
    x2: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'],
    x0_5: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'],
    x0: ['Ghost'],
  },
  Poison: {
    x2: ['Grass', 'Fairy'],
    x0_5: ['Poison', 'Ground', 'Rock', 'Ghost'],
    x0: ['Steel'],
  },
  Ground: {
    x2: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'],
    x0_5: ['Grass', 'Bug'],
    x0: ['Flying'],
  },
  Flying: {
    x2: ['Grass', 'Fighting', 'Bug'],
    x0_5: ['Electric', 'Rock', 'Steel'],
  },
  Psychic: {
    x2: ['Fighting', 'Poison'],
    x0_5: ['Psychic', 'Steel'],
    x0: ['Dark'],
  },
  Bug: {
    x2: ['Grass', 'Psychic', 'Dark'],
    x0_5: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'],
  },
  Rock: {
    x2: ['Fire', 'Ice', 'Flying', 'Bug'],
    x0_5: ['Fighting', 'Ground', 'Steel'],
  },
  Ghost: {
    x2: ['Psychic', 'Ghost'],
    x0_5: ['Dark'],
    x0: ['Normal'],
  },
  Dragon: {
    x2: ['Dragon'],
    x0_5: ['Steel'],
    x0: ['Fairy'],
  },
  Dark: {
    x2: ['Psychic', 'Ghost'],
    x0_5: ['Fighting', 'Dark', 'Fairy'],
  },
  Steel: {
    x2: ['Ice', 'Rock', 'Fairy'],
    x0_5: ['Fire', 'Water', 'Electric', 'Steel'],
  },
  Fairy: {
    x2: ['Fighting', 'Dragon', 'Dark'],
    x0_5: ['Fire', 'Poison', 'Steel'],
  },
};

const TYPES = dex.TYPES;

test('vendored TYPE_CHART_SV matches the hand-verified chart in all 324 cells', () => {
  assert.equal(TYPES.length, 18);
  const mismatches = [];
  for (const attacking of TYPES) {
    const row = HAND_VERIFIED[attacking];
    assert.ok(row, 'hand-verified chart is missing an entry for ' + attacking);
    for (const defending of TYPES) {
      let expected = 1;
      if ((row.x2 || []).includes(defending)) expected = 2;
      else if ((row.x0_5 || []).includes(defending)) expected = 0.5;
      else if ((row.x0 || []).includes(defending)) expected = 0;

      const actual = dex.typeEffectiveness(attacking, [defending]).multiplier;
      if (actual !== expected) {
        mismatches.push(`${attacking} -> ${defending}: vendored ${actual}, hand-verified ${expected}`);
      }
    }
  }
  assert.deepEqual(mismatches, [], 'Vendored type chart diverged from the hand-verified chart: ' + mismatches.join(' | '));
});

test('every hand-verified entry names only real types', () => {
  for (const [attacking, row] of Object.entries(HAND_VERIFIED)) {
    assert.ok(TYPES.includes(attacking), `${attacking} is not a real type`);
    for (const list of [row.x2 || [], row.x0_5 || [], row.x0 || []]) {
      for (const t of list) {
        assert.ok(TYPES.includes(t), `${attacking} lists a non-type: ${t}`);
      }
    }
  }
});
