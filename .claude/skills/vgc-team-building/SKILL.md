---
name: vgc-team-building
description: Use when building a new VGC doubles team from scratch, extending a partial team, or building a team around a specific favorite Pokémon. Not for optimizing an already-mostly-decided roster — see vgc-team-refining for that narrower job.
---

# VGC Team Building

## Overview
Format is Pokémon Champions VGC doubles, not Smogon singles — don't import singles reasoning or Scarlet/Violet-era stat assumptions. Two goals apply, not one: ladder/tournament prep AND building a strong team around a user-named favorite. Don't default to "here's the top usage squad" when the user names a Pokémon they want to build around.

## Process, in order
1. **Regulation check, fresh this session** — `reference/vgc_current_regulation.md`, even if already checked earlier in this conversation. Note it stamps a "Last verified" date; don't trust it past that date. Roster availability and regulation legality are two separate checks — a Pokémon can be legal but not yet in Champions' roster, or vice versa.
2. **Use the vgc-meta-lookup skill** for the live meta scan — all three Pikalytics surfaces (`/topteams`, `/team-usage`, per-mon "Common Team Cores"), not just per-mon usage rank. A flat top-20 list has missed real archetypes (Sun, rain cores) before.
3. **Check in at real decision points** — the strategic archetype and any genuine judgment-call pick — before finalizing. This isn't "ask permission for every lookup"; research legwork just gets done. It's not disappearing and returning with a finished six.
4. **Use the vgc-threat-evaluation skill** whenever a pick is justified as a counter/answer/check to something.
5. **Verify numbers via the CLI tools**, don't hand-calculate: `tools/damage-calc/cli.js` for rolls, `optimize-bulk-cli.js` for HP/Def/SpD breakpoints. Solve for the minimum SP a spread actually needs — don't default to an even 32/32/2 split.
6. **Pitfalls gate before finalizing** — `reference/vgc_common_pitfalls.md`. Recurring real misses: duplicate items across the six (hard illegal, not a style choice), assuming Tera is active (it isn't, unless the regulation file says otherwise), assuming a "generic" SP/ability/item without checking the real preset, ladder usage ≠ tournament results, co-occurrence ≠ proven synergy.
7. **Save to `teams/`** using `teams/_TEMPLATE.md`'s format — reasoning per pick, intentional exclusions, bring-6-pick-4 notes. Update an existing team's file in place with a changelog row rather than creating a new file per iteration.

## Common mistakes
- Building strategy around a move/ability the Pokémon doesn't actually have this game (verify learnset before committing to a role)
- Treating a per-Pokémon page's empty "Best Moves" panel as a low-usage signal — it's a client-rendering artifact; check the curated "Champions Teams" section instead
- Forgetting the opponent's weather when it's their side setting it, not yours

See `reference/vgc_teambuilding_methodology.md` (full methodology + citations), `reference/vgc_common_pitfalls.md` (case studies), `reference/vgc_current_regulation.md` (regulation authority).
