'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatKnowledgeStatus } = require('../vendor-staleness');

const DAY = 24 * 60 * 60 * 1000;

test('absent file reports missing', () => {
  const s = formatKnowledgeStatus({ exists: false });
  assert.equal(s.stale, true);
  assert.match(s.reason, /has never been generated/);
});

test('a file older than 7 days is stale', () => {
  const s = formatKnowledgeStatus({
    exists: true,
    generatedAt: new Date(Date.now() - 8 * DAY).toISOString().slice(0, 10),
    regulation: 'M-B',
    activeRegulation: 'M-B',
  });
  assert.equal(s.stale, true);
  assert.match(s.reason, /8 days old/);
});

test('a fresh file for the active regulation is current', () => {
  const s = formatKnowledgeStatus({
    exists: true,
    generatedAt: new Date().toISOString().slice(0, 10),
    regulation: 'M-B',
    activeRegulation: 'M-B',
  });
  assert.equal(s.stale, false);
});

test('a fresh file for the WRONG regulation is stale regardless of age', () => {
  const s = formatKnowledgeStatus({
    exists: true,
    generatedAt: new Date().toISOString().slice(0, 10),
    regulation: 'M-B',
    activeRegulation: 'M-C',
  });
  assert.equal(s.stale, true);
  assert.match(s.reason, /M-B.*M-C/);
});
