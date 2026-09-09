'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../manifest');

test('learnsetPin: reads both load-bearing fields from VENDOR_MANIFEST.md', () => {
  const pin = manifest.learnsetPin();
  assert.match(pin.commit, /^[0-9a-f]{7,40}$/, `expected a commit sha, got ${JSON.stringify(pin.commit)}`);
  assert.match(pin.regulation, /^[A-Za-z0-9-]+$/, `expected a regulation id, got ${JSON.stringify(pin.regulation)}`);
});

test('learnsetPin: never throws, even if the manifest is unreadable', () => {
  assert.doesNotThrow(() => manifest.learnsetPin());
});

// pinStatus is a pure function taking injected values rather than reading the
// manifest, for a specific reason: on the day this is written the pin and the
// active regulation MATCH, so the stale branch cannot be reached by calling
// the real CLI. An untested branch that only fires at a regulation rollover
// is an untested branch at exactly the moment it matters most.
test('pinStatus: a pin matching the active regulation is not stale', () => {
  const s = manifest.pinStatus({ pinRegulation: 'M-B', activeRegulation: 'M-B' });
  assert.equal(s.stale, false);
  assert.equal(s.caveat, null);
});

test('pinStatus: a pin from a previous regulation is stale and explains why', () => {
  const s = manifest.pinStatus({ pinRegulation: 'M-B', activeRegulation: 'M-C' });
  assert.equal(s.stale, true);
  assert.match(s.caveat, /STALE LEARNSET PIN/);
  assert.match(s.caveat, /M-B/);
  assert.match(s.caveat, /M-C/);
  assert.match(s.caveat, /CUT move pools/);
});

test('pinStatus: an unknown pin or unknown active regulation is not asserted either way', () => {
  assert.equal(manifest.pinStatus({ pinRegulation: null, activeRegulation: 'M-C' }).stale, false);
  assert.equal(manifest.pinStatus({ pinRegulation: 'M-B', activeRegulation: null }).stale, false);
});
