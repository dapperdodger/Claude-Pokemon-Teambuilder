#!/usr/bin/env node
'use strict';
// One-off script: drives the real NCP calculator (GitHub Pages, since it's
// a static site and needs no server) headlessly via Playwright to capture
// ground-truth output for a known matchup, saved as a fixture that
// tests/fixture-validation.test.js checks calc.js against.
//
// Run manually (not part of `node --test`):
//   node tools/damage-calc/scripts/generate-fixture.js
// Requires the `playwright` package (`npm install --save-dev playwright`,
// already added to this repo's package.json) plus a downloaded Chromium
// (`npx playwright install chromium`) — this is why it's not part of the
// normal test suite (network access + a headless-browser download).
//
// DISCOVERY NOTES (empirically confirmed against the live page, not
// guessed — see the exploration transcript in task-6-report.md for the
// full probing session this was derived from):
//
//  - Generation selector: a radio-button group, `input.gen` (ids gen1..
//    gen10), NOT a <select>. The Champions mode radio is `#gen10`, whose
//    visible label text is "CHAMP" (not literally "Champions" — the page
//    title band separately reads "VGC 2026: Champions Damage Calculator").
//    It is already `checked` by default on page load, but this script
//    clicks it explicitly anyway rather than relying on that default,
//    since a future page change could alter it silently.
//  - Each Pokémon panel (#p1 / #p2) has a species/set picker built on
//    select2 (a jQuery plugin), not a plain <select> — clicking its
//    `.select2-choice` opens a search box, typing a species name filters
//    a results list grouped by species with each of that species' preset
//    sets as sub-items PLUS a literal "Blank Set" item. Selecting "Blank
//    Set" gives a fresh Pokémon of that species with all fields at
//    engine defaults (0 Stat Points everywhere, Serious nature, no item,
//    first alphabetical ability) which this script then overrides
//    explicitly — this is the correct choice for a fully custom build
//    like this matchup's, rather than picking a preset and hoping its
//    fields happen to match.
//  - GOTCHA (discovered empirically, not documented anywhere on the
//    page): select2's own dropdown/search-box DOM (`.select2-drop`,
//    `.select2-drop-active`, `.select2-input`) is a single shared node
//    the plugin repositions and re-shows per field, rather than a fresh
//    node per field — after closing Pokémon 1's species dropdown, the
//    stale (now-hidden) node can still carry the `.select2-drop-active`
//    class, so a plain `.select2-drop-active .select2-input` locator can
//    resolve to Pokémon 1's now-invisible input instead of Pokémon 2's
//    freshly-opened one, hanging on Playwright's actionability wait.
//    Fixed by filtering to `:visible` explicitly.
//  - Ability/item ARE plain `<select class="ability ...">` / `<select
//    class="item ...">` elements underneath their select2 skin (unlike
//    the species picker), so Playwright's `selectOption({ label })`
//    drives them directly and reliably fires the page's own `change`
//    listener (the site's `calc-trigger` class), no select2 UI
//    choreography needed.
//  - Confirmed empirically: Pokémon Champions' item dropdown (`select.
//    item` when gen10/CHAMP is active) does NOT include "Choice Specs"
//    as an option at all — consistent with this project's independently
//    verified fact that Choice Specs is not currently legal in Champions.
//    Life Orb IS present and is used here instead, matching the same
//    real matchup already covered by tools/damage-calc/tests/calc.test.js.
//  - Nature is a plain (non-select2) `<select class="nature">`, with
//    option labels like "Modest (+SpA, -Atk)" — the full label including
//    the stat-change annotation is required for `selectOption({ label })`
//    (a plain "Modest" label does not match any option).
//  - Stat Points inputs are six plain `<input class="sps">` elements per
//    Pokémon panel, in fixed DOM order HP, Attack, Defense, Sp. Atk,
//    Sp. Def, Speed (confirmed by reading the table row order in the
//    page's own HTML — the hidden Gen-1-only "Special" stat row has no
//    `.sps` input at all, so the count stays exactly 6 per panel with no
//    off-by-one risk).
//  - Move slots are four `<select class="move-selector">` elements per
//    Pokémon panel (one per move slot); `selectOption({ label:
//    '<Move Name>' })` on the first one sets slot 1.
//  - The computed result appears in `#mainResult` (a human-readable
//    summary string) and `#damageValues` (the raw 16 damage rolls as a
//    parenthesized comma-separated list, e.g. "(129, 130, ..., 152)").
//    Both are in RAW HP POINTS, not percentages — `#mainResult` shows
//    both forms together, e.g. "...: 129-152 (70.4 - 83%) -- guaranteed
//    2HKO", confirming the raw-number segment ("129-152") is HP points,
//    matching this project's calc.js's `min`/`max` convention (see
//    calc.js's header comment on `rawResult.damage`). `#damageValues`
//    is used here as the source of truth since it is already
//    machine-parseable (no regex against a free-text summary string
//    needed) and gives every individual roll, not just the extremes.

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/';

async function selectSpeciesBlankSet(page, panelSelector, speciesName) {
  const panel = page.locator(panelSelector);
  await panel.locator('.select2-choice').first().click();
  const searchInput = page.locator('.select2-drop-active .select2-input:visible').first();
  await searchInput.fill(speciesName);
  await page.waitForTimeout(400); // select2's own debounced filtering
  await page
    .locator('.select2-drop-active .select2-results:visible li:has-text("Blank Set")')
    .first()
    .click();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(SOURCE_URL, { waitUntil: 'networkidle' });

  // Select Champions mode explicitly (gen = 10, visible label "CHAMP"),
  // per the confirmed gen dispatch in script_res/ap_calc.js ("case 10:
  // //Champions") this project's calc.js also relies on. The `<input
  // id="gen10">` radio itself is visually hidden (btn-input styling) —
  // its paired `<label for="gen10">` is the actual clickable element —
  // discovered empirically after clicking the radio directly hung
  // Playwright's actionability wait on an invisible element.
  await page.locator('label[for="gen10"]').click();

  // --- Pokémon 1 (attacker): Gholdengo ---
  await selectSpeciesBlankSet(page, '#p1', 'Gholdengo');
  const p1 = page.locator('#p1');
  await p1.locator('select.ability').first().selectOption({ label: 'Good as Gold' });
  await p1.locator('select.item').first().selectOption({ label: 'Life Orb' });
  await p1.locator('select.nature').first().selectOption({ label: 'Modest (+SpA, -Atk)' });
  const p1SpInputs = await p1.locator('input.sps').all(); // [hp, at, df, sa, sd, sp]
  await p1SpInputs[3].fill('32'); // Sp. Atk = 32 SP (the max)
  await p1SpInputs[3].dispatchEvent('change');
  const p1MoveSelects = await p1.locator('select.move-selector').all();
  await p1MoveSelects[0].selectOption({ label: 'Make It Rain' });

  // --- Pokémon 2 (defender): Garchomp ---
  await selectSpeciesBlankSet(page, '#p2', 'Garchomp');
  const p2 = page.locator('#p2');
  await p2.locator('select.ability').first().selectOption({ label: 'Rough Skin' });
  await p2.locator('select.nature').first().selectOption({ label: 'Serious' });
  // Item left at "Blank Set" default of "(none)" — Garchomp holds no item
  // in this matchup, matching tools/damage-calc/tests/calc.test.js.
  // All 6 SP inputs left at their Blank Set default of 0 (0 SP everywhere).

  await page.waitForTimeout(300); // let the page's own recalculation settle

  const mainResult = await page.locator('#mainResult').textContent();
  const damageValuesRaw = await page.locator('#damageValues').textContent();

  // damageValuesRaw looks like "(129, 130, 130, 133, ..., 152)" — the 16
  // individual damage rolls, in raw HP points (confirmed above).
  const rolls = damageValuesRaw
    .trim()
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .split(',')
    .map((s) => Number(s.trim()));

  if (rolls.length === 0 || rolls.some((n) => Number.isNaN(n))) {
    throw new Error(`Could not parse damage rolls from page output: "${damageValuesRaw}" (mainResult: "${mainResult}")`);
  }

  const min = Math.min(...rolls);
  const max = Math.max(...rolls);

  console.log('Real NCP calculator mainResult:', mainResult);
  console.log('Real NCP calculator damage rolls:', rolls);
  console.log(`Parsed min/max: ${min}-${max}`);

  const fixture = {
    attacker: {
      species: 'Gholdengo',
      ability: 'Good as Gold',
      item: 'Life Orb',
      nature: 'Modest',
      sp: { hp: 0, at: 0, df: 0, sa: 32, sd: 0, sp: 0 },
    },
    defender: {
      species: 'Garchomp',
      ability: 'Rough Skin',
      item: '',
      nature: 'Serious',
      sp: { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 },
    },
    move: 'Make It Rain',
    field: {},
    expected: { min, max },
    // Every individual roll, kept for reference/debugging even though
    // fixture-validation.test.js only checks min/max.
    allRolls: rolls,
    pageMainResult: mainResult,
    capturedAt: new Date().toISOString().slice(0, 10),
    sourceUrl: SOURCE_URL,
  };

  const fixturePath = path.join(__dirname, '..', 'tests', 'fixtures', 'gholdengo-vs-garchomp.json');
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n');
  console.log('Wrote fixture to', fixturePath);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
