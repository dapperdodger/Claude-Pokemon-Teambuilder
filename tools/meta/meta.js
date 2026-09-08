'use strict';
const parse = require('./parse');
const validate = require('./validate');

const NO_USAGE = 'this format\'s upstream carries no usage weighting — use a tournament or Showdown format for usage';
const TEAMMATES_BUG = 'upstream renders this section as undefined% for every format';

// Shared with usageFromText so an off-regulation lookup reads identically no
// matter which command surfaced it — one phrasing, not two that can drift.
function offRegulationWarning(d) {
  return `Format "${d.code}" is regulation ${d.regulation || 'unknown'}, which is NOT the current one. ` +
    `Reading a previous regulation deliberately is fine; doing it unknowingly is not.`;
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
  const items = percentList(text, 'Common Items', 'not reported for this entry');
  const warnings = [];
  if (opts.describe && !opts.describe.current) warnings.push(offRegulationWarning(opts.describe));

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
        ? { value: row.percent.value, reason: null }
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
  const warnings = [];
  if (!d.current) warnings.push(offRegulationWarning(d));
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
