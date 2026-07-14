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
