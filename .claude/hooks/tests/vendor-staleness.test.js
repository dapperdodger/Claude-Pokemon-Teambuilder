const test = require('node:test');
const assert = require('node:assert/strict');
const hook = require('../vendor-staleness.js');

test('parsePin reads a bare commit line (NCP manifest style)', () => {
  const pin = hook.parsePin('Commit: `dfbf020d4ed7df8921c6e11bbaa23410f6ca1448` (main branch HEAD)');
  assert.equal(pin.sha, 'dfbf020d4ed7df8921c6e11bbaa23410f6ca1448');
  assert.equal(pin.regulation, null);
});

test('parsePin reads commit + regulation (learnset manifest style)', () => {
  const pin = hook.parsePin('Commit: `6b4bc34e44cc2541929cc4b8fff96e756ab3f268` (master)\nRegulation: `M-B`');
  assert.equal(pin.sha, '6b4bc34e44cc2541929cc4b8fff96e756ab3f268');
  assert.equal(pin.regulation, 'M-B');
});

test('parsePin returns null sha when the line is missing', () => {
  assert.equal(hook.parsePin('no pin here').sha, null);
});

test('parseActiveRegulation reads the regulation stamp', () => {
  assert.equal(hook.parseActiveRegulation('**Regulation: M-B**\n**Regulation ends: 2026-09-09**'), 'M-B');
});

test('parseActiveRegulation returns null when the stamp is absent', () => {
  assert.equal(hook.parseActiveRegulation('nothing'), null);
});
