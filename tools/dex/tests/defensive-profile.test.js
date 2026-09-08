'use strict';
// Defensive-profile mode — `dex type --vs <types>` / `--vs-mon <Species>`.
//
// Why this exists: answering "what is this defender weak to?" previously meant
// looping the single-pair CLI over 18 attacking types in a shell and scraping
// the JSON with grep. That pattern silently swallowed errors — a misspelled
// type produced a BLANK ROW and a zero exit status, which in a defensive
// profile reads as "nothing notable". That is exactly how a 0x immunity gets
// missed, the failure CLAUDE.md's dual-type rule exists to prevent.
//
// So the tests below care about two things above all: every one of the 18
// types is accounted for, and a bad input fails loudly instead of quietly.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dex = require('../dex');

const CLI = path.join(__dirname, '..', 'cli.js');

function run(...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));
}

function runFailing(...args) {
  try {
    execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout || '') };
  }
  return null; // signals "it did not fail", which the assertions below reject
}

// ---------------------------------------------------------------------------
// Completeness — the property the shell loop could not guarantee
// ---------------------------------------------------------------------------

test('defensiveProfile accounts for all 18 attacking types exactly once', () => {
  const p = dex.defensiveProfile(['Ice', 'Ghost']);
  const listed = p.tiers.flatMap((t) => t.types);
  assert.equal(listed.length, 18, 'every attacking type must appear');
  assert.equal(new Set(listed).size, 18, 'no attacking type may appear twice');
  assert.deepEqual([...listed].sort(), [...dex.TYPES].sort());
  assert.equal(p.typesCovered, 18);
});

test('every tier multiplier agrees with typeEffectiveness for the same pairing', () => {
  // Derived rather than hardcoded on purpose: this asserts the two code paths
  // cannot disagree, without restating the type chart from recall.
  const defending = ['Fire', 'Dark'];
  const p = dex.defensiveProfile(defending);
  for (const tier of p.tiers) {
    for (const attacking of tier.types) {
      const single = dex.typeEffectiveness(attacking, defending);
      assert.equal(single.multiplier, tier.multiplier, `${attacking} vs ${defending.join('/')}`);
    }
  }
});

test('tiers run most-dangerous-first and omit empty ones', () => {
  const p = dex.defensiveProfile(['Ice', 'Ghost']);
  const ms = p.tiers.map((t) => t.multiplier);
  assert.deepEqual(ms, [...ms].sort((a, b) => b - a), 'tiers must be descending');
  assert.ok(ms.every((m) => p.tiers.find((t) => t.multiplier === m).types.length > 0));
});

// ---------------------------------------------------------------------------
// The two verdicts that must never be scanned for
// ---------------------------------------------------------------------------

test('regression: Steel/Fairy is immune to Poison, and it is surfaced as an immunity', () => {
  // pitfalls.md: Tinkaton was called "weak to Poison" by checking only the
  // Fairy half. 0x times anything is 0x — immunity always wins.
  const p = dex.defensiveProfile(['Steel', 'Fairy']);
  assert.ok(p.immunities.includes('Poison'), 'Poison must be listed as an immunity');
  const zeroTier = p.tiers.find((t) => t.multiplier === 0);
  assert.ok(zeroTier.types.includes('Poison'));
});

test('immunities and quadWeaknesses are first-class keys, not something to scan tiers for', () => {
  const p = dex.defensiveProfile(['Ice', 'Ghost']);
  const zero = p.tiers.find((t) => t.multiplier === 0);
  const quad = p.tiers.find((t) => t.multiplier === 4);
  assert.deepEqual(p.immunities, zero ? zero.types : []);
  assert.deepEqual(p.quadWeaknesses, quad ? quad.types : []);
});

test('a single-type defender still gets a full 18-type profile', () => {
  const p = dex.defensiveProfile(['Electric']);
  assert.deepEqual(p.defending, ['Electric']);
  assert.equal(p.tiers.flatMap((t) => t.types).length, 18);
});

// ---------------------------------------------------------------------------
// Input validation — same guarantees the single-pair path already gives
// ---------------------------------------------------------------------------

test('defensiveProfile rejects an unknown defending type', () => {
  assert.throws(() => dex.defensiveProfile(['Ice', 'Ghsot']), /Unknown type/);
});

test('defensiveProfile rejects more than two defending types', () => {
  assert.throws(() => dex.defensiveProfile(['Ice', 'Ghost', 'Dark']), /at most 2 types/);
});

// ---------------------------------------------------------------------------
// CLI surface
// ---------------------------------------------------------------------------

test('CLI: `type --vs Fire,Dark` with no attacking type returns a profile', () => {
  const out = run('type', '--vs', 'Fire,Dark');
  assert.deepEqual(out.defending, ['Fire', 'Dark']);
  assert.equal(out.typesCovered, 18);
});

test('CLI: `type --vs-mon` resolves the defender typing from the dex', () => {
  const out = run('type', '--vs-mon', 'Mega Froslass');
  assert.deepEqual(out.defending, ['Ice', 'Ghost']);
  assert.equal(out.defendingFrom, 'Mega Froslass');
  assert.equal(out.typesCovered, 18);
});

test('CLI: --vs-mon reads the Mega forme, not the base forme', () => {
  // Mega Staraptor retypes Normal/Flying -> Fighting/Flying. Passing the
  // typing by hand is where that gets stated from recall and lands wrong.
  const mega = run('type', '--vs-mon', 'Mega Staraptor');
  assert.deepEqual(mega.defending, ['Fighting', 'Flying']);
  const base = run('type', '--vs-mon', 'Staraptor');
  assert.deepEqual(base.defending, ['Normal', 'Flying']);
});

test('CLI: the existing single-pair form is unchanged', () => {
  const out = run('type', 'Water', '--vs', 'Fire,Dark');
  assert.equal(out.attacking, 'Water');
  assert.equal(out.multiplier, 2);
  assert.equal(out.verdict, 'super effective');
  assert.equal(out.tiers, undefined, 'single-pair output must not grow a tiers key');
});

// ---------------------------------------------------------------------------
// Loud failure — the actual bug that motivated this mode
// ---------------------------------------------------------------------------

test('CLI: a misspelled attacking type exits non-zero and prints an error', () => {
  const r = runFailing('type', 'Watr', '--vs', 'Fire,Dark');
  assert.ok(r, 'a misspelled type must not exit 0');
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /Unknown type/);
});

test('CLI: a misspelled defending type in profile mode exits non-zero', () => {
  const r = runFailing('type', '--vs', 'Fire,Drak');
  assert.ok(r, 'a misspelled defending type must not exit 0');
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /Unknown type/);
});

test('CLI: --vs-mon with an unknown species exits non-zero', () => {
  const r = runFailing('type', '--vs-mon', 'Notamon');
  assert.ok(r, 'an unknown species must not exit 0');
  assert.equal(r.status, 1);
});

test('CLI: --vs and --vs-mon together is rejected rather than one silently winning', () => {
  const r = runFailing('type', '--vs', 'Fire,Dark', '--vs-mon', 'Incineroar');
  assert.ok(r, 'conflicting defender flags must not exit 0');
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /not both/);
});

test('CLI: `type` with neither --vs nor --vs-mon is rejected', () => {
  const r = runFailing('type');
  assert.ok(r, 'a bare `type` must not exit 0');
  assert.equal(r.status, 1);
});
