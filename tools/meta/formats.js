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

function describe(indexText) {
  const info = parse.parseFormatInfo(indexText);
  const rows = parse.parseUsageTable(indexText);
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

// Disagreement between what Pikalytics itself declares as current and what
// reference/regulation.md has stamped is a hard error, never a fallback:
// silently preferring either source reintroduces the exact trap this repo has
// been burned by (a previous regulation's slug keeps returning complete,
// correctly-formatted, entirely wrong data forever).
function check(fetchmod) {
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
  const d = describe(idx.text);
  return { slug: stamped, agrees: true, etag: idx.etag, ...d };
}

function report(fetchmod, opts = {}) {
  const code = defaultFormatCode();
  const idx = fetchmod.get(`${fetchmod.BASE}/ai/pokedex/${code}`);
  const d = describe(idx.text);
  const out = { ...d, etag: idx.etag, checked: new Date().toISOString().slice(0, 10) };
  if (opts.write) {
    const p = path.join(__dirname, 'META_MANIFEST.md');
    const row = `| \`${d.code}\` | ${d.regulation} | ${d.capabilities.usage} | ${d.capabilities.winRate} | ${d.capabilities.record} | ${idx.etag} | ${out.checked} |`;
    const src = fs.readFileSync(p, 'utf8').replace(/\| _\(populated.*\n/, row + '\n');
    fs.writeFileSync(p, src);
    out.written = p;
  }
  return out;
}

module.exports = {
  activeRegulation, regulationOf, detectCapabilities, describe,
  defaultFormatCode, report, check,
};
