# Team Refining Mode — Design

Date: 2026-07-17
Status: Approved

## 1. Problem

The existing teambuilding workflow (`reference/vgc_teambuilding_methodology.md`,
CLAUDE.md rules 1-11) is built around constructing a team from scratch:
picking six Pokémon, reasoning about synergy, coverage, speed control, etc.

There's a distinct, narrower need: the user already has most or all of a
team's species/items/abilities decided, and wants a focused pass that:

1. Verifies every listed move actually exists on that Pokémon and is
   meta-relevant (not just legal-but-never-run).
2. Works out the best SP spread (full allocation — speed, offense, and
   bulk) against the current meta's top threats.

Without a defined scope, this kind of request risks turning into (or being
treated as) a full teambuilding review — relitigating picks, item/ability
choices, and overall synergy the user has already settled on. This design
gives that narrower workflow its own name, trigger, and reference file so
future sessions handle it consistently instead of improvising each time.

## 2. Trigger

User says something like "refine this team," "team refining mode," or
similar, while providing a mostly-complete six. This is the signal that
picks are largely locked in and the request is verification + optimization,
not team construction.

## 3. Scope

**In scope**, per Pokémon given:
- Species, item, ability, and listed moves are treated as fixed inputs.
- Move legality check (does this Pokémon learn this move, is it available
  this regulation — CLAUDE.md rules 6/7).
- Move meta-relevance check (is it actually run on current sets, or is it
  legal-but-obscure).
- Full SP spread recommendation: speed breakpoints, offensive breakpoints,
  and defensive bulk, all against a current threat list.

**Out of scope** (explicit non-goals, to prevent scope creep back into full
teambuilding):
- Team synergy / overall strategy critique.
- Filling empty slots if fewer than 6 Pokémon are given — flag the gap and
  hand that back to a normal teambuilding conversation.
- Overriding the user's species/item/ability choices.

**Still bound by standing CLAUDE.md rules**: live-search verification (rule
3), roster-availability-vs-legality (rule 6), common-pitfalls check (rule
10) — this mode is a narrower entry point into the same rulebook, not an
exception to it.

## 4. Input format

For each Pokémon: species, item, ability, and whatever moves are already
decided (up to 4). No requirement on SP spread being pre-filled — that's
what this mode produces. If fewer than 6 Pokémon are given, note the gap
per Section 3 rather than filling it.

## 5. Process

### 5.1 Move verification (per Pokémon, per listed move)

1. **Legality**: confirm the move is in that Pokémon's current-regulation
   learnset and not restricted this regulation.
2. **Meta-relevance**: cross-check live Pikalytics per-Pokémon set data
   (per the "Live meta lookup" section of
   `reference/vgc_teambuilding_methodology.md`). If a move is legal but
   rarely appears on real sets, flag it and name what's commonly run
   instead. Do not auto-swap — report the finding and let the user decide.

### 5.2 Threat sourcing

Default: derive the current top-usage threats via live Pikalytics
regulation usage data (roughly top 10-15), then pull each one's common
set(s) — moves, item, ability, spread — from their per-mon pages. Weight by
usage share rather than treating every threat as equally likely (per the
co-occurrence-vs-synergy trap in `reference/vgc_common_pitfalls.md`).

If the user names specific threats/matchups instead, use those in place of
(or in addition to) the auto-derived list.

### 5.3 SP spread optimization (per Pokémon)

Full allocation across all three axes, not bulk alone:

1. **Speed** — compute relevant breakpoints against the threat list (who
   this Pokémon needs to outrun, or undercut for Trick Room), per the speed
   calculation section of `reference/vgc_ability_move_mechanics.md`.
2. **Offense** — minimum SP on the relevant attacking stat to hit real
   OHKO/2HKO breakpoints against the threats' actual bulk, via
   `tools/damage-calc/cli.js`.
3. **Bulk** — minimum defensive SP to survive the threats' relevant hits,
   via `tools/damage-calc/optimize-bulk-cli.js` (`solve` mode for a hard
   must-survive-all constraint; `rank` mode when there's leftover SP budget
   to place after speed and offense are covered, weighted by threat usage).
4. Reconcile 1-3 into a single spread within the SP budget (see
   `reference/vgc_current_regulation.md`'s Stat system section for the
   current cap/budget), calling out any real trade-off where the budget is
   too tight to hit every breakpoint at once.

## 6. Output

A standalone report — **not** written into the team's `teams/*.md` file.
The team file stays untouched unless the user separately asks to save the
result (per existing memory: saved teams aren't a meta source, and saves
happen on request, not automatically).

Per Pokémon, the report includes:
- Moves table: each move with a verdict (legal + common / legal but rare —
  with alternative / illegal) and source.
- Threat list used, with source and date (auto-derived vs. user-named).
- Recommended SP spread with the speed/offense/bulk breakpoint reasoning
  behind each allocation.
- Any open trade-offs where the budget didn't stretch to cover everything.

## 7. Files changed

- **New**: `reference/vgc_team_refining_mode.md` — the workflow itself:
  trigger, scope/non-goals, input format, the three-part process (5.1-5.3),
  and output format from this design, written as an operational reference
  (not a copy of this design doc's narrative framing).
- **`CLAUDE.md`**: add a new rule pointing to the file, e.g. "When the user
  wants to refine an existing team rather than build one from scratch,
  follow `reference/vgc_team_refining_mode.md` — a narrower workflow scoped
  to move verification and SP-spread optimization, not full pick/synergy
  review." Placed after the existing rule 11 (team-saving rule), since it's
  a related but distinct workflow note.

## 8. Out of scope for this pass

- No changes to `tools/damage-calc/optimize-bulk-cli.js` or `cli.js` —
  existing tools are used as-is.
- No new automation/enforcement hook (unlike the SP-spread bulk
  optimization work, this doesn't need a `PostToolUse` hook — the mode is
  conversational, not a file-format invariant to enforce).
- No retrofit of existing `teams/*.md` files — this mode applies going
  forward, on request.
