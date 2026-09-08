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
