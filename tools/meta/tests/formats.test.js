'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
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

// FIX 6: assertNotFiller returns early on ZERO rows, so a 404 body or a
// changed upstream heading previously produced a complete-looking, all-false
// capability set instead of an error — indistinguishable from a real format
// that just doesn't carry any metric.
test('REGRESSION: describe() refuses a response with no usage rows at all, not a complete-looking all-false format', () => {
  const empty404ish = '# Not Found\n\nNothing here.\n';
  assert.throws(() => formats.describe(empty404ish), /parse|empty response/i);
});

test('REGRESSION: describe() refuses a response with a Format Code but zero table rows', () => {
  const noRows = [
    '## Format Information',
    '- **Format**: Some Format',
    '- **Format Code**: `somecode`',
    '',
    '## Best 50 Pokemon by Usage',
    '',
    '(nothing here — heading changed upstream, no rows parsed)',
  ].join('\n');
  assert.throws(() => formats.describe(noRows), /parse|empty response/i);
});

test('REGRESSION: describe() refuses a response with rows but no Format Code', () => {
  const text = fx('ranked-index.md').replace(/- \*\*Format Code\*\*: `[^`]+`/, '');
  assert.throws(() => formats.describe(text), /parse|empty response|Format Code/i);
});

// FIX 8: the page's own declared format code was parsed and then discarded.
// A 200 response for a different format than requested (redirect, alias)
// must be caught rather than silently trusted.
test('REGRESSION: describe() throws when the page declares a different format than requested', () => {
  assert.throws(
    () => formats.describe(fx('ranked-index.md'), 'some-other-requested-code'),
    /requested format|declares format/i
  );
});

test('describe() accepts a matching expectedCode', () => {
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'battledataregmbs3'));
});

// FIX 8: case-variant format codes must be accepted (index echoes requested
// casing; mon page normalizes to lowercase), but genuinely different codes
// must still be rejected.
test('REGRESSION: describe() accepts case-variant format code', () => {
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'BattleDataRegMBS3'));
  assert.doesNotThrow(() => formats.describe(fx('ranked-index.md'), 'BATTLEDATAREGMBS3'));
});

test('REGRESSION: describe() still rejects genuinely different format code', () => {
  assert.throws(
    () => formats.describe(fx('ranked-index.md'), 'some-other-format-code'),
    /requested format|declares format/i
  );
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

// FIX 1: check() and report() previously never looked at r.status. On a 404
// (or any non-200) the parse functions ran on a "Not Found" body anyway and
// happily returned nulls everywhere — the mandated first-line gate reporting
// a PASS off a failed fetch, exiting 0. Both must fail loudly instead.
test('REGRESSION: check() fails loudly on a non-200 format fetch, not a null-filled false PASS', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 404, text: 'Not Found', etag: null };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  assert.throws(() => formats.check(stub), /404/);
});

test('REGRESSION: report() fails loudly on a non-200 fetch, not a null-filled false PASS', () => {
  const stub = {
    BASE: 'https://stub.test',
    get() {
      return { status: 500, text: 'Internal Server Error', etag: null };
    },
  };
  assert.throws(() => formats.report(stub), /500/);
});

// FIX 3: "check reports ETag drift" was claimed in cli.js's own usage text,
// reference/meta-lookup.md and README.md, but nothing ever read
// META_MANIFEST.md back — the manifest was write-only, so the capability the
// docs claimed did not exist. readManifestRow is the pure text->row parser
// underlying that read, tested the same dependency-injected way as
// upsertManifestRow above.
test('readManifestRow: finds the pinned row for a written format code', () => {
  const row = '| `codeA` | M-B | true | true | true | "etag1" | 2026-09-01 |';
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, 'codeA', row);
  const found = formats.readManifestRow(text, 'codeA');
  assert.equal(found.etag, '"etag1"');
  assert.equal(found.checked, '2026-09-01');
});

test('readManifestRow: returns null for a format that has never been pinned', () => {
  assert.equal(formats.readManifestRow(MANIFEST_TEMPLATE, 'codeA'), null);
});

function writeTempManifest(text) {
  const p = path.join(os.tmpdir(), `meta-manifest-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(p, text);
  return p;
}

test('REGRESSION: check() reports etagStatus "unpinned" — distinguishable from "unchanged" — when never written', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fx('ranked-index.md'), etag: 'W/"live-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  const manifestPath = writeTempManifest(MANIFEST_TEMPLATE);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'unpinned');
    assert.equal(out.pinnedEtag, null);
    assert.equal(out.etag, 'W/"live-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('check() reports etagStatus "unchanged" when the pinned ETag matches the live one', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fx('ranked-index.md'), etag: 'W/"match-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  const row = `| \`${stamped}\` | M-B | false | true | true | W/"match-etag" | 2026-09-01 |`;
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, stamped, row);
  const manifestPath = writeTempManifest(text);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'unchanged');
    assert.equal(out.pinnedEtag, 'W/"match-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});

test('REGRESSION: check() reports etagStatus "changed" when upstream has drifted from the pin', () => {
  const stamped = formats.defaultFormatCode();
  const stub = {
    BASE: 'https://stub.test',
    get(url) {
      if (url === `${stub.BASE}/llms-full.txt`) {
        return { status: 200, text: `**Format Code**: \`${stamped}\``, etag: null };
      }
      if (url === `${stub.BASE}/ai/pokedex/${stamped}`) {
        return { status: 200, text: fx('ranked-index.md'), etag: 'W/"new-etag"' };
      }
      throw new Error(`unexpected url in test stub: ${url}`);
    },
  };
  const row = `| \`${stamped}\` | M-B | false | true | true | W/"old-etag" | 2026-09-01 |`;
  const { text } = formats.upsertManifestRow(MANIFEST_TEMPLATE, stamped, row);
  const manifestPath = writeTempManifest(text);
  try {
    const out = formats.check(stub, { manifestPath });
    assert.equal(out.etagStatus, 'changed');
    assert.equal(out.pinnedEtag, 'W/"old-etag"');
    assert.equal(out.etag, 'W/"new-etag"');
  } finally {
    fs.unlinkSync(manifestPath);
  }
});
