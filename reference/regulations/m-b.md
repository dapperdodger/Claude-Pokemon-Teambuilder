# Regulation M-B (archive)

**Regulation: M-B** · 17 June 2026 – 9 September 2026 · superseded by M-C.

Archived when M-B ended. Kept so team files stamped `Regulation: M-B` stay
interpretable — a team's per-pick reasoning was true under *these* rules, not
today's. Do not treat anything here as current.

## What was active

- **Mega Evolution only.** All M-A Megas remained legal, plus 16 added for
  M-B (Mega Sceptile, Mega Blaziken, Mega Swampert, Mega Mawile, Mega
  Staraptor, and others).
- Terastallization present in game files but **not** active.
- Dynamax and Z-Moves **not** active.

## Full changelog carried over from `regulation.md`

These rows document how the file was verified and corrected over M-B's life,
including the M-A→M-B transition and the M-C research pass done just before
rollover. Retained as the audit trail for that period.

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file; verified M-B regulation dates, active-mechanics status (Mega only, no Tera/Dynamax/Z-Move), and platform launch dates via web search. Usage snapshot WebSearch attempted but returned no results (session limit) — left unfilled per fallback instructions | See Sources section above |
| 2026-07-09 | Added "Stat system" section — Champions replaced EVs/IVs with a Stat Points (SP) system entirely (66 total, 32/stat cap, no IVs, Nature renamed Stat Alignment). Caught while researching a speed-calc reference addition; existing repo content still used old "EV" terminology | champsdex.com EV/IV/Stats guide, genpkm.com, game8.co (cross-checked across sources, fetched this session) |
| 2026-07-10 | Extended "Roster vs. legality" to explicitly cover items/abilities — confirmed Choice Band/Choice Specs/Assault Vest and others are genuinely unavailable in Champions right now (not a data gap), and that the item pool grows via regulation updates (Life Orb added in M-B) the same way the Pokémon roster does. Caught building tools/damage-calc's itemChampionsLegal/abilityChampionsLegal flags | Victory Road VGC, cross-checked against vendored ITEMS_CHAMPIONS data (see tools/damage-calc/VENDOR_MANIFEST.md) |
| 2026-07-24 | Routine re-verification (session-start staleness flag, >14 days since last check) — confirmed M-B is still active, no regulation change | Live web search this session |
| 2026-08-19 | Routine re-verification (session-start staleness flag, >14 days since last check) — caught that M-B's end date was extended from 2 September to 9 September 2026 via an official update announced 5 August 2026; still Mega-only, no Tera/Dynamax/Z-Move | victoryroad.pro/champions-regulations/, serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml (cross-checked both) |
| 2026-09-07 | Routine re-verification, and caught mid-session that user's assumption "Rillaboom not in the game yet" was about to become stale — Regulation M-C launches 8/9 Sept 2026 (1-2 days after this check) and adds 24 new Pokémon including Rillaboom, plus 3 new "Z Mega Evolution" forms (Mega Absol Z, Mega Lucario Z, Mega Garchomp Z). Added dedicated M-C section | pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions, pokemon-zone.com/champions/regulations/m-c/, rotomlabs.net Z-Mega abilities article, nintendolife.com M-C Z Mega article (cross-checked) |
| 2026-09-07 | Same-session follow-up: caught that the initial M-C pass only recorded the 3 "Z Mega" reworks and missed the other 3 new-species Megas M-C also adds (Mega Baxcalibur, Mega Golisopod, Mega Salamence — ported from Pokémon Legends: Z-A's Mega Dimension DLC), which the "6 Mega Evolutions" count in the source material implied but wasn't broken out. Added while researching Mega Baxcalibur for a user's proposed team | Serebii.net (x.com/SerebiiNet/status/2095182431133274553), rotomlabs.net/article/baxcalibur-golisopod-salamence-megas-champions-m-c, gamerant.com Mega Golisopod/Baxcalibur article |
| 2026-09-07 | Added a machine-readable `**Regulation ends: YYYY-MM-DD**` stamp near the top. Format change only — the date restates M-B's last day already given in prose above. The staleness hook's end-date guard had been parsing an `Active dates:` string that a previous rewrite of this file removed, so it had been silently dead | This file's own "Active regulation" section; see docs/specs/2026-09-07-repo-reorganization.md |
| 2026-09-07 | Restructured for rollover: added the four-stamp machine-readable block (`Regulation`/`starts`/`ends`/`Last verified`) that the phase hook and team validator read; moved the format-invariant sections (platform context, Stat Points, roster-vs-legality) to `reference/champions-format.md`; added an "Unverified mechanics" gate; renamed the M-C section to "Incoming regulation" as a standing slot rather than a one-off; archived prior history under `reference/regulations/`. Also recorded that the vendored data does not yet contain M-C's roster | docs/specs/2026-09-07-workflow-audit.md; direct inspection of `POKEDEX_CHAMPIONS` this session |
| 2026-09-07 | Added the `**Pikalytics slug:**` stamp and a "Live usage data — the format slug" section after confirming the slug is neither derivable nor fail-safe: M-B ranked is `battledataregmbs3` while M-A was `gen9championsvgc2026regma` (different naming schemes), and M-A's page still serves complete, normal-looking usage data (Garchomp Earthquake 90.8% vs M-B's 80.7%) rather than 404ing. A stale slug therefore yields authoritative-looking wrong-regulation numbers | Live fetches of pikalytics.com/pokedex, /pokedex/battledataregmbs3/Garchomp, /pokedex/gen9championsvgc2026regma/Garchomp and a 404 check on /pokedex/battledataregmbs1/Garchomp, this session |
| 2026-09-08 | Corrected the turnover cadence from "roughly every 3-4 months" to "every one to three months". The handbook states regulation sets "may last between one and three months"; the repo's figure was never sourced and overshot every actual cycle (M-B ran ~2.7 months, M-C runs ~2.8). Same correction applied in `CLAUDE.md`, `README.md` and the `vgc-regulation-transition` skill | Play! Pokémon VGC Tournament Handbook rev. 2026-09-01, §2.1.1 Regulation Sets in Pokémon Champions |
| 2026-09-09 | M-B ended and was superseded by M-C. This file finalized as the closed archive for M-B's full life; `reference/regulation.md` rewritten wholesale for M-C per the `vgc-regulation-transition` skill (steps 2-4) | pokemon.com M-C launch page, victoryroad.pro/champions-regulations/, live pikalytics.com/ai/pokedex read, this session |
