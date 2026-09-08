'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const formats = require('../formats');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('regulationOf reads the regulation out of a format label', () => {
  assert.equal(formats.regulationOf('Pokemon Champions VGC 2026 Reg M-B S3 Ranked Battle Data', 'battledataregmbs3'), 'M-B');
  assert.equal(formats.regulationOf('Pokemon Champions VGC 2026 BO3 Reg M-A', 'gen9championsvgc2026regmabo3'), 'M-A');
});

test('a non-Champions format has no Champions regulation', () => {
  // gen9vgc2025regi is a different GAME, not merely a different regulation.
  assert.equal(formats.regulationOf('VGC 2025 Regulation Set I', 'gen9vgc2025regi'), null);
});

test('REGRESSION: the ladder format carries win rate but NOT usage', () => {
  const caps = formats.detectCapabilities(fx('ranked-index.md'));
  assert.equal(caps.usage, false, 'the official ladder upstream has no usage weighting');
  assert.equal(caps.winRate, true);
  assert.equal(caps.record, true);
});

test('REGRESSION: the tournament format carries usage AND win rate', () => {
  const caps = formats.detectCapabilities(fx('tournaments-index.md'));
  assert.equal(caps.usage, true);
  assert.equal(caps.winRate, true);
});

test('describe() stamps the regulation and marks currency', () => {
  const d = formats.describe(fx('ranked-index.md'));
  assert.equal(d.code, 'battledataregmbs3');
  assert.equal(d.regulation, 'M-B');
  assert.equal(typeof d.current, 'boolean');
});

test('describe() refuses the empty-dataset format', () => {
  assert.throws(() => formats.describe(fx('filler-index.md')), /empty dataset|alphabetical/i);
});

// REGRESSION: formats.report({write: true}) used to replace only the one-time
// placeholder row. A second --write for the SAME format code found no match,
// left the file byte-identical, and still reported `written` as success —
// a confident report of success with nothing behind it, in the one tool
// whose whole job is catching exactly that failure mode.
const MANIFEST_TEMPLATE = [
  '| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |',
  '|---|---|---|---|---|---|---|',
  '| _(populated by `meta formats --write`)_ | | | | | | |',
].join('\n');

test('upsertManifestRow: first write for a code replaces the placeholder', () => {
  const row = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const { text, action } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', row);
  assert.equal(action, 'added');
  assert.ok(text.includes(row));
  assert.ok(!text.includes('_(populated'));
});

test('REGRESSION: a second write for the SAME code updates the row in place, not a no-op', () => {
  const rowV1 = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const rowV2 = '| `codeA` | M-B | true | true | true | "etag2" | 2026-09-02 |';
  const first = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', rowV1);
  const second = formats.upsertManifestRow(first.text, 'codeA', rowV2);
  assert.equal(second.action, 'updated');
  assert.ok(second.text.includes(rowV2), 'the refreshed row must be present');
  assert.ok(!second.text.includes(rowV1), 'the stale row must not survive');
  assert.notEqual(second.text, first.text, 'the file must actually change on a real update');
});

test('a write for a DIFFERENT code appends rather than clobbering the first row', () => {
  const rowA = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const rowB = '| `codeB` | M-B | false | true | true | "etag9" | 2026-09-03 |';
  const first = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', rowA);
  const second = formats.upsertManifestRow(first.text, 'codeB', rowB);
  assert.equal(second.action, 'added');
  assert.ok(second.text.includes(rowA), 'the existing codeA row must survive untouched');
  assert.ok(second.text.includes(rowB));
});

// FINDING 3: check() has no automated test despite being the most
// safety-critical behaviour in the tool. fetchmod is dependency-injected, so
// both paths are testable deterministically with a stub — no network needed.
test('check() names the slug on agreement', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fx('ranked-index.md'), etag: 'W/"stub-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  const out = formats.check(stub);
  assert.equal(out.slug, stamped);
  assert.equal(out.agrees, true);
});

test('REGRESSION: check() throws on disagreement, naming BOTH values', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: '**Format Code**: `some-other-stale-slug`', etag: null };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  assert.throws(() => formats.check(stub), (err) => {
    assert.match(err.message, /some-other-stale-slug/, 'must name the declared (stale) value');
    assert.ok(err.message.includes(stamped), 'must name the stamped value too');
    return true;
  });
});
