'use strict';
// Skill-text tests: these fail when a rule is DELETED or a skill's copy of the
// card skeleton DRIFTS. They cannot tell whether a rule is followed — that is
// what docs/regression-scenarios.md is for.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..', '..');
const REFERENCE = 'reference/decision-card.md';

// Git on Windows may check files out with CRLF; compare on LF.
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}

function skeleton(rel) {
  const m = read(rel).match(/<!-- card-skeleton:start -->\n([\s\S]*?)\n<!-- card-skeleton:end -->/);
  assert.ok(m, `${rel} has no <!-- card-skeleton:start --> ... <!-- card-skeleton:end --> block at column 0`);
  return m[1];
}

function assertInOrder(rel, anchors) {
  const text = read(rel);
  let last = -1;
  for (const anchor of anchors) {
    const i = text.indexOf(anchor, last + 1);
    assert.ok(i !== -1, `${rel} is missing anchor phrase (or it is out of order): ${anchor}`);
    last = i;
  }
}

test('reference/decision-card.md carries the card skeleton with all seven fields', () => {
  const s = skeleton(REFERENCE);
  for (const field of [
    '1. **Decision**', '2. **Role**', '3. **Gap is real**', '4. **Options from**',
    '5. **Options table**', '6. **Recommendation**', '7. **Not verified**',
  ]) {
    assert.ok(s.includes(field), `skeleton is missing field: ${field}`);
  }
});

test('reference/decision-card.md states the shared rule', () => {
  assert.ok(read(REFERENCE).includes('**Usage can suggest a pick; it never justifies one.**'));
});
