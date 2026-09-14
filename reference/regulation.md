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
     every rollover, and whenever the season number increments.

     DATE CONVENTION — `Regulation starts`/`Regulation ends` record the UTC
     DATE of the official start/end instant, not a local-timezone date. The
     real cutover happens at a specific PDT/PST instant that does not line up
     with a UTC midnight: M-C's start ("Tuesday 8 September 2026, 7:00pm
     PDT") lands at 02:00 UTC on the 9th, and its end ("Tuesday 1 December
     2026, 5:59pm PST") lands at 01:59 UTC on the 2nd — both stamped as the
     UTC date the instant falls on (2026-09-09 / 2026-12-02), not the North
     American calendar date the announcement uses. `formats.regulationHasEnded`
     and the phase hook's ENDED branch both compare using >= against
     `Regulation ends`, deliberately: the regulation is treated as over for
     its ENTIRE stamped end date, not just the day after it, because that
     date is already (UTC) past the actual cutover instant. Every future
     stamp MUST follow this same UTC-date convention or that >= comparison
     will be off by a day. -->

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
  - **3 "Z Megas"** — alternate Mega formes for species that already had a
    Mega, introduced via Pokémon Legends: Z-A. "Z Mega" is a naming
    convention, not a distinct mechanic: it is a Mega Evolution exactly like
    any other, the same way Mega Charizard X and Mega Charizard Y are both
    just Mega Charizard. It uses a Mega Stone, it counts against the
    one-Mega-per-battle limit the same as every other Mega, and registering
    a Z Mega's stone alongside a second, unrelated Mega Stone remains legal
    and standard — see `CLAUDE.md`'s point on the second Mega Stone as a
    bring-4 flex slot. The three: Mega Absol Z (Dark/Ghost, Sharpness —
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
- **Dynamax and Z-Moves are not active.** ("Z Mega" is a Mega-forme naming
  convention, unrelated to Z-Moves despite the shared word — see above.)
- **No restricted/banned list changes were found** for M-C on any source
  checked (pokemon.com, Victory Road, Pikalytics). Recorded as "none found
  as of this check", not as "none exists" — a later source could still
  surface one.
- **Expanded item pool for M-C:** Rocky Helmet, Air Balloon, Terrain Extender,
  and all four terrain Seeds (Electric, Grassy, Misty, Psychic) are now legal.
  Verified via `dex legal --item "<Item>"` against the M-C-re-vendored item
  pool on 2026-09-09.

## Unverified mechanics — do not build around these yet

Each regulation tends to introduce a mechanic before its exact ruleset is
publicly pinned down. Anything listed here is **known to exist but not
verified enough to build on**. Resolve it with a live lookup and move it into
"Active mechanics" with the answer, or drop it — don't leave a build
depending on an entry that is still here.

*(Empty as of 2026-09-10. Both entries opened at the M-C rollover have been
resolved: the new item pool, confirmed via `dex legal --item` against the
re-vendored M-C data; and "Z Mega Evolution", which turned out not to be a
mechanic at all — see Active mechanics.*

**An empty table means nothing is currently open, not that M-C is fully
understood.** The regulation is days old. This table only ever held the
mechanics someone thought to ask about — add a row the moment something new
surfaces, rather than reading the emptiness as a clean bill of health.)*

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
| 2026-09-09 | User correction of a repo inference (not new external information): "Z Mega" is a naming convention for an alternate Mega forme of a species that already had one — mechanically identical to a regular Mega, the same relationship as Mega Charizard X vs Y — not a distinct mechanic as the initial M-C rollover entry had assumed from the name alone. Removed the "Z Mega Evolution" row from Unverified mechanics (one-Mega-per-battle limit and dual-Mega-Stone registration both already apply to it, same as any Mega) and rewrote the Active mechanics prose to state this plainly. | User clarification this session |
| 2026-09-09 | Rolled over M-B → M-C: promoted the former "Incoming regulation" section into Active mechanics/regulation, updated all five machine-readable stamps (`Regulation`, starts, ends, `Last verified`, `Pikalytics slug`), replaced the M-A-vintage "Incoming regulation" section with a "Next regulation" section (nothing announced), added a new item-pool row to Unverified mechanics marked **[unresolved]** rather than [consensus] per `vgc-format.md`'s single-source rule, and recorded the first live M-C usage snapshot (Rillaboom #1 36.64%). M-B archived to `reference/regulations/m-b.md`. Vendored roster/learnset/item data was not yet refreshed at this point — `dex mon`/`dex legal` initially reported M-C-only species and items as absent or unknown | pokemon.com M-C launch page, victoryroad.pro/champions-regulations/, live read of pikalytics.com/ai/pokedex (slug + usage), this session |
| 2026-09-09 | Item pool verification complete: moved the new item row from Unverified mechanics to Active mechanics. Confirmed all seven items (Rocky Helmet, Air Balloon, Terrain Extender, Electric/Grassy/Misty/Psychic Seed) as legal via `dex legal --item` against the M-C-re-vendored pool. Vendored data is now pinned to M-C. Cleared the Unverified mechanics table. | `node tools/dex/cli.js legal --item` verification this session |

Earlier changelog history for this file — covering all of M-B's life,
including the M-A→M-B transition and the original M-C research pass — is
preserved in `reference/regulations/m-b.md`.
