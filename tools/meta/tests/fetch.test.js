'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fetchmod = require('../fetch');

const ONLINE = process.env.META_OFFLINE !== '1';

test('BASE is the Pikalytics origin', () => {
  assert.equal(fetchmod.BASE, 'https://www.pikalytics.com');
});

test('a 404 is returned as a status, not thrown', { skip: !ONLINE }, () => {
  // Callers decide what a 404 means; for a species it means "not found",
  // for a format it means "bad slug". Throwing here would flatten that.
  const r = fetchmod.get(fetchmod.BASE + '/ai/pokedex/battledataregmbs3/Notamon');
  assert.equal(r.status, 404);
});

test('a real page returns 200, markdown, and an ETag', { skip: !ONLINE }, () => {
  const r = fetchmod.get(fetchmod.BASE + '/ai/pokedex/battledataregmbs3/Garchomp');
  assert.equal(r.status, 200);
  assert.match(r.text, /Quick Info/);
  assert.ok(r.etag && r.etag.length > 0, 'ETag is the freshness signal; it must be captured');
});
