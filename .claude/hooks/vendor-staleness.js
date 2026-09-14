#!/usr/bin/env node
'use strict';
// SessionStart hook. Reports whether either vendored dataset is behind
// upstream, and whether the learnset vendor's pin has drifted from the
// active regulation.
//
// Re-vendoring is how a new regulation's roster and move pools reach the
// local data, so EVERY failure path here reports rather than exiting
// quietly: a silent exit is indistinguishable from "vendored data is
// current", which would let stale data go unnoticed at exactly the moment
// it matters most — a regulation rollover.
//
// Rewritten from the original bash version, which hand-escaped JSON with
// sed/awk (fragile, and it silently mis-escaped) and computed its repo root
// one directory too high after the hooks moved into .claude/hooks/, leaving
// the whole check dead.

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const metaParse = require('../../tools/meta/parse');
const metaFormats = require('../../tools/meta/formats');

function emit(body) {
  process.stdout.write(JSON.stringify({
    systemMessage: body,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body },
  }) + '\n');
}

function fetchUpstreamSha(api) {
  return new Promise((resolve) => {
    const req = https.get(api, { headers: { 'User-Agent': 'claude-pokemon-teambuilder' }, timeout: TIMEOUT_MS }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        const m = data.match(/"sha"\s*:\s*"([0-9a-f]{40})"/);
        resolve(m ? m[1] : null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

const REPO = path.join(__dirname, '..', '..');
const REGULATION = path.join(REPO, 'reference', 'regulation.md');
const TIMEOUT_MS = 5000;

const VENDORS = [
  {
    label: "tools/damage-calc's vendored NCP-VGC-Damage-Calculator data (roster, moves, items, abilities)",
    manifest: path.join(REPO, 'tools', 'damage-calc', 'VENDOR_MANIFEST.md'),
    manifestRel: 'tools/damage-calc/VENDOR_MANIFEST.md',
    api: 'https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main',
    commits: 'https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main',
  },
  {
    label: "tools/dex's vendored Pokemon Showdown Champions learnsets (move legality)",
    manifest: path.join(REPO, 'tools', 'dex', 'VENDOR_MANIFEST.md'),
    manifestRel: 'tools/dex/VENDOR_MANIFEST.md',
    // Scoped to the vendored file's path, not master HEAD: the upstream repo
    // takes ~15 commits/week overall but data/mods/champions/learnsets.ts
    // itself changes far less often, so comparing against master HEAD reports
    // "behind upstream" almost permanently even when this exact file is
    // current — noise that buries the regulation-drift line this check
    // exists to surface. This endpoint returns an array of commits that
    // actually touched the path; its first entry's "sha" is what matters,
    // and the existing regex below matches it unchanged.
    api: 'https://api.github.com/repos/smogon/pokemon-showdown/commits?path=data/mods/champions/learnsets.ts',
    commits: 'https://github.com/smogon/pokemon-showdown/commits/master/data/mods/champions/learnsets.ts',
  },
];

function parsePin(text) {
  const sha = text.match(/Commit: `([0-9a-f]{40})`/);
  const reg = text.match(/Regulation: `([A-Za-z0-9-]+)`/);
  return { sha: sha ? sha[1] : null, regulation: reg ? reg[1] : null };
}

function parseActiveRegulation(text) {
  const m = text.match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
  return m ? m[1] : null;
}

function activeRegulation() {
  try {
    return parseActiveRegulation(fs.readFileSync(REGULATION, 'utf8'));
  } catch {
    return null;
  }
}

// Pure: decides whether a pinned regulation has drifted from the active one.
// Kept separate from checkVendor so the one behaviour that actually matters
// here — the drift decision — can be exercised directly in tests without
// touching the filesystem or network.
function driftNote(manifestRel, pinRegulation, active) {
  if (pinRegulation && active && pinRegulation !== active) {
    return (
      `REGULATION DRIFT — ${manifestRel} is pinned to regulation ${pinRegulation}, but the active regulation is ${active}. ` +
      'Move pools change at a regulation boundary (species are added AND existing pools are cut), so this data can report a move ' +
      'as legal that the current regulation removed. Re-vendor before trusting any legality answer.'
    );
  }
  return null;
}

// `fetchSha` is injectable (defaults to the real network fetcher) so tests
// can exercise the full drift decision — including the surrounding
// missing-manifest / missing-pin / unexpected-throw handling — without any
// network call.
async function checkVendor(v, active, fetchSha = fetchUpstreamSha) {
  try {
    if (!fs.existsSync(v.manifest)) {
      return `VENDOR CHECK NOT RUNNING — ${v.manifestRel} not found. This is not a clean bill of health.`;
    }
    const pin = parsePin(fs.readFileSync(v.manifest, 'utf8'));
    if (!pin.sha) {
      return `VENDOR CHECK NOT RUNNING — could not read a "Commit: \`<sha>\`" line from ${v.manifestRel}. Restore that line.`;
    }

    const notes = [];

    // Regulation drift is the more dangerous of the two checks: a pin taken
    // under a previous regulation keeps serving complete, normal-looking data
    // rather than failing, exactly like a stale Pikalytics slug.
    const drift = driftNote(v.manifestRel, pin.regulation, active);
    if (drift) notes.push(drift);

    const upstream = await fetchSha(v.api);
    if (!upstream) {
      notes.push(
        `VENDOR CHECK COULD NOT REACH UPSTREAM for ${v.manifestRel} — no network, or an unexpected API response. This is NOT a clean ` +
        `bill of health; the vendored commit is ${pin.sha}. Compare manually against ${v.commits}.`
      );
    } else if (pin.sha !== upstream) {
      notes.push(
        `${v.label} is behind upstream.\nVendored: ${pin.sha}\nUpstream: ${upstream}\n` +
        `Re-vendor per ${v.manifestRel}'s 'Re-vendoring' section if the gap looks significant. ` +
        'If a regulation has just rolled over, re-vendoring is a required step of the vgc-regulation-transition skill, not optional.'
      );
    }

    return notes.length ? notes.join('\n\n') : null;
  } catch (err) {
    // An unexpected failure (e.g. existsSync passes but readFileSync throws
    // for a non-ENOENT reason) must still report rather than reject: this
    // function is run in parallel with the other vendor's check, and a
    // rejected promise here must never be able to take the other vendor's
    // already-computed report down with it.
    const message = err && err.message ? err.message : String(err);
    return `VENDOR CHECK FAILED UNEXPECTEDLY for ${v.manifestRel}: ${message}. This is not a clean bill of health — treat this as an unknown state, not "current".`;
  }
}

const FORMAT_KNOWLEDGE = path.join(REPO, 'reference', 'format-knowledge.md');

// Pure so it can be tested without a filesystem. The caller reads the file and
// passes what it found; this decides only whether that constitutes stale.
//
// A regulation mismatch is stale at ANY age: the file can be generated
// minutes ago and still describe a field that no longer exists.
function formatKnowledgeStatus({ exists, generatedAt, regulation, activeRegulation }) {
  if (!exists) {
    return {
      stale: true,
      reason:
        'reference/format-knowledge.md has never been generated. Speed tiers and key-move ' +
        'distributions are unavailable. Generate with: node tools/meta/cli.js speed-tiers --write',
    };
  }
  if (regulation && activeRegulation && regulation !== activeRegulation) {
    return {
      stale: true,
      reason:
        `reference/format-knowledge.md describes regulation ${regulation}, but the active ` +
        `regulation is ${activeRegulation}. Regenerate: node tools/meta/cli.js speed-tiers --write`,
    };
  }
  const days = generatedAt
    ? Math.floor((Date.now() - Date.parse(generatedAt)) / (24 * 60 * 60 * 1000))
    : null;
  if (days === null) {
    return { stale: true, reason: 'reference/format-knowledge.md has no parseable generated-on stamp. Regenerate it.' };
  }
  if (days > 7) {
    return {
      stale: true,
      reason:
        `reference/format-knowledge.md is ${days} days old. Usage moves within a regulation. ` +
        'Regenerate: node tools/meta/cli.js speed-tiers --write',
    };
  }
  return { stale: false, days };
}

// Reads reference/format-knowledge.md's own stamps off disk and hands them to
// formatKnowledgeStatus. Kept separate from that pure function (mirrors the
// checkVendor/driftNote split above) so the filesystem read stays isolated
// from the decision it feeds.
function readFormatKnowledgeStatus(active) {
  try {
    if (!fs.existsSync(FORMAT_KNOWLEDGE)) {
      return formatKnowledgeStatus({ exists: false });
    }
    const text = fs.readFileSync(FORMAT_KNOWLEDGE, 'utf8');
    const generatedAt = (text.match(/^\*\*Generated:\*\*\s*(\d{4}-\d{2}-\d{2})/m) || [])[1] || null;
    const regulation = (text.match(/^\*\*Regulation:\*\*\s*(\S+)/m) || [])[1] || null;
    return formatKnowledgeStatus({ exists: true, generatedAt, regulation, activeRegulation: active });
  } catch (err) {
    // Same rule as checkVendor: an unexpected read failure must still report,
    // never resolve to a silent "nothing to say" that reads as current.
    const message = err && err.message ? err.message : String(err);
    return {
      stale: true,
      reason: `Could not read reference/format-knowledge.md: ${message}. Treat this as stale, not current.`,
    };
  }
}

// --- Regulation corroboration ----------------------------------------------
// Everything else in this file (and in tools/meta/formats.js's currency
// checks) ultimately traces back to ONE hand-edited file, reference/
// regulation.md — so a stale stamp there vouches for itself: every
// comparison against it agrees, because they're all reading the same source.
// This is the second, INDEPENDENT source the M-B -> M-C rollover incident
// (2026-09-09) exposed the lack of: Pikalytics' own live default format
// (the bare /ai/pokedex index, no code — it self-declares whatever the site
// currently treats as current). Reused here rather than reimplemented:
// metaFormats.regulationOf() (same label-parsing regex every other caller
// uses) and metaFormats.corroborateRegulation() (the pure, four-outcome
// comparison — agrees/disagrees/uncorroborated/unverified — already unit
// tested in tools/meta/tests/formats.test.js). This hook only supplies the
// live fetch and decides whether the result is worth printing.
const PIKALYTICS_BASE = 'https://www.pikalytics.com';
const REGULATION_CHECK_TIMEOUT_MS = 5000;

// A short-timeout, promise-based GET, matching fetchUpstreamSha's own style
// above — this hook must never hang session start on a slow or hanging
// upstream.
function fetchText(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'claude-pokemon-teambuilder' }, timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Resolves to the provider's regulation ("M-C"), `null` (fetched fine, no
// regulation token — e.g. Pikalytics switched its default to a tournament or
// preview format), or `undefined` (could not be fetched at all: network
// error, timeout, or an unparseable body). Never throws — every failure
// collapses to `undefined`, which corroborateRegulation reports as
// 'unverified' rather than silently reading as agreement.
async function fetchProviderRegulation(timeoutMs = REGULATION_CHECK_TIMEOUT_MS) {
  try {
    const text = await fetchText(`${PIKALYTICS_BASE}/ai/pokedex`, timeoutMs);
    const info = metaParse.parseFormatInfo(text);
    if (!info.label) return undefined;
    return metaFormats.regulationOf(info.label, info.code);
  } catch {
    return undefined;
  }
}

// Runs the corroboration and returns a report string, or `null` when there is
// nothing to say. Agreement stays quiet on purpose — matching how the rest of
// this hook treats an up-to-date vendor (checkVendor returns `null`, not a
// "still current" message) — so a session start with nothing wrong stays
// silent instead of training a reader to skim past a wall of green text.
// `fetchProvider` is injectable so tests exercise every branch (agrees,
// disagrees, uncorroborated, unverified) without a network call.
//
// Respects META_OFFLINE the same way tools/meta's own test suite does (see
// tools/meta/tests/{cli,fetch}.test.js's `ONLINE` guard), so a caller that
// sets it never triggers a live fetch here either — the fetcher must NEVER
// run in this mode. But unlike a network failure, this is not "nothing to
// report": it's a check that did not run at all, exactly the category this
// hook already reports loudly for a vendor with no manifest ("VENDOR CHECK
// NOT RUNNING ... This is not a clean bill of health"). Silence here would be
// indistinguishable from "verified current" to anyone who has META_OFFLINE
// left set in their shell, so this returns a one-line report instead of
// staying quiet.
async function checkRegulationCorroboration(active, fetchProvider = fetchProviderRegulation) {
  if (process.env.META_OFFLINE === '1') {
    return (
      "Regulation corroboration skipped (META_OFFLINE=1): reference/regulation.md's stamp was NOT " +
      'checked against Pikalytics. Unset META_OFFLINE for this check to run.'
    );
  }
  if (!active) return null;
  let provider;
  try {
    provider = await fetchProvider();
  } catch {
    // fetchProviderRegulation itself never throws (see its own comment), but
    // an injected fetcher (tests, or a future caller) might — collapse to
    // the same `undefined` -> 'unverified' path rather than letting this
    // reject and silently drop the whole check, same rule as every other
    // failure path in this file.
    provider = undefined;
  }
  // NEVER REJECTS, by construction. main() starts this promise before the
  // vendor checks and awaits it afterwards, so a rejection in that gap is an
  // unhandled rejection: on Node 22 that kills the process printing nothing,
  // and the hook's `2>/dev/null || true` wrapper turns the crash into silence —
  // the exact failure this corroboration exists to prevent. The comparison is
  // pure today and cannot throw, but that is a property of another file that
  // nobody will remember to preserve. So the guarantee lives here instead: an
  // internal failure, or a malformed result that would otherwise return
  // `undefined` (silent without ever throwing), reports UNVERIFIED.
  try {
    const result = metaFormats.corroborateRegulation(active, provider);
    if (!result || typeof result.status !== 'string') {
      throw new Error('corroborateRegulation returned no status');
    }
    if (result.status === 'agrees') return null;
    if (typeof result.message !== 'string' || !result.message) {
      throw new Error(`corroborateRegulation returned status "${result.status}" with no message`);
    }
    return result.message;
  } catch (err) {
    const reason = err && err.message ? err.message : String(err);
    return (
      `Could not verify reference/regulation.md's stamped regulation (${active}) against ` +
      `Pikalytics' own live default format — the corroboration check itself failed (${reason}). ` +
      'Treat the stamp as UNVERIFIED, not confirmed current.'
    );
  }
}

async function main() {
  const active = activeRegulation();
  // Kicked off BEFORE the vendor Promise.all, not after: this network call
  // and the vendor checks' network calls are unrelated, and running them one
  // after another (rather than concurrently) doubled worst-case session-start
  // latency on a hung network (measured: ~10s vendor-only vs. ~20s with this
  // sequenced after) for no benefit — nothing here depends on the vendor
  // results. The emitted order below is unchanged (vendor notes, then the
  // format-knowledge note, then this one); only when the network calls START
  // moves, not the order results are reported in.
  const regulationPromise = checkRegulationCorroboration(active);
  const results = await Promise.all(VENDORS.map((v) => checkVendor(v, active)));
  const fk = readFormatKnowledgeStatus(active);
  if (fk.stale) results.push(fk.reason);
  const regulationNote = await regulationPromise;
  if (regulationNote) results.push(regulationNote);
  const body = results.filter(Boolean).join('\n\n---\n\n');
  if (body) emit(body);
}

module.exports = {
  parsePin, parseActiveRegulation, driftNote, checkVendor, VENDORS, formatKnowledgeStatus,
  fetchProviderRegulation, checkRegulationCorroboration,
};

if (require.main === module) {
  main().catch(() => {}).finally(() => process.exit(0));
}
