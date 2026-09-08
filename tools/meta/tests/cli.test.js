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

test('meta mon returns usage as null-with-reason on the ladder', { skip: !ONLINE }, () => {
  const out = run('mon', 'Raichu');
  assert.equal(out.usage.value, null);
  assert.match(out.usage.reason, /no usage/i);
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
