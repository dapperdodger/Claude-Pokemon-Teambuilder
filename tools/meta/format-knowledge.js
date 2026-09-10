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
const validate = require('./validate');

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

// Common Team Cores — Pikalytics' own pre-computed 2/3/4-Pokemon groupings,
// carried through from parse.parseCores()'s raw output the same way
// speedTiers() carries usageFromText()'s rows: this function's job is
// turning raw/validated numbers into a bounded, format/regulation-stamped
// view, not re-parsing text. `format`/`regulation` are threaded in via
// `opts` (there is no per-core network fetch to read them off, unlike
// speedTiers' usageResult).
//
// `usage` and `teams` come back as validate.toNumber() envelopes ({value,
// reason}), never bare numbers — see render()'s handling below, which
// exists because the speed-tiers renderer once stringified this exact shape
// straight into a table cell as "[object Object]".
//
// Species are passed through in Pikalytics' own convention (e.g.
// "Charizard-Mega-Y") untouched — exactly like speedTiers' row.species.
// Anything that needs the dex form must go through megas.pikaToDex itself;
// this function does no name resolution of its own.
function cores(parsed, opts) {
  const o = opts || {};
  const top = (o.top) || 5;
  const base = {
    format: o.format,
    regulation: o.regulation,
    generatedAt: new Date().toISOString().slice(0, 10),
    top,
  };

  if (parsed.reason) {
    return { ...base, groups: [], reason: parsed.reason };
  }

  const groups = parsed.groups.map((g) => {
    if (g.reason) {
      return { size: g.size, cores: [], reason: g.reason };
    }
    return {
      size: g.size,
      reason: null,
      cores: g.cores.slice(0, top).map((c) => ({
        rank: c.rank,
        species: c.species,
        teams: validate.toNumber(c.teamsRaw, 'not reported for this core'),
        usage: validate.toNumber(c.usageRaw, 'not reported for this core'),
      })),
    };
  });

  return {
    ...base,
    groups,
    reason: null,
    note:
      'Cores are Pikalytics\' own 2/3/4-Pokemon groupings ranked by how many sampled teams run ' +
      'them, read off the same pokedex index page `usage` already fetches — no extra network ' +
      'request. "top" bounds each group\'s own already-ranked list; it does not re-sort.',
  };
}

// /ai/topteams + /ai/team-usage — the other two-thirds of methodology.md's
// three-Pikalytics-surface rule (cores() above covers the third). Carries
// through parse.parseTopTeams()/parse.parseTeamUsage()'s raw output the same
// way cores() carries parse.parseCores()'s, and takes `format`/`regulation`/
// `straddle` via opts for the same reason cores() does: there is no single
// per-Pokemon usage page here to read them off, since both endpoints are
// team-shaped, not Pokemon-ranked.
//
// `parsed.topTeams` / `parsed.teamUsage` each arrive as ONE of three shapes,
// set by the caller (cli.js), so a network failure on either feed never
// takes the other down with it:
//   { skipped: true }                — not requested (the `--only` flag)
//   { error: '<message>' }           — the fetch/parse for this feed failed
//   the real parse.parseTopTeams() / parse.parseTeamUsage() return value
//
// Never blended: topTeams answers "here is a real team to test against" (one
// row = one build), teamUsage answers "which archetype actually wins" (ranked
// by win rate) — see docs/superpowers/specs/
// 2026-09-09-team-level-meta-design.md. Presented as two separate sections
// rather than joined into one list.
function teams(parsed, opts) {
  const o = opts || {};
  const top = o.top || 5;
  const straddle = o.straddle || null;

  // Surfaced at the TOP LEVEL, not nested inside a section a reader might
  // skip: championstournaments is a rolling window with no regulation of its
  // own, and for roughly its window length after a rollover it reaches back
  // into the previous regulation — genuinely current AND genuinely mixed.
  // Without this, the command confidently describes a blend of two
  // regulations as if it were one meta.
  const warnings = [];
  if (straddle) {
    warnings.push(
      `Format "${o.format}" is a rolling ~${straddle.windowDays}-day tournament window that currently ` +
      `straddles the regulation rollover: it reaches back before ${straddle.regulation} started ` +
      `(${straddle.regulationStart}), so BOTH sections below mix ${straddle.regulation} with the previous ` +
      `regulation. Expect it to clear of the old regulation's data around ${straddle.clearsOn}.`
    );
  }

  const tt = parsed.topTeams || {};
  let topTeams;
  if (tt.skipped) {
    topTeams = { included: false };
  } else if (tt.error) {
    topTeams = { included: true, error: tt.error, reason: null, teams: [] };
  } else {
    topTeams = {
      included: true,
      error: null,
      reason: tt.teams.length ? null : tt.reason,
      teams: tt.teams.slice(0, top).map((t) => ({
        rank: t.rank,
        author: t.author,
        record: t.record,
        tournament: t.tournament,
        // Pikalytics' own free-text tags, in reference/archetypes.md's
        // taxonomy. Nothing else in this repo consumes them yet — carried
        // through so a later pass can join them against teamUsage's win
        // rate, which is precisely what nothing here can currently measure.
        archetypes: t.archetypes,
        species: t.species,
      })),
    };
  }

  const tu = parsed.teamUsage || {};
  let teamUsage;
  if (tu.skipped) {
    teamUsage = { included: false };
  } else if (tu.error) {
    teamUsage = { included: true, error: tu.error, reason: null, compositions: [] };
  } else {
    teamUsage = {
      included: true,
      error: null,
      reason: tu.rows.length ? null : tu.reason,
      compositions: tu.rows.slice(0, top).map((r) => ({
        rank: r.rank,
        uses: validate.toNumber(r.usesRaw, 'not reported for this composition'),
        winRate: validate.toNumber(r.winRateRaw, 'not reported for this composition'),
        record: validate.isSentinel(r.recordRaw) ? null : r.recordRaw,
        uniqueTeams: validate.toNumber(r.uniqueTeamsRaw, 'not reported for this composition'),
        species: r.species,
      })),
    };
  }

  return {
    format: o.format,
    regulation: o.regulation,
    generatedAt: new Date().toISOString().slice(0, 10),
    top,
    straddle,
    warnings,
    topTeams,
    teamUsage,
    note:
      'topTeams answers "here is a real tournament team to test against" (one row = one build, not a ' +
      'frequency signal). teamUsage answers "which six-Pokemon archetype actually wins" (ranked by uses ' +
      'and win rate). Pulled together in one call because methodology.md asks for both, but never ' +
      'blended into one list — read them as answers to two different questions. "top" bounds each ' +
      'section\'s own already-ranked list independently; it does not merge or re-sort them.',
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
function render(speedTiers, distributions, cores) {
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

  lines.push('## Common team cores');
  lines.push('');
  const c = cores || { reason: 'not computed', groups: [] };
  if (c.reason) {
    lines.push(`_${c.reason}_`);
    lines.push('');
  } else {
    for (const g of c.groups) {
      lines.push(`### ${g.size}-Pokemon Cores`);
      lines.push('');
      if (g.reason) {
        lines.push(`_${g.reason}_`);
        lines.push('');
        continue;
      }
      lines.push('| Rank | Core | Teams | Usage |');
      lines.push('|---|---|---|---|');
      for (const row of g.cores) {
        // Same {value, reason} envelope as speed tiers' usage column above —
        // never stringify the object itself into the table.
        const teams = row.teams && row.teams.value !== null && row.teams.value !== undefined
          ? row.teams.value
          : 'n/a';
        const usage = row.usage && row.usage.value !== null && row.usage.value !== undefined
          ? `${row.usage.value}%`
          : 'n/a';
        lines.push(`| ${row.rank} | ${row.species.join(', ')} | ${teams} | ${usage} |`);
      }
      lines.push('');
    }
  }

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

module.exports = { speedTiers, distribution, KEY_MOVES, KEY_ABILITIES, cores, teams, render };
