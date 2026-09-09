'use strict';
// Derives "important format knowledge" — the things a player has to know
// about the field rather than about any one Pokemon — from live usage joined
// against the vendored dex.
//
// This is computed, never stored by hand, for the reason the source notes
// give it: what is common changes. A hand-maintained speed-tier list is wrong
// within weeks and looks exactly as authoritative as a correct one.
//
// NAMING HAZARD: usage rows arrive under Pikalytics' convention
// ("Staraptor-Mega"); the dex needs "Mega Staraptor". Every crossing goes
// through megas.pikaToDex — the real, vendored name bridge (see megas.js).
// There is deliberately no local regex fallback here: a hand-rolled name
// transform silently producing a wrong-but-plausible dex entry is exactly the
// failure this repo exists to prevent, and megas.pikaToDex already exists to
// do this correctly. For a non-Mega species, pikaToDex is a no-op and returns
// the name unchanged, so this is safe to call unconditionally.

const dex = require('../dex/dex');
const megas = require('./megas');

function speedTiers(usageResult, opts) {
  const top = (opts && opts.top) || 20;
  const rows = (usageResult.rows || []).slice(0, top);
  const tiers = [];
  const unresolved = [];

  for (const row of rows) {
    let entry;
    try {
      entry = dex.mon(megas.pikaToDex(row.species));
    } catch {
      // Reported, never dropped: a silently shorter tier list reads as a
      // smaller field than the one actually being played. If this list grows
      // long against real usage data, the name conversion above is wrong —
      // fix that, don't add another fallback here to paper over it.
      unresolved.push(row.species);
      continue;
    }
    // dex.mon() returns the vendor's raw stat keys (hp/at/df/sa/sd/sp), where
    // `sp` is base Speed — NOT this repo's own "SP" (Stat Points). See
    // tools/dex/dex.js's mon() and CLAUDE.md's SP note. Our own output field
    // is named baseSpeed precisely to avoid perpetuating that collision.
    const baseSpeed = entry.baseStats.sp;
    tiers.push({
      species: row.species,
      baseSpeed,
      usage: row.usage,
      // scarfed/tailwind are raw multiples of base Speed for tier comparison
      // only — NOT real in-battle stats. A real Speed stat depends on Stat
      // Points, nature/Stat Alignment, and level; use tools/damage-calc for
      // that. Choice Scarf multiplies stage-modified Speed by 1.5 and floors
      // it; Tailwind doubles it.
      scarfed: Math.floor(baseSpeed * 1.5),
      tailwind: baseSpeed * 2,
    });
  }

  tiers.sort((a, b) => b.baseSpeed - a.baseSpeed || a.species.localeCompare(b.species));

  return {
    format: usageResult.format,
    regulation: usageResult.regulation,
    generatedAt: new Date().toISOString().slice(0, 10),
    top,
    tiers,
    unresolved,
    note:
      'Base Speed at level 50 before Stat Points. scarfed and tailwind are the ' +
      'raw multiplier applied to base Speed, for tier comparison only — they are not ' +
      'real in-battle stats. Compute a real Speed stat with tools/damage-calc.',
  };
}

module.exports = { speedTiers };
