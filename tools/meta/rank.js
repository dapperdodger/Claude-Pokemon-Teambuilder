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
