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
  assert.equal(out.megaShare.ofSpecies.value, 60.5);
  assert.equal(out.megaShare.ofSpecies.reason, null);
  assert.equal(out.resolvedFrom, 'Raichu');
  assert.match(out.megaShare.basis, /item distribution/i);
});

test('REGRESSION: Mega with stone not in item distribution reports reason, not bare null', () => {
  // Alakazite does not appear in ranked-raichu.md's item list.
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3',
    capabilities: rankedCaps(),
    megaInfo: { isMega: true, base: 'Raichu', stone: 'Alakazite', dexName: 'Mega Alakazam' },
  });
  assert.equal(out.megaShare.stone, 'Alakazite');
  assert.equal(out.megaShare.ofSpecies.value, null);
  assert.ok(out.megaShare.ofSpecies.reason);
  assert.match(out.megaShare.ofSpecies.reason, /does not appear/i);
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

// FINDING 2: mon reported off-regulation data with `current: false` in the
// output but no warning text — a reader has to know to check the boolean.
// usage already warns in words; mon must say the same thing, not stay silent.
test('REGRESSION: mon on an off-regulation format warns, in the SAME words usage uses', () => {
  const describeInfo = { code: 'x', label: 'l', regulation: 'M-A', current: false, capabilities: rankedCaps() };
  const monOut = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(), describe: describeInfo,
  });
  const usageOut = meta.usageFromText(fx('ranked-index.md'), { describe: describeInfo });
  assert.ok(monOut.warnings.some((w) => /previous regulation|not current/i.test(w)));
  assert.deepEqual(
    monOut.warnings.filter((w) => /previous regulation|not current/i.test(w)),
    usageOut.warnings.filter((w) => /previous regulation|not current/i.test(w)),
    'mon and usage must use identical wording for the same condition'
  );
});

test('mon on the CURRENT format carries no off-regulation warning', () => {
  const describeInfo = { code: 'x', label: 'l', regulation: 'M-B', current: true, capabilities: rankedCaps() };
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(), describe: describeInfo,
  });
  assert.ok(!out.warnings.some((w) => /previous regulation|not current/i.test(w)));
});

test('mon without a describe opt (existing callers) still returns a warnings array', () => {
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(),
  });
  assert.deepEqual(out.warnings, []);
});

// FIX 4: megaShare.ofSpecies used to rebuild {value, reason: null} by hand
// instead of using row.percent directly, discarding the reason whenever the
// stone's OWN percentage happened to be a sentinel — reproducing the exact
// bare-null-with-no-reason hole toNumber() exists to close.
test('REGRESSION: a Mega share preserves the stone\'s own sentinel reason, not a bare null', () => {
  const text = [
    '| Property | Value |',
    '|----------|-------|',
    '| **Usage** | N/A |',
    '| **Win Rate** | 45.2% |',
    '| **Record** | 100-90-2 |',
    '',
    '## Common Items',
    '- **Weirdite**: undefined%',
    '',
  ].join('\n');
  const out = meta.monFromText(text, {
    capabilities: {},
    megaInfo: { isMega: true, base: 'Weirdmon', stone: 'Weirdite', dexName: 'Mega Weirdmon' },
  });
  assert.equal(out.megaShare.ofSpecies.value, null);
  assert.ok(out.megaShare.ofSpecies.reason, 'must carry a reason, not a bare null');
});

// FIX 2(b): the input-name regex in megas.js is the FIRST line of defense
// against fetching a Mega's dex-generated stub page, not the only one. This
// pins the second line: a fetched page whose metrics AND items are all
// sentinel must be rejected outright, with a reason naming the real problem,
// rather than reported as a real (if data-sparse) entry.
test('REGRESSION: a stub page (all metrics AND all items sentinel) is rejected, not silently reported', () => {
  assert.throws(
    () => meta.monFromText(fx('ranked-raichu-mega-y.md'), {
      formatCode: 'battledataregmbs3', capabilities: rankedCaps(), lookupName: 'Raichu-Mega-Y',
    }),
    /stub|no rows of its own/i
  );
});

// FIX 8: mon already parses the fetched page's own declared format code via
// parseQuickInfo and discarded it. A redirect or server-side alias serving a
// different format than requested must be caught, the same class of trap as
// a stale Pikalytics slug.
test('REGRESSION: mon throws when the fetched page declares a different format than requested', () => {
  assert.throws(
    () => meta.monFromText(fx('ranked-raichu.md'), {
      formatCode: 'someotherformat', capabilities: rankedCaps(),
    }),
    /requested format|declares format/i
  );
});

// FIX 7: no offline test previously covered usageFromText's happy path —
// current regulation, a format that DOES carry usage, real (non-sentinel)
// numbers all the way through.
test('FIX 7: usageFromText happy path — current true, capabilities.usage true, real numbers survive', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  assert.equal(caps.usage, true, 'tournament format must carry usage for this to be a real happy-path test');
  const out = meta.usageFromText(fx('tournaments-index.md'), {
    describe: { code: 'championstournaments', label: 'l', regulation: 'M-B', current: true, capabilities: caps },
  });
  assert.equal(out.current, true);
  assert.deepEqual(out.warnings, []);
  assert.equal(out.rows[0].species, 'Kingambit');
  assert.equal(out.rows[0].usage.value, 35.59);
  assert.equal(out.rows[0].usage.reason, null);
  assert.equal(out.rows[0].winRate.value, 51.397);
  assert.equal(out.rows[0].winRate.reason, null);
  assert.equal(out.rows[0].record, '13129-12414-39');
});

// FIX 8: case-variant format codes must be accepted (index echoes requested
// casing; mon page normalizes to lowercase), but genuinely different codes
// must still be rejected.
test('REGRESSION: case-variant format code is accepted (index)', () => {
  assert.doesNotThrow(() => meta.usageFromText(fx('ranked-index.md'), {
    describe: formats.describe(fx('ranked-index.md'), 'BattleDataRegMBS3'),
  }));
});

test('REGRESSION: case-variant format code is accepted (mon page)', () => {
  assert.doesNotThrow(() => meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'BattleDataRegMBS3', capabilities: rankedCaps(),
  }));
});

test('REGRESSION: genuinely different format code is still rejected (mon page)', () => {
  assert.throws(
    () => meta.monFromText(fx('ranked-raichu.md'), {
      formatCode: 'someotherformat', capabilities: rankedCaps(),
    }),
    /requested format|declares format/i
  );
});

// --- Currency-taxonomy warnings ---------------------------------------------
// Replaces the old "off-regulation" binary. A rolling format must never get
// the previous-regulation warning (that was the bug this task fixes); an
// unknown-provenance format gets a warning too, but worded as genuinely
// unknown rather than "a previous regulation" — nothing established that.

test('REGRESSION: usageFromText on a rolling+current format (championstournaments-shaped) carries NO off-regulation warning', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  const describeInfo = {
    code: 'championstournaments', label: 'l', regulation: null, currency: 'rolling', current: true,
    straddle: null, capabilities: caps,
  };
  const out = meta.usageFromText(fx('tournaments-index.md'), { describe: describeInfo });
  assert.deepEqual(out.warnings, [], 'a rolling window is current by construction — no warning at all here');
  assert.equal(out.currency, 'rolling');
});

test('REGRESSION: monFromText on a rolling+current format carries NO off-regulation warning', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  const describeInfo = {
    code: 'championstournaments', label: 'l', regulation: null, currency: 'rolling', current: true,
    straddle: null, capabilities: caps,
  };
  const out = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(), describe: describeInfo,
  });
  assert.deepEqual(out.warnings, []);
});

test('REGRESSION: an unknown-currency format is warned as genuinely unknown provenance, not "a previous regulation"', () => {
  const describeInfo = {
    code: 'some-brand-new-format', label: 'l', regulation: null, currency: 'unknown', current: false,
    straddle: null, capabilities: rankedCaps(),
  };
  const out = meta.usageFromText(fx('ranked-index.md'), { describe: describeInfo });
  // ranked-index.md's upstream also carries no usage weighting, so a second,
  // unrelated NO_USAGE warning is expected too — isolate the currency one.
  const currencyWarning = out.warnings.find((w) => /provenance|previous regulation/i.test(w));
  assert.ok(currencyWarning);
  assert.match(currencyWarning, /unknown/i);
  assert.doesNotMatch(currencyWarning, /previous regulation/i);
});

test('a genuinely off-regulation format keeps the ORIGINAL "previous regulation" wording', () => {
  const describeInfo = {
    code: 'gen9championsvgc2026regmabo3', label: 'l', regulation: 'M-A', currency: 'regulation', current: false,
    straddle: null, capabilities: rankedCaps(),
  };
  const out = meta.usageFromText(fx('ranked-index.md'), { describe: describeInfo });
  const currencyWarning = out.warnings.find((w) => /previous regulation/i.test(w));
  assert.ok(currencyWarning);
});

test('REGRESSION: a straddling rolling format gets a distinct mixed-regulation warning, in addition to being current', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  const describeInfo = {
    code: 'championstournaments', label: 'l', regulation: null, currency: 'rolling', current: true,
    straddle: { regulation: 'M-C', regulationStart: '2026-09-09', windowDays: 14, clearsOn: '2026-09-23' },
    capabilities: caps,
  };
  const out = meta.usageFromText(fx('tournaments-index.md'), { describe: describeInfo });
  assert.equal(out.warnings.length, 1, 'straddle is the only warning — current+rolling suppresses the off-regulation one');
  assert.match(out.warnings[0], /mix/i);
  assert.match(out.warnings[0], /M-C/);
  assert.match(out.warnings[0], /2026-09-09/);
  assert.match(out.warnings[0], /2026-09-23/);
  assert.doesNotMatch(out.warnings[0], /NOT the current one/);
});

test('mon and usage use identical straddle wording for the same describe input', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  const describeInfo = {
    code: 'championstournaments', label: 'l', regulation: null, currency: 'rolling', current: true,
    straddle: { regulation: 'M-C', regulationStart: '2026-09-09', windowDays: 14, clearsOn: '2026-09-23' },
    capabilities: caps,
  };
  const usageOut = meta.usageFromText(fx('tournaments-index.md'), { describe: describeInfo });
  const monOut = meta.monFromText(fx('ranked-raichu.md'), {
    formatCode: 'battledataregmbs3', capabilities: rankedCaps(), describe: describeInfo,
  });
  assert.deepEqual(monOut.warnings, usageOut.warnings);
});

test('REGRESSION: an expired regulation stamp warns even when every stamp agrees', () => {
  // The one rollover hole the cross-stamp logic cannot see. Note current:true
  // and straddle:null — by every other signal this data looks fine.
  const out = meta.usageFromText(fx('ranked-index.md'), {
    describe: {
      code: 'battledataregmbs3', label: 'l', regulation: 'M-B', currency: 'regulation',
      current: true, straddle: null,
      stampExpired: { regulation: 'M-B', endedOn: '2026-09-09', daysAgo: 12 },
      capabilities: formats.detectCapabilities(fx('ranked-index.md')),
    },
  });
  const w = out.warnings.join(' ');
  assert.match(w, /stale/i);
  assert.match(w, /2026-09-09/);
  assert.match(w, /12 days ago/);
  assert.match(w, /check/);
});

test('no stamp-expiry warning while the stamped regulation is still running', () => {
  const out = meta.usageFromText(fx('ranked-index.md'), {
    describe: {
      code: 'battledataregmbs3', label: 'l', regulation: 'M-B', currency: 'regulation',
      current: true, straddle: null, stampExpired: null,
      capabilities: formats.detectCapabilities(fx('ranked-index.md')),
    },
  });
  assert.equal(out.warnings.some((x) => /stale/i.test(x)), false);
});
