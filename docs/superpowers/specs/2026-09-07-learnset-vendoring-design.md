# Design: Vendored Champions learnsets

**Date:** 2026-09-07
**Status:** Approved, pending implementation plan

## Problem

There is no move-legality data in this repo. `POKEDEX_CHAMPIONS` entries carry
only `t1/t2/bs/w/ab/formes`, so nothing local can answer "can this Pokémon
learn this move?" Every other stable fact in this repo has a command that
makes the correct answer cheaper than the remembered one; learnsets are the
one load-bearing fact still answered by recall or an ad-hoc web fetch.

This gap caused the worst failure in the repo's history: an entire team
premise built on Mega Altaria running Calm Mind, a move it cannot learn,
unnoticed until a final audit (`reference/pitfalls.md`, 2026-07-14).

## Source

`smogon/pokemon-showdown` → `data/mods/champions/learnsets.ts` (MIT).

Selected after probing four candidates:

| Candidate | Verdict |
|---|---|
| **PS `mods/champions/learnsets.ts`** | **Selected.** Complete, pinnable, MIT, actively maintained |
| PokéAPI `champions` version group (id 32) | Independent cross-check only — no bulk pinnable dump, one HTTP call per species, partially unpopulated metadata |
| NCP-VGC-Damage-Calculator (existing vendor) | No learnset data at all. Its setdexes are curated sets, not legality |
| Bulbapedia / Serebii | HTML only; superseded |

Evidence gathered at design time:

- **Coverage is complete.** 237 species entries vs. our 240 non-Mega roster
  entries. Every apparent gap is a forme that correctly shares its base
  form's learnset. Megas correctly have no separate entry.
- **It is genuinely Champions data, not mainline relabelled.** Incineroar
  here has no Knock Off and no U-turn, both of which it has in SV — matching
  the same curation that produced Champions' restricted item pool.
- **Independently cross-validated.** PokéAPI's `champions` version group
  agrees exactly on all three spot checks — Altaria 65/65 moves, Torkoal
  57/57, Incineroar 77/77, `calm-mind` absent from Altaria in both.
- **Maintained.** Implemented 2026-04-11 (Champions launched 04-08);
  learnsets extended 2026-06-17; last fix 2026-07-09.

## Key finding: learnsets are regulation-variant

An earlier draft of this design claimed learnsets were regulation-invariant,
reasoning from `championsregma` having no `learnsets.ts`. That was wrong, and
it is the single most important correction in this document.

On 2026-06-17 — the exact M-B start date — `learnsets.ts` changed by
**+2019/-353 lines**. Two consequences:

1. Regulations add species *and cut existing move pools*. A stale pin can
   therefore report a move as **legal that the current regulation removed** —
   a false positive on legality, the worst failure direction here.
2. The base mod is updated **in place**; there is no per-regulation copy of
   the file. A stale pin serves complete, normal-looking, wrong data rather
   than failing.

Point 2 is the same hazard the `vgc-regulation-transition` skill already
documents for the Pikalytics format slug (step 5b: "the old slug will keep
returning complete, normal-looking data from the previous regulation rather
than failing"). This design mirrors that treatment rather than inventing new
framing.

**Design consequence:** the vendor pin records the regulation it was taken
for, and that pin is the correctness boundary. Pinned regulation == active
regulation means the data is trusted.

On a mismatch, **the hook reports and the tool does not change its verdicts.**
`dex learnset` keeps returning `legal`/`illegal` rather than downgrading
everything to `unknown`. This is deliberate: the selected trust level is
"authoritative, absence = unknown", not "stale-gated" (user decision,
2026-09-07). Auto-downgrading would make a stale pin indistinguishable from
an uncovered species and would silently disable enforcement in `dex team` at
exactly the moment — a rollover — when team rebuilding peaks. Surfacing the
mismatch loudly and leaving the verdicts intact keeps the failure visible
rather than converting it into a quiet no-op.

Per-move diffing against upstream was considered and **explicitly rejected**
(user decision, 2026-09-07): move pools are not expected to change outside a
regulation boundary, so the regulation pin already covers it. Do not add
per-move auditing without new evidence that mid-regulation changes occur.

## Architecture

### 1. Vendor

New `tools/dex/vendor/learnsets.js`, with its own
`tools/dex/VENDOR_MANIFEST.md` — deliberately separate from
`tools/damage-calc/VENDOR_MANIFEST.md`.

Rationale: different upstream, and — the operative reason — the two vendors
go stale **independently**. One manifest per upstream lets the staleness hook
report them separately instead of conflating "roster is current" with "move
pools are current".

The transform is a single line, matching the existing `side.js` "verbatim
extract + wrapper" precedent already documented in the NCP manifest:

```
export const Learnsets: import('...').ModdedLearnsetDataTable =
    ->  var CHAMPIONS_LEARNSETS =
```

Everything after line 1 is byte-for-byte upstream. Verified to load in ~14ms
through the existing `vm` sandbox pattern.

The manifest records **SHA + the regulation the pin was taken for**. The
second field is what makes staleness answerable and is not optional.

### 2. Query layer

`tools/dex/dex.js` gains `learnset(species, move?)`, exposed via `cli.js`:

```bash
node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"
node tools/dex/cli.js learnset "Incineroar"
```

**Species resolution is data-driven, not string-driven.** It walks the
vendored `formes` array to map a Mega back to its base — the mirror of
`team.js:resolveBattleForme`, which already maps base → Mega via stone.

This matters: the naive "strip the `Mega ` prefix" approach was tested and
silently fails on **Mega Floette**, whose base is `Floette-Eternal`; there is
no plain "Floette" on the roster. The formes-driven resolver was verified
against the full roster and resolves **315/315** entries — 231 direct, 75
mega-base, 9 forme-shares-base, 0 unresolved.

Three verdicts, never collapsed into two:

| Verdict | Condition | Meaning |
|---|---|---|
| `legal` | species in table, move listed | hard answer |
| `illegal` | species in table, move absent | hard answer |
| `unknown` | species absent from table | verify live — **never** reported as illegal |

The `unknown` verdict follows the repo's existing "absence proves nothing"
discipline, already applied to `isPriority` in
`reference/champions-format.md`.

### 3. Enforcement

`tools/dex/team.js` gains a per-row move-legality check. `illegal` -> error.
`unknown` -> warning naming the species.

Its `notChecked` array — currently hardcoded to
`'move legality (learnsets are not in the vendored data — verify live)'` — is
replaced by a computed list containing only species that actually returned
`unknown`. A clean result then genuinely means moves were checked, which it
does not today.

The module's scope-fence comment ("It deliberately does NOT check move
legality") must be updated in the same change; leaving it would make the file
lie about itself.

### 4. Regulation-awareness

- **`.claude/hooks/vendor-staleness.js`** extends to the learnset pin and
  fires on two independent conditions: SHA behind upstream, **and** pinned
  regulation != active regulation in `reference/regulation.md`. It preserves
  the hook's existing discipline that every failure path reports rather than
  exiting quietly — a silent exit is indistinguishable from "current".
- **Cross-vendor invariant test** (new), following the
  `type-chart-invariant.test.js` precedent: any `POKEDEX_CHAMPIONS` species
  resolving to `unknown` fails the suite. This is the automatic detector for
  "the roster was re-vendored and the learnsets were not", turning silent
  drift into a named failure. It is what makes `unknown` safe rather than a
  silent shrug.
- **`vgc-regulation-transition`** gains re-vendoring learnsets as a required,
  gated step (new step 5c, immediately after the roster re-vendor at 5 and
  the Pikalytics slug at 5b).

## Testing

New `tools/dex/tests/learnset.test.js`:

- **Regression:** `Mega Altaria` + `Calm Mind` -> `illegal`. This is the
  documented worst failure in the repo's history and is pinned permanently.
- **Resolver:** `Mega Floette` -> `floetteeternal` via `formes` (the case that
  breaks naive string-stripping); `Mega Charizard Y` -> `charizard`;
  `Gourgeist-Small` -> `gourgeist`.
- **Absence:** an unknown species returns `unknown`, and asserts it never
  returns `illegal`.

New `tools/dex/tests/learnset-coverage-invariant.test.js` — the cross-vendor
test described in §4.

`package.json`'s test script already globs `tools/dex/tests/*.test.js`, so no
change is needed there.

## Documentation

| File | Change |
|---|---|
| `CLAUDE.md` | New row in the "Never state these from recall" table for `dex learnset`. **Replace** the "Learnsets are NOT in the local data — verify them live" section with the tool plus its `unknown`/staleness caveats. Keep the Mega Altaria warning, reframed as now tool-caught. |
| `reference/champions-format.md` | Move learnsets from "It does NOT cover" to "It covers". Add the regulation-variant caveat and absence-is-unknown rule. Changelog row. |
| `reference/pitfalls.md` | Point the existing learnset pitfall at the tool. **Add** a pitfall for "a stale learnset pin serves plausible wrong data", cross-referenced to the Pikalytics wrong-regulation entry it rhymes with. Changelog row. |
| `reference/team-refining.md` | Step 1 "Legality" (line ~63) -> use the command. |
| `docs/case-studies.md` | Mega Altaria case gains a resolution note: now caught automatically, with the command. |
| `README.md` | Add `learnset` to the `tools/dex/` command block (lines 40-46); note the second vendor under Maintenance notes. |
| `.claude/skills/vgc-team-building/SKILL.md` | Step 4b (lines 52-57) and the "Common mistakes" bullet (lines 99-100) — both currently assert learnsets are not in local data. |
| `.claude/skills/vgc-team-audit/SKILL.md` | Step 1 (lines 41-42) — same assertion. |
| `.claude/skills/vgc-regulation-transition/SKILL.md` | New required step 5c. |

`.claude/skills/vgc-team-refining/SKILL.md` contains no learnset assertion and
needs no change; the corresponding text lives in `reference/team-refining.md`.

## Scope fence

- This answers **legality only**. Every move-source tag in the upstream data
  is `9M`; it carries no level-up / TM / egg distinction. Do not extend this
  to breeding or acquisition questions — the data cannot support them.
- Meta-dependent facts (usage, common sets) remain out of scope, per
  `dex.js`'s existing scope fence.

## Sequencing

Built now, with regulation-awareness included, rather than deferred to the
2026-09-09 M-B rollover (user decision, 2026-09-07). The rollover two days
later becomes the first live exercise of the machinery: the hook fires, the
new transition step runs, the pin is updated, and the invariant test confirms
roster coverage.
