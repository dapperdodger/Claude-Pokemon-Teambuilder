# Damage Calculation (VGC / Pokémon Champions)

Pointer file — this repo doesn't try to reproduce a damage calculator,
just where to find one and the fundamentals for sanity-checking its
output by hand.

## Tool

**Local calculator**: `tools/damage-calc/cli.js` — a Bash-invokable CLI
vendoring the real NCP-VGC-Damage-Calculator engine (see
`tools/damage-calc/VENDOR_MANIFEST.md` for provenance). Run directly:

```bash
node tools/damage-calc/cli.js \
  --attacker Gholdengo --attacker-ability "Good as Gold" --attacker-item "Life Orb" \
  --attacker-nature Modest --attacker-sp sa:32 \
  --defender Garchomp --defender-ability "Rough Skin" --defender-nature Serious \
  --move "Make It Rain"
```

Prints structured JSON including the exact matched Pokémon/move records used
(base stats, computed stats, type, power) so a wrong name match is visible
in the output, not hidden. Real, current-regulation data — not recalled
from training data — since it comes from the vendored files, which are
periodically re-synced against the upstream project (see the vendor
staleness check in `scripts/check_damage_calc_vendor_staleness.sh`).

**Optional presets**: `--attacker-preset "<set name>"` /
`--defender-preset "<set name>"` pull ability/item/nature/SP from the
vendored `SETDEX_GEN10` community preset data as defaults — any of those
you also pass explicitly (e.g. `--attacker-nature`) still overrides the
preset. Coverage is best-effort, not comprehensive — many Champions-legal
Pokémon (e.g. Vileplume) have no preset yet, which produces a clear error
naming that, not a crash. Presets are a starting point, not an
authoritative "current meta" claim — cross-check against a live source
before treating one as the build for a real recommendation (see
`vgc_teambuilding_methodology.md`'s "Live meta lookup" section).

If a Pokémon or move isn't in the vendored Champions-curated data at all,
the CLI's error message says so explicitly, and separately flags whether
it exists in the broader (non-Champions-specific) vendored dex — that
broader data is NEVER used to compute a result, only to make the error
more informative (see this tool's own `VENDOR_MANIFEST.md` for why).

**Item/ability legality flags**: output includes `itemChampionsLegal` and
`abilityChampionsLegal` per Pokémon (under `matchedRecords.attacker` /
`matchedRecords.defender`). `abilityChampionsLegal` is a plain boolean.
`itemChampionsLegal` is a boolean when an item is held, but `null` (not
`false`) when no item is held at all — "no item" isn't an illegal item,
it's the absence of one. These reflect real current Champions
restrictions, not just incomplete vendored data — confirmed via live
search that e.g. Choice Band, Choice Specs, and Assault Vest are
genuinely unavailable in Champions right now (not merely missing from
this tool's data). The calculator still computes a result even when one
of these is `false` (useful for hypotheticals or testing a future-patch
item), but a `false` flag means don't treat that build as usable in a
real current-format recommendation without double-checking.

**Multi-hit moves — `min`/`max` caveat**: for ordinary variable-hit-count
multi-hit moves (Bullet Seed, Icicle Spear, Rock Blast, etc. — real
2-5-hit moves, not a fixed hit count), the output's `min`/`max` is ONE
hit's damage, not a summed total for the move, even though the
human-readable `description` string correctly reports the hit count.
`matchedRecords.move.isVariableMultiHit` is `true` for exactly this class
of move — check it before treating `min`/`max` as "the total damage of
using this move," or you'll silently read a number roughly 2-5x too low.
Fixed-hit-count moves (e.g. always-3-hit moves) are unaffected and sum
correctly.

**Web alternative**: Pikalytics' damage calculator
(https://www.pikalytics.com/damage-calculator) remains a browser-based
option covering the same ground, useful as a second opinion or if the
local tool's vendored data looks stale before a re-vendor happens.

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
| 2026-07-09 | Replaced Pikalytics-only guidance with a local CLI tool (tools/damage-calc/) vendoring the real NCP-VGC-Damage-Calculator engine | tools/damage-calc/VENDOR_MANIFEST.md |
