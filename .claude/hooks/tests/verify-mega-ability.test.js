const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const HOOK = path.join(__dirname, '..', 'verify-mega-ability.js');

// Run the hook exactly as Claude Code does: PostToolUse payload on stdin.
function run(toolResponse) {
  const payload = JSON.stringify({ tool_name: 'WebFetch', tool_response: toolResponse });
  const out = execFileSync('node', [HOOK], { input: payload, encoding: 'utf8' });
  if (!out.trim()) return null;
  return JSON.parse(out).hookSpecificOutput.additionalContext;
}

function megasIn(context) {
  if (!context) return [];
  return context
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).split(':')[0]);
}

// --- fires on the real trap ------------------------------------------------

test('fires on a usage-style pre-Mega ability split, naming the fixed ability', () => {
  const ctx = run('Mega Raichu Y usage this season. Abilities: Lightning Rod 93.7%, No Guard 2.7%.');
  assert.deepEqual(megasIn(ctx), ['Mega Raichu Y']);
  assert.match(ctx, /fixed battle ability is "No Guard"/);
  assert.match(ctx, /pre-Mega selection is "Lightning Rod"/);
});

test('a species name is found even at a sentence boundary', () => {
  // "Mega Delphox. Abilities:" — the word after the name is capitalised too,
  // so the name boundary cannot be read off the prose.
  const ctx = run('The most used Mega is Mega Delphox. Abilities: Blaze 61%, Magician 39%. Also common: Mega Blastoise, Mega Staraptor.');
  assert.deepEqual(megasIn(ctx), ['Mega Delphox', 'Mega Blastoise', 'Mega Staraptor']);
});

test('a bare leading "Mega" does not swallow the real one after it', () => {
  const ctx = run('Choosing a Mega is hard. Mega Swampert abilities: Torrent 58.7%.');
  assert.deepEqual(megasIn(ctx), ['Mega Swampert']);
});

test('two Megas in one sentence are both reported', () => {
  const ctx = run('Top teams feature Mega Swampert and Mega Charizard Y. Ability breakdown: Torrent 58.7%.');
  assert.deepEqual(megasIn(ctx), ['Mega Swampert', 'Mega Charizard Y']);
});

test('punctuation around the name does not defeat the match', () => {
  assert.deepEqual(megasIn(run('Ability split for (Mega Swampert): Torrent 58.7%.')), ['Mega Swampert']);
  assert.deepEqual(megasIn(run('Ability data for "Mega Blastoise", Torrent 55%.')), ['Mega Blastoise']);
});

test('a Mega whose ability happens to match its base form is still reported', () => {
  // Mega Tyranitar keeps Sand Stream. That is a coincidence, not a rule, so
  // staying silent here would teach exactly the wrong lesson.
  assert.deepEqual(megasIn(run('Mega Tyranitar ability: Sand Stream 100%.')), ['Mega Tyranitar']);
});

// --- stays quiet otherwise -------------------------------------------------

test('silent when a Mega is mentioned with no ability language', () => {
  assert.equal(run('Mega Delphox appeared in three top teams this week.'), null);
});

test('silent for a non-Mega ability page', () => {
  assert.equal(run('Garchomp abilities: Rough Skin 71%, Sand Veil 29%.'), null);
});

test('silent when "Mega" appears only as a common noun', () => {
  assert.equal(run('Choosing a Mega is an important ability decision, 50% of teams.'), null);
});

test('silent on an unknown pseudo-Mega', () => {
  assert.equal(run('Mega Nosuchmon abilities: Fakeability 99%.'), null);
});

// --- fails open ------------------------------------------------------------

test('non-JSON stdin exits 0 and emits nothing', () => {
  const out = execFileSync('node', [HOOK], { input: 'not json at all', encoding: 'utf8' });
  assert.equal(out.trim(), '');
});

test('empty stdin exits 0 and emits nothing', () => {
  const out = execFileSync('node', [HOOK], { input: '', encoding: 'utf8' });
  assert.equal(out.trim(), '');
});

test('a payload with no tool_response exits 0 and emits nothing', () => {
  const out = execFileSync('node', [HOOK], { input: '{"tool_name":"WebFetch"}', encoding: 'utf8' });
  assert.equal(out.trim(), '');
});
