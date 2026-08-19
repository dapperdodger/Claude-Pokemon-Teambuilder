---
name: vgc-threat-evaluation
description: Use when evaluating whether a specific Pokémon, moveset, or team counters, answers, or beats another — before calling something a counter based on typing alone, or when checking a threat's coverage move.
---

# VGC Threat Evaluation

## Overview
Typing alone doesn't make something a counter — the type chart only covers a Pokémon's own STAB and defensive typing, not what coverage moves it's actually running. A real matchup call needs both typing AND actual current moveset.

## When to use
- Calling a Pokémon a "counter," "check," or "answer" to something
- Asked "what beats X" or "does X counter Y"
- Reasoning about a threat's coverage before it's confirmed via live data
- Invoked from vgc-team-building or vgc-team-refining whenever a counter claim comes up mid-task

## The two checks (both required)
1. **Typing** — raw effectiveness in both directions, from `reference/vgc_type_chart_reference.md`. For dual types, multiply BOTH halves' effectiveness together — a single immunity half overrides the other (2 × 0 = 0), don't reason from one half alone. Check attacking-type row vs. defending-type column, not the mirrored cell: Ground *moves* have no effect on Flying *types*, but Flying moves hit Ground types normally — direction matters.
2. **Actual moveset** — what coverage moves the Pokémon is really running in the current meta (Pikalytics per-mon page — see `reference/vgc_teambuilding_methodology.md`'s "Live meta lookup" section). A Pokémon can be a real answer to something despite bad on-paper typing (via a coverage move), or a bad answer despite good typing (if it isn't actually running the relevant move).

## Verify the number, don't hand-calculate
Run `tools/damage-calc/cli.js` for the actual roll. Pass the real `--weather` flag for the matchup — including the *opponent's* weather, not just your own side's — omitting it has produced swings of 30-50% in past sessions. Don't manually apply a 0.75x spread-move reduction; the CLI already bakes it in.

## Common mistakes
- Multiplying only one half of a dual-type's defensive typing
- Reading a type-immunity direction backwards (attacking row vs. defending column)
- Treating "commonly seen together" usage stats as proof of synergy or of a coverage move being run
- Skipping the weather flag when the *opponent* sets the weather, not you

See `reference/vgc_type_chart_reference.md` (chart), `reference/vgc_teambuilding_methodology.md` (live lookup), `reference/vgc_common_pitfalls.md` (Tinkaton/Poison and Garchomp/Staraptor direction-error case studies, weather cases).
