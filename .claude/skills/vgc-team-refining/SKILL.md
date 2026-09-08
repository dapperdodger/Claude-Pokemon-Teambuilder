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

## Process
0. **Validate the input first.** `node tools/dex/cli.js team <file>` if the
   team is in a file — an illegal roster (duplicate item, SP over budget, a
   Mega listed with its pre-Mega ability) makes every downstream number
   meaningless. Report those before optimising anything.
1. **Move legality + meta-relevance**, per Pokémon per listed move — legal this regulation (`reference/regulation.md`), and actually run on real current sets (not just legal-but-obscure). Flag mismatches; don't auto-swap, report and let the user decide.
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

## References
- `reference/team-refining.md` — full process, input/output format
- `reference/pitfalls.md` — the trap checklist
- `reference/damage-calc.md` — CLI usage and caveats
- `docs/case-studies.md` — the incidents these rules came from
