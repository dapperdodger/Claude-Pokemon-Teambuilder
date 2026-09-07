#!/usr/bin/env node
'use strict';
// PostToolUse hook on WebFetch|WebSearch.
//
// The trap this exists for: a usage-stat page's ability breakdown for a
// Mega-capable species (e.g. "Lightning Rod 93.7% / No Guard 2.7%") reports
// the PRE-Mega ability selection, not the fixed post-Mega battle ability.
// It looks authoritative, and it has been believed over the correct local
// answer repeatedly — including once after the correct answer was already
// written down by name in this repo's own reference files.
//
// Why a hook and not a rule: the rule existed, in four places, and lost. A
// rule read 10,000 tokens earlier competes with a percentage sitting right
// there in the tool output. This fires at the moment of the trap, with the
// real answer attached, so the correct fact arrives at the same instant as
// the misleading one.
//
// Fails open: any parse problem, unreadable input, or vendor-load failure
// exits 0 silently. A broken hook must never block a fetch.

const fs = require('node:fs');
const path = require('node:path');

const MAX_MEGAS_REPORTED = 6;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Pull every "Mega <Something>" mention out of the tool result.
//
// Species names run from one to three words ("Mega Absol", "Mega Raichu Y",
// "Mega Charizard X"), and prose gives no reliable signal about where the
// name ends: "Mega Delphox. Abilities:" and "Mega Raichu Y usage" both
// continue with a capitalised word that is not part of the name. So rather
// than trying to guess the boundary, emit every 1-to-3-word prefix, longest
// first, and let the dex decide. Over-generating is free — a candidate that
// isn't a real Mega simply fails to resolve and is dropped.
//
// Returns an array of arrays: one ordered candidate list per mention.
function candidateMegaNames(text) {
  const groups = [];
  const seen = new Set();
  // Each captured word must start capitalised: species names are, and the
  // requirement stops "Mega is Mega Delphox" from being consumed as one
  // match by the leading bare "Mega" (which would hide the real one).
  const re = /\bMega\s+([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,2})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const words = m[1]
      .split(/\s+/)
      // Trailing punctuation is sentence structure, not part of the name.
      // Leading/trailing quotes and brackets likewise.
      .map((w) => w.replace(/^[("'“”‘’]+/, '').replace(/[.,;:!?)"'“”‘’]+$/, ''))
      .filter(Boolean);

    const ordered = [];
    for (let n = Math.min(3, words.length); n >= 1; n--) {
      const name = 'Mega ' + words.slice(0, n).join(' ');
      ordered.push(name);
    }
    const key = ordered.join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push(ordered);
  }
  return groups;
}

// Only speak up when the fetched content actually looks like it is making an
// ability claim. A page that merely names a Mega in passing is not the trap.
function looksLikeAbilityClaim(text) {
  return /\babilit(?:y|ies)\b/i.test(text) || /\b\d{1,3}(?:\.\d+)?\s*%/.test(text);
}

function main() {
  const raw = readStdin();
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const result = payload && payload.tool_response;
  const text = typeof result === 'string' ? result : JSON.stringify(result || '');
  if (!text || text.length < 20) return;
  if (!looksLikeAbilityClaim(text)) return;

  let dex;
  try {
    dex = require(path.join(__dirname, '..', '..', 'tools', 'dex', 'dex.js'));
  } catch {
    return; // vendor not loadable — fail open
  }

  const hits = [];
  const reported = new Set();
  for (const candidates of candidateMegaNames(text)) {
    if (hits.length >= MAX_MEGAS_REPORTED) break;
    // Longest first, so "Mega Raichu Y" wins over a bare "Mega Raichu".
    for (const name of candidates) {
      let mon;
      try {
        mon = dex.mon(name);
      } catch {
        continue; // not a real Mega in the vendored dex — try a shorter prefix
      }
      if (!mon.abilityIsMegaFixed) break;
      if (!reported.has(mon.name)) {
        reported.add(mon.name);
        hits.push(mon);
      }
      break;
    }
  }

  if (hits.length === 0) return;

  const lines = hits.map((m) => {
    const types = m.types.join('/');
    const pre = m.baseFormeAbility ? `, pre-Mega selection is "${m.baseFormeAbility}"` : '';
    return `- ${m.name}: fixed battle ability is "${m.ability}" (${types}${pre})`;
  });

  const context =
    'MEGA ABILITY CHECK — this fetched page mentions Mega forme(s) alongside ability text. ' +
    'A usage page\'s ability percentages report the PRE-Mega selection, not the fixed post-Mega ' +
    'battle ability. From the local vendored dex:\n' +
    lines.join('\n') +
    '\nUse the fixed battle ability above. Confirm any of these with ' +
    '`node tools/dex/cli.js mon "<Name>"` before stating it.';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }) + '\n');
}

try {
  main();
} catch {
  // Fail open, always.
}
process.exit(0);
