# Current Regulation — Pokémon Champions VGC

**Last verified: 2026-09-07**
**Regulation ends: 2026-09-09**

<!-- The two stamps above are parsed by .claude/hooks/check_regulation_staleness.sh.
     Keep both in ISO YYYY-MM-DD form on their own lines. `Regulation ends` restates
     the currently-active regulation's last day from the prose below; when a
     regulation rolls over, update this stamp in the same edit. -->

This is the single most volatile fact set in this repo. Before relying on
anything below, re-check it if it's been more than a couple of weeks since
"Last verified," or if the regulation's end date (below) has passed.

## Contents

- [Active regulation](#active-regulation)
- [Regulation M-C — new roster and mechanics (launching 8/9 Sept 2026)](#regulation-m-c-new-roster-and-mechanics-launching-89-sept-2026)
- [Active mechanics](#active-mechanics)
- [Platform / version context](#platform-version-context)
- [Stat system: Stat Points (SP), not EVs/IVs](#stat-system-stat-points-sp-not-evsivs)
- [Roster vs. legality — two separate checks](#roster-vs-legality-two-separate-checks)
- [Usage snapshot](#usage-snapshot)
- [Sources](#sources)
- [Changelog](#changelog)

## Active regulation

- **Regulation Set M-B is ending imminently.** M-B runs **17 June 2026 –
  8/9 September 2026** — **Regulation Set M-C replaces it starting Tuesday
  8 September 2026, 7:00pm PDT in North America (9 September in EU/JP/AU
  due to timezones)**, running through **2 December 2026 (~5:59pm PST)**.
  As of this file's last-verified date, M-C has not yet gone live — treat
  anything below tagged M-C as imminent-but-not-yet-active if you're
  reading this before that switchover.
- Prior regulation was M-A (ended 17 June 2026)

## Regulation M-C — new roster and mechanics (launching 8/9 Sept 2026)

- **24 new battle-eligible Pokémon**, including **Rillaboom**, Baxcalibur,
  Salamence, and Golisopod. **Rillaboom is not a permanent roster
  exclusion — it launches with M-C**, so don't treat "not in the game yet"
  as a durable fact past this date.
- **6 new Mega Evolutions total**, in two groups:
  - **3 new "Z Mega Evolutions"** (reworks of existing Megas): Mega Absol Z
    (Dark/Ghost, ability Sharpness — slicing moves +50% power), Mega
    Lucario Z (Fighting/Steel, ability Aura Guard — halves damage from
    contact moves), Mega Garchomp Z (Dragon, ability Levitate — immune to
    Ground moves and hazards). Mega Heatran has also been teased for a
    future update but wasn't detailed as of this check.
  - **3 brand-new-species Megas**, ported from Pokémon Legends: Z-A's Mega
    Dimension DLC: **Mega Baxcalibur** (Dragon/Ice, BST 700, Atk 175 —
    highest-Attack Mega in this batch; abilities Thermal Exchange / Ice
    Body, not yet confirmed whether Mega-fixed or inherited from pre-Mega
    choice), **Mega Golisopod**, **Mega Salamence**.
- **"Z Mega Evolution" is a new, distinct mechanic name** — do not confuse
  with Z-Moves (still not active) or existing plain Mega Evolution. Verify
  its exact ruleset (one per team? stacks with a regular Mega on the same
  team? successor to specific existing Megas?) before relying on it in a
  build — not confirmed in this pass.
- Day-one M-C usage data will be thin/volatile for anything below; treat
  Rillaboom stats pulled before the switchover (e.g. from preview-format or
  pre-M-C tournaments) as provisional, not settled meta.

## Active mechanics

- **Mega Evolution is the only active competitive mechanic** through the
  end of M-B. All Mega Evolutions legal in M-A remain legal, plus 16 new
  Mega Evolutions added for M-B (e.g. Mega Sceptile, Mega Blaziken, Mega
  Swampert, Mega Mawile, Mega Staraptor). M-C adds the 3 Z Mega Evolutions
  above on top of this.
- **Terastallization exists in the game files but is NOT active** in this
  regulation. Do not recommend Tera strategy for current-format teams — see
  `pitfalls.md` for the correction history on this point.
- **Dynamax and Z-Moves are not active.** Both have been teased for
  possible future regulations, not confirmed.

## Platform / version context

- Pokémon Champions replaced Scarlet/Violet as the official VGC platform
  starting **8 April 2026** (Nintendo Switch / Switch 2).
- iOS and Android versions launched **17 June 2026**, same day M-B began.
  Switch save data carries over via linked Nintendo Account.
- This is a full platform change, not a patch — older Scarlet/Violet-era
  Smogon/VGC content may not reflect current mechanics, roster, or balance.

## Stat system: Stat Points (SP), not EVs/IVs

Pokémon Champions replaced the classic EV/IV system entirely — this is a
structural change, not a rebalance, and it's easy to default to old
Scarlet/Violet-era EV terminology without noticing it no longer applies.

- **IVs are gone.** Every Pokémon is automatically treated as having
  perfect 31 IVs in every stat (including via Pokémon HOME transfers).
- **EVs are replaced by Stat Points (SP).** 66 SP total per Pokémon, spent
  freely across the six stats, with a hard cap of 32 SP in any single
  stat. Each SP costs 5 VP to assign (330 VP to max a single stat from
  scratch).
- **SP-to-stat conversion is 1:1** (not 1 point per 4, like old EVs) —
  each SP assigned adds exactly +1 to that stat at Level 50.
- **Natures are renamed "Stat Alignments"** but work the same way (~10%
  boost to one stat, ~10% cut to another). 21 options exist (down from
  25); "Serious" is the only neutral one.
- **All Champions battles are Level 50.**

**Stat formula (Level 50, Champions SP system):**
- Non-HP: `floor((floor(((2 × Base + 31) × 50) / 100) + 5 + SP) × Alignment modifier)`
- HP: `floor(((2 × Base + 31) × 50) / 100) + 50 + 10 + SP`

Old EV numbers from Smogon/SV-era sets do NOT map 1:1 onto SP — don't
assume "252 EVs" means "32 SP" or try to convert by formula; work from a
set's actual current SP allocation instead. See
`pitfalls.md`'s "Build assumption trap" for the pitfall this
causes.

## Roster vs. legality — two separate checks

Champions' available roster is a **subset** of the full historical Pokédex,
not the complete National Dex, and it grows via periodic updates. Being
"unrestricted" in a regulation's rules does not mean a Pokémon is actually
available in Champions yet. Before recommending any Pokémon:

1. Does it exist in Champions' roster at all (check current roster list)?
2. If yes, is it legal under the *current* regulation's specific rules
   (not banned/restricted this regulation)?

Both checks are required — skipping either produces a wrong recommendation.

**This applies to items and abilities too, not just Pokémon.** Champions
launched with a deliberately curated, restricted item pool — confirmed this
session that several historically-standard competitive items (Choice Band,
Choice Specs, Assault Vest, Safety Goggles, Covert Cloak, Clear Amulet,
Loaded Dice, Power Herb) are genuinely NOT available right now, not just
missing from a reference source. The pool grows via regulation updates the
same way the Pokémon roster does — Life Orb, for example, was added
specifically in the Regulation M-B item-pool expansion after being
unavailable in M-A. Before assuming an item or ability is usable:

1. Does it exist in Champions' current item/ability pool at all?
2. Don't assume "this was a staple in Scarlet/Violet" or "this is common in
   general Pokémon knowledge" means it's available now — verify per-regulation,
   the same discipline as roster checks above.

`tools/damage-calc/cli.js` (see `damage-calc.md`) surfaces this
automatically via `itemChampionsLegal`/`abilityChampionsLegal` flags on its
output, backed by the same vendored data this file's roster checks rely on
— but that vendored data itself needs the same "re-verify, don't assume
it's still current" discipline as everything else in this file.

## Usage snapshot

Usage snapshot not pulled this session — re-check Pikalytics directly. A
live WebSearch for `Pikalytics Pokemon Champions VGC regulation M-B usage
stats July 2026` was attempted on 2026-07-09 but returned no search results
(session search limit reached), so no usage list is recorded here rather
than risk inventing numbers.

This list decays fast — re-pull from Pikalytics before leaning on it for a
specific recommendation, especially more than a few weeks after the date
above.

## Sources

- https://victoryroad.pro/champions-regulations/
- https://www.pokemon.com/us/pokemon-news/regulation-set-m-b-kicks-off-a-new-ranked-battles-season-and-battle-pass-in-pokemon-champions
- https://bulbagarden.net/threads/pokemon-champions-launches-new-ruleset-for-competitive-vgc-regulation-set-m-a-runs-until-june-17th-2026.310333/
- https://www.pokemon.com/us/pokemon-news/pokemon-champions-comes-to-android-and-ios-on-june-17

## Changelog

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
