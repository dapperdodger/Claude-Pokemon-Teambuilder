#!/usr/bin/env node
'use strict';
// PostToolUse hook (Write|Edit) — flags team-file SP spreads that look like
// un-optimized round defaults (every stat value is 0, 2, or 32) with no
// accompanying evidence that a real breakpoint search was done.
//
// IMPORTANT: round numbers are not banned. 32/2/0 can genuinely be the
// correct, optimal spread (e.g. a wallbreaker's Attack really should be
// maxed, or 32 Def really is the minimum that clears a named threat with
// nothing left over). What's banned is landing on round numbers with no
// visible justification — see reference/vgc_teambuilding_methodology.md's
// "SP spread allocation" section. A first version of this hook blocked on
// round numbers alone regardless of justification; the user pointed out
// that's wrong (a real doc-and-blame flagged, not fixed then) — round is
// fine *if* it's demonstrably the solved answer.
//
// This can't verify correctness, only look for a real optimization-style
// justification (not just a survival percentage — a percentage only proves
// "this spread survives X," not "X is the minimum that survives"). Each
// Pokemon whose spread is round-only must have its "Why these six"
// paragraph contain explicit minimum/breakpoint-style language.
// Real history: this file's own first draft (teams/surprise-trick-room-anti-meta.md)
// had six 32/32/2 spreads and plenty of verification percentages in the
// prose, but zero minimum/breakpoint language anywhere — confirmed via a
// live grep before writing this check, not assumed.

const fs = require('node:fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function extractSection(content, headingRegex) {
  const match = content.match(headingRegex);
  return match ? match[1] : '';
}

function parseSixTable(sixSection) {
  const rows = [];
  for (const line of sixSection.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed.split('|').map((c) => c.trim());
    // cells[0] = '' (before leading |), cells[1] = Pokemon, ..., cells[5] = SP allocation
    if (cells.length < 6) continue;
    const name = cells[1];
    if (!name) continue;
    if (/^Pok[eé]mon$/i.test(name)) continue; // header row
    if (/^-+$/.test(name)) continue; // separator row
    rows.push({ name, sp: cells[5] || '' });
  }
  return rows;
}

const EVIDENCE_PATTERN =
  /\bminimum\b|\bbreakpoint\b|\bleftover\b|reallocat|freed\s*(up\s*)?(the\s*)?(remaining|extra|other)?|\bsolves?\s+for\b|\bsolved\s+for\b|\bonly\s+needs?\b|\bno\s+SP-allocation\s+fix\b/i;

function main() {
  const input = readStdin();
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const filePath = payload && payload.tool_input && payload.tool_input.file_path;
  if (!filePath) process.exit(0);

  const normPath = filePath.replace(/\\/g, '/');
  if (!/\/teams\/[^/]+\.md$/.test(normPath)) process.exit(0);
  if (/\/teams\/_TEMPLATE\.md$/.test(normPath)) process.exit(0);
  if (!fs.existsSync(filePath)) process.exit(0);

  const content = fs.readFileSync(filePath, 'utf8');

  const sixSection = extractSection(content, /## The six\n([\s\S]*?)\n## /);
  if (!sixSection) process.exit(0);

  const rows = parseSixTable(sixSection);
  if (rows.length < 3) process.exit(0);

  const whySection = extractSection(content, /## Why these six\n([\s\S]*?)\n## /);

  const unjustified = [];
  for (const row of rows) {
    const nums = (row.sp.match(/\d+/g) || []).map(Number);
    if (nums.length === 0) continue;
    const allRound = nums.every((n) => n === 0 || n === 2 || n === 32);
    if (!allRound) continue;

    const coreName = row.name.split(/[\s(]/)[0];
    if (!coreName) continue;

    // Locate this Pokemon's paragraph: from its bold header to the next
    // bold-header-starting paragraph (or end of section). Approximate by
    // taking a fixed window after the header if no next boundary is found —
    // imprecise, but errs toward NOT over-blocking (may pull in a little of
    // the next paragraph rather than missing evidence in this one).
    const headerRegex = new RegExp(`\\*\\*[^*]*${escapeRegex(coreName)}[^*]*\\*\\*`, 'i');
    const headerMatch = whySection.match(headerRegex);
    if (!headerMatch) {
      unjustified.push(row.name + ' (no matching paragraph found)');
      continue;
    }
    const startIdx = headerMatch.index;
    const rest = whySection.slice(startIdx + headerMatch[0].length);
    const nextHeaderIdx = rest.search(/\n\*\*[^*]+\*\*/);
    const paraText = nextHeaderIdx === -1 ? rest.slice(0, 2000) : rest.slice(0, nextHeaderIdx);

    if (!EVIDENCE_PATTERN.test(paraText)) {
      unjustified.push(row.name);
    }
  }

  if (unjustified.length > 0) {
    const base = filePath.split(/[\\/]/).pop();
    const reason =
      `Round-only SP spread (values only 0/2/32) with no visible optimization-search evidence for: ${unjustified.join(', ')} in ${base}. ` +
      `Round numbers are fine IF they are genuinely the solved answer — but that needs explicit minimum/breakpoint-style ` +
      `reasoning in "Why these six" (e.g. "the minimum SP that survives X is Y, leftover points went to Z"), not just a ` +
      `percentage showing the chosen spread happens to survive something (that proves survival, not minimality). ` +
      `Use tools/damage-calc/cli.js to binary-search a Speed breakpoint, or tools/damage-calc/optimize-bulk.js to find the ` +
      `real minimum HP/Def/SpD split for a named threat (see reference/vgc_damage_calc.md's "Bulk optimization" section — ` +
      `HP-vs-Def/SpD is NOT a 50/50 or "max the relevant stat" split, it depends on the defender's own base stats), ` +
      `then either lower the spread and spend the rest elsewhere, or write the explicit justification if 32/2/0 truly is optimal.`;
    const msg = `SP spread check: ${unjustified.length} Pokemon in ${base} have round spreads without visible optimization evidence.`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason, systemMessage: msg }) + '\n');
  }

  process.exit(0);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
