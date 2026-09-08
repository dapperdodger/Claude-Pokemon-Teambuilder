'use strict';
// Query layer over the vendored Champions data.
//
// Why this exists: type effectiveness and Mega-Evolution abilities are
// deterministic lookups against data this repo already ships, but they were
// only available as hand-maintained markdown (the type chart) or as a raw
// grep into a 421KB pretty-printed JSON blob (pokedex.js). Both of those are
// read-and-interpret paths with a real, demonstrated error rate — see
// docs/case-studies.md. This module makes the correct answer cheaper to get
// than the remembered one.
//
// Scope fence: STABLE facts only — typing, base stats, Mega-fixed abilities,
// item/ability legality, move data. Never meta-dependent facts (usage,
// common sets, threat rankings). Those go stale and must come from a live
// lookup; see the vgc-meta-lookup skill.

const { getVendor } = require('../damage-calc/load-vendor');
const { getLearnsets } = require('./load-learnsets');

// The 18 real types. The vendored chart also carries Typeless/???/Stellar,
// which are engine-internal and not answerable questions about a matchup.
const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
];

function canonicalType(input) {
  const match = TYPES.find((t) => t.toLowerCase() === String(input).trim().toLowerCase());
  if (!match) {
    throw new Error(`Unknown type: "${input}". Valid types: ${TYPES.join(', ')}`);
  }
  return match;
}

function verdictFor(multiplier) {
  if (multiplier === 0) return 'immune';
  if (multiplier < 1) return 'resisted';
  if (multiplier > 1) return 'super effective';
  return 'neutral';
}

// typeEffectiveness(attacking, [def1, def2]) -> combined multiplier.
//
// Takes BOTH defending types and multiplies them here rather than returning
// two numbers for the caller to combine. Multiplying two separately-looked-up
// multipliers by hand is a documented recurring error (reading only one half
// of a dual type, or missing that a 0x half zeroes the product regardless of
// the other half), so the tool does not offer that failure mode.
function typeEffectiveness(attackingInput, defendingInputs) {
  const v = getVendor();
  const attacking = canonicalType(attackingInput);
  if (!Array.isArray(defendingInputs) || defendingInputs.length === 0) {
    throw new Error('At least one defending type is required (--vs Grass, or --vs Rock,Flying)');
  }
  if (defendingInputs.length > 2) {
    throw new Error(`A Pokemon has at most 2 types; got ${defendingInputs.length}: ${defendingInputs.join(', ')}`);
  }
  const defending = defendingInputs.map(canonicalType);

  const breakdown = defending.map((d) => {
    const m = v.TYPE_CHART_SV[attacking][d];
    if (m === undefined) {
      throw new Error(`Vendored TYPE_CHART_SV has no ${attacking} -> ${d} entry; vendored data may be incomplete.`);
    }
    return [d, m];
  });
  const multiplier = breakdown.reduce((acc, [, m]) => acc * m, 1);

  return {
    attacking,
    defending,
    multiplier,
    breakdown,
    verdict: verdictFor(multiplier),
  };
}

function isMegaForme(name) {
  return /^Mega\s/.test(name);
}

// Find the base species whose `formes` list contains this Mega, so the CLI can
// show the pre-Mega ability side by side with the fixed post-Mega one. That
// contrast is the whole point: the recurring error is reporting the pre-Mega
// selection (which is what usage pages show) as the battle ability.
function baseFormeOf(v, megaName) {
  for (const [species, entry] of Object.entries(v.POKEDEX_CHAMPIONS)) {
    if (entry && Array.isArray(entry.formes) && entry.formes.includes(megaName)) {
      return species;
    }
  }
  return null;
}

function mon(name) {
  const v = getVendor();
  const entry = v.POKEDEX_CHAMPIONS[name];
  if (!entry) {
    if (v.POKEDEX_ZA_NATDEX && v.POKEDEX_ZA_NATDEX[name]) {
      throw new Error(`"${name}" exists in the broader dex but not in the Champions-legal roster (vendored POKEDEX_CHAMPIONS) — this may be a genuine Champions restriction, or the vendored roster may be lagging a recent update. Verify via live search before assuming either way.`);
    }
    // Only offer the "Mega <name>" hint when the input mentions no Mega at
    // all. Suggesting `Mega Raichu-Mega-Y` for an input of `Raichu-Mega-Y` is
    // noise; that input is a naming-convention miss, not a forgotten forme.
    let hint = '';
    if (!/mega/i.test(name)) {
      hint = ` If you meant the Mega forme, query it by its full name, e.g. "Mega ${name}".`;
    } else if (!isMegaForme(name)) {
      hint = ' This dex names Mega formes as "Mega <Species>" (leading word, spaces not hyphens), e.g. "Mega Raichu Y".';
    }
    throw new Error(`Unknown Pokemon: "${name}" — not found in any vendored dex. Check spelling.${hint}`);
  }

  const types = [entry.t1, entry.t2].filter(Boolean);
  const out = {
    name,
    types,
    baseStats: entry.bs,
    weight: entry.w,
    ability: entry.ab || null,
    abilityIsMegaFixed: isMegaForme(name),
  };

  if (out.abilityIsMegaFixed) {
    const base = baseFormeOf(v, name);
    out.baseForme = base;
    out.baseFormeAbility = base && v.POKEDEX_CHAMPIONS[base] ? v.POKEDEX_CHAMPIONS[base].ab : null;
    out.abilityNote =
      `This is the fixed battle ability of ${name}. A Mega's ability is set by the Mega forme itself and overrides whatever the base Pokemon had selected before evolving. ` +
      `A usage-stat page's ability percentages for this species report the PRE-Mega selection (${out.baseFormeAbility || 'the base forme ability'}), not this. Do not cite that split as the ability it fights with.`;
    if (out.baseFormeAbility && out.baseFormeAbility === out.ability) {
      out.abilityNote += ` (Here the two happen to match — that is a coincidence for this species, not a rule that Megas keep their base ability.)`;
    }
  } else {
    out.abilityNote =
      'Non-Mega Pokemon legally have 2-3 abilities (two regular slots plus a hidden ability). This field is the single option the vendored dex surfaces, NOT proof it is the only one or the one a given real set runs. Check the actual preset or live usage data for the specific role being built.';
  }

  if (entry.formes) out.formes = entry.formes;
  return out;
}

function move(name) {
  const v = getVendor();
  const entry = v.MOVES_CHAMPIONS[name];
  if (!entry) {
    if (v.MOVES_ZA_NATDEX && v.MOVES_ZA_NATDEX[name]) {
      throw new Error(`"${name}" exists in the broader move dex but not in the Champions-curated move list — it may not be usable in Champions, or the vendored list may be lagging. Verify via live search.`);
    }
    throw new Error(`Unknown move: "${name}" — not found in any vendored dex. Check spelling.`);
  }
  const out = Object.assign({ name }, entry);
  // MOVES_CHAMPIONS does not reliably flag priority: confirmed present for
  // Sucker Punch but absent for Follow Me, which genuinely has +2. Absence is
  // not evidence, and a caller deciding whether a redirector needs Speed
  // investment must not read it as such.
  if (!('isPriority' in entry)) {
    out.priorityUnknown = true;
    out.priorityNote = 'No isPriority flag in the vendored data. That is NOT proof this move has normal priority — the vendored table is known to omit it for real priority moves (e.g. Follow Me, +2). Cross-check a live source if priority decides something.';
  }
  return out;
}

function legal(kind, name) {
  const v = getVendor();
  if (kind === 'item') {
    return {
      kind, name,
      championsLegal: v.ITEMS_CHAMPIONS.includes(name),
      note: 'Champions ships a curated item pool that grows per regulation. A false here means genuinely unavailable now, not merely missing from vendored data — but re-verify against the current regulation if the vendored snapshot is old.',
    };
  }
  if (kind === 'ability') {
    return {
      kind, name,
      championsLegal: v.ABILITIES_CHAMPIONS.includes(name),
    };
  }
  throw new Error(`legal: kind must be "item" or "ability", got "${kind}"`);
}

// Showdown keys everything by a lowercase-alphanumeric id: "Will-O-Wisp"
// becomes "willowisp", "U-turn" becomes "uturn".
function toId(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// A table entry only counts as a hit if it actually carries a usable
// `.learnset` object. The vendored table contains bare placeholder entries —
// `{}` with no `.learnset` key at all — for at least 5 ids (vivillonfancy,
// vivillonpokeball, gourgeistsuper, polteageistantique, sinistchamasterpiece).
// `{}` is truthy, so a plain `learnsets[id]` truthiness check treats those as
// hits and `learnset()` then crashes on `Object.keys(undefined)`. One of the
// five — gourgeistsuper — is a real, currently Champions-legal roster
// species, so this is not a theoretical edge case.
function hasUsableLearnset(learnsets, id) {
  return Boolean(learnsets[id] && learnsets[id].learnset);
}

// Map a roster display name onto its learnset key.
//
// This walks the vendored `formes` data rather than stripping a "Mega "
// prefix, because prefix-stripping is silently wrong for at least one real
// species: Mega Floette's base is Floette-Eternal, and no species called
// "Floette" exists on the roster. Verified against the full roster — all 315
// entries resolve (231 direct, 75 via mega-base, 9 via forme-shares-base).
function resolveLearnsetId(v, species) {
  const learnsets = getLearnsets();

  // A Mega has no learnset of its own; it uses its base form's.
  const base = isMegaForme(species) ? (baseFormeOf(v, species) || species) : species;
  if (hasUsableLearnset(learnsets, toId(base))) return toId(base);

  // Cosmetic and battle formes (Gourgeist-Small, Palafin-Hero) share the
  // base species' entry. This same guard is what makes Gourgeist-Super
  // resolve here (to "gourgeist") instead of stopping at the empty
  // "gourgeistsuper" placeholder above.
  const stem = base.split('-')[0];
  if (hasUsableLearnset(learnsets, toId(stem))) return toId(stem);

  return null;
}

// learnset(species) -> the full legal move list
// learnset(species, move) -> a legality verdict for that one move
//
// Three verdicts, never two. A species missing from the vendored table is
// "unknown" and must never be reported as "illegal": absence proves nothing,
// the same discipline this file already applies to isPriority in move().
function learnset(species, moveName) {
  const v = getVendor();
  const learnsets = getLearnsets();
  const id = resolveLearnsetId(v, species);

  if (!id) {
    const out = {
      species,
      resolvedId: null,
      verdict: 'unknown',
      moveCount: null,
      note:
        `"${species}" is not in the vendored Champions learnset table. This is NOT evidence the move is illegal — ` +
        'it means this species is uncovered here (a roster addition the learnset vendor has not caught up to, or a ' +
        'naming mismatch). Verify live before ruling anything out, and check whether tools/dex/VENDOR_MANIFEST.md ' +
        'needs re-vendoring.',
    };
    if (moveName !== undefined) out.move = moveName;
    return out;
  }

  const moves = Object.keys(learnsets[id].learnset);

  if (moveName === undefined) {
    return {
      species,
      resolvedId: id,
      moveCount: moves.length,
      moves: moves.sort(),
      note: 'Legality only. Every upstream source tag is "9M" — this data carries no level-up/TM/egg distinction.',
    };
  }

  const known = moves.includes(toId(moveName));
  return {
    species,
    resolvedId: id,
    move: moveName,
    verdict: known ? 'legal' : 'illegal',
    moveCount: moves.length,
    note: known
      ? 'Legality only — this says the move is in the pool, not that it is worth running.'
      : `${species} cannot learn ${moveName} in Champions. Do not build a role around it.`,
  };
}

module.exports = { TYPES, canonicalType, typeEffectiveness, mon, move, legal, isMegaForme, learnset, resolveLearnsetId, toId };
