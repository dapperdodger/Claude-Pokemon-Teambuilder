'use strict';
// Validates a team file under teams/ against the vendored Champions data and
// the current regulation.
//
// Why this exists: "check before finalising" was a prose checklist, and the
// two things it most needed to catch — a duplicate item across the six (hard
// illegal) and a Mega listed with its pre-Mega ability — had both already
// slipped through more than once. Everything checked here is deterministic,
// so it should not depend on remembering to look.
//
// Scope fence: this checks what the local data can prove. Move legality IS
// now checked, against the vendored learnset table (tools/dex/VENDOR_MANIFEST.md)
// — but only for species that table covers; anything else is reported as
// unchecked rather than silently passed. It still does not judge whether a set
// is any good.

const fs = require('node:fs');
const path = require('node:path');
const { getVendor } = require('../damage-calc/load-vendor');
const dex = require('./dex');

const SP_BUDGET = 66;
const SP_CAP_PER_STAT = 32;
const TEAM_SIZE = 6;
const STAT_LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

function repoRoot() {
  return path.join(__dirname, '..', '..');
}

function currentRegulation() {
  const p = path.join(repoRoot(), 'reference', 'regulation.md');
  try {
    const m = fs.readFileSync(p, 'utf8').match(/^\*\*Regulation: ([A-Za-z0-9-]+)\*\*/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// A cell may carry an annotation in parentheses, e.g.
// "Dragonite (→ Mega Dragonite)" or "Staraptorite (→ Mega, fixed Swift Swim)".
// The annotation is prose for human readers; the value is what precedes it.
function cellValue(cell) {
  return String(cell || '').replace(/\s*\(.*$/, '').trim();
}

function parseSix(text) {
  const after = text.split(/^## The six\s*$/m)[1];
  if (after === undefined) return null;
  const block = after.split(/^## /m)[0];
  const rows = block.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  const out = [];
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim());
    // cells[0] is '' before the leading pipe.
    if (cells.length < 7) continue;
    const name = cells[1];
    if (!name || /^Pok[eé]mon$/i.test(name) || /^-+$/.test(name)) continue;
    out.push({
      raw: name,
      species: cellValue(name),
      item: cellValue(cells[2]),
      ability: cellValue(cells[3]),
      nature: cellValue(cells[4]),
      sp: cells[5] || '',
      moves: (cells[6] || '').split('/').map((m) => m.trim()).filter(Boolean),
    });
  }
  return out;
}

// Both orders appear across real team files ("32 HP" and "HP 32"), so accept
// either rather than silently parsing nothing — a spread that fails to parse
// looks identical to a spread with no problems, which is the wrong default
// for a budget check.
function parseSp(spCell) {
  const parts = [];
  const re = /(?:(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)|(HP|Atk|Def|SpA|SpD|Spe)\s*(\d+))/gi;
  let m;
  while ((m = re.exec(spCell)) !== null) {
    if (m[1] !== undefined) parts.push({ value: parseInt(m[1], 10), stat: m[2] });
    else parts.push({ value: parseInt(m[4], 10), stat: m[3] });
  }
  return parts;
}

// Resolve the forme that actually fights. Holding a Mega stone means the
// battle forme is the Mega, which is the whole reason the ability column has
// been wrong before: the file names the base species, the usage page reports
// the pre-Mega ability, and nothing connects either to what is on the field.
function resolveBattleForme(v, species, item) {
  const stoneUser = item ? v.MEGA_STONE_USER_LOOKUP[item] : undefined;
  if (!stoneUser) return { name: species, isMega: false };

  const base = v.POKEDEX_CHAMPIONS[stoneUser];
  const formes = (base && base.formes) || [];
  const megas = formes.filter((f) => /^Mega /.test(f));
  if (megas.length === 1) return { name: megas[0], isMega: true, stoneUser };

  // A species with X/Y (or Z) variants has one stone per variant, and the
  // stone's own suffix says which — "Raichunite Y" can only mean "Mega Raichu
  // Y". Use that rather than asking the file to repeat it, so the ability
  // check still runs on the common case.
  const suffix = (item.match(/\s([XYZ])$/) || [])[1];
  if (suffix) {
    const match = megas.find((f) => new RegExp(`\\s${suffix}$`).test(f));
    if (match) return { name: match, isMega: true, stoneUser };
  }
  return { name: null, isMega: true, stoneUser, candidates: megas };
}

function validateTeamText(text, opts = {}) {
  const v = getVendor();
  const errors = [];
  const warnings = [];

  const activeReg = opts.activeRegulation !== undefined ? opts.activeRegulation : currentRegulation();
  const regMatch = text.match(/^\*\*Regulation:\*\*\s*([A-Za-z0-9-]+)/m);
  if (!regMatch) {
    warnings.push('No parseable "**Regulation:** <id>" stamp — the team cannot be checked against the current regulation.');
  } else if (activeReg && regMatch[1] !== activeReg) {
    warnings.push(`Built for regulation ${regMatch[1]}, current is ${activeReg}. This is a historical record — its per-pick reasoning was true under those rules, not today's.`);
  }

  const six = parseSix(text);
  if (six === null) {
    errors.push('No "## The six" section found.');
    return { errors, warnings, checked: 0 };
  }
  if (six.length !== TEAM_SIZE) {
    (six.length < TEAM_SIZE ? warnings : errors).push(`Roster has ${six.length} Pokemon, expected ${TEAM_SIZE}.`);
  }

  const itemsHeld = [];
  let megaCount = 0;
  const learnsetUnknown = new Set();

  for (const row of six) {
    const label = row.species || row.raw;

    // --- species -----------------------------------------------------------
    let baseEntry = v.POKEDEX_CHAMPIONS[row.species];
    if (!baseEntry) {
      errors.push(`${label}: not in the Champions roster (vendored POKEDEX_CHAMPIONS). Check spelling, or the vendored data may predate a roster update.`);
      continue;
    }

    // --- item --------------------------------------------------------------
    if (row.item && row.item !== '—') {
      if (!v.ITEMS_CHAMPIONS.includes(row.item)) {
        const near = v.ITEMS_CHAMPIONS.filter((i) => i.toLowerCase().startsWith(row.item.slice(0, 5).toLowerCase()));
        errors.push(`${label}: item "${row.item}" is not in the Champions item pool.${near.length ? ` Did you mean: ${near.join(', ')}?` : ''}`);
      }
      itemsHeld.push({ item: row.item, mon: label });
    }

    // --- battle forme and ability -----------------------------------------
    const forme = resolveBattleForme(v, row.species, row.item);
    if (forme.isMega) megaCount += 1;

    let battleName = forme.name;
    if (forme.isMega && !battleName) {
      const explicit = (row.raw.match(/Mega [A-Za-z' .-]+(?:\s+[XYZ])?/) || [])[0];
      const normalised = explicit ? explicit.replace(/-([XYZ])$/, ' $1').trim() : null;
      if (normalised && v.POKEDEX_CHAMPIONS[normalised]) {
        battleName = normalised;
      } else {
        warnings.push(`${label}: holds a Mega stone for a species with multiple Mega formes (${(forme.candidates || []).join(', ')}) — name the exact forme in the Pokemon cell so the ability can be checked.`);
      }
    }

    if (battleName && forme.isMega) {
      const mega = v.POKEDEX_CHAMPIONS[battleName];
      if (!mega) {
        warnings.push(`${label}: could not resolve Mega forme "${battleName}" in the vendored dex.`);
      } else if (!row.ability || row.ability === '—') {
        warnings.push(`${label}: ability column is empty. Put the Mega's fixed battle ability there — ${battleName} is ${mega.ab}.`);
      } else if (row.ability !== mega.ab) {
        errors.push(`${label}: ability listed as "${row.ability}" but ${battleName}'s fixed battle ability is "${mega.ab}". A Mega's ability overrides the pre-Mega selection (base ${row.species} is "${baseEntry.ab}"), and usage pages report that pre-Mega value.`);
      }
    } else if (row.ability && row.ability !== '—' && !v.ABILITIES_CHAMPIONS.includes(row.ability)) {
      errors.push(`${label}: ability "${row.ability}" is not in the Champions ability pool.`);
    }

    // --- stat alignment ----------------------------------------------------
    if (row.nature && row.nature !== '—' && !(row.nature in v.NATURES)) {
      errors.push(`${label}: "${row.nature}" is not a valid Stat Alignment.`);
    }

    // --- SP ----------------------------------------------------------------
    const sp = parseSp(row.sp);
    if (sp.length === 0) {
      warnings.push(`${label}: no SP allocation parsed from "${row.sp}".`);
    } else {
      const total = sp.reduce((a, b) => a + b.value, 0);
      if (total > SP_BUDGET) {
        errors.push(`${label}: SP total ${total} exceeds the ${SP_BUDGET}-point budget.`);
      } else if (total < SP_BUDGET) {
        warnings.push(`${label}: SP total ${total}, leaving ${SP_BUDGET - total} point(s) unspent.`);
      }
      for (const s of sp) {
        if (s.value > SP_CAP_PER_STAT) {
          errors.push(`${label}: ${s.value} ${s.stat} exceeds the ${SP_CAP_PER_STAT}-per-stat cap.`);
        }
      }
      const seen = new Set();
      for (const s of sp) {
        const key = s.stat.toLowerCase();
        if (seen.has(key)) warnings.push(`${label}: ${s.stat} listed more than once in the SP cell.`);
        seen.add(key);
      }
      for (const s of sp) {
        if (!STAT_LABELS.some((l) => l.toLowerCase() === s.stat.toLowerCase())) {
          warnings.push(`${label}: unrecognised stat label "${s.stat}".`);
        }
      }
    }

    // --- moves -------------------------------------------------------------
    if (row.moves.length === 0) {
      warnings.push(`${label}: no moves listed.`);
    } else if (row.moves.length > 4) {
      errors.push(`${label}: ${row.moves.length} moves listed, maximum is 4.`);
    }
    for (const mv of row.moves) {
      if (!v.MOVES_CHAMPIONS[mv]) {
        errors.push(`${label}: move "${mv}" is not in the Champions move list. Check spelling.`);
      }
    }

    // Move legality. A species the learnset table does not cover yields
    // "unknown" — recorded as unchecked, never reported as illegal.
    for (const mv of row.moves) {
      if (!v.MOVES_CHAMPIONS[mv]) continue; // already reported as a spelling error above
      const verdict = dex.learnset(battleName || row.species, mv);
      if (verdict.verdict === 'illegal') {
        errors.push(`${label}: cannot learn "${mv}" in Champions. Do not build a role around it.`);
      } else if (verdict.verdict === 'unknown') {
        learnsetUnknown.add(row.species);
      }
    }
  }

  // --- duplicate items (hard illegal) --------------------------------------
  const byItem = new Map();
  for (const { item, mon } of itemsHeld) {
    if (!byItem.has(item)) byItem.set(item, []);
    byItem.get(item).push(mon);
  }
  for (const [item, mons] of byItem) {
    if (mons.length > 1) {
      errors.push(`DUPLICATE ITEM: "${item}" held by ${mons.join(' and ')}. No two Pokemon on a team may hold the same item — this is a hard rule, not a style choice.`);
    }
  }

  if (megaCount > 1) {
    warnings.push(`${megaCount} Mega stones on one team. Bringing more than one is a real strategy (only one can Mega Evolve per battle), but confirm the current regulation allows it — see reference/regulation.md's Unverified mechanics table.`);
  }

  // Move legality is checked above for every species the vendored learnset
  // table covers. Only genuinely-uncovered species are reported here, so a
  // clean result now means moves really were checked.
  const notChecked = learnsetUnknown.size
    ? [`move legality for: ${[...learnsetUnknown].join(', ')} (not in the vendored learnset table — verify live, and see tools/dex/VENDOR_MANIFEST.md)`]
    : [];

  return { errors, warnings, checked: six.length, notChecked };
}

function validateTeamFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const result = validateTeamText(text);
  return Object.assign({ file: filePath }, result);
}

module.exports = { validateTeamFile, validateTeamText, parseSix, parseSp, currentRegulation };
