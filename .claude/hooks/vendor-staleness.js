#!/usr/bin/env node
'use strict';
// SessionStart hook. Reports whether tools/damage-calc's vendored
// NCP-VGC-Damage-Calculator data is behind upstream.
//
// Re-vendoring is how a new regulation's roster reaches the local data, so
// EVERY failure path here reports rather than exiting quietly: a silent exit
// is indistinguishable from "vendored data is current", which would let the
// roster go stale unnoticed at exactly the moment it matters most — a
// regulation rollover.
//
// Rewritten from the original bash version, which hand-escaped JSON with
// sed/awk (fragile, and it silently mis-escaped) and computed its repo root
// one directory too high after the hooks moved into .claude/hooks/, leaving
// the whole check dead.

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const REPO = path.join(__dirname, '..', '..');
const MANIFEST = path.join(REPO, 'tools', 'damage-calc', 'VENDOR_MANIFEST.md');
const API = 'https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main';
const TIMEOUT_MS = 5000;

function emit(body) {
  process.stdout.write(JSON.stringify({
    systemMessage: body,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body },
  }) + '\n');
}

function fetchUpstreamSha() {
  return new Promise((resolve) => {
    const req = https.get(API, { headers: { 'User-Agent': 'claude-pokemon-teambuilder' }, timeout: TIMEOUT_MS }, (res) => {
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

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    emit(`VENDOR CHECK NOT RUNNING — tools/damage-calc/VENDOR_MANIFEST.md not found at ${MANIFEST}. This is not a clean bill of health.`);
    return;
  }

  const manifest = fs.readFileSync(MANIFEST, 'utf8');
  const vm = manifest.match(/Commit: `([0-9a-f]{40})`/);
  if (!vm) {
    emit('VENDOR CHECK NOT RUNNING — could not read a "Commit: `<sha>`" line from tools/damage-calc/VENDOR_MANIFEST.md. Restore that line.');
    return;
  }
  const vendored = vm[1];

  const upstream = await fetchUpstreamSha();
  if (!upstream) {
    emit(`VENDOR CHECK COULD NOT REACH UPSTREAM — no network, or the GitHub API response was not in the expected shape. This is NOT a clean bill of health; the vendored commit is ${vendored}. Re-run later, or compare manually against https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main — especially if a regulation has just changed.`);
    return;
  }

  if (vendored !== upstream) {
    emit(
      "tools/damage-calc's vendored NCP-VGC-Damage-Calculator data is behind upstream.\n" +
      `Vendored: ${vendored}\nUpstream main: ${upstream}\n` +
      "Re-vendor per tools/damage-calc/VENDOR_MANIFEST.md's 'Re-vendoring' section if the gap looks significant (new Pokemon, balance changes) — a few commits behind on typo fixes is not urgent. " +
      'If a regulation has just rolled over, re-vendoring is a required step of the vgc-regulation-transition skill, not optional.'
    );
  }
}

main().catch(() => {}).finally(() => process.exit(0));
