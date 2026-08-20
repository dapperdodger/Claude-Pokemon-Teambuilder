# Type Effectiveness Reference (Gen 6+ chart, current for Champions/VGC)

Source: pokemondb.net/type (verified against Bulbapedia), pulled July 2026.

**Format note (2026-08-19):** this used to be an 18x18 attacker-row ×
defender-column grid. It was replaced with the by-attacking-type list below
after repeated in-session errors traced back to miscounting grid columns
(e.g. reading the Steel column as Fairy, or vice versa) — a short "what
does this type hit for 2x/0.5x/0x" list only requires scanning ~5 words,
not counting position across 18 columns. Every entry below was
cross-checked line-by-line against the old grid before it was removed (no
discrepancies found — this was a pure format problem, not a data error),
and both independently match the standard Gen 6+ chart from a second pass.

## How to use this

**Each type's own section already tells you what it does to every other
type when it's the attacker.** Look up the *attacking* move's type, not the
defender's type — effectiveness isn't symmetric (Ghost moves have no effect
on Normal-types, but Normal moves hit Ghost-types for 0 too... except that's
a coincidence; Fighting has no effect on Ghost, but Ghost hits Fighting
completely normally, not 0x). Always look up the attacker's own section.

**Dual-type defender = look up the attacking type's entry, find each of the
defender's two types in it, multiply the two multipliers together.**
Example: checking a Fire-type move against a Rock/Flying defender — open
Fire's section, Rock is listed under "0.5x", Flying isn't listed anywhere
(so 1x) → 0.5 × 1 = 0.5, resisted. A type not mentioned in any of a
section's three lists is always 1x (normal) against that attacking type.

If one of the two defending types is a 0x (immune) entry, the combined
result is always 0 regardless of the other type's multiplier — immunity
always wins the multiplication.

---

## Normal
- **2x:** —
- **0.5x:** Rock, Steel
- **0x:** Ghost

## Fire
- **2x:** Grass, Ice, Bug, Steel
- **0.5x:** Fire, Water, Rock, Dragon
- **0x:** —

## Water
- **2x:** Fire, Ground, Rock
- **0.5x:** Water, Grass, Dragon
- **0x:** —

## Electric
- **2x:** Water, Flying
- **0.5x:** Electric, Grass, Dragon
- **0x:** Ground

## Grass
- **2x:** Water, Ground, Rock
- **0.5x:** Fire, Grass, Poison, Flying, Bug, Dragon, Steel
- **0x:** —

## Ice
- **2x:** Grass, Ground, Flying, Dragon
- **0.5x:** Fire, Water, Ice, Steel
- **0x:** —

## Fighting
- **2x:** Normal, Ice, Rock, Dark, Steel
- **0.5x:** Poison, Flying, Psychic, Bug, Fairy
- **0x:** Ghost

## Poison
- **2x:** Grass, Fairy
- **0.5x:** Poison, Ground, Rock, Ghost
- **0x:** Steel

## Ground
- **2x:** Fire, Electric, Poison, Rock, Steel
- **0.5x:** Grass, Bug
- **0x:** Flying

## Flying
- **2x:** Grass, Fighting, Bug
- **0.5x:** Electric, Rock, Steel
- **0x:** —

## Psychic
- **2x:** Fighting, Poison
- **0.5x:** Psychic, Steel
- **0x:** Dark

## Bug
- **2x:** Grass, Psychic, Dark
- **0.5x:** Fire, Fighting, Poison, Flying, Ghost, Steel, Fairy
- **0x:** —

## Rock
- **2x:** Fire, Ice, Flying, Bug
- **0.5x:** Fighting, Ground, Steel
- **0x:** —

## Ghost
- **2x:** Psychic, Ghost
- **0.5x:** Dark
- **0x:** Normal

## Dragon
- **2x:** Dragon
- **0.5x:** Steel
- **0x:** Fairy

## Dark
- **2x:** Psychic, Ghost
- **0.5x:** Fighting, Dark, Fairy
- **0x:** —

## Steel
- **2x:** Ice, Rock, Fairy
- **0.5x:** Fire, Water, Electric, Steel
- **0x:** —

## Fairy
- **2x:** Fighting, Dragon, Dark
- **0.5x:** Fire, Poison, Steel
- **0x:** —

---

This file is type-effectiveness data only. Ability/move-specific mechanics
(priority interactions, immunity-granting abilities, etc.) live in
`vgc_ability_move_mechanics.md`. Teambuilding process/methodology notes
live in `vgc_teambuilding_methodology.md`.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo; cross-checked every cell against the standard Gen 6+ chart, no errors found | pokemondb.net/type, Bulbapedia (verified during migration) |
| 2026-08-19 | Replaced the 18x18 attacker-row/defender-column grid with a by-attacking-type list (2x/0.5x/0x per type) after a session with several real grid-column-miscounting errors (e.g. misreading Water-vs-Steel as resisted when it's actually normal, confusing which column was Fairy vs Steel). Every entry cross-checked against the old grid before removal — no data changes, format only | User feedback ("you seem to regularly get type stuff wrong... something easier for you to read"); cross-checked line-by-line against the prior grid, both independently verified against the standard Gen 6+ chart |
