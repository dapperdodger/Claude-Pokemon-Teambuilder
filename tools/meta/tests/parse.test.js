'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parse = require('../parse');

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('parseQuickInfo reads a real per-Pokemon header', () => {
  const q = parse.parseQuickInfo(fx('ranked-raichu.md'));
  assert.equal(q.formatCode, 'battledataregmbs3');
  assert.equal(q.winRate, '48.411%');
  assert.equal(q.record, '3527-3759-14');
  assert.equal(q.usage, 'N/A');
  assert.equal(q.dataDate, '2026-05');
});

test('parseQuickInfo returns sentinels verbatim rather than cleaning them', () => {
  // The Mega stub carries N/A for everything. Cleaning here would hide it from
  // the validator, which is the layer that must decide what a sentinel means.
  const q = parse.parseQuickInfo(fx('ranked-raichu-mega-y.md'));
  assert.equal(q.winRate, 'N/A');
  assert.equal(q.record, 'N/A');
});

test('parseFormatInfo reads the index header', () => {
  const f = parse.parseFormatInfo(fx('ranked-index.md'));
  assert.equal(f.code, 'battledataregmbs3');
  assert.match(f.label, /M-B S3/);
  assert.equal(f.dataDate, '2026-05');
});

test('parsePercentList reads the item distribution, Mega stones included', () => {
  const items = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Items');
  assert.equal(items[0].name, 'Raichunite Y');
  assert.equal(items[0].percentRaw, '60.5%');
  assert.equal(items[1].name, 'Raichunite X');
  assert.equal(items[1].percentRaw, '18.2%');
  assert.ok(items.length >= 5);
});

test('parsePercentList preserves undefined% rather than dropping the row', () => {
  // Dropping it would make a broken section look like an empty one.
  const mates = parse.parsePercentList(fx('ranked-raichu.md'), 'Common Teammates');
  assert.ok(mates.length > 0);
  assert.ok(mates.every((m) => m.percentRaw === 'undefined%'));
});

test('parsePercentList returns an empty array for an absent section', () => {
  // Floette-Eternal legitimately has no Featured Teams; absence is not an error.
  assert.deepEqual(parse.parsePercentList(fx('ranked-raichu.md'), 'No Such Section'), []);
});

test('parseUsageTable reads the ranked index', () => {
  const rows = parse.parseUsageTable(fx('ranked-index.md'));
  assert.equal(rows.length, 50);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[0].species, 'Garchomp');
  assert.equal(rows[0].usageRaw, 'N/A%');       // ladder carries no usage
  assert.equal(rows[0].winRateRaw, '48.05%');
  assert.equal(rows[0].recordRaw, '10833-11714-41');
});

test('parseUsageTable reads real usage from the tournament index', () => {
  const rows = parse.parseUsageTable(fx('tournaments-index.md'));
  assert.equal(rows[0].species, 'Kingambit');
  assert.equal(rows[0].usageRaw, '35.59%');
  assert.equal(rows[0].winRateRaw, '51.397%');
});

test('parseCores: all three group sizes parse from the real M-B cores section, sizes derived from headings', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  assert.equal(out.reason, null);
  assert.deepEqual(out.groups.map((g) => g.size), [2, 3, 4]);
});

test('parseCores: species are split correctly from the comma-separated Core cell', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  const two = out.groups.find((g) => g.size === 2);
  assert.deepEqual(two.cores[0].species, ['Charizard-Mega-Y', 'Garchomp']);
  const three = out.groups.find((g) => g.size === 3);
  assert.deepEqual(three.cores[0].species, ['Charizard-Mega-Y', 'Garchomp', 'Kingambit']);
});

test('parseCores: team counts and usage come through as raw strings, untouched', () => {
  const out = parse.parseCores(fx('ranked-index.md'));
  const two = out.groups.find((g) => g.size === 2);
  assert.equal(two.cores[0].rank, 1);
  assert.equal(two.cores[0].teamsRaw, '2155');
  assert.equal(two.cores[0].usageRaw, '16.3%');
});

test('parseCores: real M-C fixture splits a Mega-named core member using Pikalytics\' own convention', () => {
  // Floette-Eternal-Mega must come through verbatim here — resolving it to
  // the dex form ("Mega Floette Eternal") is a job for whoever consumes this
  // against the dex, via megas.pikaToDex, never a parser-level transform.
  const out = parse.parseCores(fx('ranked-index-mc.md'));
  const three = out.groups.find((g) => g.size === 3);
  assert.deepEqual(three.cores[0].species, ['Floette-Eternal-Mega', 'Incineroar', 'Rillaboom']);
});

test('parseCores: a placeholder "no curated data yet" group is empty with a reason, not a throw', () => {
  const out = parse.parseCores(fx('filler-index.md'));
  assert.equal(out.reason, null);
  assert.deepEqual(out.groups.map((g) => g.size), [2, 3, 4]);
  for (const g of out.groups) {
    assert.deepEqual(g.cores, []);
    assert.match(g.reason, /no curated core data/);
  }
});

test('parseCores: a page with no Common Team Cores section yields an empty result with a reason, not a throw', () => {
  const out = parse.parseCores(fx('ranked-raichu.md'));
  assert.deepEqual(out.groups, []);
  assert.match(out.reason, /no "Common Team Cores" section/);
});

test('parseCores: a group whose heading parses but whose table row does not match must surface, not vanish', () => {
  const text = [
    '## Common Team Cores',
    '',
    '### 2-Pokemon Cores',
    '',
    '| Rank | Core | Teams | Usage |',
    '|------|------|-------|-------|',
    '| 1 | Charizard-Mega-Y, Garchomp | 2155 | 16.3% |',
    '| Charizard-Mega-Y, Garchomp | 2155 | 16.3% |',
    '',
    '## Recent Top Teams',
  ].join('\n');
  assert.throws(() => parse.parseCores(text), /did not match the expected/);
});

// --- parseTopTeams / parseTeamUsage -----------------------------------
// Fixtures fetched live 2026-09-10 (one day into the M-C rollover window),
// so this data genuinely straddles the regulation boundary — that is a
// property of what this frozen snapshot is testing, not a bug in the
// fixture. Parsing-mechanics assertions below are pinned to this exact
// content and must not move at a later rollover.

test('parseTopTeams: reads real rows off the Top Teams Table, species and archetypes split', () => {
  const out = parse.parseTopTeams(fx('tournaments-topteams.md'));
  assert.equal(out.reason, null);
  assert.equal(out.teams.length, 25);
  const first = out.teams[0];
  assert.equal(first.rank, 1);
  assert.equal(first.author, 'M_rada');
  assert.equal(first.record, '7-0');
  assert.deepEqual(first.species, ['Gengar-Mega', 'Snorlax', 'Incineroar', 'Scrafty', 'Dragonite', 'Rillaboom']);
});

test('parseTopTeams: a literal "None" archetypes cell becomes an empty array, not a one-element ["None"]', () => {
  const out = parse.parseTopTeams(fx('tournaments-topteams.md'));
  const untagged = out.teams.find((t) => t.rank === 1);
  assert.deepEqual(untagged.archetypes, []);
});

test('parseTopTeams: a real multi-tag archetypes cell splits into separate tags', () => {
  const out = parse.parseTopTeams(fx('tournaments-topteams.md'));
  const tagged = out.teams.find((t) => t.rank === 3);
  assert.deepEqual(tagged.archetypes, ['trick-room', 'tailwind']);
});

test('REGRESSION: parseTopTeams reconstructs a Tournament name containing literal un-escaped "|" characters', () => {
  // Row 7's real tournament name is "🍋Sitrus-Series🍋|Champions-MC|$50 to
  // First|#75" — Pikalytics never escapes the pipes in it, so a naive
  // positional column split misattributes every cell after Tournament for
  // this exact row. Parsing from both ends (fixed Rank/Author/Record at the
  // front, fixed Archetypes/Pokemon at the back) must still recover it
  // whole, and must not have eaten into the real Archetypes/Pokemon cells.
  const out = parse.parseTopTeams(fx('tournaments-topteams.md'));
  const row7 = out.teams.find((t) => t.rank === 7);
  assert.equal(row7.tournament, '🍋Sitrus-Series🍋|Champions-MC|$50 to First|#75');
  assert.deepEqual(row7.archetypes, ['trick-room']);
  assert.deepEqual(row7.species, ['Absol-Mega-Z', 'Sneasler', 'Salamence-Mega', 'Kingambit', 'Incineroar', 'Sinistcha']);
});

test('parseTopTeams: a page with no Top Teams Table section yields an empty result with a reason, not a throw', () => {
  const out = parse.parseTopTeams('# Nothing here\n');
  assert.deepEqual(out.teams, []);
  assert.match(out.reason, /no "Top Teams Table" section/);
});

test('parseTopTeams: a table whose data row does not match the expected shape must surface, not vanish', () => {
  const text = [
    '## Top Teams Table',
    '',
    '| Rank | Author | Record | Tournament | Archetypes | Pokemon |',
    '|------|--------|--------|------------|------------|---------|',
    '| 1 | Someone | 7-0 | Some Cup | None | A, B, C, D, E, F |',
    '| Someone | 7-0 | Some Cup | None | A, B, C, D, E, F |',
    '',
    '## Source Links',
  ].join('\n');
  assert.throws(() => parse.parseTopTeams(text), /did not match the expected/);
});

test('parseTeamUsage: reads real rows off the Team Usage Table, Uses/Win Rate/Record/Unique Teams raw and Pokemon split', () => {
  const out = parse.parseTeamUsage(fx('tournaments-team-usage.md'));
  assert.equal(out.reason, null);
  assert.equal(out.rows.length, 25);
  const first = out.rows[0];
  assert.equal(first.rank, 1);
  assert.equal(first.usesRaw, '12');
  assert.equal(first.winRateRaw, '59.46%');
  assert.equal(first.recordRaw, '22 - 15 - 0');
  assert.equal(first.uniqueTeamsRaw, '12');
  assert.deepEqual(first.species, ['Rillaboom', 'Incineroar', 'Salamence-Mega', 'Floette-Eternal', 'Sneasler', 'Basculegion']);
});

test('parseTeamUsage: a page with no Team Usage Table section yields an empty result with a reason, not a throw', () => {
  const out = parse.parseTeamUsage('# Nothing here\n');
  assert.deepEqual(out.rows, []);
  assert.match(out.reason, /no "Team Usage Table" section/);
});

test('parseTeamUsage: a table whose data row does not match the expected shape must surface, not vanish', () => {
  const text = [
    '## Team Usage Table',
    '',
    '| Rank | Uses | Win Rate | Record | Unique Teams | Pokemon |',
    '|------|------|----------|--------|--------------|---------|',
    '| 1 | 12 | 59.46% | 22 - 15 - 0 | 12 | A, B, C, D, E, F |',
    '| 12 | 59.46% | 22 - 15 - 0 | 12 | A, B, C, D, E, F |',
    '',
    '## Related Pages',
  ].join('\n');
  assert.throws(() => parse.parseTeamUsage(text), /did not match the expected/);
});
