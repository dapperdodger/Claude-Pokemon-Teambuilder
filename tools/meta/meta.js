'use strict';
const parse = require('./parse');
const validate = require('./validate');

const NO_USAGE = 'this format\'s upstream carries no usage weighting — use a tournament or Showdown format for usage';
const TEAMMATES_BUG = 'upstream renders this section as undefined% for every format';

// Shared with usageFromText so a not-current lookup reads identically no
// matter which command surfaced it — one phrasing, not two that can drift.
// Wording depends on WHY the format isn't current: an `unknown`-currency
// format has no regulation to name, so calling it "a previous regulation"
// would be stating something not established — its provenance is genuinely
// unknown, not confirmed to be old.
function offRegulationWarning(d) {
  if (d.currency === 'unknown') {
    return `Format "${d.code}" has no regulation stamp and is not on the curated list of ` +
      `rolling-window formats (tools/meta/formats.js's ROLLING_WINDOW_FORMATS) — its ` +
      `provenance is genuinely unknown. This is not evidence the data is stale, mixed, or ` +
      `up to date; verify what this format actually covers before citing a number from it.`;
  }
  return `Format "${d.code}" is regulation ${d.regulation || 'unknown'}, which is NOT the current one. ` +
    `Reading a previous regulation deliberately is fine; doing it unknowingly is not.`;
}

// A rolling format is current by construction but can still straddle a
// regulation rollover: for roughly its window length after a new regulation
// starts, the window still reaches back into the previous one, so results
// are genuinely current AND genuinely mixed.
function straddleWarning(d) {
  const s = d.straddle;
  return `Format "${d.code}" is a rolling ~${s.windowDays}-day tournament window that currently ` +
    `straddles the regulation rollover: it reaches back before ${s.regulation} started ` +
    `(${s.regulationStart}), so results mix ${s.regulation} with the previous regulation. ` +
    `Expect it to clear of the old regulation's data around ${s.clearsOn}.`;
}

// The stamped cycle's end date has passed, so reference/regulation.md itself
// is out of date. This fires independently of everything above: the other
// checks all compare stamps against each other or against the fetched page,
// and none of them can see the case where nobody edited regulation.md at all
// — every stamp then agrees, and all of them are wrong.
function stampExpiredWarning(d) {
  const s = d.stampExpired;
  return `reference/regulation.md stamps ${s.regulation || 'the active regulation'} as ending ` +
    `${s.endedOn}, which was ${s.daysAgo} day${s.daysAgo === 1 ? '' : 's'} ago — the repo's own ` +
    `regulation stamps are stale, so the Pikalytics slug may be fetching a finished cycle. ` +
    `Nothing above can detect this, because the stamps agree with each other. ` +
    `Run \`node tools/meta/cli.js check\` and the vgc-regulation-transition skill before ` +
    `citing these numbers as current.`;
}

// FINDING 3 (Fix round 1): stampExpired forces `current: false` in
// describe() even when the format's own regulation token still matches the
// active regulation — that's precisely the case a stale calendar stamp
// produces (see formats.js's describe(), and its regression test "sets
// current:false when the stamp has expired, even though the regulation
// token still matches"). Without this guard, that single failure fired BOTH
// stampExpiredWarning AND offRegulationWarning, and the latter's wording
// ("NOT the current one") is actively wrong in that case — the token
// agrees; only the calendar stamp is stale. `d.stampExpired.regulation` is
// always set to the active regulation (see describe()), so comparing it
// against `d.regulation` here needs no second read of reference/regulation.md
// — it's the same information describe() already computed.
function stampExpiredExplainsOffRegulation(d) {
  return Boolean(d.currency === 'regulation' && d.stampExpired && d.regulation === d.stampExpired.regulation);
}

// Every currency-driven warning, in one call, so mon/usage/any future caller
// stay identical by construction rather than by two call sites happening to
// agree.
function currencyWarnings(d) {
  const warnings = [];
  if (!d.current && !stampExpiredExplainsOffRegulation(d)) warnings.push(offRegulationWarning(d));
  if (d.straddle) warnings.push(straddleWarning(d));
  if (d.stampExpired) warnings.push(stampExpiredWarning(d));
  return warnings;
}

function percentList(text, heading, reason) {
  return parse.parsePercentList(text, heading).map((e) => ({
    name: e.name,
    percent: validate.toNumber(e.percentRaw, reason),
  }));
}

function monFromText(text, opts) {
  const q = parse.parseQuickInfo(text);
  const caps = opts.capabilities || {};

  // The page's own declared format must match what was actually requested —
  // catches a redirect or a server-side alias silently serving a different
  // format, the same failure class as a stale Pikalytics slug. Only checked
  // when both sides are known; costs no extra request since Quick Info is
  // already being parsed. Comparison is case-insensitive since the page may
  // normalize casing independently of the request.
  if (opts.formatCode && q.formatCode && q.formatCode.toLowerCase() !== opts.formatCode.toLowerCase()) {
    throw new Error(
      `Requested format "${opts.formatCode}" but the fetched page declares format ` +
      `"${q.formatCode}" — possible redirect or server-side alias serving different data.`
    );
  }

  const rawItems = parse.parsePercentList(text, 'Common Items');
  validate.assertNotStub(q, rawItems.map((e) => e.percentRaw), opts.lookupName || opts.formatCode || 'this entry');

  const items = percentList(text, 'Common Items', 'not reported for this entry');
  const warnings = [];
  if (opts.describe) warnings.push(...currencyWarnings(opts.describe));

  const out = {
    format: opts.formatCode,
    usage: validate.toNumber(q.usage, caps.usage ? 'not reported for this entry' : NO_USAGE),
    winRate: validate.toNumber(q.winRate, caps.winRate ? 'not reported for this entry' : 'this format carries no win rate'),
    record: validate.isSentinel(q.record) ? null : q.record,
    moves: percentList(text, 'Common Moves', 'not reported for this entry'),
    abilities: percentList(text, 'Common Abilities', 'not reported for this entry'),
    items,
    teammates: percentList(text, 'Common Teammates', TEAMMATES_BUG),
    warnings,
  };

  // A Mega has no rows of its own on ladder formats: the numbers above are the
  // BASE species', and the Mega's share is that stone's slice of the base's
  // item distribution.
  if (opts.megaInfo && opts.megaInfo.isMega) {
    const row = items.find((i) => i.name === opts.megaInfo.stone);
    out.resolvedFrom = opts.megaInfo.base;
    out.megaShare = {
      stone: opts.megaInfo.stone,
      ofSpecies: row
        ? row.percent
        : { value: null, reason: `stone does not appear in ${opts.megaInfo.base}'s item distribution for this format` },
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
  const warnings = currencyWarnings(d);
  if (!d.capabilities.usage) warnings.push(NO_USAGE);

  return {
    format: d.code,
    regulation: d.regulation,
    currency: d.currency,
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
