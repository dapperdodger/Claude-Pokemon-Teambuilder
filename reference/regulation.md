# Current Regulation — Pokémon Champions VGC

<!-- MACHINE-READABLE BLOCK — parsed by .claude/hooks/regulation-phase.js and
     tools/dex (team validation). Keep all five stamps, one per line, exactly
     this wording; dates ISO. `Regulation` is the id team files must match.
     `Pikalytics slug` is the CURRENT format slug for live usage lookups — it
     is NOT derivable from the regulation id (M-B ranked was
     "battledataregmbs3", M-A was "gen9championsvgc2026regma", M-C is
     "gen9championsvgc2026regmc" — three different naming shapes across three
     regulations), and a previous regulation's slug keeps serving complete,
     correctly-labelled data forever. Re-check it live and update it here at
     every rollover, and whenever the season number increments. -->

**Regulation: M-C**
**Regulation starts: 2026-09-09**
**Regulation ends: 2026-12-02**
**Last verified: 2026-09-09**
**Pikalytics slug: gen9championsvgc2026regmc**

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
- [Unverified mechanics](#unverified-mechanics--do-not-build-around-these-yet)
- [Next regulation](#next-regulation)
- [Usage snapshot](#usage-snapshot)
- [Live usage data — the format slug](#live-usage-data--the-format-slug)
- [Sources](#sources)
- [Changelog](#changelog)

## Active regulation

- **Regulation Set M-C**, active from **Tuesday 8 September 2026, 7:00pm
  PDT** in North America (9 September in EU/JP/AU due to timezones — hence
  the ISO stamp above reads 2026-09-09) through **Tuesday 1 December 2026,
  5:59pm PST** (2026-12-02 UTC-equivalent, hence the `Regulation ends` stamp).
- Prior regulation was **M-B** (17 June 2026 – 9 September 2026) — see
  `reference/regulations/m-b.md`.

## Active mechanics

- **Mega Evolution is the only active competitive mechanic.** All Megas
  legal in M-A and M-B remain legal, plus **6 new Mega Evolutions** added for
  M-C, in two groups:
  - **3 "Z Mega Evolutions"** — reworks of existing Megas, not a new
    mechanic name for an old one: Mega Absol Z (Dark/Ghost, Sharpness —
    slicing moves +50% power), Mega Lucario Z (Fighting/Steel, Aura Guard —
    halves contact-move damage), Mega Garchomp Z (Dragon, Levitate — immune
    to Ground moves and hazards).
  - **3 brand-new-species Megas**, ported from Pokémon Legends: Z-A's Mega
    Dimension DLC: **Mega Baxcalibur** (Dragon/Ice, BST 700, Atk 175 —
    highest-Attack Mega in this batch; abilities Thermal Exchange / Ice Body,
    not confirmed whether Mega-fixed or inherited), **Mega Golisopod**,
    **Mega Salamence**.
- **24 new battle-eligible Pokémon** launch with M-C, including **Rillaboom**,
  Baxcalibur, Salamence, Golisopod, Cinderace, and Inteleon. Rillaboom's
  absence in M-A/M-B was never a permanent roster exclusion — it launches
  with M-C, so "not in the game yet" stops being true on this date.
- **Terastallization exists in the game files but is NOT active.** Do not
  recommend Tera game plans — see `reference/pitfalls.md` for the correction
  history on this point.
- **Dynamax and Z-Moves are not active.** ("Z Mega Evolution" is a distinct
  mechanic name from Z-Moves — see below.)
- **No restricted/banned list changes were found** for M-C on any source
  checked (pokemon.com, Victory Road, Pikalytics). Recorded as "none found
  as of this check", not as "none exists" — a later source could still
  surface one.

## Unverified mechanics — do not build around these yet

Each regulation tends to introduce a mechanic (or, this cycle, a new item
pool) before its exact ruleset is publicly pinned down. Anything listed here
is **known to exist but not verified enough to build on**. Resolve it with a
live lookup and move it into "Active mechanics" with the answer, or drop it —
don't leave a build depending on an entry that is still here.

| Mechanic | Open question | Blocks |
|---|---|---|
| Z Mega Evolution (Mega Absol Z, Mega Lucario Z, Mega Garchomp Z) | Does a Z Mega count against the one-Mega-per-battle limit the same as a regular Mega? Can one team register **both** a Z Mega and a separate regular Mega (i.e. is it a genuinely independent slot)? Does Mega Evolving into a Z Mega require a distinct held item from the Mega Stone it reworks, or the same one? The official pokemon.com M-C page names the three Z Megas and does not explain the mechanic at all | Any team that plans around bringing a Z Mega *and* a second regular Mega, or that assumes the Z Mega's held item |
| New item pool — Rocky Helmet, Air Balloon, Terrain Extender, and all four terrain Seeds (Electric/Grassy/Misty/Psychic) | **[unresolved]**, not [consensus] — only a single search summary reports these as added, and it is not corroborated by a second independent source (see `reference/vgc-format.md`'s confidence-marking rule: consensus requires *multiple independent* sources, and a repeated search summary is not a second source). pokemon.com's official M-C page does not mention items at all | Any set built around these items being legal. Settled definitively by `dex legal --item "<Item>"` once the item vendor is refreshed in the next transition stage — do not assume yes or no until then |

## Next regulation

Nothing about the regulation after M-C has been announced as of this check.
One unconfirmed tease surfaced during M-C research — **Mega Heatran** — but
it was not detailed on any source checked (no typing, ability, or timing),
so it is recorded here only as "mentioned, nothing to build on" and not
given its own table row. Re-check at the next transition.

## Usage snapshot

First live read under the new M-C slug (`gen9championsvgc2026regmc`), taken
this session from Pikalytics' own index at
`https://www.pikalytics.com/ai/pokedex` (page self-labels "Pokemon Champions
VGC 2026 Reg M-C"):

- **Rillaboom** — #1, 36.64% usage
- **Salamence** — #5
- **Golisopod** — #9
- **Indeedee-F** — #7

This is week-one data. Do **not** present it as a settled meta — see the
`vgc-meta-lookup` skill's "early in a regulation" section for how to reason
about a field this thin and volatile. It is recorded here only to show the
new roster is already seeing play, not as a usage tier list to build against.

## Live usage data — the format slug

Current slug: **`gen9championsvgc2026regmc`** (also in the stamp block
above). URL pattern: `https://www.pikalytics.com/pokedex/{slug}/{Pokemon}`.

**The slug is not derivable and a stale one does not fail loudly.** Naming
has now taken three different shapes across three regulations: M-A was
`gen9championsvgc2026regma`, M-B ranked was `battledataregmbs3`, M-C is back
to `gen9championsvgc2026regmc`. You cannot infer the next one from a pattern
— it has to be read off `https://www.pikalytics.com/ai/pokedex` (or
`/pokedex`) live, every time. An old regulation's slug keeps working
indefinitely and returns complete, normal-looking data — nothing about a
stale page looks wrong except its own format label.

**So always verify the returned page's own format label names the regulation
you are actually in** before using any number off it. That check costs
nothing, needs no tooling, and works even when this stamp is out of date.

## Sources

- https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions
- https://victoryroad.pro/champions-regulations/
- https://www.pikalytics.com/ai/pokedex (live slug + usage read, this session)
- https://pokemon-zone.com/champions/regulations/m-c/

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-09 | Rolled over M-B → M-C: promoted the former "Incoming regulation" section into Active mechanics/regulation, updated all five machine-readable stamps (`Regulation`, starts, ends, `Last verified`, `Pikalytics slug`), replaced the M-A-vintage "Incoming regulation" section with a "Next regulation" section (nothing announced), added a new item-pool row to Unverified mechanics marked **[unresolved]** rather than [consensus] per `vgc-format.md`'s single-source rule, and recorded the first live M-C usage snapshot (Rillaboom #1 36.64%). M-B archived to `reference/regulations/m-b.md`. Vendored roster/learnset/item data is **not yet refreshed** — that is the next transition stage, not this one; `dex mon`/`dex legal` will still report M-C-only species and items as absent or unknown until then | pokemon.com M-C launch page, victoryroad.pro/champions-regulations/, live read of pikalytics.com/ai/pokedex (slug + usage), this session |

Earlier changelog history for this file — covering all of M-B's life,
including the M-A→M-B transition and the original M-C research pass — is
preserved in `reference/regulations/m-b.md`.
