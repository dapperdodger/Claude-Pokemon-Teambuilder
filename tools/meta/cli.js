#!/usr/bin/env node
'use strict';
// CLI over tools/meta. One JSON object per invocation, mirroring tools/dex.

const fs = require('node:fs');
const path = require('node:path');
const fetchmod = require('./fetch');
const formats = require('./formats');
const megas = require('./megas');
const meta = require('./meta');
const parse = require('./parse');
const fk = require('./format-knowledge');

const USAGE = `Usage:
  node tools/meta/cli.js formats [--write]      list formats, capabilities, regulation
  node tools/meta/cli.js mon <Species> [--format <code>]   per-Pokemon data
  node tools/meta/cli.js usage [--format <code>]           ranked list
  node tools/meta/cli.js speed-tiers [--top N] [--format <code>] [--write]  base-Speed tiers of the field
                                                 --write also runs a KEY_MOVES/KEY_ABILITIES
                                                 distribution and a cores lookup, and (re)generates
                                                 reference/format-knowledge.md
  node tools/meta/cli.js distribution --move <Move> | --ability <Ability> [--top N] [--format <code>]
                                                 how much of the field carries a move/ability
  node tools/meta/cli.js cores [--top N] [--format <code>]  2/3/4-Pokemon "Common Team Cores" —
                                                 read off the same page \`usage\` fetches, no extra
                                                 network request
  node tools/meta/cli.js check                  slug agreement and ETag drift

Notes:
  "What is used" and "what is winning" come from different upstreams. The
  official ladder format carries win rate but NO usage; tournament formats
  carry both. The tool says which, per call.

  Pass a Mega by its Pikalytics name (e.g. "Staraptor-Mega"); it resolves to
  the base species plus the stone's share. This is the OPPOSITE convention to
  tools/damage-calc, which needs "Mega Staraptor".

  speed-tiers and distribution both sample the top N BY USAGE, then answer
  their question only within that sample — "top" means "among the N
  most-used", not "the N most-extreme overall". A faster (or subject-running)
  species sitting outside that usage cutoff is invisible to either command.

  distribution makes N+1 network requests: one usage index fetch, plus one
  per-Pokemon fetch for each of the top N species. --top defaults to 20, so a
  bare call costs 21 requests. A single species failing to fetch is recorded
  under "unresolved" rather than aborting the run.`;

function fail(message) {
  process.stdout.write(JSON.stringify({ error: message }, null, 2) + '\n');
  process.exit(1);
}
function ok(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
function flagValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

function loadIndex(code) {
  const r = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}`);
  if (r.status !== 200) throw new Error(`Format "${code}" returned HTTP ${r.status}`);
  return r;
}

// Shared by the `cores` command and `speed-tiers --write`: the cores section
// lives on the same index page `usage`/`speed-tiers` already fetch, so this
// costs no extra network request — see docs/superpowers/specs/
// 2026-09-09-team-level-meta-design.md.
function computeCores(idxText, describe, top) {
  const parsed = parse.parseCores(idxText);
  return fk.cores(parsed, { format: describe.code, regulation: describe.regulation, top });
}

// Shared by the `distribution` command and `speed-tiers --write`: fetches the
// per-Pokemon page for each of the top-N usage rows and builds the
// {species, usage, mon} entries fk.distribution() needs. A single species
// failing to fetch is recorded under `unresolved`, same as `distribution`'s
// own contract, rather than aborting the whole run.
function fetchDistributionEntries(usage, code, describe, top) {
  const entries = [];
  const unresolved = [];
  for (const row of usage.rows.slice(0, top)) {
    try {
      const megaInfo = megas.resolve(row.species);
      const lookup = megaInfo.isMega ? megaInfo.base : row.species;
      const r = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}/${encodeURIComponent(lookup)}`);
      if (r.status !== 200) {
        unresolved.push({ species: row.species, reason: `HTTP ${r.status} fetching "${lookup}"` });
        continue;
      }
      const mon = meta.monFromText(r.text, {
        formatCode: code, capabilities: describe.capabilities, megaInfo, describe, lookupName: lookup,
      });
      entries.push({ species: row.species, usage: row.usage, mon });
    } catch (err) {
      unresolved.push({ species: row.species, reason: err.message });
    }
  }
  return { entries, unresolved };
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(USAGE + '\n');
    process.exit(command ? 0 : 1);
  }

  try {
    // Inside the try: defaultFormatCode() throws when the regulation stamp is
    // missing, and every failure here must still emit one JSON object and
    // exit 1, not a raw Node stack trace.
    const code = flagValue(argv, '--format') || formats.defaultFormatCode();

    if (command === 'mon') {
      const name = argv[1];
      if (!name) return fail('mon: a species name is required, e.g. mon "Staraptor-Mega"');
      const megaInfo = megas.resolve(name);
      const lookup = megaInfo.isMega ? megaInfo.base : name;
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text, code);
      const r = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}/${encodeURIComponent(lookup)}`);
      if (r.status !== 200) return fail(`"${lookup}" returned HTTP ${r.status} in format ${code}`);
      const out = meta.monFromText(r.text, {
        formatCode: code, capabilities: describe.capabilities, megaInfo, describe, lookupName: lookup,
      });
      out.species = name;
      out.regulation = describe.regulation;
      out.currency = describe.currency;
      out.current = describe.current;
      return ok(out);
    }

    if (command === 'usage') {
      const idx = loadIndex(code);
      return ok(meta.usageFromText(idx.text, { describe: formats.describe(idx.text, code) }));
    }

    if (command === 'speed-tiers') {
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text, code);
      const usage = meta.usageFromText(idx.text, { describe });
      const topRaw = flagValue(argv, '--top');
      const top = topRaw ? Number(topRaw) : 20;
      const tiers = fk.speedTiers(usage, { top });

      if (!argv.includes('--write')) return ok(tiers);

      // --write additionally runs a distribution over every KEY_MOVES /
      // KEY_ABILITIES subject (the source notes' "Important Format
      // Knowledge" list) and renders both halves to
      // reference/format-knowledge.md. Regeneration is a manual command,
      // never something the SessionStart hook triggers itself.
      // Fetched once and reused across every subject below — the per-Pokemon
      // pages don't change between a Trick Room check and a Prankster check,
      // so re-fetching per subject would multiply N+1 requests by the
      // subject count for no new information.
      const { entries, unresolved } = fetchDistributionEntries(usage, code, describe, top);
      const subjects = [
        ...fk.KEY_MOVES.map((move) => ({ move })),
        ...fk.KEY_ABILITIES.map((ability) => ({ ability })),
      ];
      const distributions = subjects.map((subj) => {
        const d = fk.distribution(entries, subj);
        d.unresolved = unresolved;
        return d;
      });

      // Cores come off the same index page fetched above (`idx.text`) — see
      // computeCores's own note. No new network request.
      const coresOut = computeCores(idx.text, describe, top);

      const body = fk.render(tiers, distributions, coresOut);
      const outPath = path.join(__dirname, '..', '..', 'reference', 'format-knowledge.md');
      fs.writeFileSync(outPath, body);

      return ok({ ...tiers, distributions, cores: coresOut, written: { path: outPath } });
    }

    if (command === 'cores') {
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text, code);
      const topRaw = flagValue(argv, '--top');
      const top = topRaw ? Number(topRaw) : 5;
      return ok(computeCores(idx.text, describe, top));
    }

    if (command === 'distribution') {
      const move = flagValue(argv, '--move');
      const ability = flagValue(argv, '--ability');
      if (Boolean(move) === Boolean(ability)) {
        return fail('distribution: pass exactly one of --move <Move> or --ability <Ability>.');
      }
      const idx = loadIndex(code);
      const describe = formats.describe(idx.text, code);
      const usage = meta.usageFromText(idx.text, { describe });
      const topRaw = flagValue(argv, '--top');
      const top = topRaw ? Number(topRaw) : 20;

      // Same Mega-aggregation rule as `mon`: Pikalytics logs a Mega's battles
      // under its base species, so the fetch must go out under the base name
      // even though the usage row itself may already be the base
      // (pikaToDex/resolve is a no-op for a non-Mega name).
      const { entries, unresolved } = fetchDistributionEntries(usage, code, describe, top);

      const out = fk.distribution(entries, move ? { move } : { ability });
      out.format = describe.code;
      out.regulation = describe.regulation;
      out.top = top;
      out.unresolved = unresolved;
      return ok(out);
    }

    if (command === 'formats') {
      return ok(formats.report(fetchmod, { write: argv.includes('--write') }));
    }

    if (command === 'check') {
      return ok(formats.check(fetchmod));
    }

    return fail(`Unknown command: "${command}".\n\n${USAGE}`);
  } catch (err) {
    return fail(err.message);
  }
}

main();
