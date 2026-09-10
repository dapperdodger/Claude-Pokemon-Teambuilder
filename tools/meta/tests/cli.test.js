'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CLI = path.join(__dirname, '..', 'cli.js');
const ONLINE = process.env.META_OFFLINE !== '1';

function run(...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));
}
function runFailing(...args) {
  try {
    execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout || '') };
  }
  return null;
}

test('no args prints usage and exits non-zero', () => {
  const r = runFailing();
  assert.ok(r);
  assert.equal(r.status, 1);
});

test('an unknown command exits non-zero with an error object', () => {
  const r = runFailing('wat');
  assert.ok(r);
  assert.match(JSON.parse(r.stdout).error, /Unknown command/);
});

// Was "returns usage as null-with-reason on the ladder": M-B's default slug
// (battledataregmbs3) was a ranked-ladder page with no usage weighting, only
// win rate. M-C's default slug (gen9championsvgc2026regmc, re-resolved at
// the M-C rollover per reference/regulation.md) is a genuinely different
// page shape — confirmed live 2026-09-09 via
// formats.detectCapabilities()/describe() against the real fetched page —
// and DOES carry usage (e.g. Rillaboom #1 at 36.64%, matching the usage
// snapshot recorded in reference/regulation.md). This is a real upstream
// behavior difference tied to the slug, not fixture staleness, so the
// assertion is updated to match the new format rather than forced back to
// null.
test('meta mon returns real usage on the M-C default format', { skip: !ONLINE }, () => {
  const out = run('mon', 'Raichu');
  assert.equal(typeof out.usage.value, 'number');
  assert.equal(out.usage.reason, null);
});

test('meta mon on a Mega name reports the stone share', { skip: !ONLINE }, () => {
  const out = run('mon', 'Staraptor-Mega');
  assert.equal(out.resolvedFrom, 'Staraptor');
  // megaShare.ofSpecies is an envelope ({value, reason}), not a bare number —
  // Task 8 review changed it for consistency with every other absent-metric field.
  assert.ok(out.megaShare.ofSpecies.value > 90, 'nearly every ladder Staraptor is Mega');
});

test('meta usage --format on the empty dataset exits non-zero', { skip: !ONLINE }, () => {
  const r = runFailing('usage', '--format', 'gen9championsvgc2026regmbbo3');
  assert.ok(r, 'the alphabetical filler must not exit 0');
  assert.equal(r.status, 1);
});

// REGRESSION (currency-taxonomy rewrite): championstournaments has no
// regulation token because it's a rolling window over current play, current
// by construction. It used to get slapped with the "previous regulation"
// warning that belongs to a genuinely stale regulation-tagged format — the
// exact bug this task fixes. Pin the live behavior so it can't regress back.
test('REGRESSION: meta usage --format championstournaments is rolling/current and carries no previous-regulation warning', { skip: !ONLINE }, () => {
  const out = run('usage', '--format', 'championstournaments');
  assert.equal(out.currency, 'rolling');
  assert.equal(out.current, true);
  assert.ok(
    !out.warnings.some((w) => /NOT the current one/i.test(w)),
    `must not carry the regulation-mismatch warning: ${JSON.stringify(out.warnings)}`
  );
});

// --- teams: /ai/topteams + /ai/team-usage ----------------------------------
// Live 2026-09-10, one day into the M-C rollover window opened 2026-09-09 —
// championstournaments' ~14-day rolling window is expected to straddle the
// regulation boundary right now (clears ~2026-09-23). These tests pin that
// live, currently-true state; they will need re-pinning once the window
// clears, same as any other REGRESSION test tied to "today".

test('meta teams returns both sections by default, each bounded by --top', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '5');
  assert.equal(out.format, 'championstournaments');
  assert.equal(out.topTeams.included, true);
  assert.equal(out.topTeams.error, null);
  assert.ok(out.topTeams.teams.length > 0 && out.topTeams.teams.length <= 5);
  assert.equal(out.teamUsage.included, true);
  assert.equal(out.teamUsage.error, null);
  assert.ok(out.teamUsage.compositions.length > 0 && out.teamUsage.compositions.length <= 5);
});

test('meta teams: topTeams entries carry species and archetype tags', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '10');
  const first = out.topTeams.teams[0];
  assert.equal(typeof first.rank, 'number');
  assert.ok(Array.isArray(first.species) && first.species.length === 6, 'a team is six species');
  assert.ok(Array.isArray(first.archetypes));
});

test('meta teams: teamUsage compositions carry win rate and record', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '5');
  const first = out.teamUsage.compositions[0];
  assert.equal(typeof first.winRate.value, 'number');
  assert.equal(typeof first.record, 'string');
  assert.ok(Array.isArray(first.species) && first.species.length === 6);
});

test('REGRESSION: meta teams surfaces the rollover straddle live, today', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '5');
  assert.ok(out.straddle, 'championstournaments is expected to straddle the M-C rollover right now');
  assert.equal(out.straddle.regulation, 'M-C');
  assert.ok(out.warnings.some((w) => /straddles the regulation rollover/i.test(w)));
});

test('meta teams --only topteams reports topTeams only, teamUsage as not-included', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '3', '--only', 'topteams');
  assert.equal(out.topTeams.included, true);
  assert.deepEqual(out.teamUsage, { included: false });
});

test('meta teams --only team-usage reports teamUsage only, topTeams as not-included', { skip: !ONLINE }, () => {
  const out = run('teams', '--top', '3', '--only', 'team-usage');
  assert.equal(out.teamUsage.included, true);
  assert.deepEqual(out.topTeams, { included: false });
});

test('meta teams: an invalid --only value exits non-zero rather than silently ignoring it', () => {
  const r = runFailing('teams', '--only', 'bogus');
  assert.ok(r);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /--only must be/);
});
