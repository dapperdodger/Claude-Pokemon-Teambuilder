'use strict';
// Cross-vendor coverage invariant — the named re-vendor gate.
//
// tools/dex/VENDOR_MANIFEST.md's re-vendoring step 5 names THIS FILE by
// filename as the check to run after re-vendoring learnsets. tools/dex and
// tools/damage-calc vendor from two different upstreams with two independent
// pins, so they can drift apart: re-vendoring the roster (POKEDEX_CHAMPIONS)
// without re-vendoring learnsets.js leaves the new species answering
// "unknown" forever, silently. This test turns that drift into a named,
// actionable failure.
//
// Deliberate overlap with tools/dex/tests/learnset.test.js: that file's
// "no roster species causes learnset() to throw" test already sweeps the
// full roster and asserts learnset() never throws — it is Task 2's
// regression guard for the resolver fix that this same sweep originally
// caught a bug in. This file covers the same ground for a different reason
// (it is the manifest-named re-vendor gate, and must exist under this exact
// filename), so a future reader should not delete either copy as redundant.
//
// Why "resolves to non-null" is not a strong enough assertion: an earlier
// draft of this test asserted only `dex.resolveLearnsetId(v, species) !==
// null`. That assertion already failed to catch a real bug during Task 2 —
// five entries in the vendored learnset table are bare `{}` placeholders
// with no `.learnset` key at all, and one of them (gourgeistsuper) is a
// real, currently Champions-legal roster species (Gourgeist-Super).
// resolveLearnsetId("Gourgeist-Super") returned the non-null id
// "gourgeistsuper" — so the weak assertion would have PASSED — while
// dex.learnset("Gourgeist-Super") went on to crash with a TypeError on
// Object.keys(undefined). A resolved id is not the same thing as a usable
// learnset entry.
//
// So this invariant asserts USABILITY, not mere resolution: for every
// roster species, dex.learnset(species) must (a) not throw, and (b) return
// the sanctioned "resolved" shape — a string resolvedId, a real moves
// array, and a moveCount matching that array's length. This is written so
// that it would have FAILED against the pre-Task-2 resolver (which used a
// bare truthiness check and let gourgeistsuper's placeholder through).
//
// A failure here is a REAL FINDING, not a broken test: it means the two
// vendors have drifted apart. Re-vendor per tools/dex/VENDOR_MANIFEST.md.

const test = require('node:test');
const assert = require('node:assert/strict');
const dex = require('../dex');
const { getVendor } = require('../../damage-calc/load-vendor');

test('invariant: every roster species has a usable learnset', () => {
  const v = getVendor();
  const broken = [];

  for (const species of Object.keys(v.POKEDEX_CHAMPIONS)) {
    let r;
    try {
      r = dex.learnset(species);
    } catch (err) {
      broken.push(`${species} (threw: ${err.message})`);
      continue;
    }

    const isUsableResolvedShape =
      typeof r.resolvedId === 'string' &&
      r.resolvedId.length > 0 &&
      Array.isArray(r.moves) &&
      r.moves.length > 0 &&
      typeof r.moveCount === 'number' &&
      r.moveCount === r.moves.length;

    if (!isUsableResolvedShape) {
      broken.push(`${species} (resolvedId=${JSON.stringify(r.resolvedId)}, unusable shape: ${JSON.stringify(r)})`);
    }
  }

  assert.deepEqual(
    broken,
    [],
    `${broken.length} roster species have no usable learnset entry: ${broken.join('; ')}. ` +
    'Re-vendor per tools/dex/VENDOR_MANIFEST.md.'
  );
});

test('invariant: the learnset table still covers a meaningful roster', () => {
  const v = getVendor();
  const total = Object.keys(v.POKEDEX_CHAMPIONS).length;
  assert.ok(total > 300, `roster shrank unexpectedly to ${total} — check the NCP vendor`);
});
