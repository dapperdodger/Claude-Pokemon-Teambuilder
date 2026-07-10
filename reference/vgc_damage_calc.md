# Damage Calculation (VGC / Pokémon Champions)

Pointer file — this repo doesn't try to reproduce a damage calculator,
just where to find one and the fundamentals for sanity-checking its
output by hand.

## Tool

**Pikalytics Damage Calculator**: https://www.pikalytics.com/damage-calculator

Confirmed (2026-07-09, fetched directly) to be Champions-specific — it has
a ruleset toggle for current Champions Stat Point assumptions rather than
standard Generation 9 defaults, and accounts for weather, terrain,
abilities, held items, Mega Evolution, spread-move damage reduction,
Trick Room, screens, and other field effects.

It's a client-side interactive tool — Claude Code cannot drive it
directly (WebFetch only returns the page shell, not a computed result for
specific inputs, since the calculation runs in the browser based on your
selections). Use it directly in a browser for anything that needs to be
right, or do the math manually using the fundamentals below when a
specific damage roll just needs sanity-checking inline.

## Damage formula fundamentals

Standard Pokémon damage formula (structurally unchanged across
generations; re-verify if Champions output looks inconsistent with it):

```
Damage = floor(floor(floor(2 x Level / 5 + 2) x Power x Attack / Defense) / 50 + 2)
         x modifiers
```

`modifiers` is the product of, roughly in this order: targets (0.75 in
doubles if the move is a spread move hitting multiple targets — see
`vgc_common_pitfalls.md`'s doubles-specific traps), weather, critical hit,
a random factor (0.85-1.00, applied last), STAB (1.5x, or 2x for
Adaptability), type effectiveness (from `vgc_type_chart_reference.md`),
burn (0.5x for physical moves if the attacker is burned, unless it has
Guts or is using Facade), and other item/ability modifiers.

Attack and Defense in the formula use the Champions Stat Points (SP)
formula from `vgc_current_regulation.md`'s "Stat system" section, not the
old EV-based one.

This is enough to sanity-check a suspicious number, not to hand-calculate
full damage rolls as a matter of course — use the Pikalytics tool above
for anything a recommendation actually depends on, especially once
terrain/weather/abilities start stacking.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file; confirmed Pikalytics damage calculator is Champions-specific and what it accounts for | https://www.pikalytics.com/damage-calculator (fetched and confirmed this session) |
