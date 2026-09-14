# Binding Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo's evaluation guidelines bind on every pick — a decision card shown in chat for every species, move, and threat answer — backed by two tool additions, skill edits, and tests that fail if the rules are deleted.

**Architecture:** Two tool surfaces first (`dex find --resists`, `meta rank`). Then a new `reference/decision-card.md` holding a marked card skeleton, copied byte-for-byte into the three skills that make picks and pointed to from the other three; a Node test in `.claude/skills/tests/` enforces the copies and the ordering anchors. Wiring (`CLAUDE.md`, `pitfalls.md`, case study, reference files, `README.md`) and a manual regression-scenarios file close it out.

**Tech Stack:** Node.js v22 (CommonJS), `node:test` + `node:assert/strict`, no new dependencies. Markdown for the reference and skill layers.

**Spec:** `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md` (commit `5492304`)

## Global Constraints

- **CommonJS**, not ESM — matches every existing tool.
- **No new npm dependencies.**
- **One JSON object per CLI invocation**, `JSON.stringify(x, null, 2)`, exit 0 on success and 1 on error — exactly as `tools/dex/cli.js` and `tools/meta/cli.js` already do.
- **Stat Points (SP), never EVs.** New CLI flags use `spe` for Speed, never `sp`.
- **Mega naming hazard:** `tools/dex` and `tools/damage-calc` want `"Mega Froslass"`; `tools/meta` wants `"Froslass-Mega"`. Code crossing the two goes through `tools/meta/megas.js` (`pikaToDex`, `dexToPika`, `resolve`).
- **`teams/` is read-only.** No task writes to or reads-for-authority anything under `teams/`. The untracked `teams/raichu-megay-scizor-trick-room-core.md` predates this work — never stage it.
- **Usage can suggest a pick; it never justifies one.** This is the rule the whole plan installs; no example, doc, or scenario in this plan may present usage rank or co-occurrence as a reason.
- **The card skeleton is byte-identical** in `reference/decision-card.md`, `vgc-team-building`, `vgc-team-refining`, and `vgc-threat-evaluation`, always between `<!-- card-skeleton:start -->` and `<!-- card-skeleton:end -->` at column 0.
- **Changelog rows follow each file's existing order:** `reference/meta-lookup.md` puts the newest row **first** (directly under the header row); `reference/pitfalls.md`, `reference/team-evaluation.md`, and `reference/team-refining.md` **append** at the bottom. Columns are `| Date | Change | Source |`. Date for every row in this plan: `2026-09-14`.
- **`npm test` is green after every commit.** Live-network meta tests skip under `META_OFFLINE=1`; run `META_OFFLINE=1 npm test` if offline.
- **Every commit ends with** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## The card skeleton (referenced by Tasks 3-6)

This exact block — markers included — is what Tasks 3, 4, 5 and 6 paste. Copy it from here; do not retype it.

````markdown
<!-- card-skeleton:start -->
**Decision card** — required before any species, move, or threat-answer choice
goes to the user. Full guidance: `reference/decision-card.md`.

1. **Decision** — what is being chosen.
2. **Role** — the job (`reference/roles.md`). On a centrepiece build, also what
   it does for the centrepiece's strengths, not only which weakness it covers.
3. **Gap is real** — current meta evidence the job matters
   (`reference/team-evaluation.md`, Meta awareness), or "no current threat found".
4. **Options from** — the exact `dex find` command (always, for species and
   threat answers) plus any meta source used. For moves: learnset + role template.
5. **Options table** — per option: usage rank (`meta rank`); source (find / meta /
   user); Q1 real matchups, with a calc wherever a counter is claimed; Q2 stats,
   moves, ability, tool-verified; Q3 role fit; Q4 is there a better legal option
   for this role. Moves also: base power and category.
6. **Recommendation** — the reason cites fields 2-5. Usage rank and co-occurrence
   are context, never the reason. If every option is top-10 usage, say so.
7. **Not verified** — anything claimed without a tool call this session.
<!-- card-skeleton:end -->
````

## Ordering

Tasks 1-2 (tools) are independent of everything else. Task 3 must precede Tasks 4-8, because it creates the reference file and the test file those tasks extend. Tasks 4-7 are independent of each other. Task 8 depends on Tasks 1-7 (it documents their results). Task 9 is last.

Each skill task is red-then-green **within the task**: it adds its assertions to `.claude/skills/tests/decision-card.test.js`, watches them fail, edits the skill, watches them pass, and commits both together. That keeps `npm test` green at every commit, which the spec's "test first, then skill edits" ordering would otherwise break for several commits.

---

### Task 1: `dex find --resists`

**Files:**
- Modify: `tools/dex/dex.js` (`find`, currently lines 381-497)
- Modify: `tools/dex/cli.js` (`USAGE` lines 16-39; `find` block lines 180-209)
- Test: `tools/dex/tests/find.test.js`

**Interfaces:**
- Consumes: `canonicalType(input)` and `typeEffectiveness(attacking, defendingTypes) -> { multiplier, ... }`, both already in `tools/dex/dex.js`.
- Produces: `dex.find({ resists: string[] })` — keeps species taking `multiplier <= 0.5` from **every** listed type; throws `Unknown type: "<x>"` for an invalid type. CLI flag `--resists <Type>`, repeatable. Task 6 and Task 9 rely on the CLI flag name.

- [ ] **Step 1: Write the failing tests**

In `tools/dex/tests/find.test.js`, insert these tests directly after the `'find: no filters returns the whole roster'` test (before the `const { execFileSync } = require('node:child_process');` line):

```js
test('find: resists keeps only species taking 0.5x or less from each named type', () => {
  const r = dex.find({ resists: ['Dark', 'Steel'] });
  assert.ok(r.count > 0, 'expected at least one species resisting both Dark and Steel');
  for (const m of r.results) {
    for (const t of ['Dark', 'Steel']) {
      const mult = dex.typeEffectiveness(t, m.types).multiplier;
      assert.ok(mult <= 0.5, `${m.name} (${m.types.join('/')}) takes ${mult}x from ${t}`);
    }
  }
});

test('find: resists counts an immunity as a resist', () => {
  const r = dex.find({ resists: ['Ground'] });
  assert.ok(
    r.results.some((m) => dex.typeEffectiveness('Ground', m.types).multiplier === 0),
    'a Ground-immune species must be kept by resists: Ground'
  );
});

test('find: resists judges a Mega on its own typing, not its base form', () => {
  // Verified 2026-09-14: Mega Staraptor is Fighting/Flying (0.5x from Dark);
  // base Staraptor is Normal/Flying (1x from Dark).
  const names = dex.find({ resists: ['Dark'] }).results.map((m) => m.name);
  assert.ok(names.includes('Mega Staraptor'), 'Mega Staraptor takes 0.5x from Dark');
  assert.ok(!names.includes('Staraptor'), 'base Staraptor takes 1x from Dark');
});

test('find: resists combines with learns as an AND', () => {
  const r = dex.find({ resists: ['Dark', 'Steel'], learns: ['Close Combat'] });
  for (const m of r.results) {
    assert.ok(dex.typeEffectiveness('Dark', m.types).multiplier <= 0.5);
    assert.ok(dex.typeEffectiveness('Steel', m.types).multiplier <= 0.5);
    assert.equal(dex.learnset(m.name, 'Close Combat').verdict, 'legal');
  }
});

test('find: an unknown resists type throws rather than matching nothing', () => {
  assert.throws(() => dex.find({ resists: ['Fairyy'] }), /Unknown type/);
});
```

At the end of the file, after the last `cli find` test, add:

```js
test('cli find: --resists is repeatable and filters on type effectiveness', () => {
  const out = run(['find', '--resists', 'Dark', '--resists', 'Steel']);
  assert.ok(out.count > 0);
  for (const m of out.results) {
    assert.ok(dex.typeEffectiveness('Dark', m.types).multiplier <= 0.5, `${m.name} vs Dark`);
    assert.ok(dex.typeEffectiveness('Steel', m.types).multiplier <= 0.5, `${m.name} vs Steel`);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tools/dex/tests/find.test.js`
Expected: FAIL — `resists keeps only species taking 0.5x...` (a non-resisting species is returned, because the filter is ignored), `resists judges a Mega on its own typing` (`Staraptor` is present), `an unknown resists type throws` (nothing throws), and `cli find: --resists` (non-resisters returned).

- [ ] **Step 3: Implement the filter in `dex.find`**

In `tools/dex/dex.js`, inside `find`, directly after the line
`const wantTypes = (f.types || []).map(canonicalType);` add:

```js
  // --resists answers "what takes this type well" from the dex's own chart and
  // the entry's own typing, so a Mega is judged on its Mega typing. An invalid
  // type throws via canonicalType rather than silently matching nothing.
  const wantResists = (f.resists || []).map(canonicalType);
```

Then, directly after the line
`if (wantTypes.length && !wantTypes.every((t) => types.includes(t))) continue;` add:

```js
    if (wantResists.length && !wantResists.every((t) => typeEffectiveness(t, types).multiplier <= 0.5)) continue;
```

- [ ] **Step 4: Wire the CLI flag**

In `tools/dex/cli.js`, in the `dex.find({ ... })` call, add a line after `types: flagValues(argv, '--type'),`:

```js
        resists: flagValues(argv, '--resists'),
```

In `USAGE`, after the line
`  node tools/dex/cli.js find --learns "Trick Room" --max-spe 50 --min-atk 100`
add:

```
  node tools/dex/cli.js find --resists Dark --resists Steel --learns "Close Combat"
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tools/dex/tests/find.test.js`
Expected: PASS, all tests.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/dex/dex.js tools/dex/cli.js tools/dex/tests/find.test.js
git commit -m "$(cat <<'EOF'
feat(dex): add find --resists for "what takes this type well"

Answering a threat needed a type-chart search the dex could not run, so
"what beats X" fell back to recall. Repeatable, AND, immunity counts, and a
Mega is judged on its Mega typing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `meta rank`

**Files:**
- Create: `tools/meta/rank.js`
- Modify: `tools/meta/cli.js` (`require` block lines 5-12; `USAGE` lines 14-67; add a command block after `usage`, line ~160)
- Test: `tools/meta/tests/rank.test.js` (create)
- Test: `tools/meta/tests/cli.test.js` (append)

**Interfaces:**
- Consumes: `meta.usageFromText(text, { describe }) -> { format, regulation, currency, current, warnings, rows: [{ rank, species, usage, winRate, record }] }`; `dex.mon(name) -> { name, ... }` (throws `Unknown Pokemon: "..."`); `megas.pikaToDex`, `megas.dexToPika`, `megas.resolve(pikaName) -> { isMega, base, stone, dexName }`.
- Produces: `rankFromUsage(usageResult, names: string[]) -> { format, regulation, rows, anchoring: { threshold, allWithinThreshold, message } }`; `ANCHOR_THRESHOLD = 10`. A row is either `{ query, error }` or `{ query, dexName, usageSpecies, isMega, note?, rank, usage, winRate, record, reason }`. CLI: `node tools/meta/cli.js rank "<Species>" ["<Species>" ...] [--format <code>]`. Tasks 4, 6, 8 and 9 rely on the command name.

- [ ] **Step 1: Write the failing unit tests**

Create `tools/meta/tests/rank.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const meta = require('../meta');
const formats = require('../formats');
const { rankFromUsage, ANCHOR_THRESHOLD } = require('../rank');

// ranked-index-mc.md: 50 rows. Verified 2026-09-14: Rillaboom #1,
// Incineroar #3, Floette-Eternal #11, Froslass #34; Pikachu is in the dex but
// not in the table.
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures', 'ranked-index-mc.md'), 'utf8');

function usage() {
  return meta.usageFromText(FIXTURE, { describe: formats.describe(FIXTURE, 'gen9championsvgc2026regmc') });
}

function rank(names) {
  return rankFromUsage(usage(), names);
}

test('rank: a plain species reports its own row', () => {
  const r = rank(['Rillaboom']).rows[0];
  assert.equal(r.rank, 1);
  assert.equal(r.isMega, false);
  assert.equal(r.usageSpecies, 'Rillaboom');
  assert.equal(r.reason, null);
  assert.equal(r.note, undefined);
  assert.equal(typeof r.usage.value, 'number');
});

test('rank: a Mega in dex naming resolves to its base species row, with a note', () => {
  const r = rank(['Mega Froslass']).rows[0];
  assert.equal(r.dexName, 'Mega Froslass');
  assert.equal(r.usageSpecies, 'Froslass');
  assert.equal(r.isMega, true);
  assert.equal(r.rank, 34);
  assert.match(r.note, /base species' row/);
});

test('rank: a Mega in Pikalytics naming resolves the same way', () => {
  const r = rank(['Froslass-Mega']).rows[0];
  assert.equal(r.dexName, 'Mega Froslass');
  assert.equal(r.rank, 34);
});

test('rank: a Mega whose base has a forme name uses that forme row', () => {
  const r = rank(['Mega Floette']).rows[0];
  assert.equal(r.usageSpecies, 'Floette-Eternal');
  assert.equal(r.rank, 11);
});

test('rank: a real species outside the table is rank null with a reason', () => {
  const r = rank(['Pikachu']).rows[0];
  assert.equal(r.rank, null);
  assert.match(r.reason, /outside the top 50/);
});

test('rank: a misspelled name is a row error, never "outside the top 50"', () => {
  const r = rank(['Frosslass']).rows[0];
  assert.match(r.error, /Unknown Pokemon/);
  assert.equal(r.rank, undefined);
});

test('rank: rows keep input order', () => {
  const out = rank(['Pikachu', 'Rillaboom', 'Frosslass']);
  assert.deepEqual(out.rows.map((r) => r.query), ['Pikachu', 'Rillaboom', 'Frosslass']);
});

test('rank: anchoring fires only when every resolved option is inside the threshold', () => {
  assert.equal(ANCHOR_THRESHOLD, 10);

  const all = rank(['Rillaboom', 'Incineroar']).anchoring;
  assert.equal(all.threshold, 10);
  assert.equal(all.allWithinThreshold, true);
  assert.match(all.message, /top 10/);

  const mixed = rank(['Rillaboom', 'Mega Froslass']).anchoring;
  assert.equal(mixed.allWithinThreshold, false);
  assert.equal(mixed.message, null);

  const outside = rank(['Pikachu']).anchoring;
  assert.equal(outside.allWithinThreshold, false);
});

test('rank: errored rows are excluded from anchoring, and all-errors never fires', () => {
  assert.equal(rank(['Rillaboom', 'Frosslass']).anchoring.allWithinThreshold, true);
  const none = rank(['Frosslass']).anchoring;
  assert.equal(none.allWithinThreshold, false);
  assert.equal(none.message, null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tools/meta/tests/rank.test.js`
Expected: FAIL with `Cannot find module '../rank'`.

- [ ] **Step 3: Implement `tools/meta/rank.js`**

```js
'use strict';
// rankFromUsage(usageResult, names) -> where each named option sits in one
// format's usage table. Fills a decision card's usage column
// (reference/decision-card.md) in one call.
//
// Every name is validated against the dex BEFORE lookup. A misspelled name
// that came back "outside the top 50" would be a confident wrong answer — the
// failure this repo's tools exist to prevent — so it is a row error instead.
//
// Accepts both naming conventions ("Mega Froslass" as dex find prints it,
// "Froslass-Mega" as Pikalytics writes it) and crosses them only through
// megas.js. Pikalytics logs a Mega's battles under its base species, so a Mega
// reports the base species' row and says so.

const dex = require('../dex/dex');
const megas = require('./megas');

const ANCHOR_THRESHOLD = 10;

function resolveName(query) {
  const entry = dex.mon(megas.pikaToDex(query));
  const megaInfo = megas.resolve(megas.dexToPika(entry.name));
  return {
    dexName: entry.name,
    usageSpecies: megaInfo.isMega ? megaInfo.base : entry.name,
    isMega: megaInfo.isMega,
  };
}

function rankFromUsage(usageResult, names) {
  const table = usageResult.rows || [];
  const bySpecies = new Map(table.map((r) => [r.species.toLowerCase(), r]));
  const rows = [];

  for (const query of names) {
    let resolved;
    try {
      resolved = resolveName(query);
    } catch (err) {
      rows.push({ query, error: err.message });
      continue;
    }
    const base = { query, ...resolved };
    if (resolved.isMega) {
      base.note = `Pikalytics logs ${resolved.dexName}'s battles under ${resolved.usageSpecies}; ` +
        "this rank is the base species' row, not the Mega's own.";
    }
    const hit = bySpecies.get(resolved.usageSpecies.toLowerCase());
    if (!hit) {
      rows.push({
        ...base, rank: null, usage: null, winRate: null, record: null,
        reason: `outside the top ${table.length} of this format`,
      });
      continue;
    }
    rows.push({ ...base, rank: hit.rank, usage: hit.usage, winRate: hit.winRate, record: hit.record, reason: null });
  }

  const resolvedRows = rows.filter((r) => !r.error);
  const allWithinThreshold = resolvedRows.length > 0 &&
    resolvedRows.every((r) => r.rank !== null && r.rank <= ANCHOR_THRESHOLD);

  return {
    format: usageResult.format,
    regulation: usageResult.regulation,
    rows,
    anchoring: {
      threshold: ANCHOR_THRESHOLD,
      allWithinThreshold,
      message: allWithinThreshold
        ? `Every option ranks inside the top ${ANCHOR_THRESHOLD} by usage in ${usageResult.format}. ` +
          'Say so on the card, and confirm the dex find alternatives and rubric Q4 were actually weighed.'
        : null,
    },
  };
}

module.exports = { rankFromUsage, ANCHOR_THRESHOLD };
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `node --test tools/meta/tests/rank.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Write the failing CLI tests**

Append to `tools/meta/tests/cli.test.js`:

```js
test('rank with no names exits non-zero before any fetch', () => {
  const r = runFailing('rank');
  assert.ok(r);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /at least one species name/);
});

test('meta rank resolves a Mega to its base row and errors a misspelling', { skip: !ONLINE }, () => {
  const out = run('rank', 'Mega Froslass', 'Frosslass');
  assert.equal(out.rows[0].usageSpecies, 'Froslass');
  assert.equal(out.rows[0].isMega, true);
  assert.match(out.rows[1].error, /Unknown Pokemon/);
  assert.equal(typeof out.anchoring.allWithinThreshold, 'boolean');
});
```

Run: `META_OFFLINE=1 node --test tools/meta/tests/cli.test.js`
Expected: FAIL — `rank with no names` gets `Unknown command: "rank"` instead of the species-name error.

- [ ] **Step 6: Wire the CLI command**

In `tools/meta/cli.js`, add to the `require` block after `const fk = require('./format-knowledge');`:

```js
const rank = require('./rank');
```

In `USAGE`, after the line
`  node tools/meta/cli.js usage [--format <code>]           ranked list`
add:

```
  node tools/meta/cli.js rank <Species> [<Species> ...] [--format <code>]
                                                 where each option ranks in usage — one fetch.
                                                 Accepts "Mega Froslass" or "Froslass-Mega"; a Mega
                                                 reports its base species' row. A misspelled name is
                                                 a row error, never "outside the top 50".
```

Directly after the `if (command === 'usage') { ... }` block, add:

```js
    if (command === 'rank') {
      const names = [];
      for (let i = 1; i < argv.length; i++) {
        if (argv[i] === '--format') { i++; continue; }
        names.push(argv[i]);
      }
      if (!names.length) {
        return fail('rank: at least one species name is required, e.g. rank "Mega Froslass" "Sneasler"');
      }
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text, code);
      const usage = meta.usageFromText(idx.text, { describe });
      const out = rank.rankFromUsage(usage, names);
      out.currency = usage.currency;
      out.current = usage.current;
      out.warnings = usage.warnings;
      return ok(out);
    }
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `META_OFFLINE=1 node --test tools/meta/tests/cli.test.js tools/meta/tests/rank.test.js`
Expected: PASS (the online `meta rank` test reports as skipped).

If network is available, run: `node --test tools/meta/tests/cli.test.js`
Expected: PASS, including `meta rank resolves a Mega...`.

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tools/meta/rank.js tools/meta/cli.js tools/meta/tests/rank.test.js tools/meta/tests/cli.test.js
git commit -m "$(cat <<'EOF'
feat(meta): add rank for a decision card's usage column

One fetch returns each option's usage rank. Names are validated against the
dex first so a typo is an error, not "outside the top 50"; a Mega reports its
base species' row and says so; an all-top-10 option set carries a note.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `reference/decision-card.md` and the skill-text test

**Files:**
- Create: `reference/decision-card.md`
- Create: `.claude/skills/tests/decision-card.test.js`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**
- Consumes: `node tools/meta/cli.js rank` (Task 2) for the worked example.
- Produces: the canonical skeleton block (see "The card skeleton" above) and three test helpers other tasks call — `read(rel) -> string` (CRLF-normalised), `skeleton(rel) -> string` (asserts the marked block exists), `assertInOrder(rel, anchors: string[])` — plus the `REFERENCE` constant. Tasks 4-8 append tests using exactly these names.

- [ ] **Step 1: Write the failing test**

Create `.claude/skills/tests/decision-card.test.js`:

```js
'use strict';
// Skill-text tests: these fail when a rule is DELETED or a skill's copy of the
// card skeleton DRIFTS. They cannot tell whether a rule is followed — that is
// what docs/regression-scenarios.md is for.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..', '..');
const REFERENCE = 'reference/decision-card.md';

// Git on Windows may check files out with CRLF; compare on LF.
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}

function skeleton(rel) {
  const m = read(rel).match(/<!-- card-skeleton:start -->\n([\s\S]*?)\n<!-- card-skeleton:end -->/);
  assert.ok(m, `${rel} has no <!-- card-skeleton:start --> ... <!-- card-skeleton:end --> block at column 0`);
  return m[1];
}

function assertInOrder(rel, anchors) {
  const text = read(rel);
  let last = -1;
  for (const anchor of anchors) {
    const i = text.indexOf(anchor, last + 1);
    assert.ok(i !== -1, `${rel} is missing anchor phrase (or it is out of order): ${anchor}`);
    last = i;
  }
}

test('reference/decision-card.md carries the card skeleton with all seven fields', () => {
  const s = skeleton(REFERENCE);
  for (const field of [
    '1. **Decision**', '2. **Role**', '3. **Gap is real**', '4. **Options from**',
    '5. **Options table**', '6. **Recommendation**', '7. **Not verified**',
  ]) {
    assert.ok(s.includes(field), `skeleton is missing field: ${field}`);
  }
});

test('reference/decision-card.md states the shared rule', () => {
  assert.ok(read(REFERENCE).includes('**Usage can suggest a pick; it never justifies one.**'));
});
```

- [ ] **Step 2: Add the test glob and run it to verify it fails**

In `package.json`, change `scripts.test` to:

```json
"test": "node --test \"tools/damage-calc/tests/*.test.js\" \"tools/dex/tests/*.test.js\" \"tools/meta/tests/*.test.js\" \".claude/hooks/tests/*.test.js\" \".claude/skills/tests/*.test.js\""
```

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL with `ENOENT` on `reference/decision-card.md`.

- [ ] **Step 3: Gather the worked example's data**

The example is a **move card** for Incineroar's fourth move, chosen because it is not one of the three regression-scenario prompts (Task 9) and so does not pre-answer any of them. Run each command and keep the output for Step 4:

```bash
node tools/meta/cli.js rank "Incineroar"
node tools/meta/cli.js mon "Incineroar"
node tools/dex/cli.js learnset "Incineroar" --move "Throat Chop"
node tools/dex/cli.js learnset "Incineroar" --move "Darkest Lariat"
node tools/dex/cli.js learnset "Incineroar" --move "Will-O-Wisp"
node tools/dex/cli.js learnset "Incineroar" --move "Helping Hand"
node tools/dex/cli.js move "Throat Chop"
node tools/dex/cli.js move "Darkest Lariat"
node tools/dex/cli.js move "Will-O-Wisp"
node tools/dex/cli.js move "Helping Hand"
node tools/meta/cli.js distribution --move "Will-O-Wisp" --top 20
```

From the `meta rank` output, record `rows[0].rank` for the `‹rank›` in field 3. From the `meta mon` output, record the `percent.value` for each of the four moves in the `moves` list (write `not in top 10` for any move absent from that list). From each `learnset` call, record the `verdict`. From each `move` call, record `bp` and `category`. If any `learnset` verdict is `illegal`, drop that row from the example and say so in the file's changelog row.

- [ ] **Step 4: Create `reference/decision-card.md`**

Write the file below. In the worked-example table, replace each `‹…›` cell with the value recorded in Step 3 — every other word is literal.

````markdown
# Decision cards

**Usage can suggest a pick; it never justifies one.** Every species, move, or
threat answer — however popular — gets a decision card shown in chat before
the choice goes to the user.

This file is the full guidance. The skeleton below is copied byte-for-byte into
`vgc-team-building`, `vgc-team-refining` and `vgc-threat-evaluation`, and
`.claude/skills/tests/decision-card.test.js` fails if any copy drifts. Edit it
here and in all three skills in the same commit.

Why it exists: `docs/case-studies.md`, "A Mega Froslass build that verified
every fact and evaluated no pick" — and the design,
`docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`.

## Contents

- [The skeleton](#the-skeleton)
- [Which decisions get a card](#which-decisions-get-a-card)
- [Filling each field](#filling-each-field)
- [Worked example: a move card](#worked-example-a-move-card)
- [What a card is not](#what-a-card-is-not)
- [Changelog](#changelog)

## The skeleton

<!-- card-skeleton:start -->
**Decision card** — required before any species, move, or threat-answer choice
goes to the user. Full guidance: `reference/decision-card.md`.

1. **Decision** — what is being chosen.
2. **Role** — the job (`reference/roles.md`). On a centrepiece build, also what
   it does for the centrepiece's strengths, not only which weakness it covers.
3. **Gap is real** — current meta evidence the job matters
   (`reference/team-evaluation.md`, Meta awareness), or "no current threat found".
4. **Options from** — the exact `dex find` command (always, for species and
   threat answers) plus any meta source used. For moves: learnset + role template.
5. **Options table** — per option: usage rank (`meta rank`); source (find / meta /
   user); Q1 real matchups, with a calc wherever a counter is claimed; Q2 stats,
   moves, ability, tool-verified; Q3 role fit; Q4 is there a better legal option
   for this role. Moves also: base power and category.
6. **Recommendation** — the reason cites fields 2-5. Usage rank and co-occurrence
   are context, never the reason. If every option is top-10 usage, say so.
7. **Not verified** — anything claimed without a tool call this session.
<!-- card-skeleton:end -->

## Which decisions get a card

| Decision | Card | Options |
|---|---|---|
| A species, in any skill | Full card | 3-5 |
| A move — chosen, swapped, or flagged | Full card | The chosen move plus the alternatives its role template allows |
| An answer to "what beats X" | Full card | 3-5 |
| An item or ability | One line tying it to the role | — |
| An SP spread | No card — `reference/methodology.md`'s solve-for-the-minimum method | — |

The card goes **in the reply, immediately before the question** that asks the
user to choose. A card written after the choice, or only for the option that
was picked, is not a card.

## Filling each field

1. **Decision.** One line naming the slot, the move slot, or the threat —
   "slot 3", "Incineroar's 4th move", "answer to Kingambit".
2. **Role.** A job, not a label: "resists the Ground moves that kill the
   core", "sets speed control the core lacks". Name the `reference/roles.md`
   template it uses. On a build that started from a specific Pokémon, also
   say what this option does for the strengths written down at
   `vgc-team-building` step 1.
3. **Gap is real.** Evidence from this session's meta pull that the job
   matters now: a named threat and its usage, or a named archetype from
   `meta teams`. "No current threat found" is a valid answer and must be
   written out — it is `reference/team-evaluation.md`'s "a weakness nobody
   exploits is not a weakness", and it may end the decision there.
4. **Options from.** Paste the exact command. For species and threat answers
   `node tools/dex/cli.js find ...` always runs, even when a meta suggestion
   already looks strong; `--resists`, `--learns`, `--type` and stat bounds
   turn the role into a query. Meta suggestions (`meta mon` teammates,
   `meta usage`, `meta teams`) are welcome as extra rows — name the command
   they came from. For a move: the learnable moves that fit the role template
   (`dex learnset`).
5. **Options table.** One row per option:
   - **Usage** — species: `node tools/meta/cli.js rank "<A>" "<B>" ...` in one
     call; a Mega reports its base species' row. Move: its share on real sets
     from `meta mon`'s `moves` list.
   - **Source** — `find`, `meta`, `user`, or `find + meta`.
   - **Q1 real matchups** — against named threats from field 3. Any claim that
     it beats or survives something carries a `tools/damage-calc/cli.js` roll,
     with the opponent's real item and weather passed.
   - **Q2 stats, moves, ability** — from `dex mon`, `dex learnset`, `dex move`.
     A Mega's ability from `dex mon "Mega <Species>"`, never a usage split.
   - **Q3 role fit** — does it do the field-2 job; for a move, the template slot
     and the ≥80 BP floor or its stated non-damage job.
   - **Q4 better legal option** — does another row, or another `find` result
     not shown, do this exact job better? Say which, or "no".
6. **Recommendation.** Name the pick and the fields that decided it. If
   `meta rank` printed an `anchoring.message`, repeat it. A recommendation
   whose only reason is usage rank, win rate, or a teammate percentage is
   invalid.
7. **Not verified.** List every claim on the card that has no tool call behind
   it this session. An empty list is a claim too — only write "none" if it is
   true.

## Worked example: a move card

*(as of 2026-09 — confirm with meta usage; numbers below were recorded from the
commands listed on 2026-09-14)*

1. **Decision** — Incineroar's 4th move, with Fake Out, Parting Shot and Flare
   Blitz already set.
2. **Role** — defensive pivot: Fake Out and Parting Shot buy turns for a
   faster partner. `reference/roles.md` Defensive template (Support / Support /
   STAB / Support-Protect), so slot 4 is Support or Protect by default; a
   second attack is a deviation that needs a reason.
3. **Gap is real** — Incineroar is #‹rank› by usage in M-C, so it is on the
   field often enough that its fourth slot gets clicked; the job (surviving to
   pivot again) is live in every game it is brought.
4. **Options from** — `node tools/dex/cli.js learnset "Incineroar" --move
   "<Move>"` for each row; suggestions from
   `node tools/meta/cli.js mon "Incineroar"`.
5. **Options table**

| Option | Share on real sets | Source | BP / category | Q1 | Q2 learnset | Q3 role fit | Q4 |
|---|---|---|---|---|---|---|---|
| Throat Chop | ‹percent› | meta | ‹bp› / ‹category› | Second Dark attack; blocks sound moves for two turns | ‹verdict› | Deviation from Defensive template — needs a reason | Overlaps Darkest Lariat's type |
| Darkest Lariat | ‹percent› | meta | ‹bp› / ‹category› | Second Dark attack; ignores the target's stat boosts | ‹verdict› | Deviation from Defensive template — needs a reason | Overlaps Throat Chop's type |
| Will-O-Wisp | ‹percent› | learnset | ‹bp› / ‹category› | Burn halves a physical attacker's damage for the rest of the game | ‹verdict› | Fits slot 4 (Support) | — |
| Helping Hand | ‹percent› | learnset | ‹bp› / ‹category› | Boosts the partner's attack that turn; +5 priority | ‹verdict› | Fits slot 4 (Support) | Only pays off on turns the partner attacks; does nothing on its own, unlike Will-O-Wisp |

6. **Recommendation** — Will-O-Wisp: it fills the template's Support slot
   (field 5, Q3), and its effect outlasts the turn it is used on, which a
   defensive pivot that switches in repeatedly is built to exploit (field 2).
   Throat Chop and Darkest Lariat are the most-run options, but a second Dark
   attack is a template deviation with no reason stated for this team — their
   share is context, not a reason.
7. **Not verified** — Throat Chop's sound-blocking duration and Darkest
   Lariat's boost-ignoring effect are stated from move descriptions, not from a
   repo tool; Will-O-Wisp's damage halving is not measured by
   `tools/damage-calc` in this example.

## What a card is not

- **Not a score.** It records the rubric answers; judgement still decides.
  `reference/team-evaluation.md`'s counterweights apply to every field.
- **Not a ban on meta picks.** Meta Pokémon are often right. A card whose
  recommendation is the top-usage option is fine when fields 2-5 carry it.
- **Not enforced by a hook.** It is enforced by being visible to the user, by
  the skill-text test (which catches deletion, not skipping), and by
  `docs/regression-scenarios.md`. A blocking hook is the recorded escalation if
  cards are skipped anyway.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-14 | Created. The rule "usage can suggest a pick; it never justifies one", the seven-field card skeleton (copied byte-for-byte into `vgc-team-building`, `vgc-team-refining`, `vgc-threat-evaluation` and enforced by `.claude/skills/tests/decision-card.test.js`), which decisions get a card, field-by-field guidance, and a worked move-card example for Incineroar's 4th move recorded from `meta mon`, `dex learnset`, `dex move` and `meta distribution` output this session. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`; commands listed in the worked example |
````

Check the example against the recorded data before saving: if a recorded `category`, `bp` or share contradicts a Q1/Q3 statement in the table (for example Helping Hand recorded as illegal), rewrite that cell and the recommendation to match the data, and list the change in the changelog row. The example must never assert something the recorded output contradicts.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS, 2 tests.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add reference/decision-card.md .claude/skills/tests/decision-card.test.js package.json
git commit -m "$(cat <<'EOF'
docs(reference): add decision cards and the skill-text test

The rule and card skeleton every pick-making skill will carry, with a worked
move card. The new test file fails if the skeleton is removed; later tasks
add assertions that each skill's copy matches it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `vgc-team-building` — centrepiece first, cards per pick, two new gates

**Files:**
- Modify: `.claude/skills/vgc-team-building/SKILL.md`
- Test: `.claude/skills/tests/decision-card.test.js` (append)

**Interfaces:**
- Consumes: `read`, `skeleton`, `assertInOrder`, `REFERENCE` from Task 3's test file; the skeleton block; `meta rank` (Task 2).
- Produces: anchor phrases `**Centrepiece first, before any meta data.**`, `**Q4 gate:**`, `**Centrepiece gate:**` — Task 9's scenario 1 criteria quote them.

- [ ] **Step 1: Write the failing tests**

Append to `.claude/skills/tests/decision-card.test.js`:

```js
const BUILDING = '.claude/skills/vgc-team-building/SKILL.md';

test('vgc-team-building carries the card skeleton verbatim', () => {
  assert.equal(skeleton(BUILDING), skeleton(REFERENCE));
});

test('vgc-team-building describes the centrepiece before the meta pull', () => {
  assertInOrder(BUILDING, [
    '**Centrepiece first, before any meta data.**',
    '**2. Regulation check, fresh this session, then a live meta scan.**',
  ]);
});

test('vgc-team-building step 7 carries the Q4 and centrepiece gates', () => {
  assertInOrder(BUILDING, [
    '**7. Team-level gates',
    '**Q4 gate:**',
    '**Centrepiece gate:**',
    '**8. Solve the numbers for SP',
  ]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL — three new tests (`no ... card-skeleton ... block`, missing `**Centrepiece first...`, missing `**Q4 gate:**`).

- [ ] **Step 3: Step 1 — centrepiece first**

In `.claude/skills/vgc-team-building/SKILL.md`, step 1, after the three starting-point bullets and **before** the paragraph beginning `Get this right before the first exchange.`, insert:

```markdown
**Centrepiece first, before any meta data.** When the starting point is a
specific Pokémon or core, write this down in chat before step 2 pulls any
usage data. It is card field 2 for every later slot:

- **Strengths to amplify** — its ability, signature moves, stats, and anything
  its kit sets up (a weather, screens, a Speed tier). From
  `node tools/dex/cli.js mon "<Species>"` — the Mega forme if it holds a stone.
- **Weaknesses to cover** — the full profile from
  `node tools/dex/cli.js type --vs-mon "<Species>"`, plus its playstyle
  weakness (fast and frail, slow and bulky) per `reference/archetypes.md`'s
  "Megas as a centrepiece" section.
- **Speed needs** — its base Speed, to place against the field at step 3.

Partners are picked to do something for the first list, not only to patch the
second.
```

- [ ] **Step 4: Step 2 — what the meta pull is for**

At the end of step 2 (after the sentence ending `...not just the teams it returned.`), add:

```markdown
**What the meta pull is for.** It produces the threat list and a pool of
suggested candidates — never a shortlist on its own. A meta-suggested Pokémon
goes onto a decision card beside the `dex find` results and is judged by the
same rubric.
```

- [ ] **Step 5: Step 5 — the card replaces "present 3-5 candidates"**

In step 5, replace this paragraph:

```markdown
**Present 3-5 real candidates with their trade-offs and let the user
choose.** Researching one option and presenting it as the answer is the
documented failure here, whether the slot came from a strategy gap or from
building around a favourite.
```

with the following — the skeleton block pasted from "The card skeleton" section of this plan, markers at column 0:

````markdown
**Put the slot on a decision card, then let the user choose.** Show the card
in chat before the pick question: 3-5 options, mixing `dex find` results with
any meta suggestions. `find` runs for every species card, even when the meta
already suggests a strong option. Get every option's usage rank in one call:

```bash
node tools/meta/cli.js rank "<Species A>" "<Species B>" "<Species C>"
```

A "(Recommended)" label must rest on fields 2-5, never on usage rank or a
teammate rate.

<!-- card-skeleton:start -->
‹paste the skeleton body from "The card skeleton" section, unchanged›
<!-- card-skeleton:end -->

Researching one option and presenting it as the answer is the documented
failure here — and so is presenting 3-5 options that all came off one
teammate list with no `find` run (`docs/case-studies.md`, "A Mega Froslass
build that verified every fact and evaluated no pick").
````

The `‹paste…›` line stands for the fifteen skeleton lines between the markers; the test compares them byte-for-byte against `reference/decision-card.md`.

- [ ] **Step 6: Step 6 — a card per move**

In step 6, after the bullet beginning `- **Verify the learnset for every move actually chosen**` and its continuation lines, add:

```markdown
**Every move goes on a decision card.** Options are the learnable moves that
fit the slot's role template; a moveset from `meta mon` is a suggestion to put
on the card, not a set to copy. A move's usage column is its share on real
sets (`meta mon`'s `moves` list).
```

- [ ] **Step 7: Step 7 — two gates**

At the end of step 7 (after the paragraph ending `...don't stop at the checklist itself.`), add:

```markdown
Two more gates, both stated in chat before step 8:

- **Q4 gate:** every species on the six went through
  `reference/team-evaluation.md`'s question 4 on its decision card. A pick
  with no card, or a card with Q4 blank, is reopened.
- **Centrepiece gate:** when the build started from a specific Pokémon, say
  what the team does with the strengths written down at step 1 — which
  partner uses or enables each one. "Nothing uses them" is a finding to raise
  with the user, not a pass.
```

- [ ] **Step 8: Common mistakes and References**

Add to the `## Common mistakes` list:

```markdown
- Filling slots from `meta mon` teammate lists with no card and no `find` run —
  every fact checks out while no pick was evaluated
- Picking partners only to cover the centrepiece's weaknesses, never to use
  its strengths
```

Add to the `## References` list:

```markdown
- `reference/decision-card.md` — the card every species and move pick goes on;
  read at steps 5 and 6
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add .claude/skills/vgc-team-building/SKILL.md .claude/skills/tests/decision-card.test.js
git commit -m "$(cat <<'EOF'
feat(skills): cards and centrepiece-first in vgc-team-building

Step 1 writes down the centrepiece before any usage data, step 5 and 6 put
every pick on a decision card with find always run, and step 7 gains the Q4
and centrepiece gates. Meta suggestions stay welcome; they get the same card.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `vgc-team-refining` — role fit before meta relevance

**Files:**
- Modify: `.claude/skills/vgc-team-refining/SKILL.md`
- Modify: `reference/team-refining.md` (Scope lines 33-34; Process lines 64-96; Changelog)
- Test: `.claude/skills/tests/decision-card.test.js` (append)

**Interfaces:**
- Consumes: Task 3's test helpers and the skeleton block.
- Produces: anchor phrases `1b. **Role fit.**`, `1c. **Meta relevance is context.**` (skill) and `### 1b. Role fit`, `### 1c. Meta relevance is context` (reference). Task 9's scenario 3 quotes them.

- [ ] **Step 1: Write the failing tests**

Append to `.claude/skills/tests/decision-card.test.js`:

```js
const REFINING = '.claude/skills/vgc-team-refining/SKILL.md';

test('vgc-team-refining carries the card skeleton verbatim', () => {
  assert.equal(skeleton(REFINING), skeleton(REFERENCE));
});

test('vgc-team-refining checks role fit before meta relevance', () => {
  assertInOrder(REFINING, ['1b. **Role fit.**', '1c. **Meta relevance is context.**']);
  assertInOrder('reference/team-refining.md', ['### 1b. Role fit', '### 1c. Meta relevance is context']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL — no skeleton block in the refining skill; `1c. **Meta relevance is context.**` missing.

- [ ] **Step 3: Rewrite the skill's step 1**

In `.claude/skills/vgc-team-refining/SKILL.md`, replace the step-1 line

```markdown
1. **Move legality + meta-relevance**, per Pokémon per listed move — legal this regulation (`reference/regulation.md`), and actually run on real current sets (not just legal-but-obscure). Flag mismatches; don't auto-swap, report and let the user decide.
```

with:

```markdown
1. **Move legality**, per Pokémon per listed move — `node tools/dex/cli.js learnset "<Species>" --move "<Move>"`, legal this regulation (`reference/regulation.md`). `illegal` is a hard stop; `unknown` means verify live. Report; don't auto-swap.
```

- [ ] **Step 4: Tighten step 1b's mismatch definition**

In step 1b, directly after the sub-bullet `- Is Protect listed alongside a Choice item? That is a wasted slot.`, add a sub-bullet at the same indentation:

```markdown
    - A move is a **mismatch** only when it breaks the role template without a
      stated reason, sits below the ≥80 BP floor with no stated non-damage job,
      or is the wrong damage category for what the role needs. "Rarely run" is
      not on this list.
```

- [ ] **Step 5: Add step 1c after step 1b**

After step 1b's closing line `Report; do not auto-swap. Species, item and ability remain fixed inputs.`, insert:

````markdown
1c. **Meta relevance is context.** Pull real sets with the **vgc-meta-lookup**
    skill (`meta mon`). How often each move is run goes in the report as
    context — a rarely-run move that passes 1b is **not** a finding. Any move
    flagged in 1b, and any replacement you suggest, goes on a decision card.
    Its options are learnable moves that fit the role; its usage column is each
    move's share on real sets.

<!-- card-skeleton:start -->
‹paste the skeleton body from "The card skeleton" section, unchanged›
<!-- card-skeleton:end -->

**Ability sanity rule:** if `meta mon` shows an ability the species cannot
have (cross-check `dex mon`, and a live source for its full ability list), the
parsed data is broken — say so and do not cite that split.
````

The `‹paste…›` line stands for the fifteen skeleton lines between the markers, at column 0.

- [ ] **Step 6: Common mistakes**

Add to `## Common mistakes`:

```markdown
- Flagging a move as a mismatch because it is rarely run, when it fits the role
- Suggesting a replacement move without putting it on a decision card
```

Add to `## References`:

```markdown
- `reference/decision-card.md` — the card for any flagged or replacement move
```

- [ ] **Step 7: Rewrite `reference/team-refining.md` to match**

In `## Scope`, replace:

```markdown
- Move meta-relevance check (is it actually run on current sets, or
  legal-but-obscure).
```

with:

```markdown
- Move meta-relevance as **context** — how often it is run on current sets.
  Never a mismatch on its own; see [Process](#process), step 1c.
```

In `## Process`, replace the whole `### 1. Move verification (per Pokémon, per listed move)` subsection (its heading and both numbered items) with:

```markdown
### 1. Move legality (per Pokémon, per listed move)

Run `node tools/dex/cli.js learnset "<Species>" --move "<Move>"`. `illegal` is
a hard stop. `unknown` means the species is not in the vendored table — verify
live rather than assuming either way. Also confirm the move is not restricted
this regulation.
```

Keep the existing `### 1b. Role fit` heading and body. Append this bullet to 1b's bullet list, after the Protect-and-Choice-item bullet:

```markdown
- A move is a **mismatch** only when it breaks the role template without a
  stated reason, sits below the floor with no stated non-damage job, or is the
  wrong damage category for what the role needs. "Rarely run" is not on this
  list.
```

Directly after 1b's closing paragraph (ending `...that question belongs to \`vgc-team-building\`.`) and before `### 2. Threat sourcing`, insert:

```markdown
### 1c. Meta relevance is context

Cross-check live per-Pokémon set data (the `vgc-meta-lookup` skill, `meta
mon`). Report how often each move is run, as context. A move that is rarely
run but passes 1b is not a finding — do not flag it for rarity.

Any move flagged in 1b, and any replacement suggested, goes on a decision card
(`reference/decision-card.md`): options are learnable moves that fit the role,
and the usage column is each move's share on real sets. Do not auto-swap —
report and let the user decide.

If `meta mon` shows an ability the species cannot have, the parsed data is
broken: say so and do not cite it.
```

Append a row to the bottom of `reference/team-refining.md`'s `## Changelog`:

```markdown
| 2026-09-14 | Role fit now precedes meta relevance. Split step 1 into 1 (legality) and a new 1c (meta relevance as context): a rarely-run move that fits its role is no longer a finding, because ranking moves by usage copied usage sets instead of judging them. Defined a mismatch in 1b (template break without a reason, below the floor with no non-damage job, wrong category). Flagged and replacement moves go on a decision card. Added the ability sanity rule. Scope line reworded to match. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`; `reference/decision-card.md` |
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add .claude/skills/vgc-team-refining/SKILL.md reference/team-refining.md .claude/skills/tests/decision-card.test.js
git commit -m "$(cat <<'EOF'
feat(skills): refining judges moves on role fit, usage is context

A rarely-run move that fits its role is no longer a mismatch. Flagged and
replacement moves go on a decision card, and implausible meta ability splits
are reported as broken data rather than cited.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `vgc-threat-evaluation` — the "What beats X" path

**Files:**
- Modify: `.claude/skills/vgc-threat-evaluation/SKILL.md`
- Test: `.claude/skills/tests/decision-card.test.js` (append)

**Interfaces:**
- Consumes: Task 3's test helpers and skeleton; `dex find --resists` (Task 1); `meta rank` (Task 2).
- Produces: section heading `## What beats X` — referenced by Task 7's post-game line and Task 9's scenario 2.

- [ ] **Step 1: Write the failing tests**

Append to `.claude/skills/tests/decision-card.test.js`:

```js
const THREAT = '.claude/skills/vgc-threat-evaluation/SKILL.md';

test('vgc-threat-evaluation carries the card skeleton verbatim', () => {
  assert.equal(skeleton(THREAT), skeleton(REFERENCE));
});

test('vgc-threat-evaluation has a What beats X path that uses find --resists', () => {
  assertInOrder(THREAT, ['## What beats X', 'find --resists', '<!-- card-skeleton:start -->', '## Common mistakes']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL — no skeleton; `## What beats X` missing.

- [ ] **Step 3: Add the ability sanity rule to check 2**

In `## The two checks (both required)`, at the end of **2. Actual moveset — pull it live.** (after the sentence ending `...not the dex default.`), add:

```markdown
If `meta mon` reports an ability the species cannot have, the parsed data is
broken — say so and do not cite that split.
```

- [ ] **Step 4: Add the section**

Insert directly **before** `## Common mistakes`:

````markdown
## What beats X

"What beats X", "what answers X", and "what do I bring into X" are candidate
questions, not type-chart questions. Popular answers are welcome as options;
none of them skips the checks.

**1. Pull X's real set.** `node tools/meta/cli.js mon "<X>"` for its moves and
item, and `node tools/dex/cli.js mon "<X>"` for typing and Speed. Note
anything that changes the matchup: priority, a berry that halves a
super-effective hit, setup.

**2. Generate options from the tools, not from recall.**

```bash
node tools/dex/cli.js find --resists <X's STAB type> --resists <X's other STAB type>
node tools/dex/cli.js find --resists <X's STAB type> --learns "<a move that hits X hard>"
```

Add meta suggestions as extra rows; they get the same checks.

**3. Put every option on a decision card**, with usage ranks from
`node tools/meta/cli.js rank "<Option A>" "<Option B>" ...`:

<!-- card-skeleton:start -->
‹paste the skeleton body from "The card skeleton" section, unchanged›
<!-- card-skeleton:end -->

**4. Back Q1 with calcs both ways**, passing X's real item and any weather:
does the option survive X's best hit into it, and does the option's attack
threaten X through that item? A resisted STAB is not an answer until the calc
says the option lives, and a super-effective hit is not an answer until the
calc says it lands through the berry.
````

The `‹paste…›` line stands for the fifteen skeleton lines between the markers, at column 0.

- [ ] **Step 5: Common mistakes and References**

Add to `## Common mistakes`:

```markdown
- Answering "what beats X" from the type chart or from what is popular, with no
  `find` run and no calc in both directions
- Ignoring X's item — a super-effective-reducing berry turns a clean KO into a
  survived hit
```

Add to `## References`:

```markdown
- `reference/decision-card.md` — the card every "what beats X" option goes on
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/vgc-threat-evaluation/SKILL.md .claude/skills/tests/decision-card.test.js
git commit -m "$(cat <<'EOF'
feat(skills): add a What beats X path to vgc-threat-evaluation

The skill verified "does X counter Y" but had no way to generate answers, so
they came from recall or popularity. Options now come from find --resists,
go on a decision card, and need calcs both ways through X's real item.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Audit pick quality, and pointers in post-game and meta-lookup

**Files:**
- Modify: `.claude/skills/vgc-team-audit/SKILL.md`
- Modify: `.claude/skills/vgc-post-game/SKILL.md`
- Modify: `.claude/skills/vgc-meta-lookup/SKILL.md`
- Test: `.claude/skills/tests/decision-card.test.js` (append)

**Interfaces:**
- Consumes: Task 3's test helpers; `## What beats X` (Task 6).
- Produces: anchor `**6a. Pick quality.**` in the audit skill.

- [ ] **Step 1: Write the failing tests**

Append to `.claude/skills/tests/decision-card.test.js`:

```js
for (const rel of [
  '.claude/skills/vgc-team-audit/SKILL.md',
  '.claude/skills/vgc-post-game/SKILL.md',
  '.claude/skills/vgc-meta-lookup/SKILL.md',
]) {
  test(`${rel} points to reference/decision-card.md`, () => {
    assert.ok(read(rel).includes('reference/decision-card.md'), `${rel} lost its pointer to the decision card`);
  });
}

test('vgc-team-audit checks pick quality before the counterweights', () => {
  assertInOrder('.claude/skills/vgc-team-audit/SKILL.md', [
    '- [ ] 6a. Pick quality',
    '**6a. Pick quality.**',
    '**6b. Apply the counterweights',
  ]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL — four new tests.

- [ ] **Step 3: `vgc-team-audit`**

In the `## Checklist` code block, insert a line between `- [ ] 6. Threat matchups` and `- [ ] 6b. Counterweights`:

```
- [ ] 6a. Pick quality
```

Directly before the paragraph beginning `**6b. Apply the counterweights before writing the report.**`, insert:

```markdown
**6a. Pick quality.** Two questions the type chart and the threat list cannot
answer, both from `reference/team-evaluation.md`:

- **Is there a better legal Pokémon for this pick's role?** (rubric question
  4). Name the role, turn it into a `node tools/dex/cli.js find` query, and
  check the strongest result against the pick with questions 1-3. Report "X is
  outclassed by Y for this role" only with Y's `find` query and its Q1-Q3
  answers shown, in the shape of a decision card
  (`reference/decision-card.md`).
- **Does the team use its centrepiece?** If the team was built around a
  specific Pokémon, name what each partner does for that Pokémon's strengths.
  A centrepiece whose strengths nothing on the team uses is a finding.

These are findings, not rebuilds — the scope fence below still holds.
```

Add to `## Common mistakes`:

```markdown
- Passing a team whose picks all check out individually, without asking
  whether a better legal option existed for each role
```

Add to `## References`:

```markdown
- `reference/decision-card.md` — the shape an "outclassed by" finding takes
```

- [ ] **Step 4: `vgc-post-game`**

In `**The repeated-loss trap.**`, after the sentence ending `**once is not a pattern; repeated is.**`, add:

```markdown
That dedicated answer is chosen through `vgc-threat-evaluation`'s "What beats
X" path, on a decision card (`reference/decision-card.md`) — the threat having
a name does not make its most-used answer the right one.
```

- [ ] **Step 5: `vgc-meta-lookup`**

In `## Handing the result onward`, after the first paragraph (ending `...not silently dropped or misread as zero.`), add:

```markdown
**A usage list is a threat list and a source of suggestions, never a
shortlist.** A Pokémon being common is a reason to put it on a decision card
(`reference/decision-card.md`), not a reason to pick it — the card's rubric
decides. And if `meta mon` reports an ability the species cannot legally have,
the parsed data is broken: say so and do not cite the split.
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/vgc-team-audit/SKILL.md .claude/skills/vgc-post-game/SKILL.md .claude/skills/vgc-meta-lookup/SKILL.md .claude/skills/tests/decision-card.test.js
git commit -m "$(cat <<'EOF'
feat(skills): audit pick quality; point post-game and meta-lookup at cards

The audit checked legality, coverage and threats but never whether a better
legal option existed per role or whether the centrepiece was used, so a
top-usage build passed. Post-game answers and meta suggestions now route
through the decision card.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Wiring — `CLAUDE.md`, pitfalls, case study, reference files, README

**Files:**
- Modify: `CLAUDE.md`
- Modify: `reference/pitfalls.md` (Data source pitfalls, after line 90; Changelog)
- Modify: `docs/case-studies.md` (end of "Process-lesson case studies", before `## Data-source misses`)
- Modify: `reference/team-evaluation.md` ("Is this Pokémon good?" intro, line ~129; Changelog)
- Modify: `reference/meta-lookup.md` (Command surface lines 27-35 and after the `mon` example; Changelog)
- Modify: `README.md` (tools examples lines 39-49 and 85-95; reference-file table; Skills section)
- Test: `.claude/skills/tests/decision-card.test.js` (append)

**Interfaces:**
- Consumes: everything from Tasks 1-7 (command names, file names, anchor phrases).
- Produces: the case-study bullet title `A Mega Froslass build that verified every fact and evaluated no pick`, which Task 4's skill text already quotes. Keep it exact.

- [ ] **Step 1: Write the failing test**

Append to `.claude/skills/tests/decision-card.test.js`:

```js
test('CLAUDE.md states the shared rule and routes to the card', () => {
  const text = read('CLAUDE.md');
  assert.ok(text.includes('**Usage can suggest a pick; it never justifies one.**'));
  assert.ok(text.includes('reference/decision-card.md'));
  assert.ok(text.includes('node tools/meta/cli.js rank'));
  assert.ok(text.includes('find --resists'));
});

test('the case study the skills cite exists under that exact title', () => {
  assert.ok(read('docs/case-studies.md').includes('A Mega Froslass build that verified every fact and evaluated no pick'));
});
```

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: FAIL — both new tests.

- [ ] **Step 2: `CLAUDE.md`**

Under `## Teambuilding defaults — these change a build's shape from its first move`, append a fourth bullet after the `**Verifiable is not the same as good.**` bullet:

```markdown
- **Usage can suggest a pick; it never justifies one.** Every species, move,
  or threat answer — however popular — gets a decision card
  (`reference/decision-card.md`) shown in chat before the choice goes to the
  user.
```

In the `## Never state these from recall — run the command` table, directly after the `| Candidates for a roster gap | ... |` row, add:

```markdown
| Where each option ranks in usage (a decision card's usage column) | `node tools/meta/cli.js rank "<Species>" ["<Species>" ...]` |
| Which Pokémon take a type well — options for "what beats X" | `node tools/dex/cli.js find --resists <Type> [--resists <Type>]` |
```

In the `## Where things live` table, directly after the `| Is this Pokémon good / is this team good | ... |` row, add:

```markdown
| Choosing any species, move, or threat answer — the decision card | `reference/decision-card.md` |
```

- [ ] **Step 3: `reference/pitfalls.md`**

In `## Data source pitfalls`, directly after the bullet beginning `- **"Common teammate" co-occurrence stats show correlation, not proven` (ending `...as if it were evidence of a working game plan.`), insert:

```markdown
- **A usage-suggested candidate still needs the whole evaluation.** Every fact
  about a pick can be tool-verified while the pick itself was never evaluated:
  a slot filled off a teammate list, with no `dex find` run and no rubric
  question 4, looks identical to a real decision. Meta picks are fine — put
  them on a decision card (`reference/decision-card.md`) beside the `find`
  results. → `docs/case-studies.md`
- **An ability percentage for an ability the species cannot have means the
  parsed data is broken.** On 2026-09-14 `meta mon` returned Trace /
  Hospitality / Mold Breaker splits for Farigiraf, which can run none of them,
  and the same names appeared in other species' tails. Don't explain an
  implausible split away — cross-check `dex mon` and a live source, say the
  data is broken, and don't cite it.
```

Append a row at the bottom of its `## Changelog`:

```markdown
| 2026-09-14 | Added two Data source pitfalls: a usage-suggested candidate still needs the whole evaluation (a Mega Froslass build verified every fact and evaluated no pick, ending with five of the top six usage picks), and an ability split impossible for the species means the parsed data is broken (Farigiraf showing Trace/Hospitality). | `docs/case-studies.md`; `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`; live `node tools/meta/cli.js mon "Farigiraf"` 2026-09-14 |
```

- [ ] **Step 4: `docs/case-studies.md`**

At the end of `## Process-lesson case studies` — after the paragraph ending `...see the staleness pitfall in \`reference/pitfalls.md\`.` and before `## Data-source misses` — append:

```markdown
- **A Mega Froslass build that verified every fact and evaluated no pick
  (2026-09-14).** Asked to build around Mega Froslass for the M-C ladder as a
  Good Stuff team, the session ended with Froslass plus Sneasler, Incineroar,
  Rillaboom, Kingambit and Basculegion — ranked #2, #3, #1, #5 and #6 by that
  session's own live `meta usage` pull. Every type matchup, learnset, item and
  Mega ability was a real tool call. What got skipped was everything that
  leaves no trace:
  - `reference/roles.md`, `speed-control.md`, `team-evaluation.md` and
    `pitfalls.md` were never opened, though the skill names each at a step.
  - `dex find` ran once, then the most-used result was recommended; every later
    slot's candidates came from `meta mon` teammate lists, and co-occurrence
    was cited as "proven synergy".
  - "(Recommended)" went to the highest-usage option all six times, and rubric
    question 4 was never asked.
  - Partners only covered Froslass's type weaknesses; none used its Snow /
    Aurora Veil / Blizzard kit.
  - Slots were spent on Ground and Rock weaknesses without checking the meta
    exploited them.
  - "A Fighting-type answers Kingambit" had no calc, and Kingambit's common
    Chople Berry was noticed and set aside.
  - Two mechanics were stated from recall and were wrong: Intimidate
    "softening" a Defiant Kingambit (the user caught it) and Grassy Terrain
    "cutting all Ground damage by a third" (`reference/mechanics.md` says it
    halves only Earthquake, Bulldoze and Magnitude, and heals the opponent).
  - Implausible `meta mon` ability splits were explained away until the user
    flagged Farigiraf.

  Caught when the user asked for a review of how the team was built. When the
  fix was first framed as "never source candidates from meta data", the user
  corrected it: meta Pokémon are probably good, but they go through the same
  evaluation. **What changed:** the rule "usage can suggest a pick; it never
  justifies one"; a decision card for every species, move and threat answer
  (`reference/decision-card.md`), copied into three skills and pinned by
  `.claude/skills/tests/decision-card.test.js`; `meta rank` and
  `dex find --resists`; and `docs/regression-scenarios.md`
  (`docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`).
```

- [ ] **Step 5: `reference/team-evaluation.md`**

In `## Is this Pokémon good?`, at the end of the intro paragraph (ending `...meant to be run per candidate while a slot is still open.`), add:

```markdown
**Record the answers on a decision card** (`reference/decision-card.md`) —
questions 1-4 are written down per option there, so a skipped question is
visible instead of silent.
```

Append a row at the bottom of its `## Changelog`:

```markdown
| 2026-09-14 | Pointed the rubric at `reference/decision-card.md` as where questions 1-4 are recorded per option. A build answered none of them while verifying every fact about its picks, because nothing made a skipped question visible. No rubric question changed. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`; `docs/case-studies.md` |
```

- [ ] **Step 6: `reference/meta-lookup.md`**

In `## Command surface`, in the code block, after the line
`node tools/meta/cli.js usage [--format <code>]           ranked list` add:

```
node tools/meta/cli.js rank <Species> [<Species> ...] [--format <code>]
                                               where each option ranks — one fetch
```

After the `**mon <Species> [--format <code>]**` paragraph and its example block (ending with `(live output, this session, matching \`tools/meta/tests/fixtures/tournaments-garchomp.md\`)`), and before `## Team-level surfaces: \`cores\` and \`teams\``, insert:

````markdown
**`rank <Species> [<Species> ...] [--format <code>]`** — fills a decision
card's usage column (`reference/decision-card.md`) in one fetch. Per name:
`query`, `dexName`, `usageSpecies`, `isMega`, `rank`, `usage`, `winRate`,
`record`, `reason`.

- Accepts `"Mega Froslass"` (dex naming, as `dex find` prints it) or
  `"Froslass-Mega"` (Pikalytics naming), converted through `megas.js`.
- A Mega reports its **base species' row** with a `note`, because Pikalytics
  logs Mega battles under the base — the rank is not the Mega's own.
- Every name is validated against the dex first: a misspelling is a row
  `error`, never a silent `rank: null`. A real species not in the table is
  `rank: null` with `reason: "outside the top 50 of this format"`.
- `anchoring.allWithinThreshold` is `true` when every resolved name ranks in
  the top 10; its `message` is the sentence the card must carry. A note, not a
  failure — meta picks are allowed.

```bash
node tools/meta/cli.js rank "Mega Froslass" "Sneasler" "Tauros-Paldea-Combat"
```
````

At the **top** of `## Changelog` (directly under the `|---|---|---|` header row), insert:

```markdown
| 2026-09-14 | Documented the new `rank` command: one-fetch usage ranks for a decision card, dual naming convention, Mega base-row note, dex validation so a typo errors instead of reading as "outside the top 50", and the top-10 anchoring note. | `tools/meta/{rank.js,cli.js}`, `tools/meta/tests/rank.test.js`; `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md` |
```

- [ ] **Step 7: `README.md`**

In the `tools/dex/` bash block, after the `find --type Flying ...` line, add:

```bash
node tools/dex/cli.js find --resists Dark --resists Steel --learns "Close Combat"  # options for "what beats X"
```

In the `tools/meta/` bash block, after the `usage --format championstournaments` line, add:

```bash
node tools/meta/cli.js rank "Mega Froslass" "Sneasler"    # usage rank per option, for a decision card
```

In the `## Reference files` table, after the `reference/team-evaluation.md` row, add:

```markdown
| [`reference/decision-card.md`](reference/decision-card.md) | The rule "usage can suggest a pick; it never justifies one", and the seven-field card every species, move and threat-answer choice goes on before the user picks. |
```

In `## Skills`, after the skills table, add:

```markdown
`.claude/skills/tests/` holds Node tests that fail if the decision-card
skeleton drifts between `reference/decision-card.md` and the skills that copy
it, if a skill loses its pointer to the card, or if the shared rule is deleted
from `CLAUDE.md`. They catch rules being removed, not rules being ignored —
`docs/regression-scenarios.md` covers that. Run with `npm test`.
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `node --test .claude/skills/tests/decision-card.test.js`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run each command added to docs in this task and confirm none returns an `error` object:

```bash
node tools/dex/cli.js find --resists Dark --resists Steel --learns "Close Combat"
node tools/meta/cli.js rank "Mega Froslass" "Sneasler" "Tauros-Paldea-Combat"
```

Expected: both print JSON with no top-level `error`.

- [ ] **Step 9: Commit**

```bash
git add CLAUDE.md reference/pitfalls.md docs/case-studies.md reference/team-evaluation.md reference/meta-lookup.md README.md .claude/skills/tests/decision-card.test.js
git commit -m "$(cat <<'EOF'
docs: wire decision cards, rank and --resists into the rulebook

CLAUDE.md gains the shared rule and command rows, pitfalls gains the
evaluation and broken-ability-data traps, and the Mega Froslass build is
recorded as a case study so the rule's reason stays attached to it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `docs/regression-scenarios.md`

**Files:**
- Create: `docs/regression-scenarios.md`

**Interfaces:**
- Consumes: anchor phrases and command names from Tasks 1-8.
- Produces: the manual regression suite the spec requires. No code depends on it.

- [ ] **Step 1: Verify the facts scenario 3 depends on**

```bash
node tools/dex/cli.js learnset "Froslass" --move "Icy Wind"
node tools/dex/cli.js move "Icy Wind"
```

Expected: `verdict: "legal"`; `bp: 55`, `category: "Special"`, `isSpread: true`. If either differs, rewrite scenario 3's setup to a move that is legal, below 80 BP, and has a stated non-damage job, and record the substitution in the file's changelog row.

- [ ] **Step 2: Create the file**

````markdown
# Regression scenarios — do the evaluation rules actually bind?

`.claude/skills/tests/decision-card.test.js` fails when a rule is **deleted**.
Nothing automated can tell whether a rule is **followed**. These scenarios do
that, by hand.

**When to run:** after any change to a file in `.claude/skills/`, to
`CLAUDE.md`, or to `reference/decision-card.md`, `roles.md`,
`team-evaluation.md` or `archetypes.md`.

**How to run:**

1. Open a **fresh** Claude Code session in this repo — not the session that
   made the change, which already carries its context.
2. Paste the scenario's prompt exactly. Answer any question it asks with the
   scripted answer; otherwise let it run.
3. Read the transcript against the pass criteria. Each is checkable by reading
   — no judgement call about quality.
4. Add a row to that scenario's results log. Any **FAIL** is a finding: fix the
   skill text, or, if the text is right and still skipped, raise the blocking
   hook recorded as the escalation in
   `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`.

## Contents

- [Scenario 1 — build around Mega Froslass](#scenario-1--build-around-mega-froslass)
- [Scenario 2 — what beats Kingambit](#scenario-2--what-beats-kingambit)
- [Scenario 3 — refine a team where Froslass runs Icy Wind](#scenario-3--refine-a-team-where-froslass-runs-icy-wind)
- [Changelog](#changelog)

## Scenario 1 — build around Mega Froslass

**Prompt:**

> I feel like Froslass-Mega should be a good Pokémon to build a team around in
> this meta but I've been having difficulty with it.

**Scripted answers:** struggles — "dies easily, especially to Kingambit and
Incineroar and psyspam with Armarouge, and no real team around it"; direction —
"flexible Good Stuff"; venue — "ladder only". For each slot, pick the option the
card recommends. Stop after the six species and their moves are chosen.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 1.1 | The centrepiece's strengths and weaknesses are written in chat **before** any `meta` command runs | Find the first `node tools/meta/cli.js` call; the write-up comes before it |
| 1.2 | Every species pick has a decision card, shown before the pick question | Count species questions; count cards; equal |
| 1.3 | Every species card's field 4 shows a `node tools/dex/cli.js find` command that was actually run | Match each pasted command to a tool call |
| 1.4 | Every species card's usage column came from `node tools/meta/cli.js rank` | A `rank` call precedes each card |
| 1.5 | Q4 is answered on every option row of every card | No blank Q4 cell |
| 1.6 | No recommendation gives usage rank, win rate or a teammate rate as its reason | Read each field 6 |
| 1.7 | Every move pick has a card | Count move choices; count move cards |
| 1.8 | The step-7 **Centrepiece gate:** is stated, naming what uses each Froslass strength | Search the transcript for the gate |
| 1.9 | The step-7 **Q4 gate:** is stated | Search the transcript for the gate |
| — | *Report only, not pass/fail:* how many of the final five partners are in the top 6 by usage | `meta rank` on the final six |

**Results log**

| Date | Model | 1.1 | 1.2 | 1.3 | 1.4 | 1.5 | 1.6 | 1.7 | 1.8 | 1.9 | Top-6 overlap | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Scenario 2 — what beats Kingambit

**Prompt:**

> What beats Kingambit right now? I want something to put on a ladder team.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 2.1 | Kingambit's real set is pulled with `node tools/meta/cli.js mon "Kingambit"` before any option is named | Order of tool calls |
| 2.2 | `node tools/dex/cli.js find --resists ...` is run to generate options | Tool call present |
| 2.3 | At least 3 options, each on a decision card | Count rows |
| 2.4 | Each option has a damage calc **from** Kingambit into it and one **from** it into Kingambit | Two `tools/damage-calc/cli.js` calls per option |
| 2.5 | The calcs into Kingambit pass its most common item from 2.1 (e.g. `--defender-item "Chople Berry"` if that is still the top item) | Read the calc flags |
| 2.6 | No option is called an answer on typing alone | Every "answers"/"beats" claim cites a calc |

**Results log**

| Date | Model | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | Notes |
|---|---|---|---|---|---|---|---|---|

## Scenario 3 — refine a team where Froslass runs Icy Wind

Verified 2026-09-14: Icy Wind is `legal` for Froslass, 55 BP, Special, spread,
and absent from Froslass's top-10 moves in live M-C data.

**Prompt:**

> Refine this team. Froslass @ Froslassite, Snow Warning: Blizzard / Icy Wind /
> Aurora Veil / Protect. Incineroar @ Sitrus Berry, Intimidate: Fake Out /
> Parting Shot / Flare Blitz / Will-O-Wisp. Rillaboom @ Leftovers, Grassy Surge:
> Fake Out / Grassy Glide / Wood Hammer / U-turn. Kingambit @ Chople Berry,
> Defiant: Kowtow Cleave / Sucker Punch / Iron Head / Protect. Sneasler @ Grassy
> Seed, Unburden: Close Combat / Dire Claw / Fake Out / Protect. Basculegion @
> Life Orb, Swift Swim: Wave Crash / Last Respects / Aqua Jet / Protect.
> Froslass is the speed-control lead.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 3.1 | Role fit (step 1b) is checked before meta relevance (step 1c) | Order in the report |
| 3.2 | Icy Wind is **not** flagged for being rarely run | Read the Icy Wind finding |
| 3.3 | Icy Wind is checked against the ≥80 BP floor and accepted or rejected on a stated speed-control job | Read the Icy Wind finding |
| 3.4 | Any replacement suggested for any move is on a decision card | Count suggestions; count cards |
| 3.5 | Nothing is auto-swapped; species, item and ability are left as given | Read the report |
| 3.6 | If an ability split looks impossible for its species, it is called broken data, not cited | Read any ability claims |

**Results log**

| Date | Model | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | 3.6 | Notes |
|---|---|---|---|---|---|---|---|---|

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-14 | Created with three scenarios — a favourite-Pokémon build, a "what beats X" question, and a refining pass with a rare but role-fitting move — each with transcript-checkable pass criteria and an empty results log. Scenario 3's Icy Wind facts verified via `dex learnset` and `dex move`. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md` |
````

- [ ] **Step 3: Check every command in the file runs**

```bash
node tools/meta/cli.js mon "Kingambit"
node tools/dex/cli.js find --resists Dark --resists Steel
node tools/meta/cli.js rank "Mega Froslass"
```

Expected: JSON with no top-level `error` for each.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/regression-scenarios.md
git commit -m "$(cat <<'EOF'
docs: add regression scenarios for whether the evaluation rules bind

The skill-text test only catches deleted rules. Three scripted prompts with
transcript-checkable criteria cover the part it cannot: a fresh session
actually filling cards, running find, and not ranking by usage.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Shared rule in `CLAUDE.md` | 8 |
| Decision card: skeleton, scope, option counts, in-chat placement | 3 |
| `vgc-team-building`: centrepiece first, meta framing, card per slot and move, Q4 and centrepiece gates, common mistake | 4 |
| `vgc-team-refining`: role fit ahead of meta relevance, mismatch definition, card for flagged/replacement moves, ability sanity rule | 5 |
| `vgc-threat-evaluation`: "What beats X" path, calcs both ways through the item | 6 |
| `vgc-team-audit` pick quality; `vgc-post-game` and `vgc-meta-lookup` pointers and suggestions framing | 7 |
| `meta rank` (dual naming, dex validation, Mega note, anchoring) | 2 |
| `dex find --resists` (AND, immunity, Mega typing, invalid type) | 1 |
| Skill-text tests (skeleton, pointers, `CLAUDE.md` rule, ordering anchors) | 3-8 |
| `docs/regression-scenarios.md`, three scenarios | 9 |
| Docs: `pitfalls.md`, case study, `team-evaluation.md`, `meta-lookup.md`, `README.md`, changelog rows | 5, 8 |

**One deliberate deviation from the spec's sequencing:** the spec lists "skill-text test first (red), then `reference/decision-card.md`, then the six skill edits". Committing a red test would break the spec's other requirement that `npm test` stay green at every step. This plan keeps both by making each skill task red-then-green internally: the test file starts in Task 3 with reference-file assertions only, and each later task adds its own assertions immediately before the edit that satisfies them.

**Also touched, not named in the spec:** `reference/team-refining.md` (Task 5). The refining skill cites it as its full process, and leaving its "flag rarely-run moves" rule in place would contradict the skill edit.

**Type and name consistency checked:** `rankFromUsage`, `ANCHOR_THRESHOLD`, row fields (`query`, `dexName`, `usageSpecies`, `isMega`, `note`, `rank`, `usage`, `winRate`, `record`, `reason`, `error`), `anchoring.{threshold, allWithinThreshold, message}`; test helpers `read`, `skeleton`, `assertInOrder`, `REFERENCE`; anchor phrases `**Centrepiece first, before any meta data.**`, `**Q4 gate:**`, `**Centrepiece gate:**`, `1b. **Role fit.**`, `1c. **Meta relevance is context.**`, `### 1b. Role fit`, `### 1c. Meta relevance is context`, `## What beats X`, `- [ ] 6a. Pick quality`, `**6a. Pick quality.**`; case-study title `A Mega Froslass build that verified every fact and evaluated no pick` — identical in Tasks 4, 8.

**Existing anchors relied on, verified present in the current files:** `**2. Regulation check, fresh this session, then a live meta scan.**`, `**7. Team-level gates`, `**8. Solve the numbers for SP` (vgc-team-building); `1b. **Role fit.**` (vgc-team-refining); `### 1b. Role fit` (team-refining.md); `**6b. Apply the counterweights` and `- [ ] 6b. Counterweights` (vgc-team-audit).

**Test data verified 2026-09-14 against `tools/meta/tests/fixtures/ranked-index-mc.md`:** 50 rows; Rillaboom #1, Incineroar #3, Floette-Eternal #11, Froslass #34; Pikachu in the dex and absent from the table. Against the dex: Mega Staraptor Fighting/Flying (0.5× Dark), Staraptor Normal/Flying (1× Dark); `megas.resolve` maps Mega Floette to base `Floette-Eternal`; `dex.mon("Frosslass")` and `dex.mon("Froslass-Mega")` both throw `Unknown Pokemon`.
