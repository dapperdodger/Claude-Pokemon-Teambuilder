# Team Refining Mode

Reference for a narrower teambuilding workflow: the user already has most
or all of a team's species/items/abilities decided and wants a focused pass
on move verification and SP-spread optimization — not a full teambuilding
review. See `reference/vgc_teambuilding_methodology.md` for the general
(from-scratch) teambuilding process this mode is deliberately narrower than.

## Trigger

The user says something like "refine this team," "team refining mode," or
similar, while providing a mostly-complete six. Treat this as a signal that
picks are locked in and the request is verification + optimization, not
team construction.

## Scope

**In scope**, per Pokémon given:
- Species, item, and ability are fixed inputs — not re-evaluated.
- Move legality check (does this Pokémon learn this move, is it available
  this regulation — see `reference/vgc_current_regulation.md`, and
  `CLAUDE.md` rules 6/7).
- Move meta-relevance check (is it actually run on current sets, or
  legal-but-obscure).
- Full SP spread recommendation: speed breakpoints, offensive breakpoints,
  and defensive bulk, all against a current threat list.

**Out of scope** (explicit non-goals — do not let this mode drift back into
full teambuilding):
- Team synergy / overall strategy critique.
- Filling empty slots if fewer than 6 Pokémon are given — flag the gap and
  hand that back to a normal teambuilding conversation instead of picking
  something yourself.
- Overriding the user's species/item/ability choices.

**Still bound by standing `CLAUDE.md` rules**: live-search verification
(rule 3), roster-availability-vs-legality (rule 6), common-pitfalls check
(rule 10, see `reference/vgc_common_pitfalls.md`) — this mode is a
narrower entry point into the same rulebook, not an exception to it.

## Input format

For each Pokémon: species, item, ability, and whatever moves are already
decided (up to 4). SP spread is not expected to be pre-filled — producing
it is this mode's job. If fewer than 6 Pokémon are given, note the gap per
the Scope section above rather than filling it.

## Process

### 1. Move verification (per Pokémon, per listed move)

1. **Legality**: confirm the move is in that Pokémon's current-regulation
   learnset and not restricted this regulation.
2. **Meta-relevance**: cross-check live Pikalytics per-Pokémon set data
   (see the "Live meta lookup" section of
   `reference/vgc_teambuilding_methodology.md`). If a move is legal but
   rarely appears on real sets, flag it and name what's commonly run
   instead. Do not auto-swap it — report the finding and let the user
   decide.

### 2. Threat sourcing

Default: derive the current top-usage threats via live Pikalytics
regulation usage data (roughly top 10-15), then pull each one's common
set(s) — moves, item, ability, spread — from their per-mon pages. Weight by
usage share rather than treating every threat as equally likely (see the
co-occurrence-vs-synergy trap in `reference/vgc_common_pitfalls.md`).

If the user names specific threats or matchups instead, use those in place
of (or in addition to) the auto-derived list.

### 3. SP spread optimization (per Pokémon)

Full allocation across all three axes — not bulk alone:

1. **Speed** — compute relevant breakpoints against the threat list (who
   this Pokémon needs to outrun, or undercut for Trick Room), per the speed
   calculation section of `reference/vgc_ability_move_mechanics.md`.
2. **Offense** — minimum SP on the relevant attacking stat to hit real
   OHKO/2HKO breakpoints against the threats' actual bulk, via
   `tools/damage-calc/cli.js` (see `reference/vgc_damage_calc.md`).
3. **Bulk** — minimum defensive SP to survive the threats' relevant hits,
   via `tools/damage-calc/optimize-bulk-cli.js`. Use `--mode solve` for a
   hard must-survive-all constraint across the threat list; use
   `--mode rank` when there's leftover SP budget to place after speed and
   offense are covered, weighted by threat usage (`--threats-file` takes a
   JSON array of `{ attacker, move, field?, weight? }` — see the CLI's own
   header comment for the exact schema).
4. Reconcile 1-3 into a single spread within the SP budget (see
   `reference/vgc_current_regulation.md`'s Stat system section for the
   current cap/budget), calling out any real trade-off where the budget is
   too tight to hit every breakpoint at once.

## Output format

A standalone report — **not** written into the team's `teams/*.md` file.
The team file stays untouched unless the user separately asks to save the
result (saved teams are historical/personal records, not a meta source —
don't treat a save request here differently from any other team save).

Per Pokémon, the report includes:
- Moves table: each move with a verdict (legal + common / legal but rare —
  with alternative / illegal) and source.
- Threat list used, with source and date (auto-derived vs. user-named).
- Recommended SP spread with the speed/offense/bulk breakpoint reasoning
  behind each allocation.
- Any open trade-offs where the budget didn't stretch to cover everything.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-17 | Initial version | `docs/superpowers/specs/2026-07-17-team-refining-mode-design.md` |
