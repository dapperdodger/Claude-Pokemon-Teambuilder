const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOK_SRC = path.join(__dirname, '..', 'regulation-phase.js');

// The hook reads reference/regulation.md and teams/ relative to its own
// location, so each case gets a throwaway repo laid out the same way.
function runIn({ regulation, teams = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'regphase-'));
  fs.mkdirSync(path.join(root, 'reference'), { recursive: true });
  fs.mkdirSync(path.join(root, 'teams'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reference', 'regulation.md'), regulation);
  for (const [name, body] of Object.entries(teams)) {
    fs.writeFileSync(path.join(root, 'teams', name), body);
  }
  fs.copyFileSync(HOOK_SRC, path.join(root, '.claude', 'hooks', 'regulation-phase.js'));
  const out = execFileSync('node', [path.join(root, '.claude', 'hooks', 'regulation-phase.js')], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });
  if (!out.trim()) return null;
  return JSON.parse(out).systemMessage;
}

function isoOffset(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

// `slug` defaults to a well-formed one for the given id, so the phase tests
// below exercise phases only. Pass slug: null to omit the stamp, or a literal
// string to exercise the stale-slug case.
function regFile({ id = 'M-X', startOffset, endOffset, verifiedOffset = 0, slug = undefined }) {
  const resolved = slug === undefined ? `battledatareg${id.toLowerCase().replace(/-/g, '')}s1` : slug;
  const lines = [
    '# Current Regulation',
    '',
    `**Regulation: ${id}**`,
    `**Regulation starts: ${isoOffset(startOffset)}**`,
    `**Regulation ends: ${isoOffset(endOffset)}**`,
    `**Last verified: ${isoOffset(verifiedOffset)}**`,
  ];
  if (resolved !== null) lines.push(`**Pikalytics slug: ${resolved}**`);
  lines.push('');
  return lines.join('\n');
}

// --- phases ----------------------------------------------------------------

test('EARLY: a regulation days old reports thin data and points at the fallback', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -2, endOffset: 90 }) });
  assert.match(msg, /REGULATION EARLY/);
  assert.match(msg, /usage data is thin or absent/);
  assert.match(msg, /vgc-meta-lookup/);
});

test('FORMING: a month in, rankings are directional', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -30, endOffset: 60 }) });
  assert.match(msg, /REGULATION FORMING/);
  assert.match(msg, /still moving/);
});

test('SETTLED mid-cycle with nothing else wrong is silent', () => {
  assert.equal(runIn({ regulation: regFile({ startOffset: -60, endOffset: 30 }) }), null);
});

test('ROLLOVER IMMINENT: within a week of the end date', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -80, endOffset: 3 }) });
  assert.match(msg, /ROLLOVER IMMINENT/);
  assert.match(msg, /ends in 3 day\(s\)/);
  assert.match(msg, /vgc-regulation-transition/);
});

test('ENDED: past the end date, demands the transition workflow first', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -100, endOffset: -5 }) });
  assert.match(msg, /REGULATION ENDED/);
  assert.match(msg, /ENDED 5 day\(s\) ago/);
  assert.match(msg, /before giving any team or moveset advice/);
});

// REGRESSION (>= semantics): the stamps record UTC DATES, but the real
// cutover instant lands just after midnight UTC on the stamped end date, so
// the regulation is essentially over for its ENTIRE end date — including day
// zero. `untilEnd === 0` used to read as ROLLOVER IMMINENT ("ends in 0
// day(s)"); it must now read ENDED, worded as "ended today", not
// "ENDED 0 day(s) ago".
test('ENDED: on the end date itself reads as "ended today", not "0 day(s) ago"', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -90, endOffset: 0 }) });
  assert.match(msg, /REGULATION ENDED/);
  assert.match(msg, /ended today/);
  assert.doesNotMatch(msg, /0 day\(s\) ago/);
  assert.match(msg, /before giving any team or moveset advice/);
});

// The day before the end date must still be a plain "ends in 1 day(s)"
// ROLLOVER IMMINENT warning, not ENDED — pins the boundary the >= change
// moved.
test('ROLLOVER IMMINENT: the day before the end date is still imminent, not ended', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -90, endOffset: 1 }) });
  assert.match(msg, /ROLLOVER IMMINENT/);
  assert.match(msg, /ends in 1 day\(s\)/);
  assert.doesNotMatch(msg, /REGULATION ENDED/);
});

// --- staleness --------------------------------------------------------------

test('a verification older than 14 days is reported', () => {
  const msg = runIn({ regulation: regFile({ startOffset: -60, endOffset: 30, verifiedOffset: -20 }) });
  assert.match(msg, /last verified .* \(20 days ago, >14\)/);
});

// --- team regulation matching ----------------------------------------------

test('team files built for another regulation are named', () => {
  const msg = runIn({
    regulation: regFile({ id: 'M-C', startOffset: -60, endOffset: 30 }),
    teams: { 'old.md': '**Regulation:** M-B (verified 2026-07-01)\n', 'cur.md': '**Regulation:** M-C\n' },
  });
  assert.match(msg, /old\.md \(M-B\)/);
  assert.doesNotMatch(msg, /cur\.md/);
  assert.match(msg, /do not read them as current/);
});

test('team files with no regulation stamp are named separately', () => {
  const msg = runIn({
    regulation: regFile({ id: 'M-C', startOffset: -60, endOffset: 30 }),
    teams: { 'nostamp.md': '# Team\n\nno stamp\n' },
  });
  assert.match(msg, /no parseable "\*\*Regulation:\*\* <id>" stamp: nostamp\.md/i);
});

test('the template and README are not treated as teams', () => {
  const msg = runIn({
    regulation: regFile({ id: 'M-C', startOffset: -60, endOffset: 30 }),
    teams: { '_TEMPLATE.md': 'no stamp\n', 'README.md': 'no stamp\n' },
  });
  assert.equal(msg, null);
});

// --- the silent-guard failure this replaced ---------------------------------

test('missing stamps report loudly instead of looking healthy', () => {
  const msg = runIn({ regulation: '# Current Regulation\n\n**Regulation: M-X**\n' });
  assert.match(msg, /REGULATION STAMPS MISSING/);
  assert.match(msg, /Regulation starts, Regulation ends, Last verified/);
  assert.match(msg, /NOT running/);
});

test('a missing regulation file does not crash the session', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'regphase-'));
  fs.mkdirSync(path.join(root, '.claude', 'hooks'), { recursive: true });
  fs.copyFileSync(HOOK_SRC, path.join(root, '.claude', 'hooks', 'regulation-phase.js'));
  const out = execFileSync('node', [path.join(root, '.claude', 'hooks', 'regulation-phase.js')], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(out.trim(), '');
});

// --- Pikalytics slug --------------------------------------------------------
//
// The slug is not derivable from the regulation id, so these only assert the
// one thing that IS decidable: whether a slug is left over from a previous
// regulation. That matters because a stale slug returns complete,
// correctly-labelled data rather than 404ing.

function regWithSlug(id, slug, extra = {}) {
  return regFile(Object.assign({ id, slug, startOffset: -60, endOffset: 30 }, extra));
}

test('a slug naming the active regulation is accepted silently', () => {
  assert.equal(runIn({ regulation: regWithSlug('M-B', 'battledataregmbs3') }), null);
});

test('the other observed naming scheme is also accepted', () => {
  // M-A used gen9championsvgc2026regma — a completely different shape.
  assert.equal(runIn({ regulation: regWithSlug('M-A', 'gen9championsvgc2026regma') }), null);
});

test('a slug left over from a previous regulation is flagged', () => {
  const msg = runIn({ regulation: regWithSlug('M-C', 'battledataregmbs3') });
  assert.match(msg, /does not mention the active regulation \(M-C\)/);
  assert.match(msg, /complete, normal-looking data/);
});

test('a missing slug stamp is reported', () => {
  const msg = runIn({ regulation: regWithSlug('M-B', null) });
  assert.match(msg, /No "\*\*Pikalytics slug: <slug>\*\*" stamp/);
});
