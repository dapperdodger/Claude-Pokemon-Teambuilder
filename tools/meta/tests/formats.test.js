'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const formats = require('../formats');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

// ranked-index.md is a frozen M-B snapshot (format code battledataregmbs3)
// used throughout this file to test parsing MECHANICS against a pinned
// historical page — those assertions are intentionally tied to that exact
// content and must not move at a rollover. check(), below, is different: it
// tests AGREEMENT between the live-stamped format code
// (formats.defaultFormatCode(), which reads reference/regulation.md and now
// reads M-C) and a fetched page's own declared code. A stub built from the
// M-B fixture can no longer agree with that stamp, so check()'s tests use
// this separate, real M-C snapshot (fetched live from
// https://www.pikalytics.com/ai/pokedex/gen9championsvgc2026regmc on
// 2026-09-09) instead.
const fxCurrent = () => fx('ranked-index-mc.md');

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

// --- Three-way currency taxonomy -------------------------------------------
// Replaces the old binary (regulation matches / doesn't). `formats.js`'s own
// design comment explains why: a format can be current for two structurally
// different reasons (a matching regulation token, or being a rolling window
// by construction), and collapsing those into one boolean is what put a
// "previous regulation" warning on `championstournaments` — data that was
// actually current the whole time.

test('classifyCurrency: a matching regulation token is current', () => {
  assert.deepEqual(formats.classifyCurrency('somecode', 'M-B', 'M-B'), { currency: 'regulation', current: true });
});

test('classifyCurrency: a mismatched regulation token is regulation-currency but NOT current', () => {
  assert.deepEqual(formats.classifyCurrency('somecode', 'M-A', 'M-B'), { currency: 'regulation', current: false });
});

test('classifyCurrency: a regulation-tagged format with no known active regulation is not current', () => {
  assert.deepEqual(formats.classifyCurrency('somecode', 'M-B', null), { currency: 'regulation', current: false });
});

test('REGRESSION: a curated rolling-window format is ALWAYS current despite carrying no regulation token', () => {
  assert.deepEqual(
    formats.classifyCurrency('championstournaments', null, 'M-B'),
    { currency: 'rolling', current: true }
  );
  // Regulation shown as mismatched/unknown must not matter — rolling is
  // current by construction, not by comparison to an active regulation.
  assert.deepEqual(
    formats.classifyCurrency('championstournaments', null, null),
    { currency: 'rolling', current: true }
  );
});

test('classifyCurrency: the rolling-format list is matched case-insensitively', () => {
  assert.equal(formats.classifyCurrency('ChampionsTournaments', null, 'M-B').currency, 'rolling');
  assert.equal(formats.classifyCurrency('CHAMPIONSTOURNAMENTS', null, 'M-B').currency, 'rolling');
});

test('REGRESSION: a token-less format NOT on the curated list is unknown, never inferred as rolling', () => {
  // championspreview also carries no regulation token, but Pikalytics itself
  // flags it as pre-launch preview data — genuinely not current. Inferring
  // "no token => rolling" from the code text alone (rather than a curated
  // list) would misclassify actively suspect data as current.
  assert.deepEqual(
    formats.classifyCurrency('championspreview', null, 'M-B'),
    { currency: 'unknown', current: false }
  );
  assert.deepEqual(
    formats.classifyCurrency('some-brand-new-format', null, 'M-B'),
    { currency: 'unknown', current: false }
  );
});

test('REGRESSION: describe() classifies championstournaments as rolling and current with no regulation token', () => {
  const d = formats.describe(fx('tournaments-index.md'));
  assert.equal(d.code, 'championstournaments');
  assert.equal(d.regulation, null);
  assert.equal(d.currency, 'rolling');
  assert.equal(d.current, true);
});

test('describe() classifies the ladder format as regulation-currency', () => {
  const d = formats.describe(fx('ranked-index.md'));
  assert.equal(d.currency, 'regulation');
});

test('REGRESSION: an off-regulation format (e.g. gen9championsvgc2026regmabo3-shaped data) still reports NOT current', () => {
  // Reuses the ranked fixture (regulation M-B) but simulates a mismatched
  // active regulation the way a genuinely previous-regulation format would
  // be flagged — describe() itself always compares against the REAL active
  // regulation, so this exercises classifyCurrency directly for the case
  // describe() cannot simulate without a second fixture.
  const out = formats.classifyCurrency('gen9championsvgc2026regmabo3', 'M-A', formats.activeRegulation());
  assert.equal(out.currency, 'regulation');
  assert.equal(out.current, false, 'a genuinely previous regulation must never read as current');
});

// --- Rolling-window rollover straddle --------------------------------------
// windowStraddlesRollover is pure — explicit regulation-start and "now"
// dates in, boolean out — specifically so this is pinned rather than tied to
// the real clock: a test that reads today's date would silently start or
// stop passing as time moves, which is worse than no test at all.

test('windowStraddlesRollover: false when the window stays entirely within the regulation (well after it started)', () => {
  // Regulation started 2026-06-17; "today" is nearly 3 months later, so the
  // window (14 days back from today) never reaches back to the start date.
  assert.equal(formats.windowStraddlesRollover('2026-06-17', '2026-09-08', 14), false);
});

test('REGRESSION: windowStraddlesRollover is true when the window reaches back before the regulation started', () => {
  // Regulation starts 2026-09-09 (the M-C rollover date). Six days later,
  // the window's own start (2026-09-15 - 14d = 2026-09-01) is EARLIER than
  // the regulation's start (2026-09-09) — the window still reaches back
  // into the previous regulation.
  assert.equal(formats.windowStraddlesRollover('2026-09-09', '2026-09-15', 14), true);
});

test('windowStraddlesRollover: clears exactly windowDays after the regulation start', () => {
  // today = regStart + windowDays: windowStart == regStart exactly, and the
  // comparison is strict ("<"), so this is the first day the straddle is
  // gone, matching "clears roughly windowDays after regulationStart".
  assert.equal(formats.windowStraddlesRollover('2026-09-09', '2026-09-23', 14), false);
  // One day earlier, the straddle is still active.
  assert.equal(formats.windowStraddlesRollover('2026-09-09', '2026-09-22', 14), true);
});

test('windowStraddlesRollover: same-day rollover straddles (window reaches back into yesterday, the old regulation)', () => {
  assert.equal(formats.windowStraddlesRollover('2026-09-09', '2026-09-09', 14), true);
});

test('windowStraddlesRollover: false with no regulation-start date, rather than throwing', () => {
  assert.equal(formats.windowStraddlesRollover(null, '2026-09-15', 14), false);
});

test('windowStraddlesRollover: accepts a real Date object for "now", not just an ISO string', () => {
  assert.equal(formats.windowStraddlesRollover('2026-09-09', new Date('2026-09-15T00:00:00Z'), 14), true);
});

test('REGRESSION: describe() surfaces a straddle warning-worthy object when the real regulation just started (injected `now`)', () => {
  // Uses the REAL stamped regulation-start from reference/regulation.md, but
  // injects `now` as a fixed offset from that stamp rather than reading the
  // system clock — so this test's pass/fail does not depend on what day it
  // is when the suite runs, only on regulation.md's start stamp existing.
  const regStart = formats.activeRegulationStart();
  assert.ok(regStart, 'reference/regulation.md must have a **Regulation starts:** stamp for this test to mean anything');
  const threeDaysIn = new Date(new Date(`${regStart}T00:00:00Z`).getTime() + 3 * 24 * 60 * 60 * 1000);
  const d = formats.describe(fx('tournaments-index.md'), undefined, { now: threeDaysIn });
  assert.ok(d.straddle, 'a rolling format queried 3 days after the regulation started must straddle');
  assert.equal(d.straddle.regulationStart, regStart);
  assert.equal(d.straddle.windowDays, formats.ROLLING_WINDOW_DAYS);
  assert.equal(d.currency, 'rolling');
  assert.equal(d.current, true, 'a straddling rolling format is still current — mixed is not the same as stale');
});

test('describe() reports no straddle for a rolling format when `now` is well past the window', () => {
  const regStart = formats.activeRegulationStart();
  assert.ok(regStart);
  const wellPast = new Date(new Date(`${regStart}T00:00:00Z`).getTime() + 60 * 24 * 60 * 60 * 1000);
  const d = formats.describe(fx('tournaments-index.md'), undefined, { now: wellPast });
  assert.equal(d.straddle, null);
});

test('describe() never sets straddle on a non-rolling format, regardless of `now`', () => {
  const d = formats.describe(fx('ranked-index.md'), undefined, { now: new Date('2026-06-18T00:00:00Z') });
  assert.equal(d.straddle, null);
});

test('describe() refuses the empty-dataset format', () => {
  assert.throws(() => formats.describe(fx('filler-index.md')), /empty dataset|alphabetical/i);
});

// FIX 6: assertNotFiller returns early on ZERO rows, so a 404 body or a
// changed upstream heading previously produced a complete-looking, all-false
// capability set instead of an error — indistinguishable from a real format
// that just doesn't carry any metric.
test('REGRESSION: describe() refuses a response with no usage rows at all, not a complete-looking all-false format', () => {
  const empty404ish = '# Not Found\n\nNothing here.\n';
  assert.throws(() => formats.describe(empty404ish), /parse|empty response/i);
});

test('REGRESSION: describe() refuses a response with a Format Code but zero table rows', () => {
  const noRows = [
    '## Format Information',
    '- **Format**: Some Format',
    '- **Format Code**: `somecode`',
    '',
    '## Best 50 Pokemon by Usage',
    '',
    '(nothing here — heading changed upstream, no rows parsed)',
  ].join('\n');
  assert.throws(() => formats.describe(noRows), /parse|empty response/i);
});

test('REGRESSION: describe() refuses a response with rows but no Format Code', () => {
  const text = fx('ranked-index.md').replace(/- \*\*Format Code\*\*: `[^`]+`/, '');
  assert.throws(() => formats.describe(text), /parse|empty response|Format Code/i);
});

// FIX 8: the page's own declared format code was parsed and then discarded.
// A 200 response for a different format than requested (redirect, alias)
// must be caught rather than silently trusted.
test('REGRESSION: describe() throws when the page declares a different format than requested', () => {
  assert.throws(
    () => formats.describe(fx('ranked-index.md'), 'some-other-requested-code'),
    /requested format|declares format/i
  );
});

test('describe() accepts a matching expectedCode', () => {
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'battledataregmbs3'));
});

// FIX 8: case-variant format codes must be accepted (index echoes requested
// casing; mon page normalizes to lowercase), but genuinely different codes
// must still be rejected.
test('REGRESSION: describe() accepts case-variant format code', () => {
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'BattleDataRegMBS3'));
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'BATTLEDATAREGMBS3'));
});

test('REGRESSION: describe() still rejects genuinely different format code', () => {
  assert.throws(
    () => formats.describe(fx('ranked-index.md'), 'some-other-format-code'),
    /requested format|declares format/i
  );
});

// REGRESSION: formats.report({write: true}) used to replace only the one-time
// placeholder row. A second --write for the SAME format code found no match,
// left the file byte-identical, and still reported `written` as success —
// a confident report of success with nothing behind it, in the one tool
// whose whole job is catching exactly that failure mode.
const MANIFEST_TEMPLATE = [
  '## Formats',
  '',
  '| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |',
  '|---|---|---|---|---|---|---|',
  '| _(populated by `meta formats --write`)_ | | | | | | |',
].join('\n');

test('upsertManifestRow: first write for a code replaces the placeholder', () => {
  const row = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const { text, action } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', row);
  assert.equal(action, 'added');
  assert.ok(text.includes(row));
  assert.ok(!text.includes('_(populated'));
});

test('REGRESSION: a second write for the SAME code updates the row in place, not a no-op', () => {
  const rowV1 = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const rowV2 = '| `codeA` | M-B | true | true | true | "etag2" | 2026-09-02 |';
  const first = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', rowV1);
  const second = formats.upsertManifestRow(first.text, 'codeA', rowV2);
  assert.equal(second.action, 'updated');
  assert.ok(second.text.includes(rowV2), 'the refreshed row must be present');
  assert.ok(!second.text.includes(rowV1), 'the stale row must not survive');
  assert.notEqual(second.text, first.text, 'the file must actually change on a real update');
});

test('a write for a DIFFERENT code appends rather than clobbering the first row', () => {
  const rowA = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const rowB = '| `codeB` | M-B | false | true | true | "etag9" | 2026-09-03 |';
  const first = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', rowA);
  const second = formats.upsertManifestRow(first.text, 'codeB', rowB);
  assert.equal(second.action, 'added');
  assert.ok(second.text.includes(rowA), 'the existing codeA row must survive untouched');
  assert.ok(second.text.includes(rowB));
});

// REAL DATA-LOSS BUG (hit live 2026-09-10, diffed at commit 49ffac3 against
// 04069c7): upsertManifestRow scanned every `|`-prefixed line in the WHOLE
// file for its code-cell match, with no regard for which heading a line sat
// under. The "Resolved slug disagreements" table's own columns are ALSO
// backtick-wrapped format codes (the declared/stamped/chosen values), so a
// Formats write for a code that also appears in that hand-written row matched
// THAT row — the line-scan's last match won regardless of table — and
// overwrote the hand-written resolution with a machine-generated Formats row,
// destroying the recorded evidence and making `check` fail again as if the
// disagreement had never been resolved. Scoping the writer (and reader) to
// the `## Formats` heading, structurally, the same way
// resolvedDisagreementsSection already scopes reads of the OTHER table, is
// what makes this collision impossible rather than merely unlikely.
function buildManifestWithResolvedRowMentioningCode(code) {
  return [
    '## Formats',
    '',
    '| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |',
    '|---|---|---|---|---|---|---|',
    '| _(populated by `meta formats --write`)_ | | | | | | |',
    '',
    '## Resolved slug disagreements',
    '',
    '| llms-full.txt declared | regulation.md stamped | Chosen | Date | Evidence |',
    '|---|---|---|---|---|',
    `| \`battledataregmbs3\` | \`${code}\` | \`${code}\` | 2026-09-09 | some hand-written evidence text that must survive |`,
  ].join('\n');
}

test('REGRESSION: writing a Formats row must not touch a Resolved slug disagreements row that mentions the same code', () => {
  const code = 'gen9championsvgc2026regmc';
  const before = buildManifestWithResolvedRowMentioningCode(code);
  const resolvedLineBefore = before.split('\n').find((l) => l.includes('some hand-written evidence text'));
  assert.ok(resolvedLineBefore, 'sanity: the hand-written row must exist in the fixture before the write');

  const formatsRow = `| \`${code}\` | M-C | true | true | true | W/"485d-etag" | 2026-09-10 | regulation |`;
  const { text: after } = formats.upsertManifestRow(before, code, formatsRow);

  assert.ok(
    after.includes(resolvedLineBefore),
    'the hand-written Resolved-slug-disagreements row must survive byte-identical'
  );
  assert.ok(after.includes(formatsRow), 'the new Formats-table row must be written');
});

test('REGRESSION: readManifestRow must not read a row from the Resolved slug disagreements section', () => {
  const code = 'gen9championsvgc2026regmc';
  // No Formats-table pin exists for this code at all — only the resolved
  // section mentions it. readManifestRow must report "never pinned" (null),
  // not accidentally parse the resolved-disagreement row as if it were an
  // ETag pin.
  const manifest = buildManifestWithResolvedRowMentioningCode(code);
  assert.equal(formats.readManifestRow(manifest, code), null);
});

test('REGRESSION: round-tripping a manifest with both tables through upsertManifestRow leaves the second table byte-identical', () => {
  const code = 'gen9championsvgc2026regmc';
  const before = buildManifestWithResolvedRowMentioningCode(code);
  const beforeResolvedSection = before.split('## Resolved slug disagreements')[1];

  const rowV1 = `| \`${code}\` | M-C | true | true | true | "etag1" | 2026-09-10 | regulation |`;
  const rowV2 = `| \`${code}\` | M-C | true | true | true | "etag2" | 2026-09-11 | regulation |`;
  const first = formats.upsertManifestRow(before, code, rowV1);
  const second = formats.upsertManifestRow(first.text, code, rowV2);

  const afterResolvedSection = second.text.split('## Resolved slug disagreements')[1];
  assert.equal(afterResolvedSection, beforeResolvedSection, 'the Resolved slug disagreements section must be untouched by either write');
});

// FINDING 3: check() has no automated test despite being the most
// safety-critical behaviour in the tool. fetchmod is dependency-injected, so
// both paths are testable deterministically with a stub — no network needed.
test('check() names the slug on agreement', () => {
  const stamped = formats.defaultFormatCode();
  const stub = checkStub();
  const out = formats.check(stub);
  assert.equal(out.slug, stamped);
  assert.equal(out.agrees, true);
  assert.equal(out.corroboration.status, 'agrees');
});

// CHANGED: this used to assert check() THROWS on an llms-full.txt
// disagreement. Under the new design llms-full.txt is Pikalytics' own
// changelog PROSE about itself (known to lag a real rollover — see
// META_MANIFEST.md's "Resolved slug disagreements" row) rather than its
// actual behaviour, so it is demoted to informational: reported in
// `warnings`, never a throw. The hard gate is now the live default endpoint
// (bare /ai/pokedex), covered by the corroboration tests above and the
// regulation-mismatch test below.
test('check() reports (never throws) an llms-full.txt disagreement, naming BOTH values', () => {
  const stamped = formats.defaultFormatCode();
  const stub = checkStub({
    llmsFull: { status: 200, text: '**Format Code**: `some-other-stale-slug`', etag: null },
  });
  const out = formats.check(stub);
  assert.equal(out.agrees, false);
  assert.ok(
    out.warnings.some((w) => w.includes('some-other-stale-slug') && w.includes(stamped)),
    `expected a warning naming both the declared and stamped values, got: ${JSON.stringify(out.warnings)}`
  );
});

// --- Resolved slug disagreements -------------------------------------------
// The real llms-full.txt vs regulation.md disagreement hit live on 2026-09-09
// (llms-full.txt still declares the M-B slug "battledataregmbs3"; the M-C
// stamp is correct — see META_MANIFEST.md's "Resolved slug disagreements"
// section for the evidence). A resolution recorded there must let `check`
// stop failing on THAT EXACT pair while still failing on any other
// disagreement, including a future one involving either of the same two
// values paired with something new. Scoped to its own heading (rather than
// reusing readManifestRow's line scan) specifically so a resolved-pair row's
// backtick-wrapped codes can never be mistaken for — or mistake for — a
// Formats-table ETag pin row for the same code.
function buildResolvedManifest(declared, stamped, chosen, date) {
  return [
    '## Formats',
    '',
    '| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |',
    '|---|---|---|---|---|---|---|',
    '| _(populated by `meta formats --write`)_ | | | | | | |',
    '',
    '## Resolved slug disagreements',
    '',
    '| llms-full.txt declared | regulation.md stamped | Chosen | Date | Evidence |',
    '|---|---|---|---|---|',
    `| \`${declared}\` | \`${stamped}\` | \`${chosen}\` | ${date} | test evidence |`,
  ].join('\n');
}

// Includes a bare /ai/pokedex handler reporting agreement with the REAL
// active regulation and `stampedCode` — these tests are exercising the
// llms-full.txt-vs-stamp resolution mechanism, not the live-default
// corroboration gate, so the gate stays quiet (agrees) throughout.
function stubFor(declaredCode, stampedCode) {
  const active = formats.activeRegulation();
  return {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${this.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${declaredCode}\``, etag: null };
      }
      if (url === `${this.BASE}/ai/pokedex`) {
        return {
          status: 200,
          text: `- **Format**: Pokemon Champions VGC 2026 Reg ${active}\n- **Format Code**: \`${stampedCode}\`\n`,
          etag: null,
        };
      }
      if (url === `${this.BASE}/ai/pokedex/${stampedCode}`) {
        return { status: 200, text: fxCurrent(), etag: 'W/"resolved-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
}

test('REGRESSION: check() passes and reports a hand-resolved disagreement recorded for the EXACT pair', () => {
  const stamped = formats.defaultFormatCode();
  const declared = 'battledataregmbs3';
  const stub = stubFor(declared, stamped);
  const manifestPath = writeTempManifest(buildResolvedManifest(declared, stamped, stamped, '2026-09-09'));
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.slug, stamped);
    assert.equal(out.agrees, false, 'the underlying values still disagree — a recorded resolution is not the same as agreement');
    assert.ok(out.resolvedDisagreement, 'must report that a resolution was applied, not fall silent');
    assert.equal(out.resolvedDisagreement.declared, declared);
    assert.equal(out.resolvedDisagreement.stamped, stamped);
    assert.equal(out.resolvedDisagreement.chosen, stamped);
    assert.equal(out.resolvedDisagreement.date, '2026-09-09');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

// CHANGED (was "check() still throws..."): the llms-full.txt comparison is
// now informational-only (see the "check() reports (never throws) an
// llms-full.txt disagreement" test above) — a mismatch against the recorded
// resolution's declared side no longer throws either. It must still report
// no resolvedDisagreement (this exact pair was never recorded as resolved)
// and name both values in a warning, since silently dropping an unresolved
// disagreement would read as agreement.
test('check() reports an unresolved disagreement (no throw) when llms-full.txt declares a value OTHER than the recorded resolution\'s declared side', () => {
  const stamped = formats.defaultFormatCode();
  const recordedDeclared = 'battledataregmbs3';
  const actualDeclared = 'some-third-value-neither-side-recorded';
  const stub = stubFor(actualDeclared, stamped);
  const manifestPath = writeTempManifest(buildResolvedManifest(recordedDeclared, stamped, stamped, '2026-09-09'));
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.resolvedDisagreement, null, 'this exact (declared, stamped) pair was never recorded as resolved');
    assert.ok(
      out.warnings.some((w) => w.includes(actualDeclared) && w.includes(stamped)),
      `expected a warning naming both values, got: ${JSON.stringify(out.warnings)}`
    );
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

// CHANGED, same reasoning as above: a rollover since the resolution was
// recorded (the stamped side has moved) no longer throws — reported instead.
test('check() reports an unresolved disagreement (no throw) when regulation.md is stamped with a value OTHER than the recorded resolution\'s stamped side (e.g. a rollover since the resolution was recorded)', () => {
  const realStamped = formats.defaultFormatCode();
  const recordedStamped = 'gen9championsvgc-some-other-regulation-entirely';
  const declared = 'battledataregmbs3';
  const stub = stubFor(declared, realStamped);
  const manifestPath = writeTempManifest(buildResolvedManifest(declared, recordedStamped, recordedStamped, '2026-09-09'));
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.resolvedDisagreement, null, 'the recorded resolution names a different stamped value than today\'s — it no longer applies');
    assert.ok(
      out.warnings.some((w) => w.includes('battledataregmbs3') && w.includes(realStamped)),
      `expected a warning naming both values, got: ${JSON.stringify(out.warnings)}`
    );
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('REGRESSION: readManifestRow is unaffected by a Resolved slug disagreements section mentioning the same code', () => {
  const code = 'sharedCode';
  const pinRow = `| \`${code}\` | M-B | true | true | true | "real-pin-etag" | 2026-09-01 |`;
  const { text: withPin } = formats.upsertManifestRow(MANIFEST_TEMPLATE, code, pinRow);
  const withResolvedSection = withPin
    + '\n\n## Resolved slug disagreements\n\n'
    + '| llms-full.txt declared | regulation.md stamped | Chosen | Date | Evidence |\n'
    + '|---|---|---|---|---|\n'
    + `| \`some-declared\` | \`${code}\` | \`${code}\` | 2026-09-09 | test |\n`;
  const found = formats.readManifestRow(withResolvedSection, code);
  assert.equal(found.etag, '"real-pin-etag"', 'the real Formats-table pin row must win, never the Resolved-section row that also mentions this code');
});

// FIX 1: check() and report() previously never looked at r.status. On a 404
// (or any non-200) the parse functions ran on a "Not Found" body anyway and
// happily returned nulls everywhere — the mandated first-line gate reporting
// a PASS off a failed fetch, exiting 0. Both must fail loudly instead.
test('REGRESSION: check() fails loudly on a non-200 format fetch, not a null-filled false PASS', () => {
  const stub = checkStub({
    codeIndex: { status: 404, text: 'Not Found', etag: null },
  });
  assert.throws(() => formats.check(stub), /404/);
});

test('REGRESSION: report() fails loudly on a non-200 fetch, not a null-filled false PASS', () => {
  const stub = {
    BASE: 'https://stub.test',
    get() {
      return { status: 500, text: 'Internal Server Error', etag: null };
    },
  };
  assert.throws(() => formats.report(stub), /500/);
});

// FIX 3: "check reports ETag drift" was claimed in cli.js's own usage text,
// reference/meta-lookup.md and README.md, but nothing ever read
// META_MANIFEST.md back — the manifest was write-only, so the capability the
// docs claimed did not exist. readManifestRow is the pure text->row parser
// underlying that read, tested the same dependency-injected way as
// upsertManifestRow above.
test('readManifestRow: finds the pinned row for a written format code', () => {
  const row = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', row);
  const found = formats.readManifestRow(text, 'codeA');
  assert.equal(found.etag, '"etag1"');
  assert.equal(found.checked, '2026-09-01');
});

test('readManifestRow: returns null for a format that has never been pinned', () => {
  assert.equal(formats.readManifestRow(MANIFEST_TEMPLATE, 'codeA'), null);
});

// Currency is appended as the LAST column (after Last checked) rather than
// inserted after Regulation, specifically so a row written before this
// taxonomy existed still parses: etag/checked keep their original indices,
// and a legacy 7-column row simply comes back with currency: null.
test('REGRESSION: readManifestRow reads back the currency column (appended last)', () => {
  const row = '| `championstournaments` | | true | true | true | "etag1" | 2026-09-08 | rolling |';
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'championstournaments', row);
  const found = formats.readManifestRow(text, 'championstournaments');
  assert.equal(found.etag, '"etag1"');
  assert.equal(found.checked, '2026-09-08');
  assert.equal(found.currency, 'rolling');
});

test('readManifestRow: a pre-taxonomy 7-column row reads back currency as null, not a crash', () => {
  const row = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', row);
  const found = formats.readManifestRow(text, 'codeA');
  assert.equal(found.currency, null);
});

function writeTempManifest(text) {
  const p = path.join(os.tmpdir(), `meta-manifest-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(p, text);
  return p;
}

test('REGRESSION: check() reports etagStatus "unpinned" — distinguishable from "unchanged" — when never written', () => {
  const stub = checkStub({
    codeIndex: { status: 200, text: fxCurrent(), etag: 'W/"live-etag"' },
  });
  const manifestPath = writeTempManifest(MANIFEST_TEMPLATE);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'unpinned');
    assert.equal(out.pinnedEtag, null);
    assert.equal(out.etag, 'W/"live-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('check() reports etagStatus "unchanged" when the pinned ETag matches the live one', () => {
  const stamped = formats.defaultFormatCode();
  const stub = checkStub({
    codeIndex: { status: 200, text: fxCurrent(), etag: 'W/"match-etag"' },
  });
  const row = `| \`${stamped}\` | M-B | false | true | true | W/"match-etag" | 2026-09-01 |`;
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, stamped, row);
  const manifestPath = writeTempManifest(text);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'unchanged');
    assert.equal(out.pinnedEtag, 'W/"match-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('REGRESSION: check() reports etagStatus "changed" when upstream has drifted from the pin', () => {
  const stamped = formats.defaultFormatCode();
  const stub = checkStub({
    codeIndex: { status: 200, text: fxCurrent(), etag: 'W/"new-etag"' },
  });
  const row = `| \`${stamped}\` | M-B | false | true | true | W/"old-etag" | 2026-09-01 |`;
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, stamped, row);
  const manifestPath = writeTempManifest(text);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'changed');
    assert.equal(out.pinnedEtag, 'W/"old-etag"');
    assert.equal(out.etag, 'W/"new-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

// --- Stamp-expiry: the one rollover hole the cross-stamp logic cannot see ---
// reference/regulation.md carries TWO independent stamps (**Regulation:** and
// **Pikalytics slug:**) plus the fetched page's own label, and any disagreement
// among those three already surfaces as current:false. What none of them can
// catch is nobody editing regulation.md AT ALL: both stamps then agree with
// each other and both are wrong. The calendar catches that, and the end date
// is already stamped in the file — it was simply never read.
//
// Dates are injected, never read from the clock, so these cannot rot.

test('regulationHasEnded: false while the stamped regulation is still running', () => {
  assert.equal(formats.regulationHasEnded('2026-09-09', '2026-09-08'), false);
});

// CHANGED (was "false on the end date itself"): the stamps record UTC DATES,
// but the real cutover instant lands mid-day UTC (M-C "ends 2026-12-02" is
// really 01:59 UTC on the 2nd) — so the regulation is essentially over for
// its ENTIRE stamped end date, not just the day after it. `>` under-reported
// the last day of every cycle as still-running; `>=` is correct. See
// reference/regulation.md's stamp-block comment for the convention this
// depends on.
test('REGRESSION (>= semantics): regulationHasEnded is true ON the end date itself', () => {
  assert.equal(formats.regulationHasEnded('2026-09-09', '2026-09-09'), true);
});

test('REGRESSION: regulationHasEnded is true once the end date has passed', () => {
  // The hole: nobody updated regulation.md, so the slug still points at a
  // finished cycle and every stamp agrees with every other stamp.
  assert.equal(formats.regulationHasEnded('2026-09-09', '2026-09-10'), true);
  assert.equal(formats.regulationHasEnded('2026-09-09', '2026-10-01'), true);
});

test('regulationHasEnded: a missing or unparseable end stamp is not an expiry claim', () => {
  // Absence of a date is not evidence the regulation ended. Returning true
  // here would cry wolf on every command in a repo whose stamp got dropped.
  assert.equal(formats.regulationHasEnded(null, '2026-10-01'), false);
  assert.equal(formats.regulationHasEnded('not-a-date', '2026-10-01'), false);
});

// --- rollingStraddle: describe()'s straddle logic, callable without an
// index-shaped page --------------------------------------------------------
// The `teams` command reads /ai/topteams and /ai/team-usage, neither of
// which carries a "Best 50 Pokemon by Usage" table or a "- **Format Code**:"
// bullet — describe() requires both and throws on either page. rollingStraddle
// is the same date-math describe() runs internally, extracted so a caller
// with no per-Pokemon usage index to run describe() against still gets the
// identical, tested answer rather than reimplementing it. Pure/injectable
// `now`, same as windowStraddlesRollover, so these tests never depend on the
// real clock.

test('rollingStraddle: null for a format not on the curated rolling list, regardless of date', () => {
  assert.equal(formats.rollingStraddle('battledataregmbs3', { now: new Date('2026-09-10T00:00:00Z') }), null);
});

test('REGRESSION: rollingStraddle mirrors describe()\'s straddle object exactly for a rolling format that straddles', () => {
  const regStart = formats.activeRegulationStart();
  assert.ok(regStart, 'reference/regulation.md must have a **Regulation starts:** stamp for this test to mean anything');
  const threeDaysIn = new Date(new Date(`${regStart}T00:00:00Z`).getTime() + 3 * 24 * 60 * 60 * 1000);
  const viaDescribe = formats.describe(fx('tournaments-index.md'), undefined, { now: threeDaysIn });
  const viaDirect = formats.rollingStraddle('championstournaments', { now: threeDaysIn });
  assert.deepEqual(viaDirect, viaDescribe.straddle);
  assert.ok(viaDirect, 'both must report a real straddle 3 days into the new regulation');
});

test('rollingStraddle: null once `now` is well past the window, matching describe()', () => {
  const regStart = formats.activeRegulationStart();
  assert.ok(regStart);
  const wellPast = new Date(new Date(`${regStart}T00:00:00Z`).getTime() + 60 * 24 * 60 * 60 * 1000);
  assert.equal(formats.rollingStraddle('championstournaments', { now: wellPast }), null);
});

test('rollingStraddle: matched case-insensitively against the curated rolling-format list', () => {
  const regStart = formats.activeRegulationStart();
  const threeDaysIn = new Date(new Date(`${regStart}T00:00:00Z`).getTime() + 3 * 24 * 60 * 60 * 1000);
  assert.ok(formats.rollingStraddle('ChampionsTournaments', { now: threeDaysIn }));
});

test('describe() reports stampExpired with the end date and days elapsed', () => {
  const d = formats.describe(fx('ranked-index.md'), null, {
    now: new Date('2026-09-19T00:00:00Z'),
    regulationEnd: '2026-09-09',
  });
  assert.equal(d.stampExpired.endedOn, '2026-09-09');
  assert.equal(d.stampExpired.daysAgo, 10);
});

test('describe() leaves stampExpired null while the regulation is still running', () => {
  const d = formats.describe(fx('ranked-index.md'), null, {
    now: new Date('2026-09-08T00:00:00Z'),
    regulationEnd: '2026-09-09',
  });
  assert.equal(d.stampExpired, null);
});

// REGRESSION: `stampExpired` used to be reported but never gated `current` —
// reproduced live: fxCurrent() (regulation M-C, matching the real active
// regulation) with now=2026-12-10 and regulationEnd=2026-12-02 returned
// BOTH current:true AND stampExpired:{daysAgo:9} in the same object. An
// expired stamp can no longer be current, regardless of how well every other
// signal (regulation token match, currency classification) agrees — those
// signals are all downstream of the same stale regulation.md.
test('REGRESSION: describe() sets current:false when the stamp has expired, even though the regulation token still matches', () => {
  const d = formats.describe(fxCurrent(), null, {
    now: new Date('2026-12-10T00:00:00Z'),
    regulationEnd: '2026-12-02',
  });
  assert.ok(d.stampExpired, 'sanity: the stamp must actually be expired in this scenario');
  assert.equal(d.stampExpired.daysAgo, 8);
  assert.equal(d.currency, 'regulation', 'sanity: currency classification still says regulation-current');
  assert.equal(d.current, false, 'an expired stamp must never read as current');
});

// --- corroborateRegulation: independent-source corroboration --------------
// Every check above ultimately reads ONE file (reference/regulation.md), so
// a stale stamp vouches for itself. corroborateRegulation is the pure
// comparison against a SECOND, unrelated source (Pikalytics' own live
// default format) — no I/O, so every branch is directly testable with
// injected values. See formats.js's own comment block for the design.

test('corroborateRegulation: agrees when the stamp matches the provider', () => {
  const out = formats.corroborateRegulation('M-C', 'M-C');
  assert.equal(out.status, 'agrees');
  assert.match(out.message, /M-C/);
});

test('corroborateRegulation: disagrees when the stamp and provider name different regulations', () => {
  const out = formats.corroborateRegulation('M-C', 'M-B');
  assert.equal(out.status, 'disagrees');
  assert.match(out.message, /M-C/);
  assert.match(out.message, /M-B/);
  assert.match(out.message, /stale/i);
});

test('corroborateRegulation: uncorroborated when the provider carries no regulation token (provider === null)', () => {
  const out = formats.corroborateRegulation('M-C', null);
  assert.equal(out.status, 'uncorroborated');
  assert.match(out.message, /M-C/);
  assert.match(out.message, /no.*regulation token|could not/i);
  assert.doesNotMatch(out.message, /agrees/i, 'must never read as agreement');
});

test('corroborateRegulation: unverified when the provider could not be fetched at all (provider === undefined)', () => {
  const out = formats.corroborateRegulation('M-C', undefined);
  assert.equal(out.status, 'unverified');
  assert.match(out.message, /M-C/);
  assert.match(out.message, /could not verify|unverified/i);
  assert.doesNotMatch(out.message, /agrees/i, 'must never read as agreement');
});

// THE INCIDENT, as a permanent regression test: on 2026-09-09, M-B rolled
// over to M-C. reference/regulation.md still stamped M-B while Pikalytics'
// own default format had already moved on — exactly what corroborateRegulation
// exists to catch. regulationOf() is reused (not a new label regex) to derive
// the provider's regulation from the real page-label shape, the same as
// fetchLiveDefaultRegulation does live.
test('REGRESSION (the 2026-09-09 M-B -> M-C rollover): a stamp still reading M-B against a provider declaring Reg M-C disagrees', () => {
  const providerRegulation = formats.regulationOf('Pokemon Champions VGC 2026 Reg M-C', 'gen9championsvgc2026regmc');
  assert.equal(providerRegulation, 'M-C', 'sanity: regulationOf must actually extract M-C from the live label shape');
  const out = formats.corroborateRegulation('M-B', providerRegulation);
  assert.equal(out.status, 'disagrees');
  assert.match(out.message, /M-B/);
  assert.match(out.message, /M-C/);
});

// --- check(): the corroboration gate wired into the CLI --------------------
// Shared stub builder for check()'s three network calls
// (llms-full.txt / bare /ai/pokedex / /ai/pokedex/<stamped>). Defaults to
// full agreement (matching the real stamped slug/regulation) so a test that
// only cares about ONE of the three calls doesn't have to restate the other
// two just to avoid the stub's "unexpected url" throw.
function checkStub(overrides = {}) {
  const stamped = formats.defaultFormatCode();
  const active = formats.activeRegulation();
  const base = 'https://stub.test';
  const responses = Object.assign(
    {
      llmsFull: { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null },
      bareIndex: {
        status: 200,
        text: `- **Format**: Pokemon Champions VGC 2026 Reg ${active}\n- **Format Code**: \`${stamped}\`\n`,
        etag: null,
      },
      codeIndex: { status: 200, text: fxCurrent(), etag: 'W/"stub-etag"' },
    },
    overrides
  );
  return {
    BASE: base,
    get(url) {
      if (url === `${base}/llms-full.txt`) return responses.llmsFull;
      if (url === `${base}/ai/pokedex`) return responses.bareIndex;
      if (url === `${base}/ai/pokedex/${stamped}`) return responses.codeIndex;
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
}

test('check(): regulation mismatch against the live default endpoint throws (the corroboration gate)', () => {
  const active = formats.activeRegulation();
  // A regulation guaranteed different from whatever is really active today,
  // so this stays meaningful across a real rollover.
  const mismatchedRegulation = active === 'M-B' ? 'M-C' : 'M-B';
  const stub = checkStub({
    bareIndex: {
      status: 200,
      text: `- **Format**: Pokemon Champions VGC 2026 Reg ${mismatchedRegulation}\n- **Format Code**: \`some-live-default-code\`\n`,
      etag: null,
    },
  });
  assert.throws(() => formats.check(stub), (err) => {
    assert.match(err.message, /Regulation mismatch/);
    assert.match(err.message, new RegExp(active));
    assert.match(err.message, new RegExp(mismatchedRegulation));
    return true;
  });
});

test('check(): same regulation but a different live-default format code warns (season bump) without throwing', () => {
  const stamped = formats.defaultFormatCode();
  const active = formats.activeRegulation();
  const bumpedCode = `${stamped}-s99`;
  const stub = checkStub({
    bareIndex: {
      status: 200,
      text: `- **Format**: Pokemon Champions VGC 2026 Reg ${active}\n- **Format Code**: \`${bumpedCode}\`\n`,
      etag: null,
    },
  });
  const out = formats.check(stub);
  assert.equal(out.corroboration.status, 'agrees');
  assert.ok(
    out.warnings.some((w) => w.includes(bumpedCode) && w.includes(stamped) && /season bump|slug/i.test(w)),
    `expected a season-bump warning naming both codes, got: ${JSON.stringify(out.warnings)}`
  );
});

test('check(): an unreachable live default endpoint reports unverified without throwing', () => {
  const stub = checkStub({
    bareIndex: { status: 500, text: 'Internal Server Error', etag: null },
  });
  const out = formats.check(stub);
  assert.equal(out.corroboration.status, 'unverified');
  assert.ok(out.warnings.some((w) => /could not fetch|unverified/i.test(w)));
});

test('check(): a live default with no regulation token reports uncorroborated without throwing', () => {
  const stub = checkStub({
    bareIndex: { status: 200, text: '- **Format**: Pokemon Champions VGC 2026 Tournament\n- **Format Code**: `championstournaments`\n', etag: null },
  });
  const out = formats.check(stub);
  assert.equal(out.corroboration.status, 'uncorroborated');
  assert.ok(out.warnings.some((w) => /uncorroborated|could not/i.test(w)));
});
