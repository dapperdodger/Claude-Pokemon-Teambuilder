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
- **Spread moves hit multiple targets but at reduced damage**, and in a
  doubles/VGC format that reduction applies even if only one of the two
  possible targets is actually present — check the specific move's spread
  behavior (e.g. Rock Slide/Muddy Water hit both opposing Pokémon; Earthquake
  hits both opponents AND the user's own ally unless the ally is immune or
  protected) before assuming a spread move is "free" team-wide damage.
- **Bring-6-pick-4 team selection** means a 6-Pokémon team is not one unit
  that always acts together — two of the six sit out every game. "Team
  synergy" claims should specify which 4-Pokémon subset the synergy applies
  to, not assume all 6 are always on the field.

## Build assumption trap

- **Don't assume a "generic" EV/item/ability spread.** A Pokémon's typing
  and base stats don't tell you its actual competitive set. Check the
  current meta's actual common spread (item, ability, EVs, moves) via usage
  data before reasoning about bulk, speed tier, or damage rolls — an
  outdated or assumed spread produces wrong damage-roll math even if the
  typing-level reasoning is correct.

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

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file, consolidating pitfalls and process-lesson case studies from the claude.ai handoff session | pokemon_vgc_project_handoff.md (prior session notes); Tera-inactive status cross-checked against reference/vgc_current_regulation.md |
