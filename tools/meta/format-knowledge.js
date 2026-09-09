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
      'real in-battle stats. Compute a real Speed stat with tools/damage-calc. ' +
      '"top" means fastest among the N most-USED species, not the N fastest overall — a ' +
      'faster but lower-usage species outside the sample is invisible here.',
  };
}

// The source notes' "Important Format Knowledge" list: rough distributions of
// Trick Room, Fake Out, Follow Me, Rage Powder, Wide Guard, Prankster. Held
// as a named constant rather than hardcoded into the command, so it can grow
// without touching the CLI.
const KEY_MOVES = ['Trick Room', 'Fake Out', 'Follow Me', 'Rage Powder', 'Wide Guard'];
const KEY_ABILITIES = ['Prankster'];

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// How common a move or ability is across a sampled slice of the field.
// `entries` is [{species, usage, mon}] where `mon` is a meta.monFromText()
// result (so `mon.moves` / `mon.abilities` are [{name, percent}] lists).
//
// `share` is deliberately NOT usage-weighted: it is carrying-count / sample
// size, so a species running the subject on 12% of its sets counts exactly
// the same as one running it on 98%. Read the per-row `rate` (that
// percentage) to see the difference — share alone answers "how many of the
// field run this at all", never "how much of the field's damage output/turns
// involve this".
function distribution(entries, opts) {
  const o = opts || {};
  if (Boolean(o.move) === Boolean(o.ability)) {
    throw new Error('distribution: pass exactly one of { move } or { ability }.');
  }
  const kind = o.move ? 'move' : 'ability';
  const subject = o.move || o.ability;
  const target = norm(subject);

  const rows = entries.map((e) => {
    const list = (kind === 'move' ? e.mon.moves : e.mon.abilities) || [];
    const hit = list.find((x) => norm(x.name) === target);
    return {
      species: e.species,
      usage: e.usage,
      carries: Boolean(hit),
      rate: hit ? hit.percent : null,
    };
  });

  const carrying = rows.filter((r) => r.carries).length;
  return {
    kind,
    subject,
    of: entries.length,
    carrying,
    share: entries.length ? Math.round((carrying / entries.length) * 1000) / 10 : 0,
    rows,
    note:
      'Share is the fraction of the sampled top-N species that run this at all, not a ' +
      'usage-weighted figure. A species carrying it on 12% of its sets counts the same as one ' +
      'carrying it on 98% — read the per-row rate before treating this as prevalence. The ' +
      'sample itself is also usage-biased: "top N" means the N most-USED species, not the N ' +
      'most likely to run this — a low-usage carrier outside the sample is invisible here.',
  };
}

// Markdown body for reference/format-knowledge.md. Mirrors META_MANIFEST.md's
// do-not-hand-edit convention: this file is computed, never edited by hand,
// because what is common changes and a hand-maintained list looks exactly as
// authoritative as a correct one right up until it's wrong.
//
// `distributions` is an array of `distribution()` results (one per KEY_MOVES
// / KEY_ABILITIES subject), each carrying its own `of`/`carrying`/`unresolved`
// via the caller (cli.js attaches `unresolved` the same way the `distribution`
// command does).
function render(speedTiers, distributions) {
  const lines = [];
  lines.push('# Format knowledge — generated');
  lines.push('');
  lines.push('**Do not hand-edit.** Regenerate with `node tools/meta/cli.js speed-tiers --write`.');
  lines.push('');
  lines.push(`**Generated:** ${speedTiers.generatedAt}`);
  lines.push(`**Format:** ${speedTiers.format}`);
  lines.push(`**Regulation:** ${speedTiers.regulation}`);
  lines.push('');
  lines.push(
    'This file answers "what does the field look like" — the questions\n' +
    '`reference/sources/teambuilding-notes-advanced.md` lists under *Important\n' +
    'Format Knowledge*. It is computed, never written by hand, because what is\n' +
    'common changes and a hand-maintained list looks exactly as authoritative as\n' +
    'it is wrong.'
  );
  lines.push('');

  lines.push('## Speed tiers');
  lines.push('');
  lines.push('| Species | Base Speed | Usage % | ×1.5 (Scarf) | ×2 (Tailwind) |');
  lines.push('|---|---|---|---|---|');
  for (const t of speedTiers.tiers) {
    // usage is a validate.toNumber() result ({value, reason}), not a bare
    // number: this format's upstream (the official ladder) carries no usage
    // weighting at all, so `value` is null and `reason` explains why — never
    // stringify the object itself into the table.
    const usage = t.usage && t.usage.value !== null && t.usage.value !== undefined
      ? `${t.usage.value}%`
      : 'n/a';
    lines.push(`| ${t.species} | ${t.baseSpeed} | ${usage} | ${t.scarfed} | ${t.tailwind} |`);
  }
  lines.push('');

  lines.push('## Key move and ability distributions');
  lines.push('');
  lines.push('| Subject | Carried by | Share |');
  lines.push('|---|---|---|');
  for (const d of distributions) {
    lines.push(`| ${d.subject} | ${d.carrying}/${d.of} | ${d.share}% |`);
  }
  lines.push('');

  // Distributions share one fetch of the top-N species (see cli.js), so their
  // `unresolved` lists are identical across subjects — collapse them into one
  // set of species-level notes instead of repeating each species once per
  // subject.
  const unresolvedSet = new Set();
  for (const s of speedTiers.unresolved || []) {
    unresolvedSet.add(`Speed tiers: could not resolve "${s}" against the dex.`);
  }
  for (const d of distributions) {
    for (const u of d.unresolved || []) {
      const reason = typeof u === 'string' ? u : `${u.species}: ${u.reason}`;
      unresolvedSet.add(`Distributions: ${reason}`);
    }
  }
  const unresolved = [...unresolvedSet];

  lines.push('## Unresolved');
  lines.push('');
  if (unresolved.length) {
    for (const u of unresolved) lines.push(`- ${u}`);
  } else {
    lines.push('None.');
  }
  lines.push('');

  return lines.join('\n');
}

module.exports = { speedTiers, distribution, KEY_MOVES, KEY_ABILITIES, render };
