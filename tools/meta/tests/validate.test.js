'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const validate = require('../validate');

test('a real percentage becomes a number', () => {
  assert.deepEqual(validate.toNumber('60.5%', 'x'), { value: 60.5, reason: null });
  assert.deepEqual(validate.toNumber('48.411%', 'x'), { value: 48.411, reason: null });
  assert.deepEqual(validate.toNumber('30%', 'x'), { value: 30, reason: null });
});

test('every known sentinel becomes null WITH the supplied reason', () => {
  for (const s of ['N/A', 'N/A%', 'undefined', 'undefined%', 'NaN%', 'null', 'high%']) {
    const r = validate.toNumber(s, 'ladder carries no usage');
    assert.equal(r.value, null, `${s} must not produce a number`);
    assert.equal(r.reason, 'ladder carries no usage', `${s} must carry a reason`);
  }
});

test('a sentinel never silently becomes zero', () => {
  // The whole point: 0 reads as "unused", null-with-reason reads as "not measured".
  assert.notEqual(validate.toNumber('N/A%', 'r').value, 0);
});

test('an unrecognised non-numeric string is an error, not a silent null', () => {
  assert.throws(() => validate.toNumber('probably high', 'r'), /unparseable/i);
});
