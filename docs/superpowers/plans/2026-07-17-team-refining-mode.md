# Team Refining Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a documented "team refining mode" — a narrower workflow (move
legality/meta-relevance verification + full SP-spread optimization against
current threats) distinct from full teambuilding — as its own reference
file, wired into `CLAUDE.md` and `README.md`.

**Architecture:** This is a documentation-only change: one new file in
`reference/`, one new rule appended to `CLAUDE.md`, and one row added to
`README.md`'s reference-files table. No code changes; the mode consumes
existing tools (`tools/damage-calc/cli.js`, `tools/damage-calc/optimize-bulk-cli.js`)
as-is.

**Tech Stack:** Markdown only.

## Global Constraints

- Source of truth: `docs/superpowers/specs/2026-07-17-team-refining-mode-design.md`
  — every section below traces back to a section of that spec.
- Follow the existing `reference/*.md` convention: ends with a `## Changelog`
  table (`Date | Change | Source` columns), per `CLAUDE.md` rule 9 and every
  existing file in `reference/`.
- Do not modify `tools/damage-calc/*.js` — used as-is (spec Section 8).
- Do not retrofit existing `teams/*.md` files — this mode applies going
  forward, on request only (spec Section 8).
- This is a "mode", not a hook/enforcement script — no `.claude/settings.json`
  changes (spec Section 8).

---

### Task 1: Create `reference/vgc_team_refining_mode.md`

**Files:**
- Create: `reference/vgc_team_refining_mode.md`

**Interfaces:**
- Consumes: nothing (new standalone file).
- Produces: a file path (`reference/vgc_team_refining_mode.md`) that Task 2
  points to from `CLAUDE.md`, and that Task 3 lists in `README.md`'s table.

- [ ] **Step 1: Write the file**

Create `reference/vgc_team_refining_mode.md` with this exact content:

```markdown
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
```

- [ ] **Step 2: Verify the file was written correctly**

Run: a plain read-back of the file (e.g. `cat reference/vgc_team_refining_mode.md`
or the editor's Read tool) and confirm:
- It ends with the `## Changelog` section (matches every other file in
  `reference/`).
- Every `reference/`-relative link in the file (e.g. to
  `vgc_teambuilding_methodology.md`, `vgc_current_regulation.md`,
  `vgc_ability_move_mechanics.md`, `vgc_common_pitfalls.md`,
  `vgc_damage_calc.md`) points to a file that actually exists:

```bash
for f in vgc_teambuilding_methodology.md vgc_current_regulation.md vgc_ability_move_mechanics.md vgc_common_pitfalls.md vgc_damage_calc.md; do
  test -f "reference/$f" && echo "OK: $f" || echo "MISSING: $f"
done
```

Expected: `OK:` for all five.

- [ ] **Step 3: Commit**

```bash
git add reference/vgc_team_refining_mode.md
git commit -m "Add team refining mode reference file

Documents a narrower teambuilding workflow scoped to move verification
and full SP-spread optimization against current threats, distinct from
full from-scratch teambuilding.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Wire the new rule into `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (append after rule 11, the team-saving rule)

**Interfaces:**
- Consumes: `reference/vgc_team_refining_mode.md` from Task 1 (path only —
  must exist before this rule references it, so this task runs after
  Task 1).
- Produces: rule 12 in `CLAUDE.md`, referenced by nothing else in this plan.

- [ ] **Step 1: Read the current end of `CLAUDE.md`**

Confirm rule 11 is still the last rule and note its exact current wording,
so the new rule is inserted after it without disturbing existing numbering.

- [ ] **Step 2: Append rule 12**

Add this new rule immediately after rule 11's paragraph (before any
trailing section, if one exists):

```markdown
12. **Refining an existing team is a different, narrower job than building
    one.** When the user says they want to refine a team they've already
    mostly built — not construct one from scratch — follow
    `reference/vgc_team_refining_mode.md`: verify moves (legality +
    meta-relevance) and optimize the full SP spread (speed, offense, bulk)
    against current threats. Don't relitigate species/item/ability picks or
    overall synergy in that mode — that scope creep is explicitly called
    out as a non-goal in the reference file.
```

- [ ] **Step 3: Verify the edit**

Run:

```bash
grep -n "^1[0-2]\." CLAUDE.md
```

Expected: rules 10, 11, and the new 12 all appear, in order, with no
duplicate numbers.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Add CLAUDE.md rule pointing to team refining mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: List the new file in `README.md`'s reference table

**Files:**
- Modify: `README.md` (the `## Reference files` table)

**Interfaces:**
- Consumes: `reference/vgc_team_refining_mode.md` from Task 1 (path only —
  runs after Task 1).
- Produces: nothing consumed elsewhere in this plan.

- [ ] **Step 1: Add a table row**

In the `## Reference files` table, add this row (placement: after the
`vgc_teambuilding_methodology.md` row, since this mode is a variant of that
methodology):

```markdown
| [`reference/vgc_team_refining_mode.md`](reference/vgc_team_refining_mode.md) | Narrower workflow for refining an already-mostly-built team: move verification + full SP-spread optimization against current threats, not full teambuilding. |
```

- [ ] **Step 2: Verify the edit**

Run:

```bash
grep -c "vgc_team_refining_mode.md" README.md
```

Expected: `1` (the single new table row; the link target file itself lives
in `reference/`, not `README.md`).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "List team refining mode in README reference table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
