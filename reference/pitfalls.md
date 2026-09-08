# Common Pitfalls (VGC / Pokémon Champions)

Traps that have caused real mistakes in past sessions, or that are easy to
get wrong by default. **Run the checklist below before finalising any team
recommendation**; read the matching section only when a line applies.

The incidents behind these — what was claimed, what was true, how it was
caught — live in `docs/case-studies.md`, deliberately out of the hot path.

**What this file is not.** It records *failure modes*, not format rules. A
rule that belongs in someone's baseline knowledge should not live here, and
several did: the Item Clause, the fixed-at-registration rule and the
ladder/tournament split were all stored as war stories, so they were only
reachable by first recalling the mistake attached to them. That is backwards
— the questions they answer ("can I flex this item?", "does my opponent see
my stones?") get asked at the *start* of a conversation, when nothing is
triggering a read of this file. Those rules now live in
`reference/vgc-format.md` and are summarised in `CLAUDE.md`, which is loaded
every session. The sections below keep the incident and the correction, and
point at the rule rather than being its home.

**So when adding to this file, ask first whether the entry is a rule or a
mistake.** A rule goes in `vgc-format.md` (format), `mechanics.md` (battle
mechanics) or `regulation.md` (this cycle), with at most a pointer here.

## Contents

- [Quick checklist](#quick-checklist)
- [Data source pitfalls](#data-source-pitfalls)
- [Current-mechanic correction](#current-mechanic-correction)
- [Weather effects on move power](#weather-effects-on-move-power)
- [Doubles-specific traps](#doubles-specific-traps)
- [Ladder rules are not tournament rules](#ladder-rules-are-not-tournament-rules)
- [Build assumption trap](#build-assumption-trap)
- [Team-finalization checks](#team-finalization-checks)
- [Changelog](#changelog)

## Quick checklist

Scan this. Follow a link only where the answer isn't already obviously fine.

**Before trusting data**
- [ ] Threat list built from Pikalytics' *team-level* pages, not per-mon usage rank or a WebSearch summary → [Data source pitfalls](#data-source-pitfalls)
- [ ] Ladder usage is not tournament results — don't treat one as the other
- [ ] Ladder and tournament **rules** differ too, not just their data — Open Team Sheets are tournament-only → `vgc-format.md`, and [why this keeps happening](#ladder-rules-are-not-tournament-rules)
- [ ] Co-occurrence is a frequency signal, not proof of synergy
- [ ] An empty Pikalytics stats panel is a loading artifact, not absence of usage — check the curated Champions Teams section instead

**Before trusting a number**
- [ ] `--weather` passed with the **exact capitalised** string, including when the *opponent* sets it (silently no-ops on a mismatch) → [Weather](#weather-effects-on-move-power)
- [ ] Spread-move damage **not** manually multiplied by 0.75 — the CLI already applies it → [Doubles traps](#doubles-specific-traps)
- [ ] Multi-hit move: `min`/`max` is one hit, not the total (`isVariableMultiHit`)
- [ ] Attacker's realistic held item included in the worst case
- [ ] Tool output read as JSON, **not** grepped out of a shell loop — a bad input goes blank instead of failing → [Data source pitfalls](#data-source-pitfalls)

**Before trusting a build**
- [ ] SP spread solved for the *minimum* per stat, not defaulted to 32/32/2
- [ ] Real current preset checked for item/ability/spread — not assumed from typing → [Build assumptions](#build-assumption-trap)
- [ ] Non-Mega ability: 2-3 legal options exist; the one the *set* runs may differ from the dex default
- [ ] An ability-boosted move still compared against higher-base-power unboosted alternatives
- [ ] No EV terminology, and no assumed EV→SP conversion factor
- [ ] A legal, widely-used tactic **not** presented as a flaw you found — check usage before "the thing that breaks your premise" → [Build assumptions](#build-assumption-trap)

**Before calling a team finished**
- [ ] **No duplicate items across the six** — hard rule (`vgc-format.md`), has been missed twice → [Team-finalization](#team-finalization-checks)
- [ ] No "flex this item per matchup" advice — everything but which four you bring is fixed at registration (`vgc-format.md`)
- [ ] Synergy claims scoped to a specific bring-6-pick-4 subset
- [ ] Tera **not** assumed active (confirm in `reference/regulation.md`)
- [ ] Redirection plan checked against Grass-types and Overcoat (powder immunity)

**Facts that must come from `tools/dex/cli.js`, never recall** — type
matchups, Mega abilities and typing, item/ability legality. See CLAUDE.md's
table; these are no longer documentation problems, they are tool calls.

## Data source pitfalls

- **Ladder data vs. tournament (Bo3) data diverge.** Pikalytics-style usage
  stats are pulled from ranked ladder play (Bo1, fast-paced, less
  team-preview counter-teaming). Actual tournament results (Bo3, real
  Swiss/elimination brackets) can favor different picks — a Pokémon can be
  ladder-dominant and tournament-weak or vice versa. Don't treat ladder
  usage as a proxy for "what wins tournaments" without checking tournament
  results separately.
- **"Common teammate" co-occurrence stats show correlation, not proven
  synergy.** Two Pokémon appearing together often in usage data doesn't mean
  they mechanically synergize — it can just mean both are independently
  strong and get used a lot. Verify the actual synergy mechanism (redirection,
  speed control, type coverage, etc.) rather than citing co-occurrence rate
  as if it were evidence of a working game plan.
- **A WebSearch summary that mentions Pikalytics is not the same as fetching
  Pikalytics' team-level pages.** Build any threat list from
  `/topteams` + `/team-usage` + `/pokedex`'s "Common Team Cores", not from
  per-Pokémon usage rank or a search snippet. A search-only pass has twice
  produced a threat list missing an entire dominant archetype — the Sun core
  once, the Swampert-Mega/Pelipper/Archaludon rain core again later, both
  invisible from individual rankings. Use the `vgc-meta-lookup` skill, which
  encodes this. → `docs/case-studies.md`
- **An empty or `NaN%`/`undefined%` stats panel on a Pikalytics per-Pokémon
  page is a client-side loading artifact, not proof of low usage.** Plain
  `WebFetch` cannot trigger that page's data loading at all, and even a
  rendered DOM leaves those specific panels empty — confirmed against a
  known top-20 pick whose panels were equally blank. The reliable signal on
  that page is the **"[Species] Pokemon Champions Teams"** section (curated
  tournament results with real records); absence there is the real
  low-presence signal. For a specific curated entry's full moveset, read the
  JSON API directly: `https://www.pikalytics.com/api/p/<date>/<format>-<id>/<species>`.
  → `docs/case-studies.md`
- **A shell loop that greps a CLI's JSON is a data source, and a silent one.**
  `for t in …; do node tools/dex/cli.js type "$t" --vs "Fire,Dark" 2>&1 |
  grep -o '"multiplier":[^,}]*'; done` looks thorough and fails invisibly:
  `2>&1 | grep | head` discards both the error text and the exit status, so a
  misspelled type prints a **blank line** while the pipeline exits 0. In a
  defensive profile a blank row reads as "nothing notable" — the same shape as
  a missed 0x immunity. Two further problems ride along: the list of 18 types
  is yours to get wrong (five were silently absent from the run that prompted
  this entry), and the defender's typing is passed in **from recall**, so one
  wrong Mega typing corrupts every row at once. Ask the tool the question you
  actually have — `dex type --vs-mon "<Species>"` returns all 18 types grouped
  by multiplier, in one call, with immunities and 4x weaknesses as named keys.
  The same rule generalises: read a tool's structured output, don't scrape it.
- **A stale learnset pin serves plausible wrong data, it does not fail.**
  Learnsets are regulation-variant — at the M-B boundary upstream changed by
  +2019/-353 lines, and the deletions matter most: a pin from a previous
  regulation can report a move as **legal that the current regulation
  removed**. The upstream file is updated in place, so there is no version
  marker in the data itself to notice. This is the same shape as the
  Pikalytics wrong-slug trap logged above: complete, correctly-formatted,
  wrong. Check the session-start hook's regulation-drift line before trusting
  a legality answer near a rollover.

## Current-mechanic correction

- **Terastallization is NOT active in the current regulation.** See
  `regulation.md` for the authoritative status. This file exists
  partly because an earlier claude.ai session incorrectly implied Tera
  strategy should be considered for current-format teams — it was corrected
  after user pushback, not caught proactively. Don't recommend Tera-based
  game plans (Tera-blast coverage, defensive Tera typing swaps, etc.) unless
  `regulation.md` says Tera is active as of its "Last verified"
  date.

## Weather effects on move power

- **Rain halves Fire-type moves and boosts Water-type moves 1.5x; Sun halves
  Water-type moves and boosts Fire-type moves 1.5x** (confirmed directly in
  this repo's own vendored engine — `damage_MASTER.js`'s `calcGeneralMods`
  applies `0x800/0x1000` = 0.5x for the halved case and `0x1800/0x1000` =
  1.5x for the boosted case, and `tools/damage-calc/cli.js`'s `--weather`
  flag triggers this automatically). **Always pass the realistic `--weather`
  flag for the matchup being calculated, not just for the user's own
  weather-setting Pokémon** — if the *opponent* is the one running the
  weather (e.g. checking a move against a Rain-team Pokémon like Archaludon
  or Sinistcha), their team's real weather is very likely to be active
  during that actual matchup, and omitting it gives a misleadingly strong
  number. Real example: Salazzle's Fire Blast vs. Sinistcha (a real Rain-
  team member) looked like a near-guaranteed OHKO (94-112% of HP) with no
  weather set, but dropped to a survivable 47-55% once Rain was correctly
  applied — the same mistake in the other direction (crediting a move with
  full power against a target whose own team would realistically have it
  weakened) as forgetting to check an attacker's boosted weather in the
  first place. Caught by the user, not proactively.

- **`tools/damage-calc/cli.js`'s `--weather` value is case-sensitive and
  silently no-ops on a mismatch instead of erroring** — the vendored engine
  matches against exact capitalized strings (`Sun`, `Rain`, `Sand`, `Hail`,
  `Snow`, `Harsh Sun`, `Heavy Rain`, `Strong Winds`), several via `===`
  and others via `.indexOf("Sun")`/`.indexOf("Rain")` substring checks —
  both fail equally on a lowercase `sun`/`rain`. Passing `--weather sun`
  (lowercase) produces a real, plausible-looking JSON result with no error,
  but silently drops both the attacker's same-weather STAB boost (1.5x Fire
  in Sun, 1.5x Water in Rain) AND, for Solar Beam/Solar Blade specifically,
  applies the *wrong-weather* 0.5x power penalty (60 BP instead of 120)
  since the engine's Solar Beam check only exempts the exact strings
  `"None"/"Sun"/"Harsh Sun"/"Strong Winds"/""`. Confirmed directly: Mega
  Charizard Y Heat Wave vs. 0 SP Scizor came out 336-400 with
  `--weather sun` vs. the correct 508-600 with `--weather Sun`; Solar Beam
  vs. Milotic came out 68-80 (60 BP) with `--weather sun` vs. the correct
  132-156 (120 BP) with `--weather Sun`. **Always pass the exact capitalized
  weather string**, and treat a "reasonable-looking" number with no error as
  no guarantee the flag was actually recognized. Caught while evaluating a
  Mega Charizard Y matchup, not proactively.

## Doubles-specific traps

- **Grass-type immunity to powder moves can break a redirection plan.**
  Moves like Rage Powder (a common redirection tool) are powder moves and
  have no effect on Grass-types or Overcoat holders — a redirection-based
  game plan that assumes it always draws the opposing attack will fail
  outright against a Grass-type or Overcoat opponent.
- **Spread moves hit multiple targets but at reduced damage (0.75x)**, and in
  a doubles/VGC format that reduction applies even if only one of the two
  possible targets is actually present — check the specific move's spread
  behavior (e.g. Rock Slide/Muddy Water hit both opposing Pokémon; Earthquake
  hits both opponents AND the user's own ally unless the ally is immune or
  protected) before assuming a spread move is "free" team-wide damage.
  **`tools/damage-calc/cli.js`'s output already has this 0.75x baked in —
  do NOT multiply its min/max by 0.75 again.** Confirmed via a controlled
  A/B test (2026-07-14): `calc.js` hardcodes the Side's format to `'Doubles'`,
  and the vendored engine's `calcGeneralMods` (damage_MASTER.js) applies the
  0.75x spread-move multiplier internally whenever `move.isSpread` is true
  and format isn't `'Singles'` — forcing a copy of the same call to
  `'Singles'` gave a ~33% higher result (Charizard-Y Heat Wave vs. Mega
  Camerupt: 63-75 real Doubles output vs. 84-99 Singles-forced, ratio ≈0.75).
  This directly reverses the process-lesson case study below from an earlier
  session, which was correct for whatever computed the numbers at the time
  but is stale guidance against the *current* tool — manually re-applying
  0.75x to the tool's real output is a double-reduction that understates
  every spread move's damage by ~25%, confirmed to have happened repeatedly
  in the session that caught this (Heat Wave, Earthquake, Rock Slide, and
  Matcha Gotcha calc results were all manually halved-again before being
  reported to the user).
- **Bring-6-pick-4 team selection** means a 6-Pokémon team is not one unit
  that always acts together — two of the six sit out every game. "Team
  synergy" claims should specify which 4-Pokémon subset the synergy applies
  to, not assume all 6 are always on the field.

## Ladder rules are not tournament rules

**The rule now lives in `reference/vgc-format.md`** — what each venue reveals,
what OTS is, and how ladder and tournament rules diverge. This section keeps
only why it went wrong twice.

The repo already warns that ladder *usage data* is not tournament *results*.
The same split applies to the **rules themselves**, and it is easier to miss
because a single source often describes both without saying which it means.

- **The failure mode is dropping a scope qualifier.** Stated flatly that
  "Champions uses Open Team Sheets" while evaluating a two-Mega bring-6 plan
  (2026-09-07, and again 2026-09-08). Both times the source quoted in support
  literally began *"In tournaments, ..."* — the qualifier was present in the
  citation and got dropped in the summary. **When a rules source opens with
  "in tournaments", that scope is load-bearing; carry it into the claim.**
- **It flips conclusions rather than shading them.** Any plan whose value
  comes from hidden information is priced differently by venue, so ask which
  the team is for *before* evaluating that kind of tech.
- **But check what is actually hidden before crediting surprise value at
  all.** The first correction here over-corrected in the other direction: it
  treated ladder as broadly hidden-information play, when in fact all six
  species are public in both venues, and held items — Mega Stones
  included — appear to be public on ladder too. What ladder actually hides is
  abilities, moves and spreads. The two-Mega plan's "they can't tell which
  Mega arrives" premise fails on ladder as well; its real value is pick
  pressure, which is a different and weaker argument. Resolved 2026-09-08
  from third-party consensus (still no official source) — see
  `vgc-format.md`'s Team Preview table, which marks the confidence.

## Build assumption trap

- **A constraint every good team already builds around is not a discovery —
  check usage before calling something a broken premise.** Repeatedly framed
  "only one Mega Evolves per battle" as *the thing that breaks* a plan to
  register two Mega Stones, complete with a base-forme stat table showing what
  the unbrought Mega "loses". The limit is real; the framing was wrong. Two
  Megas is **standard practice** — four of M-B's top six archetypes by team
  count register two, ~66% weighted by team count — because the second Mega is
  the bring-4 flex slot, and choosing which to bring is one of the few genuine
  per-matchup levers the format has. The tell was writing an emphatic
  "the thing that breaks the premise" heading about a legal, common
  configuration **without checking how often the field does it**, which is one
  Pikalytics fetch. Rule: before presenting a tactic as flawed, confirm it is
  actually rare. If it's common, the interesting question is what the players
  using it know that you don't. → `vgc-format.md`'s two-Megas section
- **Don't assume a "generic" Stat Point (SP)/item/ability spread.** A
  Pokémon's typing and base stats don't tell you its actual competitive
  set. Check the current meta's actual common spread (item, ability, SP
  allocation, moves) via usage data before reasoning about bulk, speed
  tier, or damage rolls — an outdated or assumed spread produces wrong
  damage-roll math even if the typing-level reasoning is correct.
- **Most non-Mega Pokémon legally have 2-3 abilities (two regular slots
  plus a hidden ability), not one** — `tools/damage-calc/vendor/pokedex.js`'s
  `POKEDEX_CHAMPIONS[species].ab` field returns a single string, but that's
  one legal option surfaced by the vendor data, not proof it's the only one
  or the one any given real set actually uses. Always check whether a real
  preset (`SETDEX_GEN10`) or live usage data names a *different* ability for
  the specific role being built, and trust that over the bare `.ab` field.
  Real example: the vendored dex's `.ab` for Maushold is "Technician," but
  its real, actually-used competitive Follow-Me-support preset runs
  **Friend Guard** instead — reporting "Technician" without checking the
  preset would have been a real, wrong claim about the set being built, not
  just an incomplete one. This is a different trap from
  `mechanics.md`'s "Mega Evolution ability changes"
  section (a Mega's ability is genuinely fixed to one value, overriding
  pre-Mega selection) — this one is about ordinary, non-Mega Pokémon
  having real optionality that a single vendored field doesn't show.
- **An ability's power-boosted move category isn't automatically the best move
  in that category — always compare real effective power against the
  unboosted alternatives, don't stop at "this move matches the ability."**
  Mega Launcher boosts pulse/aura moves 1.5x, so Water Pulse (60 BP) looked
  like the obvious Water-STAB pick for a Mega Launcher Blastoise — but
  60 BP × 1.5 (Mega Launcher) still loses to Hydro Pump's unboosted 110 BP,
  and both lose to Water Spout's unboosted 150 BP (which also has 100%
  accuracy vs. Hydro Pump's 80%, and hits both opponents as a spread move).
  Real calc: Mega Launcher Water Pulse into Kingambit = 97-115; Water Spout
  into the same target = 121-144, *higher* despite getting no ability boost
  at all. Verify with an actual damage-calc run whenever an ability-boosted
  option is being chosen over a higher-base-power unboosted move, rather
  than assuming the synergy pick wins by default.
- **Don't default to old "EV" terminology or numbers, and don't assume a
  fixed EV→SP conversion factor (e.g. "252 EVs = 32 SP" — there isn't
  one).** Pokémon Champions replaced EVs/IVs entirely with a Stat Points
  (SP) system — see `regulation.md`'s "Stat system" section for
  the mechanics. Smogon/SV-era or Legends: Z-A-era sets quoted in EV terms
  don't map onto SP via any constant factor; prefer a real current-game SP
  allocation from live usage data when one exists. **When one doesn't
  exist, proportionally scaling the EV spread's *ratio* onto the 66-point
  SP budget is an acceptable starting point** (user-requested standing
  method, 2026-09-07) — see `methodology.md`'s "Converting
  an inherited EV spread" bullet for the exact steps (scale by 66/sum, clamp
  anything over the 32/stat cap, re-split the freed points by the remaining
  ratio) and its worked Milotic Coil/Hypnosis example. Treat the scaled
  result as a starting point to run through `optimize-bulk.js`/a
  Speed-breakpoint search, not a verified final spread.

## Team-finalization checks

The two rules this section is built on — the Item Clause, and everything
except your four being fixed at registration — are stated in
`reference/vgc-format.md`. What follows is why knowing them has not been
enough.

- **The Item Clause needs an explicit check at assignment time, not just
  recall.** Check the final six's item column for duplicates before calling
  a team finished. Real miss:
  gave both Rotom-Wash and Archaludon Leftovers in the same six-Pokémon
  build across several messages before it was caught. Fix used Rotom-Wash's
  actual second-most-common real item (Sitrus Berry, 39.1% usage) rather
  than an arbitrary swap — when fixing a duplicate, prefer the displaced
  Pokémon's next-most-common real item over guessing.
  **This recurred in a different team file** (`palafin-arcanine-sinistcha-core.md`):
  gave Gallade Life Orb when Palafin already held it, in the same message
  that finalized the sixth roster slot — despite this exact rule already
  being documented here. Caught by the user, not proactively, again. This
  wasn't a one-time slip either time: both misses happened while actively
  building/finalizing a team, meaning the check has to be run explicitly
  at the moment an item is assigned (cross-reference against every other
  already-locked item on the roster), not just recalled as a rule that
  exists. When fixing this instance, re-verified the displaced Pokémon's
  damage breakpoints under the replacement item before committing to it
  (Focus Sash preserved both of Gallade's guaranteed OHKOs, though the
  Attack SP breakpoint that secured one of them changed as a result) —
  don't assume a same-Pokémon item swap is damage-neutral.
- **The fixed-at-registration rule is easiest to break while sounding
  helpful** — situational advice reads as thorough right up until it
  describes something the format does not permit. Suggested "Occa Berry
  vs. a Charizard-Y matchup, Colbur Berry vs. a Tyranitar/sand matchup" as
  if Sinistcha could carry whichever one fit the game currently being
  played — that's not how the format works; whichever berry gets chosen
  is on the team for every game until the team itself is rebuilt/re-
  registered. Any item recommendation that's phrased as "flex this per
  matchup" needs to instead be phrased as a genuine trade-off between two
  fixed, permanent choices (which threat is more likely/costly to face
  overall), not a situational pick. Caught by the user, not proactively.

## Process-lesson case studies

Moved to `docs/case-studies.md` — the full narrative of each incident, kept
out of the decision-time hot path. Read it when revising a rule or when
checking whether a new mistake repeats an old one.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file, consolidating pitfalls and process-lesson case studies from the claude.ai handoff session | pokemon_vgc_project_handoff.md (prior session notes); Tera-inactive status cross-checked against reference/regulation.md |
| 2026-07-09 | Corrected "EV" terminology to Stat Points (SP) in the build assumption trap, added explicit SP-vs-EV pitfall — Champions replaced EVs/IVs entirely and this file still used the old terms. Caught while researching a speed-calc reference addition | champsdex.com EV/IV/Stats guide; cross-checked against reference/regulation.md |
| 2026-07-10 | Added process-lesson case study: gave "use priority to disrupt Trick Room" advice without checking mechanics.md's existing Armor Tail/Farigiraf note first, which would have caught it. User flagged that Farigiraf (current top TR setter) blocks priority-based disruption | Pikalytics Farigiraf page (Armor Tail ~99.9% usage); reference/mechanics.md (already correct, just unconsulted) |
| 2026-07-10 | Added process-lesson case study: misread Mega Swampert's pre-Mega ability usage split (Torrent/Damp) as its actual battle ability, calling Swift Swim a rare tech pick when it's always the Mega's fixed ability. User caught it after the same check had already been done correctly for Mega Raichu-Y earlier in the session | User correction; cross-referenced against new reference/mechanics.md "Mega Evolution ability changes" section |
| 2026-07-10 | Added process-lesson case study: quoted spread-move damage-calc output (Rock Slide/Make It Rain into Farigiraf/Sinistcha) without applying the doubles 0.75x multi-target reduction already documented in this file's own doubles-traps section, twice across two separate messages. Overstated "kill the Trick Room setter turn 1" as a real answer. User asked directly whether the setter actually dies, which forced the correction | User question; recalculated with 0.75x applied via tools/damage-calc/cli.js this session |
| 2026-07-10 | Added process-lesson case study: claimed Garchomp was immune to Mega Staraptor's Flying STAB, inverting the real Ground-move-vs-Flying-type immunity direction. Caught while re-verifying Garchomp's actual value to the team via damage calc | tools/damage-calc/cli.js (Dual Wingbeat vs Garchomp = 42-51 per hit, not 0) |
| 2026-07-10 | Added "Team-finalization checks" section — gave two Pokémon (Rotom-Wash, Archaludon) the same item (Leftovers) across several messages of a six-Pokémon build before the duplicate was caught. No two Pokémon on a team may hold the same item in doubles VGC/Champions | User caught it directly; fixed via Rotom-Wash's real second-most-common item (Sitrus Berry, 39.1% usage per Pikalytics) |
| 2026-07-14 | Corrected the "Spread moves" bullet and its 2026-07-10 process-lesson case study — `tools/damage-calc/cli.js` already applies the doubles 0.75x spread-move reduction internally (confirmed via git history: `calc.js` hardcoded Doubles format from its first commit, predating that case study) and manually multiplying its output by 0.75x again is a double-reduction that understates real damage by ~25%. The 2026-07-10 entry's own "corrected math" was almost certainly this same error, not a real fix, and likely a source the mistake propagated from | Controlled Singles-vs-Doubles A/B test this session (Charizard-Y Heat Wave vs. Mega Camerupt: 63-75 real Doubles output vs. 84-99 Singles-forced); `git log -S` on calc.js |
| 2026-07-14 | Added "Most non-Mega Pokémon legally have 2-3 abilities, not one" bullet — treated the vendored dex's single `.ab` field as if it were the only/correct ability for Maushold (reported "Technician") without checking whether its real competitive preset used something else, which it did (Friend Guard, for the actual Follow-Me-support role being built). User flagged this as a recurring pattern to always keep in mind, not a one-off | User correction; `tools/damage-calc/vendor/pokedex.js`'s `SETDEX_GEN10['Maushold']['Chople Support']` preset (real ability: Friend Guard) vs. `POKEDEX_CHAMPIONS['Maushold'].ab` (Technician) |
| 2026-07-14 | Added process-lesson case study: claimed Tinkaton (Steel/Fairy) shared Altaria's weakness to Poison-type coverage by checking only the Fairy half's Poison weakness and never multiplying against the Steel half's Poison immunity (0 × anything = 0, immunity always wins). Tinkaton is flatly immune to Poison, not weak to it | User correction |
| 2026-07-14 | Added "Weather effects on move power" section — Rain halves Fire moves/boosts Water 1.5x, Sun halves Water/boosts Fire 1.5x. Calculated Salazzle's Fire Blast vs. Sinistcha (a real Rain-team member) with no weather flag set, overstating it as a near-guaranteed OHKO (94-112%) when the real number under the Rain their own team would have active is only 47-55% | User correction; confirmed via `tools/damage-calc/cli.js`'s `--weather Rain` flag, cross-checked against `damage_MASTER.js`'s `calcGeneralMods` weather multipliers |
| 2026-07-14 | Added "ability's power-boosted move category isn't automatically the best move" bullet — picked Mega Launcher-boosted Water Pulse (60 BP) as Mega Blastoise's Water STAB without comparing it against unboosted higher-BP alternatives; real calc showed unboosted Water Spout (150 BP, 100% acc, spread) and Hydro Pump (110 BP) both outdamage the "ability synergy" pick | User asked "does it matter in actual matchups"; confirmed via `tools/damage-calc/cli.js` (Water Spout 121-144 vs. Water Pulse 97-115 into Kingambit) and Bulbapedia accuracy pages |
| 2026-07-14 | Added major process-lesson case study: built a whole team's strategic premise ("Mega Altaria Calm Mind sweeper") around a move Altaria cannot learn in Champions at all — never checked until a final "deeply examine each move" audit. Altaria has no Special Attack-boosting move in its kit; real tournament usage is a Will-O-Wisp/Protect/Tailwind support set, not a sweeper. **Now tool-caught:** `node tools/dex/cli.js learnset "Mega Altaria" --move "Calm Mind"` returns `illegal`, and `dex team` fails the file. Pinned as a permanent regression test in `tools/dex/tests/learnset.test.js`. | Direct Bulbapedia Champions-learnset fetch (Calm Mind absent from full move list); Pikalytics championstournaments/Altaria usage data (Will-O-Wisp 63%, Cloud Nine 89.5% over Pixilate) |
| 2026-07-23 | Added "Generic WebSearch snippets are not the same as fetching Pikalytics' team-level pages" bullet — built a 5-Pokémon threat list (for real Palafin-moveset damage-calc decisions) from WebSearch snippets off individual Pokémon pages only, never fetching `topteams`/`team-usage` as `methodology.md`'s own "Live meta lookup" section already instructs. Missed Archaludon, Swampert-Mega, and Pelipper entirely — the Swampert-Mega/Pelipper/Archaludon rain core turned out to be one of the most common archetypes in the real top-100 team-usage list, which is especially relevant to a Water-type-heavy team since rain doubles the relevant "does this OHKO" question already being calculated. This is a repeat of the exact mistake the methodology file's 2026-07-10 changelog entry already documents being caught once (missed the Sun archetype core from usage-rank-only checking) — the written instruction existing in one file wasn't sufficient to prevent recurrence three sessions later | User asked directly whether `pikalytics.com/team-usage` should have been checked; fetched `topteams` and `team-usage` this session, cross-referenced against the prior 2026-07-10 entry |
| 2026-07-23 | Extended the duplicate-item bullet (originally added 2026-07-10 after the Rotom-Wash/Archaludon Leftovers miss) with a second real recurrence in a different team file — gave Gallade Life Orb when Palafin already held it, in the very message finalizing the sixth roster slot. Both misses happened while actively assigning an item during team construction, not as a one-off; the rule existing in this file wasn't enough to prevent it being missed a second time. Added explicit guidance: the check has to be run at the moment of assignment (cross-reference every other already-locked item), and when fixing a duplicate, re-verify the displaced Pokémon's damage breakpoints under the replacement item rather than assuming the swap is damage-neutral | User caught it directly; tools/damage-calc/cli.js re-verification of both affected breakpoints under the replacement item (Focus Sash) |
| 2026-07-27 | Added "Pikalytics per-Pokémon panel rendering empty is a loading artifact, not a low-usage signal" bullet — while scouting Mega Tailwind-setter alternatives to Aerodactyl, an empty "Best Moves" panel for Mega Pidgeot was initially treated as evidence of near-zero real usage, until the same empty-panel pattern was confirmed on Mega Aerodactyl's own page too (a known heavily-used real pick), proving it's a client-rendering limitation affecting every Pokémon's page, not a usage signal. The page's curated "Champions Teams" section (and its underlying `/api/p/...` JSON, found via the Browser tool's network log) turned out to be the real, reliable signal instead | Direct comparison via the Browser tool: Mega Pidgeot had zero curated real teams (genuinely low presence) vs. Mega Aerodactyl (19) and Mega Dragonite (9, including three 8-0/9-0/11-1 finishes) both having real ones despite identical empty stat panels |
| 2026-08-19 | Added "`--weather` value is case-sensitive and silently no-ops" bullet — ran `tools/damage-calc/cli.js` with `--weather sun` (lowercase) while checking Mega Charizard Y's Heat Wave/Solar Beam against a user's team; the engine only matches exact capitalized strings (`Sun`, `Rain`, etc.), so the lowercase flag was silently ignored with no error, dropping Heat Wave from 508-600 to a wrong 336-400 and Solar Beam from 120 BP to a wrong 60 BP against Scizor/Milotic | Caught proactively by comparing `--weather Sun` vs `--weather sun` output side-by-side this session; confirmed root cause in `tools/damage-calc/vendor/damage_MASTER.js` line ~1723 (Solar Beam weather-string allowlist) and its other `===`/`.indexOf` weather checks |
| 2026-08-19 | Added process-lesson case study: while recommending a Team Preview lead pairing, claimed "Solar Beam / Weather Ball: both resisted" for Milotic by grouping the two moves as "the sun-setter's special options" without checking each move's type separately — Weather Ball is Fire-type in Sun (correctly resisted), but Solar Beam is plain Grass-type, Milotic's one real weakness, already correctly logged as "weak" in this same session's own audit table three messages earlier. The correct number (132-156 vs. 170 HP) was already in context; the failure was re-deriving a matchup claim from a vague shared-attacker pattern instead of checking it, and not cross-referencing a conclusion already reached earlier in the same conversation | User correction; re-verified via `tools/damage-calc/cli.js` for all four move/defender pairs before restating the corrected lead recommendation |
| 2026-08-19 | Added "item/moveset/ability/SP are fixed at team-build time, not swappable per-opponent at Team Preview" bullet to "Team-finalization checks" — suggested Sinistcha carry Occa Berry into a Charizard-Y matchup and Colbur Berry into a sand-Tyranitar matchup as if it could flex per-game; Team Preview only selects which 4 of 6 to bring, it doesn't let a held item change between games. Any item recommendation needs to be framed as one permanent trade-off, not a situational swap | User correction ("i cant swap items in team preview, dont make that mistake again") |
| 2026-09-04 | Added process-lesson case study: `tools/damage-calc/cli.js` does not auto-evolve a Mega just because its Mega Stone is held — passing `--defender Staraptor --defender-item Staraptorite` silently computed base Staraptor (Normal/Flying, Intimidate), not Mega Staraptor (Fighting/Flying, ability fixed to Contrary). This produced a real wrong claim to the user that Ceruledge's Ghost-type moves deal 0 to Staraptor (true only for the base form nobody actually fields); the real Mega Staraptor takes normal neutral damage instead. Must pass the exact `"Mega <Species>"` string as `--defender`/`--attacker` for any Mega-capable Pokémon, not the base name plus its stone | Caught while re-deriving Mega Staraptor's real fixed ability for a user follow-up; confirmed via `POKEDEX_CHAMPIONS["Mega Staraptor"]` (Fighting/Flying, ab: "Contrary") and a direct cli.js re-run with the corrected species string (Poltergeist: 0 → 97-115) |
| 2026-09-04 | Added process-lesson case study + new `methodology.md` section ("A Pokémon's value isn't always damage") after judging Whimsicott, a real Focus-Sash/Prankster support pick, by % HP lost to top threats the same way an attacker candidate was judged — factually correct numbers, wrong metric for a Pokémon designed to take exactly one hit regardless of overkill. Also added cross-references from the vgc-team-building and vgc-threat-evaluation skills | User correction ("damage isn't always a pokemon's value... look into what they offer"); Whimsicott's real Pikalytics set (Tailwind 98.5%, Focus Sash 75.5%, Prankster 99.4%) confirmed this session |
| 2026-09-07 | Added process-lesson case study: claimed Rillaboom doesn't resist Electric while flagging a false "gap" in a Milotic/Rillaboom/Incineroar core — Grass resists Electric per the type chart (now `node tools/dex/cli.js type`), so Rillaboom actually already covers Milotic's Electric weakness. Same recurring failure mode as this section's other type-chart entries: stated a matchup from recall instead of opening the reference file, on a matchup that felt obvious enough not to check | User correction ("how do you keep messing up your resistances. rillaboom resists electric") |
| 2026-09-07 | Added process-lesson case study: claimed Mega Raichu Y's real ability is Lightning Rod (93.7% usage) and No Guard is a rare tech — backwards. `POKEDEX_CHAMPIONS["Mega Raichu Y"].ab` is fixed to `"No Guard"`; the 93.7%/2.7% split was pre-Mega base Raichu's own ability selection, not the Mega's. Fourth recurrence of the "usage-stat ability breakdown shows pre-Mega selection" trap, and this exact Pokémon was already named in `mechanics.md` before the mistake was made. User asked what should change structurally — added CLAUDE.md rule 13 mandating a vendor-data/reference-file check before stating any Mega's ability | User correction; `tools/damage-calc/vendor/pokedex.js` direct read (`POKEDEX_CHAMPIONS["Mega Raichu Y"]`: `ab: "No Guard"`, no alternative) |
| 2026-09-07 | Softened the "don't default to old EV terminology" bullet to add a user-requested standing method: proportionally scale an inherited EV spread's ratio onto the 66-point SP budget as a starting point (not a fixed conversion factor) when no real current-game SP allocation is available — see `methodology.md`'s new "Converting an inherited EV spread" bullet for the exact steps | User instruction, given while reviewing a Milotic Coil/Hypnosis set quoted in EV terms (252/104/88/64) |
| 2026-09-07 | Restructured for scannability: added a Contents list and a Quick checklist at the top, and moved the 220-line "Process-lesson case studies" section plus two long data-source narratives to `docs/case-studies.md`. No trap was removed — the rules stayed, the incident narratives left the decision-time hot path. Type-chart and Mega-ability traps now point at `tools/dex/cli.js` instead of a markdown file | docs/specs/2026-09-07-repo-reorganization.md |
| 2026-09-07 | Replaced dangling `CLAUDE.md rule N` references in live prose with named pointers (changelog rows keep their numbers as historical statements). The mechanically checkable team-finalization traps — duplicate items, SP budget, item/ability legality, Mega abilities — are now enforced by `node tools/dex/cli.js team` and a PostToolUse hook rather than by this checklist alone | docs/specs/2026-09-07-workflow-audit.md |
| 2026-09-07 | Added "Ladder rules are not tournament rules" plus a Quick-checklist line, after asserting Champions uses Open Team Sheets when OTS is tournament-only — the ChampDex passage cited as support began "In tournaments," and that scope was dropped. Matters because it inverts the value of hidden-information plans (e.g. carrying two Mega Stones so the opponent cannot predict the Mega): worth more on ladder, near-worthless under OTS. Item visibility in ladder Team Preview left explicitly unresolved — secondary sites say items show, no official rules source found | User correction this session; ChampDex format-rules and team-preview guides; multiple searches failed to surface an official ladder/tournament rules split |
| 2026-09-07 | Added "a stale learnset pin serves plausible wrong data" — vendoring learnsets locally closes the Mega Altaria class of error but introduces a staleness trap structurally identical to the Pikalytics wrong-slug entry: regulations cut move pools, not just add them, so an expired pin produces false-POSITIVE legality | docs/superpowers/specs/2026-09-07-learnset-vendoring-design.md |
| 2026-09-08 | Inverted this file's relationship with the format rules it had accumulated. The Item Clause, the fixed-at-registration rule and the ladder/tournament split were stored here as incidents, so each was only reachable by first recalling the mistake attached to it — and all three answer questions asked at the *start* of a conversation, when nothing triggers a read of this file. Repeating the OTS error on 2026-09-08, one day after documenting it here, made the storage location the actual defect. Rules moved to the new `reference/vgc-format.md` and summarised in `CLAUDE.md`; these sections keep the incident and point at the rule. Added a "what this file is not" contract at the top so future entries get sorted rule-vs-mistake on the way in | User observation that the file was being used backwards; `reference/vgc-format.md` |
| 2026-09-08 | Resolved the item-visibility question this file had left open, and recorded that its own 2026-09-07 correction over-corrected: ladder is not broadly hidden-information play. All six species are public in both venues and held items (Mega Stones included) appear to be public on ladder too — what ladder hides is abilities, moves and spreads. The two-Mega plan's "they can't predict which Mega" premise therefore fails on ladder as well, leaving only the weaker pick-pressure argument | champdex.com/guides/team-preview and corroborating Champions resources; marked **[consensus]** in `vgc-format.md` as no official source was found |
| 2026-09-08 | Added "a shell loop that greps a CLI's JSON is a data source, and a silent one" after auditing the loop used to build three defensive profiles. `2>&1 \| grep \| head` discards the CLI's error text *and* its non-zero exit, so a misspelled type printed a blank row while the pipeline exited 0 — indistinguishable from a real "nothing notable" result, the same shape as a missed immunity. Fixed at the source rather than by documenting the workaround: `dex type --vs-mon <Species>` now returns all 18 types in one call | Direct reproduction this session (`Watr` -> blank row, pipeline exit 0, while the CLI itself exits 1); `tools/dex/tests/defensive-profile.test.js` |
| 2026-09-08 | Added "a constraint every good team already builds around is not a discovery". Had been surfacing the one-Mega-per-battle limit as a premise-breaking objection to registering two Mega Stones — a legal, standard configuration used by four of M-B's top six archetypes by team count (~66% weighted). The limit is real and the base-forme drop-off is real; presenting them as a reason the plan does not work was not. Verified rather than conceded: Pikalytics M-B S3 team-usage pulled this session | User correction; pikalytics.com/team-usage and /pokedex (format label confirmed "Regulation Set M-B S3"); rule and data now in `reference/vgc-format.md` |
