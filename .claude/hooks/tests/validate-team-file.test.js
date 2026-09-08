const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HOOK = path.join(__dirname, '..', 'validate-team-file.js');
const REPO = path.join(__dirname, '..', '..', '..');
const TEAMS = path.join(REPO, 'teams');

function run(filePath) {
  const payload = JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } });
  const out = execFileSync('node', [HOOK], { input: payload, encoding: 'utf8' });
  if (!out.trim()) return null;
  return JSON.parse(out).hookSpecificOutput.additionalContext;
}

function withTempTeam(body, fn) {
  const name = `__hooktest-${process.pid}-${Math.random().toString(36).slice(2)}.md`;
  const full = path.join(TEAMS, name);
  fs.writeFileSync(full, body);
  try {
    return fn(full, name);
  } finally {
    fs.rmSync(full, { force: true });
  }
}

function teamBody(rows, regulation = 'M-B') {
  const body = rows.map((r) => `| ${r.mon} | ${r.item} | ${r.ability} | ${r.nature} | ${r.sp} | ${r.moves} |`).join('\n');
  return `# Team: hook test\n\n**Regulation:** ${regulation}\n\n## The six\n\n| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |\n|---|---|---|---|---|---|\n${body}\n\n## Why these six\n\ntext\n`;
}

const CHOMP = { mon: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', nature: 'Jolly', sp: '2 HP / 32 Atk / 32 Spe', moves: 'Earthquake / Protect' };
const GHOLD = { mon: 'Gholdengo', item: 'Metal Coat', ability: 'Good as Gold', nature: 'Modest', sp: '32 HP / 2 Def / 32 SpA', moves: 'Make It Rain / Protect' };

// --- fires on real problems -------------------------------------------------

test('reports a duplicate item as an ERROR', () => {
  const dup = Object.assign({}, GHOLD, { item: 'Life Orb' });
  withTempTeam(teamBody([CHOMP, dup]), (full) => {
    const ctx = run(full);
    assert.match(ctx, /ERROR: DUPLICATE ITEM: "Life Orb"/);
    assert.match(ctx, /Fix the ERROR lines/);
  });
});

test('reports an illegal item as an ERROR', () => {
  withTempTeam(teamBody([Object.assign({}, CHOMP, { item: 'Staraptorite' })]), (full) => {
    assert.match(run(full), /ERROR:.*"Staraptorite" is not in the Champions item pool/);
  });
});

test('reports a Mega listed with its pre-Mega ability', () => {
  const raichu = { mon: 'Raichu', item: 'Raichunite Y', ability: 'Lightning Rod', nature: 'Timid', sp: '2 HP / 32 SpA / 32 Spe', moves: 'Thunderbolt / Protect' };
  withTempTeam(teamBody([raichu]), (full) => {
    assert.match(run(full), /ERROR:.*fixed battle ability is "No Guard"/);
  });
});

test('reports a team built for a past regulation as a warning', () => {
  withTempTeam(teamBody([CHOMP], 'M-A'), (full) => {
    assert.match(run(full), /warn:.*Built for regulation M-A/);
  });
});

test('surfaces genuine notChecked entries from result.notChecked', () => {
  // Struggle passes the "is this a real Champions move" spelling check but
  // appears in no learnset entry at all (Fix 2's whole-table union), so
  // dex.learnset() returns 'unknown' for it and team.js records it in
  // notChecked. The hook must surface that real unknown, not a hardcoded
  // falsehood.
  const struggler = Object.assign({}, CHOMP, { moves: 'Struggle / Protect' });
  withTempTeam(teamBody([struggler]), (full) => {
    const ctx = run(full);
    assert.match(ctx, /Not checked: move legality for: Garchomp/);
  });
});

test('says nothing about move legality when nothing is unchecked', () => {
  // CHOMP's moves (Earthquake / Protect) are both fully resolvable against
  // the vendored learnset table, and the Staraptorite item error is
  // unrelated to move legality — so notChecked should be empty and the hook
  // must not claim otherwise, and must not print the old hardcoded line
  // that falsely says move legality is never checked.
  withTempTeam(teamBody([Object.assign({}, CHOMP, { item: 'Staraptorite' })]), (full) => {
    const ctx = run(full);
    assert.doesNotMatch(ctx, /Not checked: move legality/);
    assert.doesNotMatch(ctx, /learnsets are not in the local data/);
  });
});

// --- stays quiet otherwise --------------------------------------------------

test('silent on a clean team file', () => {
  withTempTeam(teamBody([CHOMP, GHOLD]).replace('Roster', 'Roster'), (full) => {
    const ctx = run(full);
    // A two-Pokemon roster warns about the count, which is legitimate for a
    // build in progress — what matters is that there is no ERROR line.
    if (ctx) assert.doesNotMatch(ctx, /ERROR:/);
  });
});

test('silent on files outside teams/', () => {
  assert.equal(run(path.join(REPO, 'README.md')), null);
});

test('silent on the template and the teams README', () => {
  assert.equal(run(path.join(TEAMS, '_TEMPLATE.md')), null);
  assert.equal(run(path.join(TEAMS, 'README.md')), null);
});

test('accepts a relative path as well as an absolute one', () => {
  withTempTeam(teamBody([Object.assign({}, CHOMP, { item: 'Staraptorite' })]), (full, name) => {
    const relative = `teams/${name}`;
    assert.match(run(relative), /ERROR:/);
  });
});

// --- fails open -------------------------------------------------------------

test('non-JSON stdin emits nothing and exits 0', () => {
  assert.equal(execFileSync('node', [HOOK], { input: 'not json', encoding: 'utf8' }).trim(), '');
});

test('a payload with no file_path emits nothing', () => {
  assert.equal(execFileSync('node', [HOOK], { input: '{"tool_name":"Write"}', encoding: 'utf8' }).trim(), '');
});

test('a file_path that does not exist emits nothing', () => {
  assert.equal(run(path.join(TEAMS, 'definitely-not-here.md')), null);
});
