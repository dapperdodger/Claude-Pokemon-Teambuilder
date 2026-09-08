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

// A Mega/alt-form page generated straight from the dex (no ladder rows of
// its own, e.g. tools/meta/tests/fixtures/ranked-raichu-mega-y.md) renders
// its headline metrics AND its item list as sentinels at the same time. A
// real entry never does both together — even an unpopular Pokemon with no
// measured usage still has real numbers in at least one of winRate/record,
// or a real (non-`undefined%`) item distribution. That compound signal is
// the tell, mirroring assertNotFiller's alphabetical+all-sentinel detector
// for a whole empty format.
//
// This exists as defense in depth: megas.js's input-name regex is the FIRST
// line of protection against asking for a stub page, but it only catches
// names megas.js recognises as Mega-shaped. A form it doesn't recognise (an
// unvendored Mega, an alternate spelling, some other dex-generated stub)
// would still slip a fetch through to a page shaped exactly like this one.
function assertNotStub(quickInfo, itemPercentsRaw, label) {
  const metricsSentinel = isSentinel(quickInfo.usage)
    && isSentinel(quickInfo.winRate)
    && isSentinel(quickInfo.record);
  const itemsSentinel = itemPercentsRaw.length > 0 && itemPercentsRaw.every((raw) => isSentinel(raw));
  if (metricsSentinel && itemsSentinel) {
    throw new Error(
      `"${label}" has no rows of its own in this format: Usage, Win Rate, Record and every ` +
      `item are all sentinel values at once. This is a generated stub page (the typical shape ` +
      `for an unresolved Mega form on Pikalytics' ladder upstream), not a real ladder entry — ` +
      `the metric is not "unreported", the entity has no data behind it. If this is a Mega, ` +
      `query the base species instead (see tools/meta/megas.js, which resolves Pikalytics' ` +
      `own Mega names automatically).`
    );
  }
}

module.exports = { SENTINELS, isSentinel, toNumber, assertNotFiller, assertNotStub };
