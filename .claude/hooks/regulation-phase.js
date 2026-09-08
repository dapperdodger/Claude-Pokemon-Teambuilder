#!/usr/bin/env node
'use strict';
// SessionStart hook. Reports where the current regulation sits in its
// lifecycle, and what that implies for this session's work.
//
// Replaces the old binary "is this file stale" check. Regulations turn over
// roughly every 3-4 months, so a transition is a scheduled event, not an
// incident — and the correct behaviour genuinely differs by phase. Early in a
// cycle there is no usage data to look up, so the meta-lookup workflow has to
// change shape; late in a cycle, long-horizon build work is about to be
// invalidated. Encoding the phase means a session is told which situation it
// is in instead of having to infer it from a date.
//
// Also reports team files whose `Regulation:` stamp no longer matches the
// active one, so an out-of-date team can't silently read as current.

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.join(__dirname, '..', '..');
const REG_FILE = path.join(REPO, 'reference', 'regulation.md');
const TEAMS_DIR = path.join(REPO, 'teams');

// Phase boundaries, in days. Chosen to match how a real cycle behaves rather
// than round numbers: usage data is effectively absent for the first fortnight
// of a regulation, still moving for about a month after that, and a rollover
// needs about a week of warning to be worth acting on.
const EARLY_DAYS = 14;
const FORMING_DAYS = 42;
const ROLLOVER_WARNING_DAYS = 7;
const VERIFY_STALE_DAYS = 14;

const MS_PER_DAY = 86400000;

function stamp(text, label) {
  const m = text.match(new RegExp('^\\*\\*' + label + ': ([0-9]{4}-[0-9]{2}-[0-9]{2})\\*\\*', 'm'));
  return m ? m[1] : null;
}

function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function teamRegulationMismatches(activeId) {
  const out = { stale: [], unstamped: [] };
  let files;
  try {
    files = fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md' && f !== 'README.md');
  } catch {
    return out;
  }
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(path.join(TEAMS_DIR, f), 'utf8');
    } catch {
      continue;
    }
    const m = text.match(/^\*\*Regulation:\*\*\s*([A-Za-z0-9-]+)/m);
    if (!m) out.unstamped.push(f);
    else if (m[1] !== activeId) out.stale.push(`${f} (${m[1]})`);
  }
  return out;
}

function main() {
  let text;
  try {
    text = fs.readFileSync(REG_FILE, 'utf8');
  } catch {
    return null;
  }

  const idMatch = text.match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
  const id = idMatch ? idMatch[1] : null;
  const starts = stamp(text, 'Regulation starts');
  const ends = stamp(text, 'Regulation ends');
  const verified = stamp(text, 'Last verified');
  const today = todayIso();

  const lines = [];
  const missing = [];
  if (!id) missing.push('Regulation');
  if (!starts) missing.push('Regulation starts');
  if (!ends) missing.push('Regulation ends');
  if (!verified) missing.push('Last verified');

  if (missing.length) {
    // A guard that cannot read its input must say so. The previous version of
    // this check silently reported healthy when its parse failed, which left
    // the end-date guard dead for weeks.
    lines.push(`REGULATION STAMPS MISSING from reference/regulation.md: ${missing.join(', ')}.`);
    lines.push('The regulation phase check is NOT running. Restore the machine-readable block at the top of that file.');
    return lines.join('\n');
  }

  const sinceStart = daysBetween(starts, today);
  const untilEnd = daysBetween(today, ends);
  const sinceVerified = daysBetween(verified, today);

  let phase;
  if (untilEnd < 0) {
    phase = 'ENDED';
    lines.push(`REGULATION ${id} ENDED ${-untilEnd} day(s) ago (${ends}).`);
    lines.push('Run the vgc-regulation-transition skill before giving any team or moveset advice — the roster, legal mechanics and vendored data are all potentially wrong until it has run.');
  } else if (untilEnd <= ROLLOVER_WARNING_DAYS) {
    phase = 'ROLLOVER IMMINENT';
    lines.push(`Regulation ${id} ends in ${untilEnd} day(s) (${ends}).`);
    lines.push('Say so before starting long-horizon build work: a team built now is for a format that is about to change. The vgc-regulation-transition skill covers the handover.');
  } else if (sinceStart < EARLY_DAYS) {
    phase = 'EARLY';
    lines.push(`Regulation ${id} is ${sinceStart} day(s) old — usage data is thin or absent by definition.`);
    lines.push('Do not present early usage numbers as a settled meta. See the vgc-meta-lookup skill\'s "Early in a regulation" section for what to do instead.');
  } else if (sinceStart < FORMING_DAYS) {
    phase = 'FORMING';
    lines.push(`Regulation ${id} is ${sinceStart} day(s) old — usage data exists but is still moving. Treat rankings as directional, not settled.`);
  } else {
    phase = 'SETTLED';
  }

  // Pikalytics slug sanity. The slug is NOT derivable from the regulation id
  // (M-B ranked is "battledataregmbs3"; M-A was "gen9championsvgc2026regma"),
  // so this cannot compute the right answer — but it can catch the dangerous
  // case, which is a slug left over from a previous regulation. Those keep
  // serving complete, correctly-labelled data forever rather than 404ing, so
  // a stale slug silently yields wrong-regulation usage numbers.
  //
  // Both observed naming schemes embed the regulation id with the hyphen
  // dropped ("mb", "ma"), so checking for that substring works across both
  // without assuming either shape.
  const slugMatch = text.match(/^\*\*Pikalytics slug: (\S+)\*\*/m);
  if (!slugMatch) {
    lines.push('No "**Pikalytics slug: <slug>**" stamp in reference/regulation.md — look the current slug up at https://www.pikalytics.com/pokedex before any usage lookup, and record it there.');
  } else {
    const slug = slugMatch[1];
    const idToken = id.toLowerCase().replace(/-/g, '');
    if (!slug.toLowerCase().includes(idToken)) {
      lines.push(`Pikalytics slug "${slug}" does not mention the active regulation (${id}). A previous regulation's slug still returns complete, normal-looking data, so this would silently produce wrong-regulation usage numbers. Re-read the current slug from https://www.pikalytics.com/pokedex and update the stamp.`);
    }
  }

  if (sinceVerified > VERIFY_STALE_DAYS) {
    lines.push(`reference/regulation.md was last verified ${verified} (${sinceVerified} days ago, >${VERIFY_STALE_DAYS}) — re-check before relying on it.`);
  }

  const mismatch = teamRegulationMismatches(id);
  if (mismatch.stale.length) {
    lines.push(`Team files built for a different regulation than ${id}: ${mismatch.stale.join(', ')}. Their per-pick reasoning was true under those rules, not today's — do not read them as current.`);
  }
  if (mismatch.unstamped.length) {
    lines.push(`Team files with no parseable "**Regulation:** <id>" stamp: ${mismatch.unstamped.join(', ')}.`);
  }

  if (lines.length === 0) return null;
  return `REGULATION ${phase} — ${id}\n- ` + lines.join('\n- ');
}

try {
  const body = main();
  if (body) {
    const payload = { systemMessage: body, hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body } };
    process.stdout.write(JSON.stringify(payload) + '\n');
  }
} catch {
  // Fail open rather than blocking a session on a reporting hook.
}
process.exit(0);
