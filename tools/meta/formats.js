'use strict';
// Which metrics a format carries is a property of its UPSTREAM, not of the
// site: the official ladder feed has battle records but no usage weighting,
// Showdown feeds have usage but no records, and tournament sheets have both.
// So capabilities are detected per format rather than assumed.
//
// Regulation is stamped for the same reason a Pikalytics slug is: the supported
// list mixes regulations AND eras (gen9vgc2025regi is a different game), every
// one of them returns clean confident numbers, and pulling several formats at
// once for a multi-population answer makes it easy to blend them unnoticed.

const fs = require('node:fs');
const path = require('node:path');
const parse = require('./parse');
const validate = require('./validate');

function repoRoot() {
  return path.join(__dirname, '..', '..');
}

// Same stamp the team validator and the phase hook read.
function activeRegulation() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Same stamp block as activeRegulation(), read separately (mirrors
// stampedSlug() below) so callers that only need one or the other don't pay
// for parsing both.
function activeRegulationStart() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Regulation starts: (\d{4}-\d{2}-\d{2})\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// The end date of the stamped cycle. This is the ONE rollover failure the
// cross-stamp logic cannot see. reference/regulation.md carries two
// independent stamps (**Regulation:** and **Pikalytics slug:**), and the
// fetched page declares its own regulation in its label; any disagreement
// among those three already surfaces as current:false without a network call.
// But if nobody edits regulation.md at all, every stamp agrees with every
// other stamp and all of them are wrong — the slug keeps fetching a finished
// cycle, which returns complete, correctly-formatted, wrong data forever.
// Only the calendar catches that, and the date was already stamped here.
function activeRegulationEnd() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Regulation ends: (\d{4}-\d{2}-\d{2})\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Pure, so its tests inject dates instead of reading the clock and cannot rot.
// A missing or unparseable stamp returns false: absence of a date is not
// evidence a regulation ended, and claiming otherwise would cry wolf on every
// command in a repo whose stamp got dropped.
function regulationHasEnded(endISO, now) {
  if (!endISO) return false;
  const end = new Date(`${endISO}T00:00:00Z`);
  const today = now instanceof Date ? now : new Date(`${now}T00:00:00Z`);
  if (Number.isNaN(end.getTime()) || Number.isNaN(today.getTime())) return false;
  return today > end;
}

function daysBetween(fromISO, now) {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const today = now instanceof Date ? now : new Date(`${now}T00:00:00Z`);
  return Math.round((today.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

// Champions regulations only. A VGC-2025/Scarlet-Violet format is not a
// Champions regulation at all and must not be stamped as one.
function regulationOf(label, code) {
  const isChampions = /champions/i.test(String(label)) || /champions/i.test(String(code));
  if (!isChampions) return null;
  const m = String(label).match(/\bReg(?:ulation)?(?:\s+Set)?\s+([A-Z]-[A-Z0-9]+)\b/i);
  return m ? m[1].toUpperCase() : null;
}

// --- Currency taxonomy -----------------------------------------------------
// A format's data is current for one of two structurally different reasons,
// and treating them as one binary ("has a regulation token that matches" /
// "everything else") is what produced the bug this rewrite fixes: it slapped
// a "previous regulation" warning on `championstournaments`, which has no
// regulation token because it doesn't need one — it's a rolling window over
// whatever's currently played, current by construction.
//
//   regulation — label carries a regulation token (e.g. "Reg M-B"). current
//                 iff that token equals reference/regulation.md's active one.
//   rolling    — a rolling window over current play. ALWAYS current.
//   unknown    — cannot be determined. Never current. The safe default.
//
// Curated list, not inferred from the absence of a token. `championspreview`
// also has no regulation token, and Pikalytics itself flags it as pre-launch
// preview data — NOT current — so "no token => rolling" would misclassify
// actively suspect data as current. A format is "rolling" only when named
// here deliberately, after being confirmed the same way `championstournaments`
// was confirmed (its own index page states the window explicitly — see
// tools/meta/tests/fixtures/tournaments-index.md's Format Notes).
//
// A newly-appearing token-less format therefore lands in `unknown` on
// purpose: that is a person's decision to make, not something for this code
// to guess at. Add to this list only after verifying the format really is a
// rolling window over current play, and cite the evidence in a changelog row.
const ROLLING_WINDOW_FORMATS = new Set(['championstournaments']);

// Upstream's own stated approximation (tournaments-index.md's Format Notes:
// "Built from approximately the last 2 weeks of qualifying tournaments above
// a minimum size threshold for relevance"). This is prose, not a documented
// contract — Pikalytics could change the window without updating anything
// this tool reads structurally. Treat it as an estimate to revisit if that
// wording ever changes, not a guaranteed cutoff.
const ROLLING_WINDOW_DAYS = 14;

function classifyCurrency(code, regulation, active) {
  if (regulation) {
    return { currency: 'regulation', current: Boolean(active && regulation === active) };
  }
  if (ROLLING_WINDOW_FORMATS.has(String(code).toLowerCase())) {
    return { currency: 'rolling', current: true };
  }
  return { currency: 'unknown', current: false };
}

// Pure — takes explicit dates so it is testable without depending on the
// real clock. A test pinned to "today" silently stops testing anything the
// moment today moves; injected dates keep testing the same scenario forever.
//
// Direction of the comparison, spelled out because it inverts easily: the
// straddle exists when the window's own start (today - windowDays) is
// EARLIER than the regulation's start date — i.e. the window reaches back
// past the rollover boundary into the previous regulation. `regulationStart`
// is the ACTIVE regulation's start date (reference/regulation.md), not the
// rolling format's own — a rolling format has no regulation of its own to
// have a start date for.
function windowStraddlesRollover(regulationStartISO, now, windowDays = ROLLING_WINDOW_DAYS) {
  if (!regulationStartISO) return false;
  const regStart = new Date(`${regulationStartISO}T00:00:00Z`);
  const today = now instanceof Date ? now : new Date(`${now}T00:00:00Z`);
  if (Number.isNaN(regStart.getTime()) || Number.isNaN(today.getTime())) return false;
  const windowStart = new Date(today.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return windowStart < regStart;
}

// The straddle half of describe()'s currency logic, extracted so a caller
// with no per-Pokemon usage index to run describe() against can still get
// the identical, tested answer. `describe()` requires a "- **Format Code**:"
// bullet AND a non-empty "Best 50 Pokemon by Usage" table in the text it is
// given — both true of a /ai/pokedex/{code} index page, neither true of
// /ai/topteams or /ai/team-usage (the `teams` command's two endpoints),
// which carry their own team-shaped tables instead. Rather than reimplement
// this date math at the call site (exactly the mistake this function exists
// to prevent — see docs/superpowers/specs/
// 2026-09-09-team-level-meta-design.md), or spend a third network request
// fetching an index page solely to run it through describe(), a caller in
// that position calls this directly with the format code it already knows.
// Pure and injectable via opts.now, same as windowStraddlesRollover.
function rollingStraddle(code, opts = {}) {
  if (!ROLLING_WINDOW_FORMATS.has(String(code).toLowerCase())) return null;
  const regulationStart = activeRegulationStart();
  const now = opts.now || new Date();
  if (!windowStraddlesRollover(regulationStart, now, ROLLING_WINDOW_DAYS)) return null;
  const regStartDate = new Date(`${regulationStart}T00:00:00Z`);
  const clearsOn = new Date(regStartDate.getTime() + ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return {
    regulation: activeRegulation(),
    regulationStart,
    windowDays: ROLLING_WINDOW_DAYS,
    clearsOn: clearsOn.toISOString().slice(0, 10),
  };
}

function detectCapabilities(indexText) {
  const rows = parse.parseUsageTable(indexText);
  const some = (key) => rows.some((r) => !validate.isSentinel(r[key]));
  return {
    usage: some('usageRaw'),
    winRate: some('winRateRaw'),
    record: some('recordRaw'),
  };
}

// `expectedCode`, when given, is the format code the caller actually asked
// for (the URL it fetched). Pikalytics' own agent API can 200 with a body
// for a different format than requested (a redirect, a server-side alias);
// asserting the page's own declared code against what was requested catches
// that the same way a stale Pikalytics slug is caught elsewhere in this
// tool — silently trusting whatever came back is how that class of bug
// slips through.
function describe(indexText, expectedCode, opts = {}) {
  const info = parse.parseFormatInfo(indexText);
  const rows = parse.parseUsageTable(indexText);
  // An empty/unparseable response (a 404 body, a changed upstream heading)
  // must not be mistaken for a real format that simply lacks every metric.
  // assertNotFiller below only fires when there ARE rows to inspect for the
  // alphabetical-filler shape — zero rows short-circuits it entirely and
  // would otherwise flow straight through to a complete-looking, all-false
  // capability set.
  if (!info.code || !rows.length) {
    throw new Error(
      `Could not parse a usable format from this response — ` +
      `${!info.code ? 'no **Format Code** found' : 'no rows in the "Best 50 Pokemon by Usage" table'}. ` +
      `This is a parse failure or an empty response (a 404 body, a changed upstream heading), not ` +
      `a format that legitimately lacks a metric: a real format still has ranked rows even when ` +
      `every metric column in them is a sentinel.`
    );
  }
  if (expectedCode && info.code.toLowerCase() !== expectedCode.toLowerCase()) {
    throw new Error(
      `Requested format "${expectedCode}" but the fetched index page declares format ` +
      `"${info.code}" — possible redirect or server-side alias serving different data.`
    );
  }
  validate.assertNotFiller(rows, info.code);
  const regulation = regulationOf(info.label, info.code);
  const active = activeRegulation();
  const { currency, current } = classifyCurrency(info.code, regulation, active);

  // A rolling window is current by construction, but it can still straddle a
  // regulation rollover: for roughly ROLLING_WINDOW_DAYS after a new
  // regulation starts, the window's own reach-back still overlaps the
  // previous one, so the data is genuinely current AND genuinely mixed — a
  // third state distinct from both "fine" and "stale".
  const straddle = currency === 'rolling' ? rollingStraddle(info.code, opts) : null;

  // Independent of currency and of the stamps agreeing with each other: if the
  // stamped cycle's end date has passed, regulation.md itself is stale and the
  // slug may be fetching a finished regulation. A warning, never an error —
  // reading a finished cycle deliberately is legitimate, and the transition
  // skill explicitly calls for it.
  const regulationEnd = opts.regulationEnd !== undefined ? opts.regulationEnd : activeRegulationEnd();
  const nowForExpiry = opts.now || new Date();
  const stampExpired = regulationHasEnded(regulationEnd, nowForExpiry)
    ? {
      regulation: active,
      endedOn: regulationEnd,
      daysAgo: daysBetween(regulationEnd, nowForExpiry),
    }
    : null;

  return {
    code: info.code,
    label: info.label,
    regulation,
    currency,
    current,
    straddle,
    stampExpired,
    capabilities: detectCapabilities(indexText),
  };
}

const LLMS = '/llms-full.txt';

// The site declares its own current default format; this is what makes the
// slug programmatically checkable instead of a manual habit.
function declaredDefault(fetchmod) {
  const r = fetchmod.get(fetchmod.BASE + LLMS);
  if (r.status !== 200) throw new Error(`llms-full.txt returned HTTP ${r.status}`);
  const m = r.text.match(/\*\*Format Code\*\*:\s*`([^`]+)`/);
  if (!m) throw new Error('llms-full.txt no longer declares a **Format Code**');
  return m[1];
}

function stampedSlug() {
  try {
    const p = path.join(repoRoot(), 'reference', 'regulation.md');
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Pikalytics slug: (\S+)\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function defaultFormatCode() {
  const stamped = stampedSlug();
  if (!stamped) throw new Error('reference/regulation.md has no **Pikalytics slug:** stamp');
  return stamped;
}

function manifestPath() {
  return path.join(__dirname, 'META_MANIFEST.md');
}

// Pure text -> row parse, same style as upsertManifestRow: no I/O, so it's
// directly testable with synthetic manifest text. Returns null when the
// format code has never been written to the manifest — that "never pinned"
// state must stay distinguishable from a pinned row whose etag happens to
// match, or a caller can't tell "nothing to compare against" from "verified
// unchanged".
function readManifestRow(src, code) {
  const codeCell = `\`${code}\``;
  for (const line of src.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    if (!line.includes(codeCell)) continue;
    const cells = line.split('|').map((c) => c.trim());
    // | Format code | Regulation | Usage | Win rate | Record | ETag | Last checked | Currency |
    // Currency is appended LAST, after the original seven columns, so a row
    // written before this taxonomy existed still parses (currency comes back
    // null, same as any other never-populated cell) instead of shifting
    // every existing index.
    return {
      code: cells[1] ? cells[1].replace(/`/g, '') : null,
      regulation: cells[2] || null,
      etag: cells[6] || null,
      checked: cells[7] || null,
      currency: cells[8] || null,
    };
  }
  return null;
}

// A markdown heading, not a line-by-line scan of the whole manifest like
// readManifestRow's — deliberately. A resolved-disagreement row's cells are
// ALSO backtick-wrapped format codes, and one of them (the "stamped" side)
// is by definition a currently-pinned format code too. If this table were
// scanned the same undifferentiated way as the Formats table, a
// resolved-disagreement row could be mistaken for that code's ETag pin row
// (or vice-versa) depending purely on which happened to sit first in the
// file. Scoping to the heading makes that collision structurally impossible
// instead of relying on section order in META_MANIFEST.md never changing.
const RESOLVED_DISAGREEMENTS_HEADING = '## Resolved slug disagreements';

function resolvedDisagreementsSection(src) {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => l.trim() === RESOLVED_DISAGREEMENTS_HEADING);
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.trim().startsWith('## '));
  return end === -1 ? rest : rest.slice(0, end);
}

// A hand-recorded resolution applies to the EXACT (declared, stamped) pair —
// see META_MANIFEST.md's "Resolved slug disagreements" section, which records
// both values, which one was chosen, why, the evidence, and the date. Pinning
// to the exact pair (not e.g. "ignore disagreements for this stamped code")
// is what keeps this scoped: if llms-full.txt ever reports a THIRD value, or
// reference/regulation.md's stamp moves to a new regulation, neither value
// matches the recorded row anymore and `check` goes back to failing until a
// fresh row is recorded for the new pair.
function readResolvedDisagreement(src, declared, stamped) {
  const declaredCell = `\`${declared}\``;
  const stampedCell = `\`${stamped}\``;
  for (const line of resolvedDisagreementsSection(src)) {
    if (!line.trim().startsWith('|')) continue;
    if (!line.includes(declaredCell) || !line.includes(stampedCell)) continue;
    const cells = line.split('|').map((c) => c.trim());
    // | llms-full.txt declared | regulation.md stamped | Chosen | Date | Evidence |
    const rowDeclared = cells[1] ? cells[1].replace(/`/g, '') : null;
    const rowStamped = cells[2] ? cells[2].replace(/`/g, '') : null;
    // Guard against a substring collision inside a longer code (rare, but
    // the same discipline readManifestRow already applies via its exact
    // backtick-cell match) — require the parsed cells to equal the values
    // asked about, not merely contain their text somewhere in the line.
    if (rowDeclared !== declared || rowStamped !== stamped) continue;
    return {
      declared: rowDeclared,
      stamped: rowStamped,
      chosen: cells[3] ? cells[3].replace(/`/g, '') : null,
      date: cells[4] || null,
      evidence: cells[5] || null,
    };
  }
  return null;
}

// Disagreement between what Pikalytics itself declares as current and what
// reference/regulation.md has stamped is a hard error, never a silent
// fallback: silently preferring either source reintroduces the exact trap
// this repo has been burned by (a previous regulation's slug keeps returning
// complete, correctly-formatted, entirely wrong data forever). The one
// exception is a disagreement that has already been resolved BY HAND, with
// evidence recorded in META_MANIFEST.md for that exact pair — see
// readResolvedDisagreement above. That still gets reported on every run
// (never silently), just not treated as a fresh, unverified failure.
//
// The manifest's whole stated purpose (META_MANIFEST.md's own header) is
// answering "has upstream changed since we last cited it?" — which was
// previously unanswerable, because nothing ever read the file back. `check`
// is where that read belongs: it already fetches the live index page and
// its ETag for the slug-agreement check, so comparing that ETag against the
// pinned one costs nothing extra.
function check(fetchmod, opts = {}) {
  const declared = declaredDefault(fetchmod);
  const stamped = stampedSlug();

  const mp = opts.manifestPath || manifestPath();
  let manifestSrc = '';
  try {
    manifestSrc = fs.readFileSync(mp, 'utf8');
  } catch {
    manifestSrc = '';
  }

  let resolvedDisagreement = null;
  if (declared !== stamped) {
    resolvedDisagreement = readResolvedDisagreement(manifestSrc, declared, stamped);
    if (!resolvedDisagreement) {
      throw new Error(
        `Slug disagreement: llms-full.txt declares "${declared}", reference/regulation.md ` +
        `stamps "${stamped}". One is stale. Resolve it by hand — silently preferring either ` +
        `reintroduces the wrong-regulation-data trap. If this exact pair has already been ` +
        `verified and resolved, record it in tools/meta/META_MANIFEST.md's "Resolved slug ` +
        `disagreements" table so \`check\` recognises it.`
      );
    }
  }

  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${stamped}`);
  if (idx.status !== 200) {
    throw new Error(
      `Format "${stamped}" returned HTTP ${idx.status} at ${fetchmod.BASE}/ai/pokedex/${stamped} — ` +
      `cannot verify agreement or ETag drift against a failed fetch.`
    );
  }
  const d = describe(idx.text, stamped);

  const pinned = readManifestRow(manifestSrc, stamped);
  const pinnedEtag = pinned ? pinned.etag : null;
  // 'unpinned': this format code has never been written with `formats --write`.
  // 'unchanged': the pinned ETag still matches what upstream serves right now.
  // 'changed': upstream has moved since the pin — re-vendor/re-check before citing it.
  const etagStatus = !pinnedEtag ? 'unpinned' : pinnedEtag === idx.etag ? 'unchanged' : 'changed';

  return {
    slug: stamped,
    agrees: declared === stamped,
    resolvedDisagreement,
    etag: idx.etag,
    pinnedEtag,
    etagStatus,
    ...d,
  };
}

// Insert-or-update a manifest row keyed on the format code (the manifest is
// meant to hold one row per format over time, refreshed on each --write, not
// grow a new row per run). Placeholder-replace only fires the FIRST time a
// given code is written; every later --write for that same code must find its
// own row by the code cell and overwrite it in place, or this silently stops
// updating anything while still claiming success.
function upsertManifestRow(src, code, row) {
  const codeCell = `\`${code}\``;
  const lines = src.split('\n');
  let codeRowIdx = -1;
  let placeholderIdx = -1;
  let lastTableRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) continue;
    lastTableRowIdx = i;
    if (placeholderIdx === -1 && /_\(populated/.test(line)) placeholderIdx = i;
    if (line.includes(codeCell)) codeRowIdx = i;
  }
  if (codeRowIdx !== -1) {
    lines[codeRowIdx] = row;
    return { text: lines.join('\n'), action: 'updated' };
  }
  if (placeholderIdx !== -1) {
    lines[placeholderIdx] = row;
    return { text: lines.join('\n'), action: 'added' };
  }
  if (lastTableRowIdx !== -1) {
    lines.splice(lastTableRowIdx + 1, 0, row);
    return { text: lines.join('\n'), action: 'added' };
  }
  lines.push(row);
  return { text: lines.join('\n'), action: 'added' };
}

function report(fetchmod, opts = {}) {
  const code = defaultFormatCode();
  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}`);
  if (idx.status !== 200) {
    throw new Error(
      `Format "${code}" returned HTTP ${idx.status} at ${fetchmod.BASE}/ai/pokedex/${code} — ` +
      `refusing to report capabilities off a failed fetch.`
    );
  }
  const d = describe(idx.text, code);
  const out = { ...d, etag: idx.etag, checked: new Date().toISOString().slice(0, 10) };
  if (opts.write) {
    const p = path.join(__dirname, 'META_MANIFEST.md');
    const row = `| \`${d.code}\` | ${d.regulation} | ${d.capabilities.usage} | ${d.capabilities.winRate} | ${d.capabilities.record} | ${idx.etag} | ${out.checked} | ${d.currency} |`;
    const src = fs.readFileSync(p, 'utf8');
    const { text: next, action } = upsertManifestRow(src, d.code, row);
    fs.writeFileSync(p, next);
    out.written = { path: p, action };
  }
  return out;
}

module.exports = {
  activeRegulation, activeRegulationStart, activeRegulationEnd, regulationHasEnded,
  regulationOf, detectCapabilities, describe,
  defaultFormatCode, report, check, upsertManifestRow, readManifestRow, readResolvedDisagreement,
  classifyCurrency, windowStraddlesRollover, rollingStraddle, ROLLING_WINDOW_FORMATS, ROLLING_WINDOW_DAYS,
};
