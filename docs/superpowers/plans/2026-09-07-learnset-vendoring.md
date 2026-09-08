# Champions Learnset Vendoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give this repo a local, authoritative answer to "can this Pokémon learn this move?" — the one load-bearing fact still answered by recall.

**Architecture:** Vendor `data/mods/champions/learnsets.ts` from `smogon/pokemon-showdown` into `tools/dex/vendor/`, behind its own manifest and pin (separate from the NCP vendor, because the two go stale independently). Expose it as `dex learnset`, wire it into `dex team` as a hard legality check, and make staleness visible via the existing SessionStart hook plus a cross-vendor invariant test.

**Tech Stack:** Node.js (no new dependencies), `node:vm` sandbox loading, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-07-learnset-vendoring-design.md`

## Global Constraints

- **Pin SHA:** `6b4bc34e44cc2541929cc4b8fff96e756ab3f268` (pokemon-showdown `master`, 2026-09-06). The learnsets file itself last changed at `cc17bb7854931ce858ebb1836b9a4ea9418aa258` (2026-07-09).
- **Pin regulation:** `M-B`. Must match the `**Regulation: M-B**` stamp in `reference/regulation.md`.
- **Upstream license:** MIT (`smogon/pokemon-showdown`).
- **Vendored file is byte-for-byte upstream except line 1**, which becomes `var CHAMPIONS_LEARNSETS = {`.
- **Three verdicts, never two:** `legal`, `illegal`, `unknown`. A species absent from the learnset table is `unknown` and MUST NEVER be reported as `illegal`.
- **On regulation mismatch the hook reports; verdicts do not change.** Do not auto-downgrade to `unknown`.
- **Scope fence:** legality only. Every upstream tag is `9M`; there is no level-up/TM/egg distinction. Do not build acquisition features on this.
- **No new npm dependencies.**
- `package.json`'s test script already globs `tools/dex/tests/*.test.js` and `.claude/hooks/tests/*.test.js` — no change needed.

---

## File Structure

| File | Responsibility |
|---|---|
| `tools/dex/vendor/learnsets.js` | Create. Vendored data, one `var` assignment. |
| `tools/dex/VENDOR_MANIFEST.md` | Create. Pin (SHA + regulation), provenance, re-vendoring steps. |
| `tools/dex/load-learnsets.js` | Create. `vm`-loads the vendor file, cached singleton. One job. |
| `tools/dex/dex.js` | Modify. Adds `learnset()` + `resolveLearnsetId()`. |
| `tools/dex/cli.js` | Modify. Adds the `learnset` command. |
| `tools/dex/team.js` | Modify. Per-move legality check; computed `notChecked`. |
| `.claude/hooks/vendor-staleness.js` | Modify. Generalise to N vendors; add regulation check. |
| `tools/dex/tests/learnset.test.js` | Create. Behaviour + regression. |
| `tools/dex/tests/learnset-coverage-invariant.test.js` | Create. Cross-vendor drift detector. |
| `.claude/hooks/tests/vendor-staleness.test.js` | Create. Manifest parsing + regulation mismatch. |

---

### Task 1: Vendor the data, manifest, and loader

**Files:**
- Create: `tools/dex/vendor/learnsets.js`
- Create: `tools/dex/VENDOR_MANIFEST.md`
- Create: `tools/dex/load-learnsets.js`
- Test: `tools/dex/tests/learnset.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `require('./load-learnsets').getLearnsets()` → `Record<string, {learnset: Record<string, string[]>}>`, keyed by lowercase-alphanumeric species id.

- [ ] **Step 1: Download the upstream file at the pinned SHA**

```bash
curl -sL "https://raw.githubusercontent.com/smogon/pokemon-showdown/6b4bc34e44cc2541929cc4b8fff96e756ab3f268/data/mods/champions/learnsets.ts" -o tools/dex/vendor/learnsets.js
```

Verify it arrived intact — expect `313506` bytes and a first line beginning `export const Learnsets:`:

```bash
wc -c tools/dex/vendor/learnsets.js && head -1 tools/dex/vendor/learnsets.js
```

- [ ] **Step 2: Apply the one-line transform**

Replace ONLY line 1. Everything else stays byte-for-byte.

```bash
node -e "
const fs=require('fs');
const p='tools/dex/vendor/learnsets.js';
const raw=fs.readFileSync(p,'utf8');
const out=raw.replace(/^export const Learnsets:[^=]*=/, 'var CHAMPIONS_LEARNSETS =');
if(out===raw) throw new Error('transform did not apply — upstream header changed, re-read line 1 before proceeding');
fs.writeFileSync(p,out);
console.log('line 1 is now:', out.split('\n')[0]);
"
```

Expected output: `line 1 is now: var CHAMPIONS_LEARNSETS = {`

- [ ] **Step 3: Write the failing test**

Create `tools/dex/tests/learnset.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getLearnsets } = require('../load-learnsets');

test('vendored learnsets load and contain the Champions roster', () => {
  const L = getLearnsets();
  assert.ok(Object.keys(L).length > 200, 'expected 200+ species entries');
  assert.ok(L.altaria, 'altaria should be present');
  assert.ok(L.altaria.learnset, 'entries carry a .learnset map');
});

test('getLearnsets is a cached singleton', () => {
  assert.equal(getLearnsets(), getLearnsets());
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: FAIL — `Cannot find module '../load-learnsets'`

- [ ] **Step 5: Write the loader**

Create `tools/dex/load-learnsets.js`:

```js
'use strict';
// Loads the vendored Champions learnset table.
//
// Kept separate from tools/damage-calc/load-vendor.js on purpose: this is a
// different upstream (smogon/pokemon-showdown) with its own pin, and the two
// go stale independently. Merging them would make "the roster is current" and
// "the move pools are current" a single indistinguishable claim, which is the
// exact confusion the separate manifests exist to prevent.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadUncached() {
  const file = path.join(__dirname, 'vendor', 'learnsets.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'learnsets.js' });
  if (!sandbox.CHAMPIONS_LEARNSETS) {
    throw new Error(
      'tools/dex/vendor/learnsets.js did not define CHAMPIONS_LEARNSETS. ' +
      'The vendored file is a top-level `var` assignment; if a re-vendor ' +
      'skipped the line-1 transform documented in tools/dex/VENDOR_MANIFEST.md, ' +
      'the raw upstream `export const` will parse but define nothing here.'
    );
  }
  return sandbox.CHAMPIONS_LEARNSETS;
}

let cached = null;
function getLearnsets() {
  if (!cached) cached = loadUncached();
  return cached;
}

module.exports = { getLearnsets };
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: PASS, 2 tests

- [ ] **Step 7: Write the manifest**

Create `tools/dex/VENDOR_MANIFEST.md`:

```markdown
# Vendor Manifest — Pokémon Showdown Champions learnsets

Source: https://github.com/smogon/pokemon-showdown
License: MIT (see upstream LICENSE)

## Pin

Commit: `6b4bc34e44cc2541929cc4b8fff96e756ab3f268` (master, 2026-09-06)
Regulation: `M-B`

Both fields are load-bearing. The commit answers "is this behind upstream";
the regulation answers "is this describing the rules we are playing under".
`.claude/hooks/vendor-staleness.js` reads both and reports on either.

## Why this is a separate manifest from tools/damage-calc/VENDOR_MANIFEST.md

Different upstream, and — the operative reason — the two vendors go stale
independently. One manifest per upstream keeps "the roster is current" and
"the move pools are current" as two separate, separately-reportable claims.

## Vendored files

- `vendor/learnsets.js` <- `data/mods/champions/learnsets.ts`

Byte-for-byte upstream **except line 1**, which is rewritten from

    export const Learnsets: import('../../../sim/dex-species').ModdedLearnsetDataTable = {

to

    var CHAMPIONS_LEARNSETS = {

so the file can be `vm`-loaded the same way the NCP vendor files are. This
mirrors the `side.js` "verbatim extract + wrapper" precedent documented in
tools/damage-calc/VENDOR_MANIFEST.md. No other byte is modified.

## Learnsets are regulation-variant — this pin expires

On 2026-06-17 (the M-B start date) upstream `learnsets.ts` changed by
+2019/-353 lines. Regulations add species **and cut existing move pools**, so
a stale pin can report a move as legal that the current regulation removed.

Worse, the base mod is updated **in place** — there is no per-regulation copy
of the file. A stale pin therefore serves complete, normal-looking, wrong data
rather than failing. This is the same hazard the vgc-regulation-transition
skill documents for the Pikalytics format slug (step 5b).

Re-vendoring at a regulation rollover is a required step, not a judgement call.

## Re-vendoring

1. Read the current upstream SHA:
   `curl -s https://api.github.com/repos/smogon/pokemon-showdown/commits/master | grep '"sha"' | head -1`
2. Re-download: `curl -sL "https://raw.githubusercontent.com/smogon/pokemon-showdown/<sha>/data/mods/champions/learnsets.ts" -o tools/dex/vendor/learnsets.js`
3. Re-apply the line-1 transform above.
4. Update **both** the Commit and Regulation fields in this file, and add a changelog row.
5. Run `npm test`. `tools/dex/tests/learnset-coverage-invariant.test.js` fails
   loudly if the roster now contains species the learnsets do not cover — that
   is a real finding, not a broken test.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-07 | Initial vendor at 6b4bc34e, regulation M-B | https://github.com/smogon/pokemon-showdown |
```

- [ ] **Step 8: Run the full suite and commit**

```bash
npm test
git add tools/dex/vendor/learnsets.js tools/dex/VENDOR_MANIFEST.md tools/dex/load-learnsets.js tools/dex/tests/learnset.test.js
git commit -m "feat(dex): vendor Champions learnsets from pokemon-showdown"
```

---

### Task 2: `dex.learnset()` — resolver and verdicts

**Files:**
- Modify: `tools/dex/dex.js` (add near the existing `move()`; export at the bottom)
- Test: `tools/dex/tests/learnset.test.js` (append)

**Interfaces:**
- Consumes: `getLearnsets()` from Task 1; existing `isMegaForme(name)` and `baseFormeOf(v, megaName)` already in `dex.js`.
- Produces:
  - `toId(s) -> string`
  - `resolveLearnsetId(v, species) -> string | null`
  - `learnset(species, moveName?) -> object` with fields `species`, `resolvedId`, `moveCount`, `note`, plus `moves: string[]` when `moveName` is omitted, or `move: string` + `verdict: 'legal'|'illegal'|'unknown'` when supplied.

- [ ] **Step 1: Write the failing tests**

Append to `tools/dex/tests/learnset.test.js`:

```js
const dex = require('../dex');

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
```

- [ ] **Step 2: Run to confirm failure**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: FAIL — `dex.learnset is not a function`

- [ ] **Step 3: Implement**

Add to `tools/dex/dex.js`, after the existing `move()` function. Add the require at the top of the file alongside the existing `getVendor` import:

```js
const { getLearnsets } = require('./load-learnsets');
```

```js
// Showdown keys everything by a lowercase-alphanumeric id: "Will-O-Wisp"
// becomes "willowisp", "U-turn" becomes "uturn".
function toId(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Map a roster display name onto its learnset key.
//
// This walks the vendored `formes` data rather than stripping a "Mega "
// prefix, because prefix-stripping is silently wrong for at least one real
// species: Mega Floette's base is Floette-Eternal, and no species called
// "Floette" exists on the roster. Verified against the full roster — all 315
// entries resolve (231 direct, 75 via mega-base, 9 via forme-shares-base).
function resolveLearnsetId(v, species) {
  const learnsets = getLearnsets();

  // A Mega has no learnset of its own; it uses its base form's.
  const base = isMegaForme(species) ? (baseFormeOf(v, species) || species) : species;
  if (learnsets[toId(base)]) return toId(base);

  // Cosmetic and battle formes (Gourgeist-Small, Palafin-Hero) share the
  // base species' entry.
  const stem = base.split('-')[0];
  if (learnsets[toId(stem)]) return toId(stem);

  return null;
}

// learnset(species) -> the full legal move list
// learnset(species, move) -> a legality verdict for that one move
//
// Three verdicts, never two. A species missing from the vendored table is
// "unknown" and must never be reported as "illegal": absence proves nothing,
// the same discipline this file already applies to isPriority in move().
function learnset(species, moveName) {
  const v = getVendor();
  const learnsets = getLearnsets();
  const id = resolveLearnsetId(v, species);

  if (!id) {
    const out = {
      species,
      resolvedId: null,
      verdict: 'unknown',
      moveCount: null,
      note:
        `"${species}" is not in the vendored Champions learnset table. This is NOT evidence the move is illegal — ` +
        'it means this species is uncovered here (a roster addition the learnset vendor has not caught up to, or a ' +
        'naming mismatch). Verify live before ruling anything out, and check whether tools/dex/VENDOR_MANIFEST.md ' +
        'needs re-vendoring.',
    };
    if (moveName !== undefined) out.move = moveName;
    return out;
  }

  const moves = Object.keys(learnsets[id].learnset);

  if (moveName === undefined) {
    return {
      species,
      resolvedId: id,
      moveCount: moves.length,
      moves: moves.sort(),
      note: 'Legality only. Every upstream source tag is "9M" — this data carries no level-up/TM/egg distinction.',
    };
  }

  const known = moves.includes(toId(moveName));
  return {
    species,
    resolvedId: id,
    move: moveName,
    verdict: known ? 'legal' : 'illegal',
    moveCount: moves.length,
    note: known
      ? 'Legality only — this says the move is in the pool, not that it is worth running.'
      : `${species} cannot learn ${moveName} in Champions. Do not build a role around it.`,
  };
}
```

Then extend the export line at the bottom of `dex.js`:

```js
module.exports = { TYPES, canonicalType, typeEffectiveness, mon, move, legal, isMegaForme, learnset, resolveLearnsetId, toId };
```

- [ ] **Step 4: Run to confirm pass**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add tools/dex/dex.js tools/dex/tests/learnset.test.js
git commit -m "feat(dex): add learnset() with formes-driven species resolution"
```

---

### Task 3: CLI command

**Files:**
- Modify: `tools/dex/cli.js` (header comment block, `USAGE` string, and `main()`)
- Test: `tools/dex/tests/learnset.test.js` (append)

**Interfaces:**
- Consumes: `dex.learnset(species, move?)` from Task 2.
- Produces: `node tools/dex/cli.js learnset "<Species>" [--move "<Move>"]`, printing one JSON object. Exit code 0 always (a verdict is not a process failure).

- [ ] **Step 1: Write the failing test**

Append to `tools/dex/tests/learnset.test.js`:

```js
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'cli.js');

function runCli(...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));
}

test('CLI: learnset with --move returns a verdict', () => {
  const out = runCli('learnset', 'Mega Altaria', '--move', 'Calm Mind');
  assert.equal(out.verdict, 'illegal');
});

test('CLI: learnset without --move lists moves', () => {
  const out = runCli('learnset', 'Altaria');
  assert.ok(Array.isArray(out.moves));
});

test('CLI: learnset with no species is an error', () => {
  assert.throws(() => execFileSync(process.execPath, [CLI, 'learnset'], { encoding: 'utf8', stdio: 'pipe' }));
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: FAIL — the CLI reports `Unknown command: "learnset"` and exits 1

- [ ] **Step 3: Implement**

In `tools/dex/cli.js`, add to the `USAGE` template literal after the `legal --ability` line:

```
  node tools/dex/cli.js learnset <Species> [--move <Move>]  move legality
```

Add to the header comment block after the `legal --ability` example:

```js
//   node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"
```

Add this branch in `main()`, before the `legal` branch:

```js
    if (command === 'learnset') {
      const name = argv[1];
      if (!name) return fail('learnset: a species name is required, e.g. learnset "Mega Altaria" --move "Calm Mind"');
      const mv = flagValue(argv, '--move');
      return ok(dex.learnset(name, mv));
    }
```

- [ ] **Step 4: Run to confirm pass**

Run: `node --test tools/dex/tests/learnset.test.js`
Expected: PASS

Then confirm by hand:

```bash
node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"
```

Expected: JSON with `"verdict": "illegal"`.

- [ ] **Step 5: Commit**

```bash
git add tools/dex/cli.js tools/dex/tests/learnset.test.js
git commit -m "feat(dex): expose learnset via CLI"
```

---

### Task 4: Cross-vendor coverage invariant

**Files:**
- Create: `tools/dex/tests/learnset-coverage-invariant.test.js`

**Interfaces:**
- Consumes: `dex.resolveLearnsetId` from Task 2; `POKEDEX_CHAMPIONS` from the NCP vendor.
- Produces: nothing consumed by later tasks.

This is the detector that makes `unknown` safe rather than a silent shrug: it turns "the roster was re-vendored and the learnsets were not" into a named test failure.

- [ ] **Step 1: Write the test**

Create `tools/dex/tests/learnset-coverage-invariant.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const dex = require('../dex');
const { getVendor } = require('../../damage-calc/load-vendor');

// Cross-vendor invariant. tools/dex and tools/damage-calc vendor from two
// different upstreams with two independent pins, so they can drift apart: a
// roster re-vendor that adds species without a matching learnset re-vendor
// leaves those species answering "unknown" forever, silently.
//
// This test makes that drift loud. A failure here is a real finding — it means
// tools/dex/VENDOR_MANIFEST.md needs re-vendoring, not that the test is broken.
test('invariant: every roster species resolves to a learnset', () => {
  const v = getVendor();
  const unresolved = Object.keys(v.POKEDEX_CHAMPIONS)
    .filter((species) => dex.resolveLearnsetId(v, species) === null);

  assert.deepEqual(
    unresolved,
    [],
    `${unresolved.length} roster species have no learnset entry: ${unresolved.join(', ')}. ` +
    'Re-vendor per tools/dex/VENDOR_MANIFEST.md.'
  );
});

test('invariant: the learnset table still covers a meaningful roster', () => {
  const v = getVendor();
  const total = Object.keys(v.POKEDEX_CHAMPIONS).length;
  assert.ok(total > 300, `roster shrank unexpectedly to ${total} — check the NCP vendor`);
});
```

- [ ] **Step 2: Run it**

Run: `node --test tools/dex/tests/learnset-coverage-invariant.test.js`
Expected: PASS. All 315 roster entries resolve at the pinned commits.

If it fails, the vendors have drifted — that is the finding, not a bug in the test.

- [ ] **Step 3: Commit**

```bash
git add tools/dex/tests/learnset-coverage-invariant.test.js
git commit -m "test(dex): add cross-vendor learnset coverage invariant"
```

---

### Task 5: `dex team` move-legality enforcement

**Files:**
- Modify: `tools/dex/team.js` (header comment ~line 12-13; the `--- moves ---` block; the `notChecked` assignment near the end)
- Test: `tools/dex/tests/team.test.js` (append)

**Interfaces:**
- Consumes: `dex.learnset(species, move)` from Task 2.
- Produces: `validateTeamText` results whose `errors` include illegal moves and whose `notChecked` lists only genuinely-unchecked species.

- [ ] **Step 1: Write the failing tests**

Append to `tools/dex/tests/team.test.js`. Match the existing helper style in that file for building team text; if it defines a fixture builder, use it rather than duplicating markdown.

```js
test('an unlearnable move is a hard error', () => {
  const text = [
    '**Regulation:** M-B',
    '',
    '## The six',
    '',
    '| Pokémon | Item | Ability | Nature | SP | Moves |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Altaria | Leftovers | Cloud Nine | Calm | 32 HP / 32 SpD / 2 Def | Calm Mind / Protect / Tailwind / Roost |',
  ].join('\n');
  const r = require('../team').validateTeamText(text, { activeRegulation: 'M-B' });
  assert.ok(
    r.errors.some((e) => /Calm Mind/.test(e) && /cannot learn/i.test(e)),
    `expected an unlearnable-move error, got: ${JSON.stringify(r.errors)}`
  );
});

test('a legal move produces no move-legality error', () => {
  const text = [
    '**Regulation:** M-B',
    '',
    '## The six',
    '',
    '| Pokémon | Item | Ability | Nature | SP | Moves |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Altaria | Leftovers | Cloud Nine | Calm | 32 HP / 32 SpD / 2 Def | Will-O-Wisp / Protect / Tailwind / Roost |',
  ].join('\n');
  const r = require('../team').validateTeamText(text, { activeRegulation: 'M-B' });
  assert.ok(!r.errors.some((e) => /cannot learn/i.test(e)), JSON.stringify(r.errors));
});

test('notChecked no longer claims move legality is unchecked', () => {
  const text = [
    '**Regulation:** M-B',
    '',
    '## The six',
    '',
    '| Pokémon | Item | Ability | Nature | SP | Moves |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Altaria | Leftovers | Cloud Nine | Calm | 32 HP / 32 SpD / 2 Def | Will-O-Wisp / Protect / Tailwind / Roost |',
  ].join('\n');
  const r = require('../team').validateTeamText(text, { activeRegulation: 'M-B' });
  assert.ok(
    !(r.notChecked || []).some((n) => /learnsets are not in the vendored data/.test(n)),
    'the hardcoded learnset caveat should be gone'
  );
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node --test tools/dex/tests/team.test.js`
Expected: FAIL — no `cannot learn` error is produced, and the hardcoded `notChecked` string is still present.

- [ ] **Step 3: Implement**

In `tools/dex/team.js`, replace the header's scope-fence sentence (currently "It deliberately does NOT check move legality (learnsets are not in the vendored data — see reference/champions-format.md) or whether a set is any good.") with:

```js
// Scope fence: this checks what the local data can prove. Move legality IS
// now checked, against the vendored learnset table (tools/dex/VENDOR_MANIFEST.md)
// — but only for species that table covers; anything else is reported as
// unchecked rather than silently passed. It still does not judge whether a set
// is any good.
```

Declare a collector immediately before the `for (const row of six)` loop:

```js
  const learnsetUnknown = new Set();
```

Then, inside the `--- moves ---` block, after the existing `MOVES_CHAMPIONS` spelling check, add:

```js
    // Move legality. A species the learnset table does not cover yields
    // "unknown" — recorded as unchecked, never reported as illegal.
    for (const mv of row.moves) {
      if (!v.MOVES_CHAMPIONS[mv]) continue; // already reported as a spelling error above
      const verdict = dex.learnset(battleName || row.species, mv);
      if (verdict.verdict === 'illegal') {
        errors.push(`${label}: cannot learn "${mv}" in Champions. ${verdict.note}`);
      } else if (verdict.verdict === 'unknown') {
        learnsetUnknown.add(row.species);
      }
    }
```

Finally, replace the hardcoded `notChecked` assignment:

```js
  // Move legality is checked above for every species the vendored learnset
  // table covers. Only genuinely-uncovered species are reported here, so a
  // clean result now means moves really were checked.
  const notChecked = learnsetUnknown.size
    ? [`move legality for: ${[...learnsetUnknown].join(', ')} (not in the vendored learnset table — verify live, and see tools/dex/VENDOR_MANIFEST.md)`]
    : [];
```

- [ ] **Step 4: Run to confirm pass**

Run: `node --test tools/dex/tests/team.test.js`
Expected: PASS

- [ ] **Step 5: Validate the real saved teams**

```bash
node tools/dex/cli.js team --all
```

Any newly-reported illegal move on an existing team file is a **real finding** about that team, not a bug. Report it; do not edit anything under `teams/` — writing there requires explicit user permission (see CLAUDE.md).

- [ ] **Step 6: Commit**

```bash
git add tools/dex/team.js tools/dex/tests/team.test.js
git commit -m "feat(dex): enforce move legality in team validation"
```

---

### Task 6: Regulation-aware staleness hook

**Files:**
- Modify: `.claude/hooks/vendor-staleness.js`
- Test: `.claude/hooks/tests/vendor-staleness.test.js` (create)

**Interfaces:**
- Consumes: both manifests' pin lines; `reference/regulation.md`'s `**Regulation: <id>**` stamp.
- Produces: SessionStart output. Exported helpers `parsePin(text)` and `parseActiveRegulation(text)` for testing.

The hook currently hardcodes one vendor. Generalise it to a list, and add the regulation check. Preserve its existing discipline: **every failure path reports**, because a silent exit is indistinguishable from a clean bill of health.

- [ ] **Step 1: Write the failing test**

Create `.claude/hooks/tests/vendor-staleness.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const hook = require('../vendor-staleness.js');

test('parsePin reads a bare commit line (NCP manifest style)', () => {
  const pin = hook.parsePin('Commit: `dfbf020d4ed7df8921c6e11bbaa23410f6ca1448` (main branch HEAD)');
  assert.equal(pin.sha, 'dfbf020d4ed7df8921c6e11bbaa23410f6ca1448');
  assert.equal(pin.regulation, null);
});

test('parsePin reads commit + regulation (learnset manifest style)', () => {
  const pin = hook.parsePin('Commit: `6b4bc34e44cc2541929cc4b8fff96e756ab3f268` (master)\nRegulation: `M-B`');
  assert.equal(pin.sha, '6b4bc34e44cc2541929cc4b8fff96e756ab3f268');
  assert.equal(pin.regulation, 'M-B');
});

test('parsePin returns null sha when the line is missing', () => {
  assert.equal(hook.parsePin('no pin here').sha, null);
});

test('parseActiveRegulation reads the regulation stamp', () => {
  assert.equal(hook.parseActiveRegulation('**Regulation: M-B**\n**Regulation ends: 2026-09-09**'), 'M-B');
});

test('parseActiveRegulation returns null when the stamp is absent', () => {
  assert.equal(hook.parseActiveRegulation('nothing'), null);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node --test .claude/hooks/tests/vendor-staleness.test.js`
Expected: FAIL — `hook.parsePin is not a function` (the module currently exports nothing)

- [ ] **Step 3: Implement**

Rewrite `.claude/hooks/vendor-staleness.js`, keeping the existing `emit()` body unchanged.

`fetchUpstreamSha()` currently closes over a module-level `API` constant. Change its signature to take the URL, leaving the body otherwise untouched:

```js
// was: function fetchUpstreamSha() {
//        const req = https.get(API, { ... }, (res) => {
function fetchUpstreamSha(api) {
  return new Promise((resolve) => {
    const req = https.get(api, { headers: { 'User-Agent': 'claude-pokemon-teambuilder' }, timeout: TIMEOUT_MS }, (res) => {
      // ...rest of the existing body is unchanged...
```

Then delete the old `MANIFEST` and `API` constants and replace the rest with:

```js
const REPO = path.join(__dirname, '..', '..');
const REGULATION = path.join(REPO, 'reference', 'regulation.md');
const TIMEOUT_MS = 5000;

const VENDORS = [
  {
    label: "tools/damage-calc's vendored NCP-VGC-Damage-Calculator data (roster, moves, items, abilities)",
    manifest: path.join(REPO, 'tools', 'damage-calc', 'VENDOR_MANIFEST.md'),
    manifestRel: 'tools/damage-calc/VENDOR_MANIFEST.md',
    api: 'https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main',
    commits: 'https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main',
  },
  {
    label: "tools/dex's vendored Pokemon Showdown Champions learnsets (move legality)",
    manifest: path.join(REPO, 'tools', 'dex', 'VENDOR_MANIFEST.md'),
    manifestRel: 'tools/dex/VENDOR_MANIFEST.md',
    api: 'https://api.github.com/repos/smogon/pokemon-showdown/commits/master',
    commits: 'https://github.com/smogon/pokemon-showdown/commits/master',
  },
];

function parsePin(text) {
  const sha = text.match(/Commit: `([0-9a-f]{40})`/);
  const reg = text.match(/Regulation: `([A-Za-z0-9-]+)`/);
  return { sha: sha ? sha[1] : null, regulation: reg ? reg[1] : null };
}

function parseActiveRegulation(text) {
  const m = text.match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
  return m ? m[1] : null;
}

function activeRegulation() {
  try {
    return parseActiveRegulation(fs.readFileSync(REGULATION, 'utf8'));
  } catch {
    return null;
  }
}

async function checkVendor(v, active) {
  if (!fs.existsSync(v.manifest)) {
    return `VENDOR CHECK NOT RUNNING — ${v.manifestRel} not found. This is not a clean bill of health.`;
  }
  const pin = parsePin(fs.readFileSync(v.manifest, 'utf8'));
  if (!pin.sha) {
    return `VENDOR CHECK NOT RUNNING — could not read a "Commit: \`<sha>\`" line from ${v.manifestRel}. Restore that line.`;
  }

  const notes = [];

  // Regulation drift is the more dangerous of the two checks: a pin taken
  // under a previous regulation keeps serving complete, normal-looking data
  // rather than failing, exactly like a stale Pikalytics slug.
  if (pin.regulation && active && pin.regulation !== active) {
    notes.push(
      `REGULATION DRIFT — ${v.manifestRel} is pinned to regulation ${pin.regulation}, but the active regulation is ${active}. ` +
      'Move pools change at a regulation boundary (species are added AND existing pools are cut), so this data can report a move ' +
      'as legal that the current regulation removed. Re-vendor before trusting any legality answer.'
    );
  }

  const upstream = await fetchUpstreamSha(v.api);
  if (!upstream) {
    notes.push(
      `VENDOR CHECK COULD NOT REACH UPSTREAM for ${v.manifestRel} — no network, or an unexpected API response. This is NOT a clean ` +
      `bill of health; the vendored commit is ${pin.sha}. Compare manually against ${v.commits}.`
    );
  } else if (pin.sha !== upstream) {
    notes.push(
      `${v.label} is behind upstream.\nVendored: ${pin.sha}\nUpstream: ${upstream}\n` +
      `Re-vendor per ${v.manifestRel}'s 'Re-vendoring' section if the gap looks significant. ` +
      'If a regulation has just rolled over, re-vendoring is a required step of the vgc-regulation-transition skill, not optional.'
    );
  }

  return notes.length ? notes.join('\n\n') : null;
}

async function main() {
  const active = activeRegulation();
  const results = await Promise.all(VENDORS.map((v) => checkVendor(v, active)));
  const body = results.filter(Boolean).join('\n\n---\n\n');
  if (body) emit(body);
}

module.exports = { parsePin, parseActiveRegulation };

if (require.main === module) {
  main().catch(() => {}).finally(() => process.exit(0));
}
```

Note the `require.main === module` guard — without it, requiring the hook from the test would run the network check.

- [ ] **Step 4: Run to confirm pass**

Run: `node --test .claude/hooks/tests/vendor-staleness.test.js`
Expected: PASS

- [ ] **Step 5: Run the hook by hand**

```bash
node .claude/hooks/vendor-staleness.js
```

Expected: valid JSON on stdout. With both pins current and regulation M-B matching, it should report only the known NCP staleness, and NOT report regulation drift.

- [ ] **Step 6: Commit**

```bash
git add .claude/hooks/vendor-staleness.js .claude/hooks/tests/vendor-staleness.test.js
git commit -m "feat(hooks): check both vendors and detect regulation drift"
```

---

### Task 7: Reference and documentation updates

**Files:**
- Modify: `CLAUDE.md`, `reference/champions-format.md`, `reference/pitfalls.md`, `reference/team-refining.md`, `docs/case-studies.md`, `README.md`

**Interfaces:**
- Consumes: the CLI surface from Task 3.
- Produces: nothing code-level.

Locate each edit **by content, not line number** — line numbers in this plan were captured during design and drift.

- [ ] **Step 1: `CLAUDE.md` — add the command row**

In the "Never state these from recall — run the command" table, add after the `Move power, type, spread/priority flags` row:

```markdown
| Whether a Pokémon can learn a move | `node tools/dex/cli.js learnset "<Species>" --move "<Move>"` |
```

- [ ] **Step 2: `CLAUDE.md` — replace the learnset section**

Replace the entire `## Learnsets are NOT in the local data — verify them live` section with:

```markdown
## Learnsets are local now — but read the verdict, not just the exit code

Move legality is answerable locally: `dex learnset` reads a vendored snapshot
of Pokémon Showdown's Champions learnsets, and `dex team` enforces it.

It returns **three** verdicts, and the third is not a failure mode to paper over:

- `legal` / `illegal` — hard answers. Trust them.
- `unknown` — the species is not in the vendored table. This is **not**
  evidence the move is illegal. Verify live, and check whether
  `tools/dex/VENDOR_MANIFEST.md` needs re-vendoring.

**The pin expires.** Learnsets are regulation-variant: at the M-B rollover
upstream changed by +2019/-353 lines, so regulations add species *and cut
existing move pools*. A pin from a previous regulation keeps serving complete,
normal-looking, wrong data rather than failing — the same trap as a stale
Pikalytics slug. The session-start hook reports regulation drift; when it
does, re-vendor before trusting a legality answer.

This closes the worst failure in this repo's history — a whole team premise
built on Mega Altaria running Calm Mind, which it cannot learn, unnoticed
until a final audit. That exact case is now a permanent regression test.

Scope: legality only. The data carries no level-up/TM/egg distinction.
```

- [ ] **Step 3: `reference/champions-format.md` — move learnsets to "It covers"**

Add to the "It covers" table:

```markdown
| Move legality (learnsets) | `CHAMPIONS_LEARNSETS` | `dex learnset <Species> --move <Move>` |
```

Delete the `**Learnsets.**` bullet from "It does NOT cover", and add to "Partial coverage — treat absence as 'unknown', not 'no'":

```markdown
- **Learnsets** are vendored from a separate upstream with its own pin
  (`tools/dex/VENDOR_MANIFEST.md`) and are **regulation-variant** — a
  regulation adds species and cuts existing move pools. A species absent from
  the table returns `unknown`, never `illegal`. A pin from a previous
  regulation serves normal-looking wrong data rather than failing.
```

- [ ] **Step 4: `reference/champions-format.md` — changelog row**

```markdown
| 2026-09-07 | Learnsets moved from "does NOT cover" to "It covers" — vendored from smogon/pokemon-showdown's Champions mod behind its own pin. Added the regulation-variance caveat: upstream changed +2019/-353 lines at the M-B boundary, so a stale pin can report a move as legal that the current regulation removed | docs/superpowers/specs/2026-09-07-learnset-vendoring-design.md |
```

- [ ] **Step 5: `reference/pitfalls.md` — point the existing pitfall at the tool**

Find the Mega Altaria / Calm Mind entry and append to it:

```markdown
**Now tool-caught:** `node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"` returns `illegal`, and `dex team` fails the file. Pinned as a permanent regression test in `tools/dex/tests/learnset.test.js`.
```

- [ ] **Step 6: `reference/pitfalls.md` — add the new staleness pitfall**

Add a bullet in the same section, plus a changelog row:

```markdown
- **A stale learnset pin serves plausible wrong data, it does not fail.**
  Learnsets are regulation-variant — at the M-B boundary upstream changed by
  +2019/-353 lines, and the deletions matter most: a pin from a previous
  regulation can report a move as **legal that the current regulation
  removed**. The upstream file is updated in place, so there is no version
  marker in the data itself to notice. This is the same shape as the
  Pikalytics wrong-slug trap logged above: complete, correctly-formatted,
  wrong. Check the session-start hook's regulation-drift line before trusting
  a legality answer near a rollover.
```

```markdown
| 2026-09-07 | Added "a stale learnset pin serves plausible wrong data" — vendoring learnsets locally closes the Mega Altaria class of error but introduces a staleness trap structurally identical to the Pikalytics wrong-slug entry: regulations cut move pools, not just add them, so an expired pin produces false-POSITIVE legality | docs/superpowers/specs/2026-09-07-learnset-vendoring-design.md |
```

- [ ] **Step 7: `reference/team-refining.md`**

In "1. Move verification (per Pokémon, per listed move)", replace the "Legality" item with:

```markdown
1. **Legality**: run `node tools/dex/cli.js learnset "<Species>" --move "<Move>"`.
   `illegal` is a hard stop. `unknown` means the species is not in the vendored
   table — verify live rather than assuming either way. Also confirm the move
   is not restricted this regulation.
```

- [ ] **Step 8: `docs/case-studies.md`**

Find the Mega Altaria case study and append a resolution note:

```markdown
**Resolved 2026-09-07.** Move legality is now vendored locally and enforced.
`node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"` returns
`illegal`, `dex team` fails any file listing it, and the case is pinned as a
permanent regression test. The residual risk moved rather than vanished: the
pin is regulation-variant, so see the staleness pitfall in
`reference/pitfalls.md`.
```

- [ ] **Step 9: `README.md`**

Add to the `tools/dex/` command block:

```bash
node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"  # move legality
```

And under "Maintenance notes", add:

```markdown
- **Two vendors, two pins.** `tools/damage-calc/VENDOR_MANIFEST.md` (roster,
  moves, items, abilities) and `tools/dex/VENDOR_MANIFEST.md` (learnsets) come
  from different upstreams and go stale independently. The learnset pin also
  records the regulation it was taken for, because move pools change at a
  regulation boundary. The session-start hook reports both.
```

- [ ] **Step 10: Verify every command in the docs actually runs**

```bash
node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"
node tools/dex/cli.js learnset "Altaria"
```

- [ ] **Step 11: Commit**

```bash
git add CLAUDE.md reference/champions-format.md reference/pitfalls.md reference/team-refining.md docs/case-studies.md README.md
git commit -m "docs: learnsets are local — update doctrine, references, and case study"
```

---

### Task 8: Skill updates

**Files:**
- Modify: `.claude/skills/vgc-team-building/SKILL.md`
- Modify: `.claude/skills/vgc-team-audit/SKILL.md`
- Modify: `.claude/skills/vgc-regulation-transition/SKILL.md`

`.claude/skills/vgc-team-refining/SKILL.md` needs no change — it carries no learnset assertion; that text lives in `reference/team-refining.md`, handled in Task 7.

Locate by content, not line number.

- [ ] **Step 1: `vgc-team-building` — replace step 4b**

Replace the "**4b. Verify the learnset before committing to a role.**" paragraph with:

```markdown
**4b. Verify the learnset before committing to a role.** Run
`node tools/dex/cli.js learnset "<Species>" --move "<Move>"` before building a
plan around any move that defines a pick's job — a sweeper's boosting move, a
support's Tailwind/Trick Room, a coverage answer. `illegal` is a hard stop. A
verdict of `unknown` means the species is not in the vendored table: verify
live, and do not read it as permission. A whole team premise has been built on
an unlearnable move before.
```

- [ ] **Step 2: `vgc-team-building` — fix the "Common mistakes" bullet**

Replace the "Building around a move the Pokémon cannot learn — verify the learnset live, it is not in the local data" bullet with:

```markdown
- Building around a move the Pokémon cannot learn — run `dex learnset`; treat
  an `unknown` verdict as "go verify", not as a pass
```

- [ ] **Step 3: `vgc-team-audit` — fix step 1**

Replace the sentence beginning "Note what it does **not** check: move legality, because learnsets aren't in the local data." with:

```markdown
Move legality **is** checked, against the vendored learnset table. Read the
`notChecked` field: it now lists only species the learnset vendor does not
cover, and those still need a live check.
```

- [ ] **Step 4: `vgc-regulation-transition` — add step 5c to the checklist block**

In the fenced checklist near the top, add after the `5b` line:

```
- [ ] 5c. Re-vendor the learnsets and re-pin the regulation
```

- [ ] **Step 5: `vgc-regulation-transition` — add the step body**

Insert after step 5b's paragraph, before step 6:

```markdown
**5c. Re-vendor the learnsets and re-pin the regulation.** Move pools change
at a regulation boundary — at the M-B rollover upstream changed by +2019/-353
lines. The deletions are the dangerous half: an expired pin reports moves as
legal that the new regulation removed. The upstream file is updated in place,
so nothing in the data itself reveals which regulation it describes.

Follow `tools/dex/VENDOR_MANIFEST.md`'s "Re-vendoring" section, and update
**both** its `Commit:` and `Regulation:` fields — the regulation field is what
the session-start hook compares against `reference/regulation.md`. Then:

```bash
npm test
node tools/dex/cli.js learnset "<A New Species>"
```

`tools/dex/tests/learnset-coverage-invariant.test.js` fails loudly if the new
roster contains species the learnsets do not cover. That is a real finding: it
means the two vendors have drifted, not that the test is broken.
```

- [ ] **Step 6: Confirm nothing still claims learnsets are absent**

```bash
grep -rniI "learnsets are not in the\|not in the local data\|aren't in the local data" --include=*.md --exclude-dir=node_modules --exclude-dir=.git .
```

Expected: matches only inside `docs/superpowers/specs/`, `docs/superpowers/plans/`, and historical changelog rows — never in `CLAUDE.md`, `reference/`, or `.claude/skills/`.

- [ ] **Step 7: Full suite and commit**

```bash
npm test
git add .claude/skills/
git commit -m "docs(skills): route learnset checks through dex learnset"
```

---

## Final verification

- [ ] `npm test` passes in full.
- [ ] `node tools/dex/cli.js team --all` runs; any new move-legality findings on saved teams are **reported to the user, not silently fixed** — `teams/` is never written without explicit permission.
- [ ] `node .claude/hooks/vendor-staleness.js` emits valid JSON and reports no regulation drift while the pin says `M-B` and `reference/regulation.md` says `M-B`.
- [ ] The grep in Task 8 Step 6 is clean.
