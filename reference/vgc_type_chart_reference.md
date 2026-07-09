# Type Effectiveness Reference (Gen 6+ chart, current for Champions/VGC)

Source: pokemondb.net/type (verified against Bulbapedia), pulled July 2026.
Cross-checked cell-by-cell against the standard Gen 6+ chart on 2026-07-09 — no errors found.

## Full chart — rows = attacking type, columns = defending type
2 = super effective, ½ = not very effective, 0 = no effect, blank = normal (1x)

| ATK \ DEF | Nor | Fir | Wat | Ele | Gra | Ice | Fig | Poi | Gro | Fly | Psy | Bug | Roc | Gho | Dra | Dar | Ste | Fai |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Normal   |   |   |   |   |   |   |   |   |   |   |   |   | ½ | 0 |   |   | ½ |   |
| Fire     |   | ½ | ½ |   | 2 | 2 |   |   |   |   |   | 2 | ½ |   | ½ |   | 2 |   |
| Water    |   | 2 | ½ |   | ½ |   |   |   | 2 |   |   |   | 2 |   | ½ |   |   |   |
| Electric |   |   | 2 | ½ | ½ |   |   |   | 0 | 2 |   |   |   |   | ½ |   |   |   |
| Grass    |   | ½ | 2 |   | ½ |   |   | ½ | 2 | ½ |   | ½ | 2 |   | ½ |   | ½ |   |
| Ice      |   | ½ | ½ |   | 2 | ½ |   |   | 2 | 2 |   |   |   |   | 2 |   | ½ |   |
| Fighting | 2 |   |   |   |   | 2 |   | ½ |   | ½ | ½ | ½ | 2 | 0 |   | 2 | 2 | ½ |
| Poison   |   |   |   |   | 2 |   |   | ½ | ½ |   |   |   | ½ | ½ |   |   | 0 | 2 |
| Ground   |   | 2 |   | 2 | ½ |   |   | 2 |   | 0 |   | ½ | 2 |   |   |   | 2 |   |
| Flying   |   |   |   | ½ | 2 |   | 2 |   |   |   |   | 2 | ½ |   |   |   | ½ |   |
| Psychic  |   |   |   |   |   |   | 2 | 2 |   |   | ½ |   |   |   |   | 0 | ½ |   |
| Bug      |   | ½ |   |   | 2 |   | ½ | ½ |   | ½ | 2 |   |   | ½ |   | 2 | ½ | ½ |
| Rock     |   | 2 |   |   |   | 2 | ½ |   | ½ | 2 |   | 2 |   |   |   |   | ½ |   |
| Ghost    | 0 |   |   |   |   |   |   |   |   |   | 2 |   |   | 2 |   | ½ |   |   |
| Dragon   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | 2 |   | ½ | 0 |
| Dark     |   |   |   |   |   |   | ½ |   |   |   | 2 |   |   | 2 |   | ½ |   | ½ |
| Steel    |   | ½ | ½ | ½ |   | 2 |   |   |   |   |   |   | 2 |   |   |   | ½ | 2 |
| Fairy    |   | ½ |   |   |   |   | 2 | ½ |   |   |   |   |   |   | 2 | 2 | ½ |   |

Dual-type defense = multiply both columns together (e.g. Fire vs Rock/Flying = ½ × 1 = ½, so Rock/Flying RESISTS Fire).

This file is type-effectiveness data only. Ability/move-specific mechanics (priority interactions, immunity-granting abilities, etc.) live in `vgc_ability_move_mechanics.md`. Teambuilding process/methodology notes live in `vgc_teambuilding_methodology.md`.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo; cross-checked every cell against the standard Gen 6+ chart, no errors found | pokemondb.net/type, Bulbapedia (verified during migration) |
