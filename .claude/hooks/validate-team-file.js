#!/usr/bin/env node
'use strict';
// PostToolUse hook on Write|Edit. When a file under teams/ is written, runs
// the team validator over it and reports anything mechanically wrong.
//
// Everything it checks is deterministic — duplicate items, SP budget and
// caps, roster/item/ability legality, a Mega listed with its pre-Mega
// ability, and whether the team's regulation is still current. Those were
// previously a prose checklist, and the two most important of them (duplicate
// items, Mega ability) had each already slipped through more than once. This
// runs at the moment the file is written rather than depending on the
// checklist being remembered.
//
// Reports; does not block. A team file is often written mid-build and being
// incomplete is legitimate, so incompleteness surfaces as a warning.
//
// Fails open on anything unexpected.

const fs = require('node:fs');
const path = require('node:path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
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

  const filePath = payload && payload.tool_input && payload.tool_input.file_path;
  if (!filePath) return;

  const normalised = String(filePath).replace(/\\/g, '/');
  // The tool may hand back an absolute path or one relative to the repo root,
  // so anchor on either a leading slash or the start of the string.
  if (!/(^|\/)teams\/[^/]+\.md$/.test(normalised)) return;
  if (/(^|\/)(_TEMPLATE|README)\.md$/.test(normalised)) return;
  if (!fs.existsSync(filePath)) return;

  let team;
  try {
    team = require(path.join(__dirname, '..', '..', 'tools', 'dex', 'team.js'));
  } catch {
    return; // vendored data not loadable — fail open
  }

  let result;
  try {
    result = team.validateTeamFile(filePath);
  } catch {
    return;
  }

  const { errors, warnings } = result;
  if (errors.length === 0 && warnings.length === 0) return;

  const name = normalised.split('/').pop();
  const lines = [`TEAM VALIDATION — ${name}`];
  for (const e of errors) lines.push(`  ERROR: ${e}`);
  for (const w of warnings) lines.push(`  warn:  ${w}`);
  if (errors.length) {
    lines.push('Fix the ERROR lines before presenting this team as finished — each one is a rule violation, not a preference.');
  }
  lines.push('Not checked: move legality (learnsets are not in the local data — verify live).');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: lines.join('\n'),
    },
  }) + '\n');
}

try {
  main();
} catch {
  // Fail open, always.
}
process.exit(0);
