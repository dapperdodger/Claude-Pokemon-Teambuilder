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
    api: 'https://api.github.com/repos/smogon/pokemon-showdown/commits/master',
    commits: 'https://github.com/smogon/pokemon-showdown/commits/master',
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

async function main() {
  const active = activeRegulation();
  const results = await Promise.all(VENDORS.map((v) => checkVendor(v, active)));
  const body = results.filter(Boolean).join('\n\n---\n\n');
  if (body) emit(body);
}

module.exports = { parsePin, parseActiveRegulation, driftNote, checkVendor };

if (require.main === module) {
  main().catch(() => {}).finally(() => process.exit(0));
}
