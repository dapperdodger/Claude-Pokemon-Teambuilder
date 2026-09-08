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

// Champions regulations only. A VGC-2025/Scarlet-Violet format is not a
// Champions regulation at all and must not be stamped as one.
function regulationOf(label, code) {
  const isChampions = /champions/i.test(String(label)) || /champions/i.test(String(code));
  if (!isChampions) return null;
  const m = String(label).match(/\bReg(?:ulation)?(?:\s+Set)?\s+([A-Z]-[A-Z0-9]+)\b/i);
  return m ? m[1].toUpperCase() : null;
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
function describe(indexText, expectedCode) {
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
  return {
    code: info.code,
    label: info.label,
    regulation,
    current: Boolean(regulation && active && regulation === active),
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
    // | Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |
    return {
      code: cells[1] ? cells[1].replace(/`/g, '') : null,
      regulation: cells[2] || null,
      etag: cells[6] || null,
      checked: cells[7] || null,
    };
  }
  return null;
}

// Disagreement between what Pikalytics itself declares as current and what
// reference/regulation.md has stamped is a hard error, never a fallback:
// silently preferring either source reintroduces the exact trap this repo has
// been burned by (a previous regulation's slug keeps returning complete,
// correctly-formatted, entirely wrong data forever).
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
  if (declared !== stamped) {
    throw new Error(
      `Slug disagreement: llms-full.txt declares "${declared}", reference/regulation.md ` +
      `stamps "${stamped}". One is stale. Resolve it by hand — silently preferring either ` +
      `reintroduces the wrong-regulation-data trap.`
    );
  }
  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${stamped}`);
  if (idx.status !== 200) {
    throw new Error(
      `Format "${stamped}" returned HTTP ${idx.status} at ${fetchmod.BASE}/ai/pokedex/${stamped} — ` +
      `cannot verify agreement or ETag drift against a failed fetch.`
    );
  }
  const d = describe(idx.text, stamped);

  const mp = opts.manifestPath || manifestPath();
  let manifestSrc = '';
  try {
    manifestSrc = fs.readFileSync(mp, 'utf8');
  } catch {
    manifestSrc = '';
  }
  const pinned = readManifestRow(manifestSrc, stamped);
  const pinnedEtag = pinned ? pinned.etag : null;
  // 'unpinned': this format code has never been written with `formats --write`.
  // 'unchanged': the pinned ETag still matches what upstream serves right now.
  // 'changed': upstream has moved since the pin — re-vendor/re-check before citing it.
  const etagStatus = !pinnedEtag ? 'unpinned' : pinnedEtag === idx.etag ? 'unchanged' : 'changed';

  return { slug: stamped, agrees: true, etag: idx.etag, pinnedEtag, etagStatus, ...d };
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
    const row = `| \`${d.code}\` | ${d.regulation} | ${d.capabilities.usage} | ${d.capabilities.winRate} | ${d.capabilities.record} | ${idx.etag} | ${out.checked} |`;
    const src = fs.readFileSync(p, 'utf8');
    const { text: next, action } = upsertManifestRow(src, d.code, row);
    fs.writeFileSync(p, next);
    out.written = { path: p, action };
  }
  return out;
}

module.exports = {
  activeRegulation, regulationOf, detectCapabilities, describe,
  defaultFormatCode, report, check, upsertManifestRow, readManifestRow,
};
