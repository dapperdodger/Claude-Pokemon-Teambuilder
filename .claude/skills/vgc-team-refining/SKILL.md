---
name: vgc-team-refining
description: Use when the user has an already-mostly-decided team (species/item/ability locked in) and wants a focused pass on move verification and SP-spread optimization — not full teambuilding. Triggers on "refine this team" or "team refining mode."
---

# VGC Team Refining

## Overview
A narrower job than `vgc-team-building`. The user provides a mostly-complete six (species, item, ability, up to 4 moves per Pokémon) and wants verification + optimization — not a rebuild. See `reference/team-refining.md` for the full process this skill summarizes.

## Scope fence — do not drift back into full teambuilding
- Species, item, ability are **fixed inputs**, not re-evaluated.
- Do **not** critique team synergy/overall strategy.
- Fewer than 6 given? Flag the gap and hand it back to a normal teambuilding conversation — don't pick something yourself.
- Don't override the user's species/item/ability choices.
- Role fit is **in** scope: "is this move right for this role" is a moveset
  question. "Is this the right Pokémon for this role" is not — that is
  `vgc-team-building`.

## Process
0. **Validate the input first.** `node tools/dex/cli.js team <file>` if the
   team is in a file — an illegal roster (duplicate item, SP over budget, a
   Mega listed with its pre-Mega ability) makes every downstream number
   meaningless. Report those before optimising anything.
1. **Move legality**, per Pokémon per listed move — `node tools/dex/cli.js learnset "<Species>" --move "<Move>"`, legal this regulation (`reference/regulation.md`). `illegal` is a hard stop; `unknown` means verify live. Report; don't auto-swap.
1b. **Role fit.** Ask what role this Pokémon plays on this team — the user
    states it, or you infer it and confirm before proceeding. Then check the
    moveset against `reference/roles.md`:
    - Does it match the template for that role (offensive: STAB / STAB /
      coverage-setup-support / Protect; defensive: support / support / STAB /
      support-Protect)? A deviation is fine **with a reason**; an unexplained
      one is a finding.
    - Does every offensive move clear the **≥80 BP** floor (preferably ≥90)?
      Check with `node tools/dex/cli.js move "<Move>"`, never from recall.
    - Is Protect listed alongside a Choice item? That is a wasted slot.
    - A move is a **mismatch** only when it breaks the role template without a
      stated reason, sits below the ≥80 BP floor with no stated non-damage job,
      or is the wrong damage category for what the role needs. "Rarely run" is
      not on this list.
    Report; do not auto-swap. Species, item and ability remain fixed inputs.
1c. **Meta relevance is context.** Pull real sets with the **vgc-meta-lookup**
    skill (`meta mon`). How often each move is run goes in the report as
    context — a rarely-run move that passes 1b is **not** a finding. Any move
    flagged in 1b, and any replacement you suggest, goes on a decision card.
    Its options are learnable moves that fit the role; its usage column is each
    move's share on real sets.

<!-- card-skeleton:start -->
**Decision card** — required before any species, move, or threat-answer choice
goes to the user. Full guidance: `reference/decision-card.md`.

1. **Decision** — what is being chosen.
2. **Role** — the job (`reference/roles.md`). On a centrepiece build, also what
   it does for the centrepiece's strengths, not only which weakness it covers.
3. **Gap is real** — current meta evidence the job matters
   (`reference/team-evaluation.md`, Meta awareness), or "no current threat found".
4. **Options from** — the exact `dex find` command (always, for species and
   threat answers) plus any meta source used. For moves: learnset + role template.
5. **Options table** — per option: usage rank (`meta rank`); source (find / meta /
   user); Q1 real matchups, with a calc wherever a counter is claimed; Q2 stats,
   moves, ability, tool-verified; Q3 role fit; Q4 is there a better legal option
   for this role. Moves also: base power and category.
6. **Recommendation** — the reason cites fields 2-5. Usage rank and co-occurrence
   are context, never the reason. If every option is top-10 usage, say so.
7. **Not verified** — anything claimed without a tool call this session.
<!-- card-skeleton:end -->

**Ability sanity rule:** if `meta mon` shows an ability the species cannot
have (cross-check `dex mon`, and a live source for its full ability list), the
parsed data is broken — say so and do not cite that split.
2. **Threat sourcing** — default to live top-usage threats (roughly top 10-15) weighted by usage share, or use threats the user names directly. Use the **vgc-meta-lookup** skill to derive that list from all three Pikalytics surfaces (not per-mon usage rank alone), and the **vgc-threat-evaluation** skill for any individual counter/matchup call.
3. **Verify every stated fact with the dex CLI, not recall** — a listed
   ability for a Mega (`node tools/dex/cli.js mon "Mega <Species>"`; its
   `ability` is the fixed battle ability, `baseFormeAbility` is what usage
   pages show), any type matchup (`node tools/dex/cli.js type <Type> --vs <A[,B]>`),
   and item legality (`node tools/dex/cli.js legal --item "<Item>"`). A team
   file that lists a Mega's pre-Mega ability is a real, common input error —
   flag it rather than silently building on it.
4. **SP spread, all three axes**:
   - Speed breakpoints via `tools/damage-calc/cli.js` binary search
   - Offense: minimum SP to hit real OHKO/2HKO breakpoints via the same CLI
   - Bulk: minimum HP/Def/SpD via `optimize-bulk-cli.js` (`--mode solve` for a hard must-survive constraint, `--mode rank` for leftover-budget allocation)
   - Reconcile into one spread within budget; call out any real trade-off where the budget can't cover everything
5. **Report, don't save** — output is a standalone report, not written into the team's `teams/*.md` file. Only save if the user separately asks (and saved teams are historical records, not a meta source to cite from later).

## Common mistakes
- Relitigating a species/item/ability pick that was already locked in as input
- Defaulting to a round 32/32/2 SP split instead of solving for the actual minimum needed per axis
- Auto-changing a flagged move instead of reporting and letting the user decide
- Writing the result into the team's `teams/*.md` file — output is a
  standalone report unless the user separately says to save
- Checking a move only for legality and usage, never for whether it fits
  the role the Pokémon is playing
- Flagging a move as a mismatch because it is rarely run, when it fits the role
- Suggesting a replacement move without putting it on a decision card

## References
- `reference/team-refining.md` — full process, input/output format
- `reference/roles.md` — moveset templates, the base-power floor, items by role
- `reference/pitfalls.md` — the trap checklist
- `reference/damage-calc.md` — CLI usage and caveats
- `docs/case-studies.md` — the incidents these rules came from
- `reference/decision-card.md` — the card for any flagged or replacement move
