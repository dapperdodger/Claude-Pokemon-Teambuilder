# tools/meta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad-hoc Pikalytics HTML scraping with `tools/meta`, a CLI over Pikalytics' documented agent API that returns validated JSON and fails loudly instead of returning plausible-looking holes.

**Architecture:** A thin CLI over a library, mirroring `tools/dex`. Pure parsers (`parse.js`) are tested against committed fixtures with no network. A validation layer rejects the site's sentinel values before they reach output. A per-format registry records which metrics each upstream actually carries and which regulation it belongs to. Mega queries resolve to base species + stone, because the ladder upstream aggregates by base species.

**Tech Stack:** Node.js (CommonJS, matching `tools/dex`), `node:test` + `node:assert/strict`, `curl` via `node:child_process` for HTTP (already used in `.claude/hooks`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-08-meta-usage-tool-design.md`

## Global Constraints

- **CommonJS**, not ESM — matches every existing tool in this repo.
- **No new npm dependencies.** Parsing is regex over markdown; HTTP is `curl`.
- **One JSON object per CLI invocation**, printed with `JSON.stringify(x, null, 2)`, exit 0 on success and 1 on error, exactly as `tools/dex/cli.js` does.
- **Never emit a sentinel as a number.** `N/A`, `N/A%`, `undefined`, `undefined%`, `NaN%`, `null`, `high%` must never appear in a numeric output field.
- **A metric a format does not carry is `{value: null, reason: "<why>"}`** — never a missing key, never `0`.
- Tests run under the existing `npm test` glob; add `"tools/meta/tests/*.test.js"` to the `test` script in `package.json`.
- Repo terminology: **Stat Points (SP)**, never EVs.

---

### Task 1: Fixtures and the per-page header parser

**Files:**
- Create: `tools/meta/tests/fixtures/ranked-index.md`
- Create: `tools/meta/tests/fixtures/ranked-raichu.md`
- Create: `tools/meta/tests/fixtures/ranked-raichu-mega-y.md`
- Create: `tools/meta/tests/fixtures/filler-index.md`
- Create: `tools/meta/tests/fixtures/tournaments-index.md`
- Create: `tools/meta/tests/fixtures/tournaments-garchomp.md`
- Create: `tools/meta/parse.js`
- Create: `tools/meta/tests/parse.test.js`
- Modify: `package.json` (test glob)

**Interfaces:**
- Consumes: nothing.
- Produces: `parse.parseQuickInfo(text) -> {format, formatCode, game, usage, winRate, record, dataDate}` (all raw strings or `null`); `parse.parseFormatInfo(text) -> {label, code, game, dataDate}`.

- [ ] **Step 1: Capture the fixtures**

```bash
mkdir -p tools/meta/tests/fixtures
B=https://www.pikalytics.com/ai/pokedex
curl -s "$B/battledataregmbs3"                 > tools/meta/tests/fixtures/ranked-index.md
curl -s "$B/battledataregmbs3/Raichu"          > tools/meta/tests/fixtures/ranked-raichu.md
curl -s "$B/battledataregmbs3/Raichu-Mega-Y"   > tools/meta/tests/fixtures/ranked-raichu-mega-y.md
curl -s "$B/gen9championsvgc2026regmbbo3"      > tools/meta/tests/fixtures/filler-index.md
curl -s "$B/championstournaments"              > tools/meta/tests/fixtures/tournaments-index.md
curl -s "$B/championstournaments/Garchomp"     > tools/meta/tests/fixtures/tournaments-garchomp.md
wc -c tools/meta/tests/fixtures/*.md
```

Each file must be non-empty. `ranked-raichu.md` must contain `**Win Rate** | 48.411%` and `ranked-raichu-mega-y.md` must contain `**Win Rate** | N/A`. If they do not, upstream has changed — stop and report rather than adapting the tests.

- [ ] **Step 2: Write the failing test**

Create `tools/meta/tests/parse.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parse = require('../parse');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('parseQuickInfo reads a real per-Pokemon header', () => {
  const q = parse.parseQuickInfo(fx('ranked-raichu.md'));
  assert.equal(q.formatCode, 'battledataregmbs3');
  assert.equal(q.winRate, '48.411%');
  assert.equal(q.record, '3527-3759-14');
  assert.equal(q.usage, 'N/A');
  assert.equal(q.dataDate, '2026-05');
});

test('parseQuickInfo returns sentinels verbatim rather than cleaning them', () => {
  // The Mega stub carries N/A for everything. Cleaning here would hide it from
  // the validator, which is the layer that must decide what a sentinel means.
  const q = parse.parseQuickInfo(fx('ranked-raichu-mega-y.md'));
  assert.equal(q.winRate, 'N/A');
  assert.equal(q.record, 'N/A');
});

test('parseFormatInfo reads the index header', () => {
  const f = parse.parseFormatInfo(fx('ranked-index.md'));
  assert.equal(f.code, 'battledataregmbs3');
  assert.match(f.label, /Regulation Set M-B S3/);
  assert.equal(f.dataDate, '2026-05');
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `node --test tools/meta/tests/parse.test.js`
Expected: FAIL — `Cannot find module '../parse'`.

- [ ] **Step 4: Implement `parse.js`**

```js
'use strict';
// Parsers for Pikalytics' /ai/* markdown. Pure string -> data; no network, no
// validation, no cleaning. Sentinels ("N/A", "undefined%") are returned exactly
// as they appear, because deciding what a sentinel MEANS is validate.js's job
// and differs by context: "N/A" usage on a ladder format is a fact about the
// upstream, while "N/A" win rate on a Mega page means the wrong entity was asked.

// Quick Info is a two-column markdown table: | **Key** | Value |
function tableField(text, key) {
  const re = new RegExp(`\\|\\s*\\*\\*${key}\\*\\*\\s*\\|\\s*([^|\\n]+?)\\s*\\|`);
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

// Format Information is a bullet list: - **Key**: Value
function bulletField(text, key) {
  const re = new RegExp(`^-\\s*\\*\\*${key}\\*\\*:\\s*(.+)$`, 'm');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function parseQuickInfo(text) {
  const format = tableField(text, 'Format');
  // "Pokemon Champions ... (`battledataregmbs3`)" -> the backticked code
  const codeMatch = format && format.match(/`([^`]+)`/);
  return {
    format: format ? format.replace(/\s*\(`[^`]+`\)\s*$/, '') : null,
    formatCode: codeMatch ? codeMatch[1] : null,
    game: tableField(text, 'Game'),
    usage: tableField(text, 'Usage'),
    winRate: tableField(text, 'Win Rate'),
    record: tableField(text, 'Record'),
    dataDate: tableField(text, 'Data Date'),
  };
}

function parseFormatInfo(text) {
  const code = bulletField(text, 'Format Code');
  return {
    label: bulletField(text, 'Format'),
    code: code ? code.replace(/`/g, '') : null,
    game: bulletField(text, 'Game'),
    dataDate: bulletField(text, 'Data Date'),
  };
}

module.exports = { parseQuickInfo, parseFormatInfo };
```

- [ ] **Step 5: Run the test and watch it pass**

Run: `node --test tools/meta/tests/parse.test.js`
Expected: PASS, 3/3.

- [ ] **Step 6: Wire the test glob**

In `package.json`, change the `test` script to append `"tools/meta/tests/*.test.js"`:

```json
"test": "node --test \"tools/damage-calc/tests/*.test.js\" \"tools/dex/tests/*.test.js\" \"tools/meta/tests/*.test.js\" \".claude/hooks/tests/*.test.js\""
```

Run: `npm test` — expected: all previously passing tests still pass, plus 3 new.

- [ ] **Step 7: Commit**

```bash
git add tools/meta package.json
git commit -m "feat(meta): fixtures and header parsers for the Pikalytics agent API"
```

---

### Task 2: Sentinel validation

**Files:**
- Create: `tools/meta/validate.js`
- Create: `tools/meta/tests/validate.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `validate.SENTINELS` (array of strings); `validate.toNumber(raw, reason) -> {value: number|null, reason: string|null}`; `validate.isSentinel(raw) -> boolean`.

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/validate.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const validate = require('../validate');

test('a real percentage becomes a number', () => {
  assert.deepEqual(validate.toNumber('60.5%', 'x'), { value: 60.5, reason: null });
  assert.deepEqual(validate.toNumber('48.411%', 'x'), { value: 48.411, reason: null });
  assert.deepEqual(validate.toNumber('30%', 'x'), { value: 30, reason: null });
});

test('every known sentinel becomes null WITH the supplied reason', () => {
  for (const s of ['N/A', 'N/A%', 'undefined', 'undefined%', 'NaN%', 'null', 'high%']) {
    const r = validate.toNumber(s, 'ladder carries no usage');
    assert.equal(r.value, null, `${s} must not produce a number`);
    assert.equal(r.reason, 'ladder carries no usage', `${s} must carry a reason`);
  }
});

test('a sentinel never silently becomes zero', () => {
  // The whole point: 0 reads as "unused", null-with-reason reads as "not measured".
  assert.notEqual(validate.toNumber('N/A%', 'r').value, 0);
});

test('an unrecognised non-numeric string is an error, not a silent null', () => {
  assert.throws(() => validate.toNumber('probably high', 'r'), /unparseable/i);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/validate.test.js`
Expected: FAIL — `Cannot find module '../validate'`.

- [ ] **Step 3: Implement `validate.js`**

```js
'use strict';
// The layer that stops Pikalytics' placeholder strings becoming numbers.
//
// Every entry below has been observed live (2026-09-08): "N/A" usage on ladder
// formats, "undefined%" in every Common Teammates block, "high%" in the format
// FAQ prose, and "N/A%" filling the usage column of an empty dataset. Each one
// reads as a real value to anything that does not check, and "0" is the worst
// possible rendering because it reads as "measured, and unused".

const SENTINELS = ['N/A', 'N/A%', 'undefined', 'undefined%', 'NaN%', 'NaN', 'null', 'high%', '-', ''];

function isSentinel(raw) {
  return raw === null || raw === undefined || SENTINELS.includes(String(raw).trim());
}

// `reason` explains why the value is absent, and is required: a null with no
// reason is the hole this tool exists to eliminate.
function toNumber(raw, reason) {
  if (!reason) throw new Error('toNumber requires a reason for a possible null');
  if (isSentinel(raw)) return { value: null, reason };
  const m = String(raw).trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  if (!m) throw new Error(`unparseable numeric value: ${JSON.stringify(raw)}`);
  return { value: Number(m[1]), reason: null };
}

module.exports = { SENTINELS, isSentinel, toNumber };
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/meta/tests/validate.test.js`
Expected: PASS, 4/4.

- [ ] **Step 5: Commit**

```bash
git add tools/meta/validate.js tools/meta/tests/validate.test.js
git commit -m "feat(meta): reject Pikalytics sentinel values before they become numbers"
```

---

### Task 3: Percentage-list parsing (moves, abilities, items)

**Files:**
- Modify: `tools/meta/parse.js`
- Modify: `tools/meta/tests/parse.test.js`

**Interfaces:**
- Consumes: `parse.parseQuickInfo` (Task 1), `validate.toNumber` (Task 2).
- Produces: `parse.parsePercentList(text, heading) -> Array<{name: string, percentRaw: string}>`.

- [ ] **Step 1: Write the failing test**

Append to `tools/meta/tests/parse.test.js`:

```js
test('parsePercentList reads the item distribution, Mega stones included', () => {
  const items = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Items');
  assert.equal(items[0].name, 'Raichunite Y');
  assert.equal(items[0].percentRaw, '60.5%');
  assert.equal(items[1].name, 'Raichunite X');
  assert.equal(items[1].percentRaw, '18.2%');
  assert.ok(items.length >= 5);
});

test('parsePercentList preserves undefined% rather than dropping the row', () => {
  // Dropping it would make a broken section look like an empty one.
  const mates = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Teammates');
  assert.ok(mates.length > 0);
  assert.ok(mates.every((m) => m.percentRaw === 'undefined%'));
});

test('parsePercentList returns an empty array for an absent section', () => {
  // Floette-Eternal legitimately has no Featured Teams; absence is not an error.
  assert.deepEqual(parse.parsePercentList(fx('ranked-raichu.md'), 'No Such Section'), []);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/parse.test.js`
Expected: FAIL — `parse.parsePercentList is not a function`.

- [ ] **Step 3: Implement**

Add to `tools/meta/parse.js`, before `module.exports`:

```js
// Sections are "## <heading>" followed by "- **Name**: 12.3%" bullets.
function sectionBody(text, heading) {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'm');
  const m = text.match(re);
  if (!m) return null;
  const after = text.slice(m.index + m[0].length);
  return after.split(/^##\s+/m)[0];
}

function parsePercentList(text, heading) {
  const body = sectionBody(text, heading);
  if (body === null) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s*\*\*(.+?)\*\*:\s*(.+?)\s*$/);
    if (m) out.push({ name: m[1], percentRaw: m[2] });
  }
  return out;
}
```

Add `sectionBody` and `parsePercentList` to the exports.

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/meta/tests/parse.test.js`
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add tools/meta/parse.js tools/meta/tests/parse.test.js
git commit -m "feat(meta): parse move/ability/item percentage lists"
```

---

### Task 4: Usage-table parsing and the alphabetical-filler guard

**Files:**
- Modify: `tools/meta/parse.js`
- Modify: `tools/meta/validate.js`
- Modify: `tools/meta/tests/parse.test.js`
- Modify: `tools/meta/tests/validate.test.js`

**Interfaces:**
- Consumes: `parse.sectionBody` (Task 3), `validate.isSentinel` (Task 2).
- Produces: `parse.parseUsageTable(text) -> Array<{rank, species, usageRaw, winRateRaw, recordRaw}>`; `validate.assertNotFiller(rows, formatCode)` — throws on an empty-dataset table.

- [ ] **Step 1: Write the failing tests**

Append to `tools/meta/tests/parse.test.js`:

```js
test('parseUsageTable reads the ranked index', () => {
  const rows = parse.parseUsageTable(fx('ranked-index.md'));
  assert.equal(rows.length, 50);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[0].species, 'Garchomp');
  assert.equal(rows[0].usageRaw, 'N/A%');       // ladder carries no usage
  assert.equal(rows[0].winRateRaw, '48.05%');
  assert.equal(rows[0].recordRaw, '10833-11714-41');
});

test('parseUsageTable reads real usage from the tournament index', () => {
  const rows = parse.parseUsageTable(fx('tournaments-index.md'));
  assert.equal(rows[0].species, 'Kingambit');
  assert.equal(rows[0].usageRaw, '35.59%');
  assert.equal(rows[0].winRateRaw, '51.397%');
});
```

Append to `tools/meta/tests/validate.test.js`:

```js
const fs = require('node:fs');
const path = require('node:path');
const parse = require('../parse');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('REGRESSION: the alphabetical empty dataset is rejected', () => {
  // gen9championsvgc2026regmbbo3 returns 50 well-formed rank-ordered rows that
  // are the dex in alphabetical order with N/A in every metric column, plus
  // prose claiming the format "is currently led by Abomasnow". Complete,
  // confident and meaningless — the same shape as a stale slug.
  const rows = parse.parseUsageTable(fx('filler-index.md'));
  assert.equal(rows.length, 50);
  assert.equal(rows[0].species, 'Abomasnow');
  assert.throws(
    () => validate.assertNotFiller(rows, 'gen9championsvgc2026regmbbo3'),
    /empty dataset|alphabetical/i
  );
});

test('a real ranked table passes the filler guard despite N/A usage', () => {
  // The ladder table also has N/A in the usage column. What distinguishes it is
  // that it is NOT alphabetical and its other metrics are real.
  const rows = parse.parseUsageTable(fx('ranked-index.md'));
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'battledataregmbs3'));
});

test('a real tournament table passes the filler guard', () => {
  const rows = parse.parseUsageTable(fx('tournaments-index.md'));
  assert.doesNotThrow(() => validate.assertNotFiller(rows, 'championstournaments'));
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `node --test tools/meta/tests/parse.test.js tools/meta/tests/validate.test.js`
Expected: FAIL — `parse.parseUsageTable is not a function`, `validate.assertNotFiller is not a function`.

- [ ] **Step 3: Implement the parser**

Add to `tools/meta/parse.js` and export:

```js
// | Rank | Pokemon | Usage % | Win Rate | Record | Web Page | AI Data |
function parseUsageTable(text) {
  const body = sectionBody(text, 'Best 50 Pokemon by Usage');
  if (body === null) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/);
    if (m) {
      out.push({
        rank: Number(m[1]),
        species: m[2],
        usageRaw: m[3],
        winRateRaw: m[4],
        recordRaw: m[5],
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Implement the guard**

Add to `tools/meta/validate.js` and export:

```js
// An empty dataset renders as the full dex in alphabetical order with sentinels
// in every metric column. It is well-formed, rank-ordered, and completely
// meaningless. Detect it structurally: real usage tables are ordered by usage,
// so alphabetical ordering combined with no real metric anywhere is the tell.
function assertNotFiller(rows, formatCode) {
  if (!rows.length) return;
  const names = rows.map((r) => r.species);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  const alphabetical = names.every((n, i) => n === sorted[i]);
  const noRealMetric = rows.every(
    (r) => isSentinel(r.usageRaw) && isSentinel(r.winRateRaw) && isSentinel(r.recordRaw)
  );
  if (alphabetical && noRealMetric) {
    throw new Error(
      `Format "${formatCode}" returned an empty dataset: ${rows.length} rows in alphabetical ` +
      `order with no real metric in any column (first: ${names[0]}). The page renders as a ` +
      `complete usage table but contains no data. Do not use this format.`
    );
  }
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 6: Commit**

```bash
git add tools/meta parse.js validate.js tools/meta/tests
git commit -m "feat(meta): reject the alphabetical empty-dataset format"
```

---

### Task 5: Mega entity resolution

**Files:**
- Create: `tools/meta/megas.js`
- Create: `tools/meta/tests/megas.test.js`

**Interfaces:**
- Consumes: `tools/damage-calc/vendor/item_data.js` — `LOCK_ITEM_LOOKUP` (Mega forme → stone, e.g. `'Mega Raichu Y': 'Raichunite Y'`) and `MEGA_STONE_USER_LOOKUP` (stone → base species, e.g. `'Raichunite Y': 'Raichu'`).
- Produces: `megas.pikaToDex(name) -> string`; `megas.dexToPika(name) -> string`; `megas.resolve(pikaName) -> {isMega: boolean, base: string, stone: string|null, dexName: string|null}`.

**Why this task exists:** the ladder upstream logs battles against the **base species** and encodes the Mega as a held item. `Raichu-Mega-Y` is a generated stub with `N/A` win rate and `undefined%` items; the real data is `Raichu` plus `Raichunite Y: 60.5%`. Querying the stub makes a Pokémon that is 60.5% of all Raichu look unused. Staraptor is the extreme case at **94.5% Staraptite**.

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/megas.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const megas = require('../megas');

test('Pikalytics and dex Mega naming convert both ways', () => {
  assert.equal(megas.pikaToDex('Raichu-Mega-Y'), 'Mega Raichu Y');
  assert.equal(megas.pikaToDex('Staraptor-Mega'), 'Mega Staraptor');
  assert.equal(megas.dexToPika('Mega Raichu Y'), 'Raichu-Mega-Y');
  assert.equal(megas.dexToPika('Mega Staraptor'), 'Staraptor-Mega');
});

test('a hyphenated non-Mega name is left alone', () => {
  // Floette-Eternal and Rotom-Wash must not be mangled by the -Mega- rule.
  assert.equal(megas.pikaToDex('Floette-Eternal'), 'Floette-Eternal');
  assert.equal(megas.pikaToDex('Rotom-Wash'), 'Rotom-Wash');
  assert.equal(megas.resolve('Rotom-Wash').isMega, false);
  assert.equal(megas.resolve('Rotom-Wash').base, 'Rotom-Wash');
});

test('REGRESSION: a Mega resolves to its base species and stone', () => {
  const r = megas.resolve('Raichu-Mega-Y');
  assert.equal(r.isMega, true);
  assert.equal(r.base, 'Raichu');
  assert.equal(r.stone, 'Raichunite Y');
  assert.equal(r.dexName, 'Mega Raichu Y');
});

test('REGRESSION: Staraptor-Mega resolves, the near-universal-Mega case', () => {
  const r = megas.resolve('Staraptor-Mega');
  assert.equal(r.base, 'Staraptor');
  assert.equal(r.stone, 'Staraptite');
});

test('X and Y variants resolve to different stones', () => {
  assert.equal(megas.resolve('Raichu-Mega-X').stone, 'Raichunite X');
  assert.equal(megas.resolve('Raichu-Mega-Y').stone, 'Raichunite Y');
});

test('an unknown Mega name throws rather than guessing a stone', () => {
  assert.throws(() => megas.resolve('Notamon-Mega'), /no Mega Stone/i);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/megas.test.js`
Expected: FAIL — `Cannot find module '../megas'`.

- [ ] **Step 3: Implement `megas.js`**

```js
'use strict';
// Pikalytics' ladder upstream aggregates by BASE species and encodes the Mega
// as a held item, so "Raichu" + "Raichunite Y" IS Mega Raichu Y. The
// "Raichu-Mega-Y" page is generated from the dex and has no rows behind it:
// N/A win rate, undefined% items. Asking it makes a Pokemon that is 60.5% of
// all Raichu look unused.
//
// NOTE THE INVERSION: tools/damage-calc requires the OPPOSITE convention —
// there you must pass "Mega Staraptor" and passing base + stone silently
// computes the base form (reference/pitfalls.md, 2026-09-04). Same repo,
// opposite entity rules, both failing confidently when crossed.
//
// The two lookups below are already vendored, so no name-guessing is needed.

const path = require('node:path');
const vendorPath = path.join(__dirname, '..', 'damage-calc', 'vendor', 'item_data.js');

function loadLookups() {
  const src = require('node:fs').readFileSync(vendorPath, 'utf8');
  const sandbox = {};
  // item_data.js is a plain script of `var X = {...}` declarations.
  new (require('node:vm').Script)(src + '\n;module.exports={LOCK_ITEM_LOOKUP,MEGA_STONE_USER_LOOKUP};')
    .runInNewContext(sandbox = { module: { exports: {} }, exports: {} });
  return sandbox.module.exports;
}

const { LOCK_ITEM_LOOKUP, MEGA_STONE_USER_LOOKUP } = loadLookups();

// "Raichu-Mega-Y" -> "Mega Raichu Y"; "Staraptor-Mega" -> "Mega Staraptor".
function pikaToDex(name) {
  const m = String(name).match(/^(.+)-Mega(?:-([XYZ]))?$/);
  if (!m) return name;
  return `Mega ${m[1]}${m[2] ? ' ' + m[2] : ''}`;
}

// "Mega Raichu Y" -> "Raichu-Mega-Y"; "Mega Staraptor" -> "Staraptor-Mega".
function dexToPika(name) {
  const m = String(name).match(/^Mega\s+(.+?)(?:\s+([XYZ]))?$/);
  if (!m) return name;
  return `${m[1]}-Mega${m[2] ? '-' + m[2] : ''}`;
}

function resolve(pikaName) {
  const dexName = pikaToDex(pikaName);
  if (dexName === pikaName) {
    return { isMega: false, base: pikaName, stone: null, dexName: null };
  }
  const stone = LOCK_ITEM_LOOKUP[dexName];
  if (!stone) {
    throw new Error(
      `"${pikaName}" looks like a Mega but no Mega Stone is known for "${dexName}". ` +
      `Check the name, or re-vendor tools/damage-calc if this is a new Mega.`
    );
  }
  const base = MEGA_STONE_USER_LOOKUP[stone];
  if (!base) {
    throw new Error(`Stone "${stone}" has no base species in MEGA_STONE_USER_LOOKUP.`);
  }
  return { isMega: true, base, stone, dexName };
}

module.exports = { pikaToDex, dexToPika, resolve };
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/meta/tests/megas.test.js`
Expected: PASS, 6/6. If `loadLookups` throws, print the first 40 lines of `item_data.js` and adjust the sandbox wiring — the file is a plain `var`-declaration script with no exports of its own.

- [ ] **Step 5: Commit**

```bash
git add tools/meta/megas.js tools/meta/tests/megas.test.js
git commit -m "feat(meta): resolve a Mega query to its base species and stone"
```

---

### Task 6: HTTP layer with ETag support

**Files:**
- Create: `tools/meta/fetch.js`
- Create: `tools/meta/tests/fetch.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `fetch.get(url, opts) -> {status: number, text: string, etag: string|null}`; `fetch.BASE` (`'https://www.pikalytics.com'`).

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/fetch.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fetchmod = require('../fetch');

test('BASE is the Pikalytics origin', () => {
  assert.equal(fetchmod.BASE, 'https://www.pikalytics.com');
});

test('a 404 is returned as a status, not thrown', () => {
  // Callers decide what a 404 means; for a species it means "not found",
  // for a format it means "bad slug". Throwing here would flatten that.
  const r = fetchmod.get(fetchmod.BASE + '/ai/pokedex/battledataregmbs3/Notamon');
  assert.equal(r.status, 404);
});

test('a real page returns 200, markdown, and an ETag', () => {
  const r = fetchmod.get(fetchmod.BASE + '/ai/pokedex/battledataregmbs3/Garchomp');
  assert.equal(r.status, 200);
  assert.match(r.text, /Quick Info/);
  assert.ok(r.etag && r.etag.length > 0, 'ETag is the freshness signal; it must be captured');
});
```

Note: these three touch the network. Guard the suite so it is skipped when offline:

```js
const ONLINE = process.env.META_OFFLINE !== '1';
// wrap the latter two: test('...', { skip: !ONLINE }, () => { ... });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/fetch.test.js`
Expected: FAIL — `Cannot find module '../fetch'`.

- [ ] **Step 3: Implement `fetch.js`**

```js
'use strict';
// HTTP via curl, matching how .claude/hooks already shell out. Returns status
// rather than throwing, because what a 404 MEANS depends on the caller.
//
// Freshness note: do not use the page's own "Data Date" — it is a global
// constant (2026-05 on every format, including VGC 2025 Reg I). JSON-LD
// dateModified is page-render time. The ETag is the only real change signal.

const { execFileSync } = require('node:child_process');

const BASE = 'https://www.pikalytics.com';
const SEP = '\n__META_SPLIT__\n';

function get(url, opts = {}) {
  const args = ['-s', '-D', '-', '--max-time', String(opts.timeoutSec || 30), url];
  let raw;
  try {
    raw = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (err) {
    throw new Error(`curl failed for ${url}: ${err.message}`);
  }
  // Headers are separated from the body by a blank line; a redirect can produce
  // more than one header block, so take the last.
  const parts = raw.split(/\r?\n\r?\n/);
  const body = parts.slice(1).join('\n\n');
  const headers = parts[0];
  const status = Number((headers.match(/^HTTP\/[\d.]+\s+(\d{3})/m) || [])[1] || 0);
  const etag = (headers.match(/^etag:\s*(.+)$/im) || [])[1] || null;
  return { status, text: body, etag: etag ? etag.trim() : null };
}

module.exports = { BASE, SEP, get };
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/meta/tests/fetch.test.js`
Expected: PASS, 3/3 (or 1/3 with 2 skipped if `META_OFFLINE=1`).

- [ ] **Step 5: Commit**

```bash
git add tools/meta/fetch.js tools/meta/tests/fetch.test.js
git commit -m "feat(meta): HTTP layer returning status and ETag"
```

---

### Task 7: Format registry — capabilities and regulation stamping

**Files:**
- Create: `tools/meta/formats.js`
- Create: `tools/meta/META_MANIFEST.md`
- Create: `tools/meta/tests/formats.test.js`

**Interfaces:**
- Consumes: `parse.parseFormatInfo`, `parse.parseUsageTable` (Tasks 1, 4); `validate.isSentinel`, `validate.assertNotFiller` (Tasks 2, 4).
- Produces: `formats.regulationOf(label, code) -> string|null`; `formats.detectCapabilities(indexText) -> {usage: boolean, winRate: boolean, record: boolean}`; `formats.activeRegulation() -> string|null`; `formats.describe(indexText) -> {code, label, regulation, current, capabilities}`.

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/formats.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const formats = require('../formats');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('regulationOf reads the regulation out of a format label', () => {
  assert.equal(formats.regulationOf('Pokemon Champions VGC 2026 Reg M-B S3 Ranked Battle Data', 'battledataregmbs3'), 'M-B');
  assert.equal(formats.regulationOf('Pokemon Champions VGC 2026 BO3 Reg M-A', 'gen9championsvgc2026regmabo3'), 'M-A');
});

test('a non-Champions format has no Champions regulation', () => {
  // gen9vgc2025regi is a different GAME, not merely a different regulation.
  assert.equal(formats.regulationOf('VGC 2025 Regulation Set I', 'gen9vgc2025regi'), null);
});

test('REGRESSION: the ladder format carries win rate but NOT usage', () => {
  const caps = formats.detectCapabilities(fx('ranked-index.md'));
  assert.equal(caps.usage, false, 'the official ladder upstream has no usage weighting');
  assert.equal(caps.winRate, true);
  assert.equal(caps.record, true);
});

test('REGRESSION: the tournament format carries usage AND win rate', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  assert.equal(caps.usage, true);
  assert.equal(caps.winRate, true);
});

test('describe() stamps the regulation and marks currency', () => {
  const d = formats.describe(fx('ranked-index.md'));
  assert.equal(d.code, 'battledataregmbs3');
  assert.equal(d.regulation, 'M-B');
  assert.equal(typeof d.current, 'boolean');
});

test('describe() refuses the empty-dataset format', () => {
  assert.throws(() => formats.describe(fx('filler-index.md')), /empty dataset|alphabetical/i);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/formats.test.js`
Expected: FAIL — `Cannot find module '../formats'`.

- [ ] **Step 3: Implement `formats.js`**

```js
'use strict';
// Which metrics a format carries is a property of its UPSTREAM, not of the
// site: the official ladder feed has battle records but no usage weighting,
// Showdown feeds have usage but no records, and tournament sheets have both.
// So capabilities are detected per format rather than assumed.
//
// Regulation is stamped for the same reason a Pikalytics slug is: the supported
// list mixes regulations AND eras (gen9vgc2025regi is a different game), every
// one of them returns clean confident numbers, and pulling several formats at
// once for a multi-population answer makes it easy to blend them unnoticed.

const fs = require('node:fs');
const path = require('node:path');
const parse = require('./parse');
const validate = require('./validate');

function repoRoot() {
  return path.join(__dirname, '..', '..');
}

// Same stamp the team validator and the phase hook read.
function activeRegulation() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Champions regulations only. A VGC-2025/Scarlet-Violet format is not a
// Champions regulation at all and must not be stamped as one.
function regulationOf(label, code) {
  const isChampions = /champions/i.test(String(label)) || /champions/i.test(String(code));
  if (!isChampions) return null;
  const m = String(label).match(/\bReg(?:ulation)?(?:\s+Set)?\s+([A-Z]-[A-Z0-9]+)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function detectCapabilities(indexText) {
  const rows = parse.parseUsageTable(indexText);
  const some = (key) => rows.some((r) => !validate.isSentinel(r[key]));
  return {
    usage: some('usageRaw'),
    winRate: some('winRateRaw'),
    record: some('recordRaw'),
  };
}

function describe(indexText) {
  const info = parse.parseFormatInfo(indexText);
  const rows = parse.parseUsageTable(indexText);
  validate.assertNotFiller(rows, info.code);
  const regulation = regulationOf(info.label, info.code);
  const active = activeRegulation();
  return {
    code: info.code,
    label: info.label,
    regulation,
    current: Boolean(regulation && active && regulation === active),
    capabilities: detectCapabilities(indexText),
  };
}

module.exports = { activeRegulation, regulationOf, detectCapabilities, describe };
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node --test tools/meta/tests/formats.test.js`
Expected: PASS, 6/6.

- [ ] **Step 5: Create the manifest**

Create `tools/meta/META_MANIFEST.md`:

```markdown
# Pikalytics agent-API manifest

Pinned ETags and detected capabilities, written by `meta formats`.
Purpose is the same as `tools/dex/VENDOR_MANIFEST.md`: make "has the upstream
changed since we last cited it?" answerable.

**Do not hand-edit.** Regenerate with `node tools/meta/cli.js formats --write`.

## Why ETags rather than the page's own date

The API's `Data Date` field is a **global constant** — every format reports
`2026-05`, including VGC 2025 Regulation I and the preview dataset. JSON-LD
`dateModified` is page-render time, not data time. The ETag is the only real
change-detection signal available.

## Formats

| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |
|---|---|---|---|---|---|---|
| _(populated by `meta formats --write`)_ | | | | | | |
```

- [ ] **Step 6: Commit**

```bash
git add tools/meta/formats.js tools/meta/META_MANIFEST.md tools/meta/tests/formats.test.js
git commit -m "feat(meta): per-format capability detection and regulation stamping"
```

---

### Task 8: Library API — `mon` with Mega composition, `usage` with the regulation gate

**Files:**
- Create: `tools/meta/meta.js`
- Create: `tools/meta/tests/meta.test.js`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: `meta.monFromText(text, {formatCode, capabilities, megaInfo}) -> object`; `meta.usageFromText(text, {describe}) -> object`.

Splitting the pure `*FromText` functions from the network wrappers is what lets this task be tested against fixtures.

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/meta.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const meta = require('../meta');
const formats = require('../formats');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');
const rankedCaps = () => formats.detectCapabilities(fx('ranked-index.md'));

test('REGRESSION: usage from the ladder is null WITH A REASON, never 0', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.equal(out.usage.value, null);
  assert.match(out.usage.reason, /no usage/i);
  assert.notEqual(out.usage.value, 0);
});

test('win rate and record survive as real numbers', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.equal(out.winRate.value, 48.411);
  assert.equal(out.record, '3527-3759-14');
});

test('REGRESSION: a Mega gets base stats plus its stone share', () => {
  // Raichu is 60.5% Raichunite Y, so Mega Raichu Y is 60.5% of all Raichu.
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3',
    capabilities: rankedCaps(),
    megaInfo: { isMega: true, base: 'Raichu', stone: 'Raichunite Y', dexName: 'Mega Raichu Y' },
  });
  assert.equal(out.megaShare.stone, 'Raichunite Y');
  assert.equal(out.megaShare.ofSpecies, 60.5);
  assert.equal(out.resolvedFrom, 'Raichu');
  assert.match(out.megaShare.basis, /item distribution/i);
});

test('REGRESSION: Common Teammates undefined% never becomes a number', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.ok(out.teammates.every((t) => t.percent.value === null));
  assert.ok(out.teammates.every((t) => /upstream/i.test(t.percent.reason)));
});

test('REGRESSION: an off-regulation format is flagged not-current', () => {
  const out = meta.usageFromText(fx('ranked-index.md'), {
    describe: { code: 'x', label: 'l', regulation: 'M-A', current: false, capabilities: rankedCaps() },
  });
  assert.equal(out.current, false);
  assert.ok(out.warnings.some((w) => /previous regulation|not current/i.test(w)));
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/meta.test.js`
Expected: FAIL — `Cannot find module '../meta'`.

- [ ] **Step 3: Implement `meta.js`**

```js
'use strict';
const parse = require('./parse');
const validate = require('./validate');

const NO_USAGE = 'this format\'s upstream carries no usage weighting — use a tournament or Showdown format for usage';
const TEAMMATES_BUG = 'upstream renders this section as undefined% for every format';

function percentList(text, heading, reason) {
  return parse.parsePercentList(text, heading).map((e) => ({
    name: e.name,
    percent: validate.toNumber(e.percentRaw, reason),
  }));
}

function monFromText(text, opts) {
  const q = parse.parseQuickInfo(text);
  const caps = opts.capabilities || {};
  const items = percentList(text, 'Common Items', 'not reported for this entry');

  const out = {
    format: opts.formatCode,
    usage: validate.toNumber(q.usage, caps.usage ? 'not reported for this entry' : NO_USAGE),
    winRate: validate.toNumber(q.winRate, caps.winRate ? 'not reported for this entry' : 'this format carries no win rate'),
    record: validate.isSentinel(q.record) ? null : q.record,
    moves: percentList(text, 'Common Moves', 'not reported for this entry'),
    abilities: percentList(text, 'Common Abilities', 'not reported for this entry'),
    items,
    teammates: percentList(text, 'Common Teammates', TEAMMATES_BUG),
  };

  // A Mega has no rows of its own on ladder formats: the numbers above are the
  // BASE species', and the Mega's share is that stone's slice of the base's
  // item distribution.
  if (opts.megaInfo && opts.megaInfo.isMega) {
    const row = items.find((i) => i.name === opts.megaInfo.stone);
    out.resolvedFrom = opts.megaInfo.base;
    out.megaShare = {
      stone: opts.megaInfo.stone,
      ofSpecies: row ? row.percent.value : null,
      basis: `share of ${opts.megaInfo.base}'s item distribution`,
      note: `${opts.megaInfo.dexName} has no rows of its own; battles are logged against ${opts.megaInfo.base}.`,
    };
  }
  return out;
}

function usageFromText(text, opts) {
  const d = opts.describe;
  const rows = parse.parseUsageTable(text);
  validate.assertNotFiller(rows, d.code);
  const warnings = [];
  if (!d.current) {
    warnings.push(
      `Format "${d.code}" is regulation ${d.regulation || 'unknown'}, which is NOT the current one. ` +
      `Reading a previous regulation deliberately is fine; doing it unknowingly is not.`
    );
  }
  if (!d.capabilities.usage) warnings.push(NO_USAGE);

  return {
    format: d.code,
    regulation: d.regulation,
    current: d.current,
    warnings,
    rows: rows.map((r) => ({
      rank: r.rank,
      species: r.species,
      usage: validate.toNumber(r.usageRaw, d.capabilities.usage ? 'not reported' : NO_USAGE),
      winRate: validate.toNumber(r.winRateRaw, d.capabilities.winRate ? 'not reported' : 'this format carries no win rate'),
      record: validate.isSentinel(r.recordRaw) ? null : r.recordRaw,
    })),
  };
}

module.exports = { monFromText, usageFromText, NO_USAGE };
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 5: Commit**

```bash
git add tools/meta/meta.js tools/meta/tests/meta.test.js
git commit -m "feat(meta): compose Mega share from base item split, gate off-regulation data"
```

---

### Task 9: CLI

**Files:**
- Create: `tools/meta/cli.js`
- Create: `tools/meta/tests/cli.test.js`

**Interfaces:**
- Consumes: all prior modules.
- Produces: the `meta` command surface.

- [ ] **Step 1: Write the failing test**

Create `tools/meta/tests/cli.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CLI = path.join(__dirname, '..', 'cli.js');
const ONLINE = process.env.META_OFFLINE !== '1';

function run(...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));
}
function runFailing(...args) {
  try {
    execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout || '') };
  }
  return null;
}

test('no args prints usage and exits non-zero', () => {
  const r = runFailing();
  assert.ok(r);
  assert.equal(r.status, 1);
});

test('an unknown command exits non-zero with an error object', () => {
  const r = runFailing('wat');
  assert.ok(r);
  assert.match(JSON.parse(r.stdout).error, /Unknown command/);
});

test('meta mon returns usage as null-with-reason on the ladder', { skip: !ONLINE }, () => {
  const out = run('mon', 'Raichu');
  assert.equal(out.usage.value, null);
  assert.match(out.usage.reason, /no usage/i);
});

test('meta mon on a Mega name reports the stone share', { skip: !ONLINE }, () => {
  const out = run('mon', 'Staraptor-Mega');
  assert.equal(out.resolvedFrom, 'Staraptor');
  assert.ok(out.megaShare.ofSpecies > 90, 'nearly every ladder Staraptor is Mega');
});

test('meta usage --format on the empty dataset exits non-zero', { skip: !ONLINE }, () => {
  const r = runFailing('usage', '--format', 'gen9championsvgc2026regmbbo3');
  assert.ok(r, 'the alphabetical filler must not exit 0');
  assert.equal(r.status, 1);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test tools/meta/tests/cli.test.js`
Expected: FAIL — `Cannot find module` for `cli.js`.

- [ ] **Step 3: Implement `cli.js`**

```js
#!/usr/bin/env node
'use strict';
// CLI over tools/meta. One JSON object per invocation, mirroring tools/dex.

const fetchmod = require('./fetch');
const formats = require('./formats');
const megas = require('./megas');
const meta = require('./meta');

const USAGE = `Usage:
  node tools/meta/cli.js formats [--write]      list formats, capabilities, regulation
  node tools/meta/cli.js mon <Species> [--format <code>]   per-Pokemon data
  node tools/meta/cli.js usage [--format <code>]           ranked list
  node tools/meta/cli.js check                  slug agreement and ETag drift

Notes:
  "What is used" and "what is winning" come from different upstreams. The
  official ladder format carries win rate but NO usage; tournament formats
  carry both. The tool says which, per call.

  Pass a Mega by its Pikalytics name (e.g. "Staraptor-Mega"); it resolves to
  the base species plus the stone's share. This is the OPPOSITE convention to
  tools/damage-calc, which needs "Mega Staraptor".`;

function fail(message) {
  process.stdout.write(JSON.stringify({ error: message }, null, 2) + '\n');
  process.exit(1);
}
function ok(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
function flagValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

function loadIndex(code) {
  const r = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}`);
  if (r.status !== 200) throw new Error(`Format "${code}" returned HTTP ${r.status}`);
  return r;
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(USAGE + '\n');
    process.exit(command ? 0 : 1);
  }

  const code = flagValue(argv, '--format') || formats.defaultFormatCode();

  try {
    if (command === 'mon') {
      const name = argv[1];
      if (!name) return fail('mon: a species name is required, e.g. mon "Staraptor-Mega"');
      const megaInfo = megas.resolve(name);
      const lookup = megaInfo.isMega ? megaInfo.base : name;
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text);
      const r = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}/${encodeURIComponent(lookup)}`);
      if (r.status !== 200) return fail(`"${lookup}" returned HTTP ${r.status} in format ${code}`);
      const out = meta.monFromText(r.text, {
        formatCode: code, capabilities: describe.capabilities, megaInfo,
      });
      out.species = name;
      out.regulation = describe.regulation;
      out.current = describe.current;
      return ok(out);
    }

    if (command === 'usage') {
      const idx = loadIndex(code);
      return ok(meta.usageFromText(idx.text, { describe: formats.describe(idx.text) }));
    }

    if (command === 'formats') {
      return ok(formats.report(fetchmod, { write: argv.includes('--write') }));
    }

    if (command === 'check') {
      return ok(formats.check(fetchmod));
    }

    return fail(`Unknown command: "${command}".\n\n${USAGE}`);
  } catch (err) {
    return fail(err.message);
  }
}

main();
```

- [ ] **Step 4: Add the three remaining `formats` helpers**

Append to `tools/meta/formats.js` and export `defaultFormatCode`, `report`, `check`:

```js
const LLMS = '/llms-full.txt';

// The site declares its own current default format; this is what makes the
// slug programmatically checkable instead of a manual habit.
function declaredDefault(fetchmod) {
  const r = fetchmod.get(fetchmod.BASE + LLMS);
  if (r.status !== 200) throw new Error(`llms-full.txt returned HTTP ${r.status}`);
  const m = r.text.match(/\*\*Format Code\*\*:\s*`([^`]+)`/);
  if (!m) throw new Error('llms-full.txt no longer declares a **Format Code**');
  return m[1];
}

function stampedSlug() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Pikalytics slug: (\S+)\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function defaultFormatCode() {
  const stamped = stampedSlug();
  if (!stamped) throw new Error('reference/regulation.md has no **Pikalytics slug:** stamp');
  return stamped;
}

function check(fetchmod) {
  const declared = declaredDefault(fetchmod);
  const stamped = stampedSlug();
  if (declared !== stamped) {
    throw new Error(
      `Slug disagreement: llms-full.txt declares "${declared}", reference/regulation.md ` +
      `stamps "${stamped}". One is stale. Resolve it by hand — silently preferring either ` +
      `reintroduces the wrong-regulation-data trap.`
    );
  }
  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${stamped}`);
  const d = describe(idx.text);
  return { slug: stamped, agrees: true, etag: idx.etag, ...d };
}

function report(fetchmod, opts = {}) {
  const code = defaultFormatCode();
  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}`);
  const d = describe(idx.text);
  const out = { ...d, etag: idx.etag, checked: new Date().toISOString().slice(0, 10) };
  if (opts.write) {
    const p = path.join(__dirname, 'META_MANIFEST.md');
    const row = `| \`${d.code}\` | ${d.regulation} | ${d.capabilities.usage} | ${d.capabilities.winRate} | ${d.capabilities.record} | ${idx.etag} | ${out.checked} |`;
    const src = fs.readFileSync(p, 'utf8').replace(/\| _\(populated.*\n/, row + '\n');
    fs.writeFileSync(p, src);
    out.written = p;
  }
  return out;
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 6: Commit**

```bash
git add tools/meta/cli.js tools/meta/formats.js tools/meta/tests/cli.test.js
git commit -m "feat(meta): CLI with slug agreement check and Mega-aware mon lookup"
```

---

### Task 10: Documentation and the paired entity-convention pitfall

**Files:**
- Create: `reference/meta-lookup.md`
- Modify: `CLAUDE.md`
- Modify: `reference/pitfalls.md`
- Modify: `reference/damage-calc.md`
- Modify: `.claude/skills/vgc-meta-lookup/SKILL.md`
- Modify: `README.md`

- [ ] **Step 1: Write `reference/meta-lookup.md`**

Must contain, with a `## Changelog` table as every reference file has:
- The command surface, with a worked example of each.
- **A table of which upstream carries which metric**, copied from the spec — ladder has win rate and no usage; tournaments have both; Showdown has usage and no records.
- The rule that usage is reported per population and never blended.
- That `Data Date` is a global constant and ETags are the freshness signal.

- [ ] **Step 2: Add the paired pitfall entry**

In `reference/pitfalls.md`, under "Data source pitfalls", add an entry covering **both** directions, because each tool fails confidently when given the other's form:

- `tools/damage-calc` needs `"Mega Staraptor"`; base + stone silently computes the **base** form.
- `tools/meta` needs `Staraptor`; the Mega name returns a stub with `undefined%` that reads as unused.

Add the matching cross-reference in `reference/damage-calc.md` so the rule is reachable from whichever tool the reader started at. Add a Quick-checklist line. Add a changelog row to both files.

- [ ] **Step 3: Add the CLAUDE.md rows**

In the "Never state these from recall" table:

```markdown
| What is *used* in the current meta | `node tools/meta/cli.js usage` |
| A Pokémon's real moves/items/abilities distribution | `node tools/meta/cli.js mon "<Species>"` |
```

Plus a note that a Mega goes in as `Staraptor-Mega` here and `"Mega Staraptor"` in the damage calc.

- [ ] **Step 4: Rewrite the meta-lookup skill**

`.claude/skills/vgc-meta-lookup/SKILL.md` keeps its three-surface reasoning as *what* to pull, but replaces every hand-fetch URL with a command. The mandatory slug check becomes `node tools/meta/cli.js check`.

- [ ] **Step 5: Add the README row**

Alongside `tools/dex` and `tools/damage-calc`.

- [ ] **Step 6: Verify and commit**

```bash
npm test
node tools/meta/cli.js check
node tools/meta/cli.js mon "Staraptor-Mega"
git add -A
git commit -m "docs(meta): document tools/meta and the paired Mega entity conventions"
```

---

## Self-review notes

- **Spec coverage.** Problem → Tasks 1–9. Key finding 1 (per-upstream metrics) → Task 7. Key finding 2 (Mega entity) → Tasks 5, 8. Alphabetical filler → Task 4. Known holes table → Tasks 2, 8. Format resolution → Task 9. Regulation gating → Tasks 7, 8. Capability detection → Task 7. Validation → Tasks 2, 4. Per-population usage → Task 8 + Task 10 docs. ETag manifest → Tasks 6, 7, 9. Testing section → every task. Documentation → Task 10.
- **Deferred from the spec, deliberately:** `meta cores` and `meta teams`. The spec lists them, but `usage`, `mon` and `check` are what the skills actually call, and cores parsing adds a fourth table shape without changing any of the design's load-bearing decisions. Add them as Task 11 if wanted before the skill rewrite — the parser helper `sectionBody` already supports it.
- **Type consistency.** `describe()` returns `{code, label, regulation, current, capabilities}` and is consumed with exactly those keys in Tasks 8 and 9. `megas.resolve()` returns `{isMega, base, stone, dexName}`, consumed with those keys in Tasks 8 and 9. `validate.toNumber()` returns `{value, reason}` everywhere.
