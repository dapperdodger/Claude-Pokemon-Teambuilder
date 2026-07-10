# Claude-Pokemon-Teambuilder

Reference workflow for high-quality VGC (Pokémon Champions, official doubles
format) team-building help — built to force verification against current
sources instead of letting the model coast on stale training data, and to
support both ladder/tournament prep and building around user-chosen favorite
Pokémon rather than copy-pasting top-usage squads.

This repo is the **sole source of truth** for this project. It supersedes an
earlier claude.ai chat + Google Drive setup (see `docs/superpowers/specs/`
for the design history) that hit a hard limitation: claude.ai's Drive
connector can create files but not update or delete them, so there was no
real way to maintain files or version history there.

## How to use this repo

Start any team-building session by reading `CLAUDE.md` (behavioral rules)
and `reference/vgc_current_regulation.md` (is the regulation info still
current?). The behavioral rules in `CLAUDE.md` require re-verifying volatile
facts via live web search rather than trusting these files indefinitely —
each reference file's `## Changelog` section and "Last verified" stamp (where
present) show how fresh its content is.

## Reference files

| File | Contents |
|---|---|
| [`reference/vgc_current_regulation.md`](reference/vgc_current_regulation.md) | Active regulation set, dates, active mechanics, roster-vs-legality rules, usage snapshot. **Most volatile file — check first.** |
| [`reference/vgc_common_pitfalls.md`](reference/vgc_common_pitfalls.md) | Domain-specific gotchas: ladder vs. tournament data, co-occurrence vs. synergy, doubles-specific traps, past correction case studies. |
| [`reference/vgc_type_chart_reference.md`](reference/vgc_type_chart_reference.md) | Full 18×18 Gen 6+ type effectiveness chart. |
| [`reference/vgc_ability_move_mechanics.md`](reference/vgc_ability_move_mechanics.md) | Ability/move mechanics not captured by typing alone (Trick Room priority, Armor Tail, speed calculation, etc.). |
| [`reference/vgc_teambuilding_methodology.md`](reference/vgc_teambuilding_methodology.md) | Process rules for evaluating matchups — typing alone isn't enough to call something a counter. |
| [`reference/vgc_damage_calc.md`](reference/vgc_damage_calc.md) | Local damage-calculator CLI (tools/damage-calc/) plus formula fundamentals for manual sanity-checks. |

## Teams

[`teams/`](teams/) holds actual built teams — one file per team, using
[`teams/_TEMPLATE.md`](teams/_TEMPLATE.md), capturing not just the roster
but the reasoning per pick and what was deliberately left out.

## Design history

`docs/superpowers/specs/` and `docs/superpowers/plans/` contain the design
spec and implementation plan for how this repo was built, including the
migration from the prior claude.ai-based workflow.
