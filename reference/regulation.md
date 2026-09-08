# Current Regulation — Pokémon Champions VGC

<!-- MACHINE-READABLE BLOCK — parsed by .claude/hooks/regulation-phase.js and
     tools/dex (team validation). Keep all five stamps, one per line, exactly
     this wording; dates ISO. `Regulation` is the id team files must match.
     `Pikalytics slug` is the CURRENT format slug for live usage lookups — it
     is NOT derivable from the regulation id (M-B ranked is
     "battledataregmbs3", M-A was "gen9championsvgc2026regma" — different
     naming schemes entirely), and a previous regulation's slug keeps serving
     complete, correctly-labelled data forever. Re-check it live and update it
     here at every rollover, and whenever the season number increments. -->

**Regulation: M-B**
**Regulation starts: 2026-06-17**
**Regulation ends: 2026-09-09**
**Last verified: 2026-09-07**
**Pikalytics slug: battledataregmbs3**

This file covers **only the current cycle** and is replaced wholesale at each
transition — see the `vgc-regulation-transition` skill. Rules that hold across
regulations (Stat Points system, platform context, roster-vs-legality
discipline, what the local data covers) live in
`reference/champions-format.md`. Past cycles are archived under
`reference/regulations/`.

Regulations turn over every one to three months. A transition is a scheduled
event with a defined workflow, not an emergency.

## Contents

- [Active regulation](#active-regulation)
- [Active mechanics](#active-mechanics)
- [Unverified mechanics — do not build around these yet](#unverified-mechanics--do-not-build-around-these-yet)
- [Incoming regulation](#incoming-regulation)
- [Usage snapshot](#usage-snapshot)
- [Sources](#sources)
- [Changelog](#changelog)

## Active regulation

- **Regulation Set M-B**, 17 June 2026 – 8/9 September 2026. M-C replaces it
  starting Tuesday 8 September 2026, 7:00pm PDT in North America (9 September
  in EU/JP/AU due to timezones).
- Prior regulation was M-A (ended 17 June 2026) — see
  `reference/regulations/`.

## Active mechanics

- **Mega Evolution is the only active competitive mechanic.** All Mega
  Evolutions legal in M-A remain legal, plus 16 new ones added for M-B (e.g.
  Mega Sceptile, Mega Blaziken, Mega Swampert, Mega Mawile, Mega Staraptor).
- **Terastallization exists in the game files but is NOT active.** Do not
  recommend Tera game plans — see `reference/pitfalls.md` for the correction
  history on this point.
- **Dynamax and Z-Moves are not active.** Both have been teased for possible
  future regulations, not confirmed.

## Unverified mechanics — do not build around these yet

Each regulation tends to introduce a mechanic before its exact ruleset is
publicly pinned down. Anything listed here is **known to exist but not
verified enough to build on**. Resolve it with a live lookup and move it into
"Active mechanics" with the answer, or drop it — don't leave a build
depending on an entry that is still here.

| Mechanic | Open question | Blocks |
|---|---|---|
| Z Mega Evolution (M-C) | Is it one per team? Does it stack with a regular Mega on the same team? Is it a successor to specific existing Megas? | Any team using Mega Absol Z, Mega Lucario Z, or Mega Garchomp Z |

## Incoming regulation

Regulation **M-C**, launching 8/9 September 2026, running through **2 December
2026** (~5:59pm PST).

- **24 new battle-eligible Pokémon**, including **Rillaboom**, Baxcalibur,
  Salamence, and Golisopod. Rillaboom is not a permanent roster exclusion —
  it launches with M-C, so "not in the game yet" stops being true on that date.
- **6 new Mega Evolutions**, in two groups:
  - **3 "Z Mega Evolutions"** (reworks of existing Megas): Mega Absol Z
    (Dark/Ghost, Sharpness — slicing moves +50% power), Mega Lucario Z
    (Fighting/Steel, Aura Guard — halves contact-move damage), Mega Garchomp Z
    (Dragon, Levitate — immune to Ground moves and hazards). Mega Heatran has
    been teased for a future update but was not detailed as of this check.
  - **3 brand-new-species Megas**, ported from Pokémon Legends: Z-A's Mega
    Dimension DLC: **Mega Baxcalibur** (Dragon/Ice, BST 700, Atk 175 —
    highest-Attack Mega in this batch; abilities Thermal Exchange / Ice Body,
    not confirmed whether Mega-fixed or inherited), **Mega Golisopod**,
    **Mega Salamence**.
- **"Z Mega Evolution" is a distinct mechanic name** — not Z-Moves (still not
  active) and not plain Mega Evolution. Its ruleset is unverified; see the
  table above.

**The local vendored data does not yet include any of this.** Confirmed by
direct inspection: none of Rillaboom, Baxcalibur, Salamence, Golisopod or the
Z Megas exist in `POKEDEX_CHAMPIONS` (they appear only in the broader
non-Champions dexes, which are never used for results). Re-vendoring is a
required step of the transition workflow.

## Live usage data — the format slug

Current slug: **`battledataregmbs3`** (also in the stamp block above).
URL pattern: `https://www.pikalytics.com/pokedex/{slug}/{Pokemon}`

**The slug is not derivable and a stale one does not fail loudly.** Two
things make this dangerous rather than merely annoying:

1. **Naming is inconsistent across regulations.** M-B ranked is
   `battledataregmbs3`; M-A was `gen9championsvgc2026regma`. You cannot
   compute the next one — it has to be read off
   `https://www.pikalytics.com/pokedex`.
2. **An old regulation's slug keeps working indefinitely, serving complete
   normal-looking data.** Verified 2026-09-07: the M-A page still returns full
   usage for Garchomp (Earthquake 90.8%) alongside M-B's live page
   (Earthquake 80.7%). Nothing about the stale page looks wrong except its
   own format label. A nonexistent slug 404s, which is safe; a *previous
   regulation's* slug is the trap.

**So always verify the returned page's own format label names the regulation
you are actually in** before using any number off it. That check costs
nothing, needs no tooling, and works even when this stamp is out of date.

## Usage snapshot

Not pulled this session — re-check Pikalytics directly via the
`vgc-meta-lookup` skill.

Note that M-C's first weeks will have thin, volatile data by definition. That
is a normal phase of every cycle, not a data problem to work around — the
meta-lookup skill's "early in a regulation" section covers what to do instead.

## Sources

- https://victoryroad.pro/champions-regulations/
- https://www.pokemon.com/us/pokemon-news/regulation-set-m-b-kicks-off-a-new-ranked-battles-season-and-battle-pass-in-pokemon-champions
- https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions
- https://pokemon-zone.com/champions/regulations/m-c/

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-08 | Corrected the turnover cadence from "roughly every 3-4 months" to "every one to three months". The handbook states regulation sets "may last between one and three months"; the repo's figure was never sourced and overshot every actual cycle (M-B ran ~2.7 months, M-C runs ~2.8). Same correction applied in `CLAUDE.md`, `README.md` and the `vgc-regulation-transition` skill | Play! Pokémon VGC Tournament Handbook rev. 2026-09-01, §2.1.1 Regulation Sets in Pokémon Champions |
| 2026-09-07 | Restructured for rollover: added the four-stamp machine-readable block (`Regulation`/`starts`/`ends`/`Last verified`) that the phase hook and team validator read; moved the format-invariant sections (platform context, Stat Points, roster-vs-legality) to `reference/champions-format.md`; added an "Unverified mechanics" gate; renamed the M-C section to "Incoming regulation" as a standing slot rather than a one-off; archived prior history under `reference/regulations/`. Also recorded that the vendored data does not yet contain M-C's roster | docs/specs/2026-09-07-workflow-audit.md; direct inspection of `POKEDEX_CHAMPIONS` this session |

Earlier changelog history for this file — including the M-A→M-B transition
and the original M-C research pass — is preserved in
`reference/regulations/m-b.md`.
| 2026-09-07 | Added the `**Pikalytics slug:**` stamp and a "Live usage data — the format slug" section after confirming the slug is neither derivable nor fail-safe: M-B ranked is `battledataregmbs3` while M-A was `gen9championsvgc2026regma` (different naming schemes), and M-A's page still serves complete, normal-looking usage data (Garchomp Earthquake 90.8% vs M-B's 80.7%) rather than 404ing. A stale slug therefore yields authoritative-looking wrong-regulation numbers | Live fetches of pikalytics.com/pokedex, /pokedex/battledataregmbs3/Garchomp, /pokedex/gen9championsvgc2026regma/Garchomp and a 404 check on /pokedex/battledataregmbs1/Garchomp, this session |
