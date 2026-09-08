const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTeamText, parseSp } = require('../team');

// Build a team file body from row specs so each test states only what it is
// exercising. Columns match teams/_TEMPLATE.md.
function teamFile(rows, opts = {}) {
  const reg = opts.regulation === null ? '' : `**Regulation:** ${opts.regulation || 'M-B'}\n`;
  const body = rows.map((r) => `| ${r.mon} | ${r.item || '—'} | ${r.ability || '—'} | ${r.nature || 'Serious'} | ${r.sp || '32 HP / 32 Def / 2 SpD'} | ${r.moves || 'Protect'} |`).join('\n');
  return `# Team: test\n\n${reg}\n## The six\n\n| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |\n|---|---|---|---|---|---|\n${body}\n\n## Why these six\n\ntext\n`;
}

const OK = { mon: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', nature: 'Jolly', sp: '2 HP / 32 Atk / 32 Spe', moves: 'Earthquake / Dragon Claw / Rock Slide / Protect' };

function run(rows, opts) {
  return validateTeamText(teamFile(rows, opts), Object.assign({ activeRegulation: 'M-B' }, opts));
}

function errorsOf(res) { return res.errors.join(' | '); }
function warningsOf(res) { return res.warnings.join(' | '); }

// --- the two errors that actually shipped ----------------------------------

test('duplicate items across the six are a hard error', () => {
  const res = run([
    Object.assign({}, OK),
    Object.assign({}, OK, { mon: 'Gholdengo', ability: 'Good as Gold', sp: '32 HP / 2 Def / 32 SpA', moves: 'Make It Rain / Protect' }),
  ]);
  assert.match(errorsOf(res), /DUPLICATE ITEM: "Life Orb" held by Garchomp and Gholdengo/);
  assert.match(errorsOf(res), /hard rule, not a style choice/);
});

test('an item outside the Champions pool errors, and suggests the real name', () => {
  // The real bug found in teams/whimsicott-incineroar-antiweather-core.md:
  // the stone is "Staraptite", not "Staraptorite".
  const res = run([Object.assign({}, OK, { mon: 'Staraptor', item: 'Staraptorite', ability: 'Contrary' })]);
  assert.match(errorsOf(res), /item "Staraptorite" is not in the Champions item pool/);
  assert.match(errorsOf(res), /Did you mean: Staraptite\?/);
});

// --- Mega ability, the repo's most-repeated error ---------------------------

test('a Mega listed with its pre-Mega ability is an error', () => {
  const res = run([{ mon: 'Raichu', item: 'Raichunite Y', ability: 'Lightning Rod', nature: 'Timid', sp: '2 HP / 32 SpA / 32 Spe', moves: 'Thunderbolt / Protect' }]);
  assert.match(errorsOf(res), /fixed battle ability is "No Guard"/);
  assert.match(errorsOf(res), /usage pages report that pre-Mega value/);
});

test('a Mega listed with its correct fixed ability passes', () => {
  const res = run([{ mon: 'Raichu', item: 'Raichunite Y', ability: 'No Guard', nature: 'Timid', sp: '2 HP / 32 SpA / 32 Spe', moves: 'Thunderbolt / Protect' }]);
  assert.equal(res.errors.length, 0, errorsOf(res));
});

test('an empty ability column on a Mega warns with the right answer', () => {
  const res = run([{ mon: 'Swampert', item: 'Swampertite', ability: '—', nature: 'Adamant', sp: '32 HP / 16 Atk / 18 Def', moves: 'Earthquake / Protect' }]);
  assert.match(warningsOf(res), /ability column is empty.*Mega Swampert is Swift Swim/);
});

test('holding a Mega stone for a multi-forme species asks for disambiguation', () => {
  // An unrecognised suffix must not silently resolve to the wrong forme.
  const res = run([{ mon: 'Raichu', item: 'Raichunite Q', ability: 'Lightning Rod', nature: 'Timid', sp: '2 HP / 32 SpA / 32 Spe', moves: 'Thunderbolt / Protect' }]);
  const all = errorsOf(res) + warningsOf(res);
  // Either it resolves cleanly or it asks — what it must not do is silently
  // check the ability against the wrong forme.
  assert.ok(/name the exact forme|not in the Champions item pool|fixed battle ability/.test(all), all);
});

// --- SP budget --------------------------------------------------------------

test('SP over the 66-point budget is an error', () => {
  const res = run([Object.assign({}, OK, { sp: '32 HP / 32 Atk / 32 Spe' })]);
  assert.match(errorsOf(res), /SP total 96 exceeds the 66-point budget/);
});

test('a single stat over the 32 cap is an error', () => {
  const res = run([Object.assign({}, OK, { sp: '34 HP / 32 Atk' })]);
  assert.match(errorsOf(res), /34 HP exceeds the 32-per-stat cap/);
});

test('unspent SP warns rather than errors', () => {
  const res = run([Object.assign({}, OK, { sp: '32 HP / 30 Atk' })]);
  assert.equal(res.errors.length, 0, errorsOf(res));
  assert.match(warningsOf(res), /SP total 62, leaving 4 point\(s\) unspent/);
});

test('both SP orderings parse', () => {
  assert.deepEqual(parseSp('32 HP / 2 Def').map((p) => [p.stat, p.value]), [['HP', 32], ['Def', 2]]);
  assert.deepEqual(parseSp('HP 32 / Def 2').map((p) => [p.stat, p.value]), [['HP', 32], ['Def', 2]]);
});

// --- other legality ---------------------------------------------------------

test('an unknown species errors', () => {
  const res = run([Object.assign({}, OK, { mon: 'Nosuchmon' })]);
  assert.match(errorsOf(res), /not in the Champions roster/);
});

test('an unknown move errors', () => {
  const res = run([Object.assign({}, OK, { moves: 'Earthquake / Fakemove' })]);
  assert.match(errorsOf(res), /move "Fakemove" is not in the Champions move list/);
});

test('more than four moves errors', () => {
  const res = run([Object.assign({}, OK, { moves: 'Earthquake / Dragon Claw / Rock Slide / Protect / Swords Dance' })]);
  assert.match(errorsOf(res), /5 moves listed, maximum is 4/);
});

test('an invalid Stat Alignment errors', () => {
  const res = run([Object.assign({}, OK, { nature: 'Sparkly' })]);
  assert.match(errorsOf(res), /"Sparkly" is not a valid Stat Alignment/);
});

test('a non-Mega ability outside the Champions pool errors', () => {
  const res = run([Object.assign({}, OK, { ability: 'Fakeability' })]);
  assert.match(errorsOf(res), /ability "Fakeability" is not in the Champions ability pool/);
});

// --- regulation -------------------------------------------------------------

test('a team built for an older regulation warns as historical', () => {
  const res = run([OK], { regulation: 'M-A' });
  assert.match(warningsOf(res), /Built for regulation M-A, current is M-B/);
  assert.match(warningsOf(res), /historical record/);
});

test('a team with no regulation stamp warns', () => {
  const res = run([OK], { regulation: null });
  assert.match(warningsOf(res), /No parseable "\*\*Regulation:\*\* <id>" stamp/);
});

// --- structure --------------------------------------------------------------

test('a roster short of six warns rather than erroring (builds in progress)', () => {
  const res = run([OK, Object.assign({}, OK, { mon: 'Gholdengo', item: 'Metal Coat', ability: 'Good as Gold', moves: 'Make It Rain / Protect' })]);
  assert.equal(res.errors.length, 0, errorsOf(res));
  assert.match(warningsOf(res), /Roster has 2 Pokemon, expected 6/);
});

test('a file with no "## The six" section errors', () => {
  const res = validateTeamText('# Team\n\nno table here\n', { activeRegulation: 'M-B' });
  assert.match(errorsOf(res), /No "## The six" section found/);
});

// --- honest about its own limits -------------------------------------------

test('a species fully covered by the vendored learnset table has no move-legality notChecked entry', () => {
  const res = run([OK]);
  assert.ok(!res.notChecked.some((n) => /learnset/i.test(n)), JSON.stringify(res.notChecked));
});

test('a fully valid single-Pokemon roster produces no errors', () => {
  const res = run([OK]);
  assert.equal(res.errors.length, 0, errorsOf(res));
});

// --- move legality (Task 5) --------------------------------------------------

test('an unlearnable move is a hard error', () => {
  const res = run([{ mon: 'Altaria', item: 'Leftovers', ability: 'Cloud Nine', nature: 'Calm', sp: '32 HP / 32 SpD / 2 Def', moves: 'Calm Mind / Protect / Tailwind / Roost' }]);
  assert.ok(
    res.errors.some((e) => /Calm Mind/.test(e) && /cannot learn/i.test(e)),
    errorsOf(res)
  );
});

test('a legal move produces no move-legality error', () => {
  const res = run([{ mon: 'Altaria', item: 'Leftovers', ability: 'Cloud Nine', nature: 'Calm', sp: '32 HP / 32 SpD / 2 Def', moves: 'Will-O-Wisp / Protect / Tailwind / Roost' }]);
  assert.ok(!res.errors.some((e) => /cannot learn/i.test(e)), errorsOf(res));
});

test('notChecked no longer claims move legality is unchecked', () => {
  const res = run([{ mon: 'Altaria', item: 'Leftovers', ability: 'Cloud Nine', nature: 'Calm', sp: '32 HP / 32 SpD / 2 Def', moves: 'Will-O-Wisp / Protect / Tailwind / Roost' }]);
  assert.ok(
    !(res.notChecked || []).some((n) => /learnsets are not in the vendored data/.test(n)),
    'the hardcoded learnset caveat should be gone'
  );
});
