# Common Pitfalls (VGC / Pokémon Champions)

Domain-specific gotchas that have caused real mistakes in past team-building
sessions, or that are easy to get wrong by default. Check this file before
finalizing any team-building recommendation.

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

## Current-mechanic correction

- **Terastallization is NOT active in the current regulation.** See
  `vgc_current_regulation.md` for the authoritative status. This file exists
  partly because an earlier claude.ai session incorrectly implied Tera
  strategy should be considered for current-format teams — it was corrected
  after user pushback, not caught proactively. Don't recommend Tera-based
  game plans (Tera-blast coverage, defensive Tera typing swaps, etc.) unless
  `vgc_current_regulation.md` says Tera is active as of its "Last verified"
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

## Build assumption trap

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
  `vgc_ability_move_mechanics.md`'s "Mega Evolution ability changes"
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
- **Don't default to old "EV" terminology or numbers.** Pokémon Champions
  replaced EVs/IVs entirely with a Stat Points (SP) system — see
  `vgc_current_regulation.md`'s "Stat system" section for the mechanics.
  Smogon/SV-era sets quoted in "252 EVs" terms don't map cleanly onto SP;
  a set pulled from an outdated source needs to be re-verified in current
  SP terms, not converted by assumption.

## Team-finalization checks

- **No two Pokémon on a team can hold the same item — this is a hard rule
  in doubles VGC/Champions, not a style choice.** Check the final six's
  item column for duplicates before calling a team finished. Real miss:
  gave both Rotom-Wash and Archaludon Leftovers in the same six-Pokémon
  build across several messages before it was caught. Fix used Rotom-Wash's
  actual second-most-common real item (Sitrus Berry, 39.1% usage) rather
  than an arbitrary swap — when fixing a duplicate, prefer the displaced
  Pokémon's next-most-common real item over guessing.

## Process-lesson case studies

These are real corrections from a past team-building session (Whimsicott +
Gholdengo core), kept here as concrete examples of why "verify the real
chart, don't rely on recall" has to be a default step, not something that
only happens after a user catches a mistake:

- **Kingambit (Dark/Steel)** was initially suggested as a Farigiraf/Trick
  Room answer, but is actually a bad pick against that specific team —
  Dark/Steel is **4x weak to Fighting** (not "a bit weak"; both types are
  independently weak to Fighting, so it compounds), plus 2x Fire and 2x
  Ground, which would have stacked on top of that team's existing Fire
  weakness. This was only caught via user pushback.
- **Mega Aerodactyl (Rock/Flying)** was initially miscalculated as 4x weak
  to Ice — it's actually only **2x weak** (Ice is neutral against the Rock
  half, only super-effective against the Flying half). It's also **immune
  to Ground** entirely (Flying half cancels Ground's normal super-effective
  matchup against Rock). Both errors were caught only after the user
  demanded the real chart be pulled instead of relying on recall — see
  `vgc_type_chart_reference.md` for the verified chart.
- **Recommending "lean on priority moves (Fake Out, Aqua Jet, Prankster
  status) to disrupt Trick Room" without checking Farigiraf's ability
  first.** Farigiraf runs Armor Tail at ~99.9% usage (Pikalytics), which
  blocks any priority-boosted move — including Prankster-boosted Taunt/
  Encore — from hitting it or its ally that turn (see
  `vgc_ability_move_mechanics.md`'s "Priority & turn order" section, which
  already documented this correctly before this mistake was made — the
  failure was not checking that file before giving priority-based advice).
  The good news buried in that same file: it doesn't matter, because
  Trick Room itself is -7 priority and always resolves last on the turn
  it's set — a normal-priority attack (Rock Slide, Wave Crash, Make It
  Rain, anything at 0 priority) still lands before the room goes up
  regardless of the attacker's Speed or whether Armor Tail is in play.
  Armor Tail only shuts down priority-based disruption on *later* turns
  while Farigiraf/its ally remains on the field — the real counter to a
  Farigiraf lead is raw damage that turn, not a priority trick.
- **Misread a usage-stat "Torrent 58.7% / Damp 46.4%" ability split as Mega
  Swampert's actual battle ability**, and recommended it as if Swift Swim
  were a rare minority tech pick rather than what it always is once
  evolved. Some Megas fix their ability on evolution, overriding whatever
  the base Pokémon had — see `vgc_ability_move_mechanics.md`'s "Mega
  Evolution ability changes" section. The ironic part: this exact check
  (does the Mega fix the ability?) had already been applied correctly to
  Mega Raichu-Y two turns earlier in the same session — it just wasn't
  applied consistently to the next Mega that came up. Caught by the user,
  not proactively.
- **Quoted a spread move's single-target damage-calc output as the real
  in-game number, twice, without applying the doubles 0.75x spread-move
  reduction** documented in this same file's "Spread moves hit multiple
  targets but at reduced damage" bullet above — forgot it applies even
  when reasoning about damage *to* a Trick Room setter, not just the
  user's own spread moves. This made "just kill the Trick Room setter
  turn 1" look like a real answer; corrected math (0.75x applied) shows
  the best case — both attackers connect, zero Fake Out disruption —
  still leaves Farigiraf at 36-61 of 195 HP, and Sinistcha often survives
  too. Caught only after the user asked directly whether the setter
  actually dies.
  **Addendum (2026-07-14): git history shows `tools/damage-calc/calc.js`
  already hardcoded Doubles format (and therefore already applied the 0.75x
  spread reduction internally) from its very first commit (2026-07-09),
  before this entry was even written (2026-07-10) — meaning this entry's
  "corrected math (0.75x applied)" was almost certainly a double-reduction
  on an already-correct tool output, not a real fix. Do not treat this
  entry as a template to follow: never manually multiply
  `tools/damage-calc/cli.js`'s min/max by 0.75 for a spread move, the tool
  already did it (see the "Spread moves" bullet above, confirmed via a
  controlled Singles-vs-Doubles A/B test). This mistake likely propagated
  from this very file into at least one later session before being caught.**
- **Claimed Garchomp (Ground/Dragon) was "immune to Mega Staraptor's Flying
  STAB,"** inverting a real mechanic: Ground-type *moves* have no effect on
  Flying-types (why Earthquake whiffs on Pelipper), not the reverse —
  Flying-type moves hit Ground-types completely normally. Calc confirmed
  Dual Wingbeat does 42-51 per hit to Garchomp, not zero. Direction matters:
  always check "attacking type row vs. defending type column" in
  `vgc_type_chart_reference.md`, not the mirrored cell, before claiming a
  one-way immunity.
- **Claimed Tinkaton (Steel/Fairy) shared Altaria's weakness to Poison-type
  coverage** by checking only the Fairy half's effectiveness (Poison vs.
  Fairy = 2x weak) and never multiplying it against the Steel half —
  Poison vs. Steel is 0 (immune), and immunity always wins in the
  multiplicative chain (2 × 0 = 0), so Tinkaton is flatly immune to Poison
  overall, not weak to it. For any dual-type Pokémon, compute BOTH halves'
  effectiveness against the incoming type and multiply them together —
  don't reason from a single half and assume it holds for the combined
  typing, especially when one half might be an immunity that overrides
  the other. Caught by the user, not proactively.

- **Built an entire team's strategic premise ("Mega Altaria Calm Mind sweeper
  core") around a move the Pokémon cannot actually learn in Champions,**
  without ever running a learnset check until asked to "deeply examine each
  move" at the very end of a long build. Calm Mind does not appear anywhere
  in Altaria's Champions learnset (confirmed via direct Bulbapedia fetch),
  and Altaria has **no Special Attack-boosting move at all** in its kit
  (Dragon Dance boosts Attack/Speed, Agility boosts Speed only — nothing
  touches SpA). Real tournament data confirms the actual role: Pikalytics
  shows Altaria's top moves are Will-O-Wisp (63%), Protect (63%), Tailwind
  (47%), Brave Bird (42%), Perish Song (26%), Roost (26%) — a support/
  utility set, not a self-setup special sweeper — and Cloud Nine (89.5%)
  outweighs Pixilate as the actual common ability, meaning most real
  Altaria isn't even the Mega/Pixilate build at all. Several other picks
  (a Follow-Me support Pokémon framed as "protecting Altaria's setup turn,"
  a second Mega framed as "backup sweeper for when Altaria's matchup is
  bad") were reasoned from this false premise. **Lesson: verify a
  Pokémon's actual learnset for its intended role-defining move BEFORE
  building team strategy around that role, not after the roster is
  finalized** — a name-recognition move ("Altaria runs Calm Mind" from
  general Pokémon knowledge/mainline-game memory) is not a substitute for
  checking the specific game's learnset, and this is a more severe version
  of the same trap as the Gyarados/Rock Slide and Blastoise/Water Pulse
  cases below: those were single-move corrections, this was a whole team's
  win condition. Caught only because the user asked for a full move-by-move
  audit at the end, not proactively during the build.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file, consolidating pitfalls and process-lesson case studies from the claude.ai handoff session | pokemon_vgc_project_handoff.md (prior session notes); Tera-inactive status cross-checked against reference/vgc_current_regulation.md |
| 2026-07-09 | Corrected "EV" terminology to Stat Points (SP) in the build assumption trap, added explicit SP-vs-EV pitfall — Champions replaced EVs/IVs entirely and this file still used the old terms. Caught while researching a speed-calc reference addition | champsdex.com EV/IV/Stats guide; cross-checked against reference/vgc_current_regulation.md |
| 2026-07-10 | Added process-lesson case study: gave "use priority to disrupt Trick Room" advice without checking vgc_ability_move_mechanics.md's existing Armor Tail/Farigiraf note first, which would have caught it. User flagged that Farigiraf (current top TR setter) blocks priority-based disruption | Pikalytics Farigiraf page (Armor Tail ~99.9% usage); reference/vgc_ability_move_mechanics.md (already correct, just unconsulted) |
| 2026-07-10 | Added process-lesson case study: misread Mega Swampert's pre-Mega ability usage split (Torrent/Damp) as its actual battle ability, calling Swift Swim a rare tech pick when it's always the Mega's fixed ability. User caught it after the same check had already been done correctly for Mega Raichu-Y earlier in the session | User correction; cross-referenced against new reference/vgc_ability_move_mechanics.md "Mega Evolution ability changes" section |
| 2026-07-10 | Added process-lesson case study: quoted spread-move damage-calc output (Rock Slide/Make It Rain into Farigiraf/Sinistcha) without applying the doubles 0.75x multi-target reduction already documented in this file's own doubles-traps section, twice across two separate messages. Overstated "kill the Trick Room setter turn 1" as a real answer. User asked directly whether the setter actually dies, which forced the correction | User question; recalculated with 0.75x applied via tools/damage-calc/cli.js this session |
| 2026-07-10 | Added process-lesson case study: claimed Garchomp was immune to Mega Staraptor's Flying STAB, inverting the real Ground-move-vs-Flying-type immunity direction. Caught while re-verifying Garchomp's actual value to the team via damage calc | tools/damage-calc/cli.js (Dual Wingbeat vs Garchomp = 42-51 per hit, not 0) |
| 2026-07-10 | Added "Team-finalization checks" section — gave two Pokémon (Rotom-Wash, Archaludon) the same item (Leftovers) across several messages of a six-Pokémon build before the duplicate was caught. No two Pokémon on a team may hold the same item in doubles VGC/Champions | User caught it directly; fixed via Rotom-Wash's real second-most-common item (Sitrus Berry, 39.1% usage per Pikalytics) |
| 2026-07-14 | Corrected the "Spread moves" bullet and its 2026-07-10 process-lesson case study — `tools/damage-calc/cli.js` already applies the doubles 0.75x spread-move reduction internally (confirmed via git history: `calc.js` hardcoded Doubles format from its first commit, predating that case study) and manually multiplying its output by 0.75x again is a double-reduction that understates real damage by ~25%. The 2026-07-10 entry's own "corrected math" was almost certainly this same error, not a real fix, and likely a source the mistake propagated from | Controlled Singles-vs-Doubles A/B test this session (Charizard-Y Heat Wave vs. Mega Camerupt: 63-75 real Doubles output vs. 84-99 Singles-forced); `git log -S` on calc.js |
| 2026-07-14 | Added "Most non-Mega Pokémon legally have 2-3 abilities, not one" bullet — treated the vendored dex's single `.ab` field as if it were the only/correct ability for Maushold (reported "Technician") without checking whether its real competitive preset used something else, which it did (Friend Guard, for the actual Follow-Me-support role being built). User flagged this as a recurring pattern to always keep in mind, not a one-off | User correction; `tools/damage-calc/vendor/pokedex.js`'s `SETDEX_GEN10['Maushold']['Chople Support']` preset (real ability: Friend Guard) vs. `POKEDEX_CHAMPIONS['Maushold'].ab` (Technician) |
| 2026-07-14 | Added process-lesson case study: claimed Tinkaton (Steel/Fairy) shared Altaria's weakness to Poison-type coverage by checking only the Fairy half's Poison weakness and never multiplying against the Steel half's Poison immunity (0 × anything = 0, immunity always wins). Tinkaton is flatly immune to Poison, not weak to it | User correction |
| 2026-07-14 | Added "Weather effects on move power" section — Rain halves Fire moves/boosts Water 1.5x, Sun halves Water/boosts Fire 1.5x. Calculated Salazzle's Fire Blast vs. Sinistcha (a real Rain-team member) with no weather flag set, overstating it as a near-guaranteed OHKO (94-112%) when the real number under the Rain their own team would have active is only 47-55% | User correction; confirmed via `tools/damage-calc/cli.js`'s `--weather Rain` flag, cross-checked against `damage_MASTER.js`'s `calcGeneralMods` weather multipliers |
| 2026-07-14 | Added "ability's power-boosted move category isn't automatically the best move" bullet — picked Mega Launcher-boosted Water Pulse (60 BP) as Mega Blastoise's Water STAB without comparing it against unboosted higher-BP alternatives; real calc showed unboosted Water Spout (150 BP, 100% acc, spread) and Hydro Pump (110 BP) both outdamage the "ability synergy" pick | User asked "does it matter in actual matchups"; confirmed via `tools/damage-calc/cli.js` (Water Spout 121-144 vs. Water Pulse 97-115 into Kingambit) and Bulbapedia accuracy pages |
| 2026-07-14 | Added major process-lesson case study: built a whole team's strategic premise ("Mega Altaria Calm Mind sweeper") around a move Altaria cannot learn in Champions at all — never checked until a final "deeply examine each move" audit. Altaria has no Special Attack-boosting move in its kit; real tournament usage is a Will-O-Wisp/Protect/Tailwind support set, not a sweeper | Direct Bulbapedia Champions-learnset fetch (Calm Mind absent from full move list); Pikalytics championstournaments/Altaria usage data (Will-O-Wisp 63%, Cloud Nine 89.5% over Pixilate) |
