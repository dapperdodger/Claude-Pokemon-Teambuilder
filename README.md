# Claude-Pokemon-Teambuilder

Reference workflow for high-quality VGC (Pokémon Champions, official doubles
format) team-building help — built to force verification against current
sources instead of letting the model coast on stale training data, and to
support both ladder/tournament prep and building around user-chosen favorite
Pokémon rather than copy-pasting top-usage squads.

This repo is the **sole source of truth** for this project — reference
files, behavioral rules, and built teams all live here with real version
history via git.

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
| [`reference/vgc_team_refining_mode.md`](reference/vgc_team_refining_mode.md) | Narrower workflow for refining an already-mostly-built team: move verification + full SP-spread optimization against current threats, not full teambuilding. |
| [`reference/vgc_damage_calc.md`](reference/vgc_damage_calc.md) | Local damage-calculator CLI (tools/damage-calc/) plus formula fundamentals for manual sanity-checks. |

## Teams

[`teams/`](teams/) holds actual built teams — one file per team, using
[`teams/_TEMPLATE.md`](teams/_TEMPLATE.md), capturing not just the roster
but the reasoning per pick and what was deliberately left out.

## Using this repo for your own teambuilding

This setup isn't tied to any one person's roster — the `CLAUDE.md` rules and
`reference/` files are general VGC knowledge (type chart, mechanics, current
regulation, methodology), and `teams/` is just where built teams accumulate.
To use it for your own teambuilding:

1. Clone the repo and open it in Claude Code — `CLAUDE.md` is picked up
   automatically and governs every session, no setup needed.
2. Start fresh in `teams/` (or clear out the existing files) — those are
   one person's specific builds, not shared reference material.
3. `reference/vgc_current_regulation.md` decays fast (it has a "Last
   verified" stamp for this reason) — expect Claude to re-verify it live
   each session rather than trust it indefinitely, per `CLAUDE.md` rule 5.
4. `tools/damage-calc/` needs Node.js installed to run damage-calc/SP-spread
   calculations locally; see `tools/damage-calc/VENDOR_MANIFEST.md` for
   where its vendored data comes from.
5. Tell Claude which Pokémon you want to build around, or that you're
   prepping for ladder/a specific tournament — rule 2 in `CLAUDE.md` means
   it won't default to just handing you the top-usage squad.

## Design history

`docs/superpowers/specs/` and `docs/superpowers/plans/` contain the design
spec and implementation plan for how this repo evolved.

## Maintenance notes

- **File size**: none of the `reference/` files are bloated yet (largest is
  ~270 lines as of 2026-07-17), but if one grows past ~300-400 lines or
  starts covering two clearly distinct topics, split it and add a pointer
  from the other files/README rather than letting it keep growing. This
  keeps context load down for sessions that only need part of the domain.
- **Changelogs vs. git history**: each file's `## Changelog` section is
  deliberately not redundant with `git log` — it's a fast, in-file "when was
  this last verified/corrected and why" signal (used by CLAUDE.md rule 5's
  staleness check) that doesn't require leaving the file to check. Keep this
  even though full history lives in git; the two serve different purposes
  (at-a-glance decay signal vs. complete audit trail).
