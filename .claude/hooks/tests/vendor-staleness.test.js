const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const hook = require('../vendor-staleness.js');

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

function writeManifest(dir, name, sha, regulation) {
  const p = path.join(dir, name);
  let content = `Commit: \`${sha}\` (main branch HEAD)\n`;
  if (regulation) content += `Regulation: \`${regulation}\`\n`;
  fs.writeFileSync(p, content);
  return p;
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-staleness-test-'));
}

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

// --- driftNote: the pure drift decision, isolated from I/O ---

test('driftNote reports drift when pinned regulation differs from active', () => {
  const note = hook.driftNote('fake/VENDOR_MANIFEST.md', 'M-A', 'M-B');
  assert.match(note, /REGULATION DRIFT/);
  assert.match(note, /M-A/);
  assert.match(note, /M-B/);
});

test('driftNote reports nothing when pinned regulation equals active', () => {
  assert.equal(hook.driftNote('fake/VENDOR_MANIFEST.md', 'M-B', 'M-B'), null);
});

test('driftNote reports nothing when the pin has no regulation (e.g. damage-calc manifest)', () => {
  assert.equal(hook.driftNote('fake/VENDOR_MANIFEST.md', null, 'M-B'), null);
});

test('driftNote reports nothing when there is no active regulation to compare against', () => {
  assert.equal(hook.driftNote('fake/VENDOR_MANIFEST.md', 'M-A', null), null);
});

// --- checkVendor: the full drift decision wired through real file I/O,
// with the network call injected so these tests never touch the network. ---

test('checkVendor reports REGULATION DRIFT when the manifest pin differs from active', async () => {
  const dir = makeTmpDir();
  try {
    const manifest = writeManifest(dir, 'VENDOR_MANIFEST.md', SHA_A, 'M-A');
    const v = { manifest, manifestRel: 'fake/VENDOR_MANIFEST.md', label: 'fake vendor', api: 'unused', commits: 'unused' };
    const result = await hook.checkVendor(v, 'M-B', async () => SHA_A);
    assert.match(result, /REGULATION DRIFT/);
    assert.match(result, /M-A/);
    assert.match(result, /M-B/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkVendor reports no drift when the manifest pin equals active', async () => {
  const dir = makeTmpDir();
  try {
    const manifest = writeManifest(dir, 'VENDOR_MANIFEST.md', SHA_A, 'M-B');
    const v = { manifest, manifestRel: 'fake/VENDOR_MANIFEST.md', label: 'fake vendor', api: 'unused', commits: 'unused' };
    const result = await hook.checkVendor(v, 'M-B', async () => SHA_A);
    assert.equal(result, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkVendor reports no drift when the manifest has no Regulation line (damage-calc style)', async () => {
  const dir = makeTmpDir();
  try {
    const manifest = writeManifest(dir, 'VENDOR_MANIFEST.md', SHA_A, null);
    const v = { manifest, manifestRel: 'fake/VENDOR_MANIFEST.md', label: 'fake vendor', api: 'unused', commits: 'unused' };
    const result = await hook.checkVendor(v, 'M-B', async () => SHA_A);
    assert.equal(result, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- VENDORS config: regression against master-HEAD noise for the learnset
// vendor. The upstream repo takes ~15 commits/week while
// data/mods/champions/learnsets.ts changes far less often, so checking
// against master HEAD reports "behind upstream" almost permanently and
// buries the regulation-drift line this check exists to surface. The
// learnset entry's API must be scoped to the file's own path instead. ---

test('the learnset vendor entry is scoped to its file path, not master HEAD', () => {
  const learnsetVendor = hook.VENDORS.find((v) => v.manifestRel === 'tools/dex/VENDOR_MANIFEST.md');
  assert.ok(learnsetVendor, 'expected a tools/dex/VENDOR_MANIFEST.md entry in VENDORS');
  assert.match(learnsetVendor.api, /\?path=data\/mods\/champions\/learnsets\.ts$/);
  assert.notEqual(learnsetVendor.api, 'https://api.github.com/repos/smogon/pokemon-showdown/commits/master');
});

test('an unexpected throw in one vendor check does not suppress the other vendor\'s report', async () => {
  const dir = makeTmpDir();
  try {
    // This vendor's manifest path is a directory, not a file: existsSync
    // passes, but readFileSync throws EISDIR — an unexpected, non-ENOENT
    // failure, distinct from the brief's three named failure modes.
    const throwingVendor = {
      manifest: dir,
      manifestRel: 'throwing/VENDOR_MANIFEST.md',
      label: 'throwing vendor',
      api: 'unused',
      commits: 'unused',
    };

    const okManifest = writeManifest(dir, 'OK_MANIFEST.md', SHA_A, 'M-A');
    const okVendor = { manifest: okManifest, manifestRel: 'ok/VENDOR_MANIFEST.md', label: 'ok vendor', api: 'unused', commits: 'unused' };

    const [throwingResult, okResult] = await Promise.all([
      hook.checkVendor(throwingVendor, 'M-B', async () => SHA_A),
      hook.checkVendor(okVendor, 'M-B', async () => SHA_A),
    ]);

    assert.match(throwingResult, /FAILED UNEXPECTEDLY/);
    assert.match(throwingResult, /throwing\/VENDOR_MANIFEST\.md/);
    assert.match(okResult, /REGULATION DRIFT/);
    assert.match(okResult, /M-A/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
