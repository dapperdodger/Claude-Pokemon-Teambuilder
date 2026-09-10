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

// FINDING 3: check() has no automated test despite being the most
// safety-critical behaviour in the tool. fetchmod is dependency-injected, so
// both paths are testable deterministically with a stub — no network needed.
test('check() names the slug on agreement', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fxCurrent(), etag: 'W/"stub-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  const out = formats.check(stub);
  assert.equal(out.slug, stamped);
  assert.equal(out.agrees, true);
});

test('REGRESSION: check() throws on disagreement, naming BOTH values', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: '**Format Code**: `some-other-stale-slug`', etag: null };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  assert.throws(() => formats.check(stub), (err) => {
    assert.match(err.message, /some-other-stale-slug/, 'must name the declared (stale) value');
    assert.ok(err.message.includes(stamped), 'must name the stamped value too');
    return true;
  });
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

function stubFor(declaredCode, stampedCode) {
  return {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${this.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${declaredCode}\``, etag: null };
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

test('REGRESSION: check() still throws when llms-full.txt declares a value OTHER than the recorded resolution\'s declared side', () => {
  const stamped = formats.defaultFormatCode();
  const recordedDeclared = 'battledataregmbs3';
  const actualDeclared = 'some-third-value-neither-side-recorded';
  const stub = stubFor(actualDeclared, stamped);
  const manifestPath = writeTempManifest(buildResolvedManifest(recordedDeclared, stamped, stamped, '2026-09-09'));
  try {
    assert.throws(() => formats.check(stub, { manifestPath }), (err) => {
      assert.match(err.message, new RegExp(actualDeclared.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.ok(err.message.includes(stamped));
      return true;
    });
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('REGRESSION: check() still throws when regulation.md is stamped with a value OTHER than the recorded resolution\'s stamped side (e.g. a rollover since the resolution was recorded)', () => {
  const realStamped = formats.defaultFormatCode();
  const recordedStamped = 'gen9championsvgc-some-other-regulation-entirely';
  const declared = 'battledataregmbs3';
  const stub = stubFor(declared, realStamped);
  const manifestPath = writeTempManifest(buildResolvedManifest(declared, recordedStamped, recordedStamped, '2026-09-09'));
  try {
    assert.throws(() => formats.check(stub, { manifestPath }), (err) => {
      assert.match(err.message, /battledataregmbs3/);
      assert.ok(err.message.includes(realStamped));
      return true;
    });
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
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 404, text: 'Not Found', etag: null };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
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
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fxCurrent(), etag: 'W/"live-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
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
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fxCurrent(), etag: 'W/"match-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
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
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fxCurrent(), etag: 'W/"new-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
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

test('regulationHasEnded: false on the end date itself — the cycle runs through it', () => {
  assert.equal(formats.regulationHasEnded('2026-09-09', '2026-09-09'), false);
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
