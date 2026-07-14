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

**Multi-hit moves — `min`/`max` caveat**: for both ordinary variable-hit-count
multi-hit moves (Bullet Seed, Icicle Spear, Rock Blast, etc. — real
2-5-hit moves) AND fixed-2-hit moves (Dual Wingbeat, Double Hit, Twin
Beam — real always-2-hit moves, carried as a numeric `hitRange` in the
vendored data rather than a `[min, max]` array), the output's `min`/`max`
is ONE hit's damage, not a summed total for the move, even though the
human-readable `description` string correctly reports the hit count.
`matchedRecords.move.isVariableMultiHit` is `true` for both of these
classes of move — check it before treating `min`/`max` as "the total
damage of using this move," or you'll silently read a number roughly
2-5x too low. The only moves the underlying engine genuinely auto-sums
into a correct total (and where `isVariableMultiHit` is correctly `false`)
are Parental Bond attacks and `isTripleHit`-flagged moves (Triple Axel,
Triple Kick — always exactly 3 hits).

## Bulk optimization: HP vs. Def/SpD SP allocation

**`tools/damage-calc/optimize-bulk.js`** (CLI: `optimize-bulk-cli.js`) finds
the real minimum-SP HP/Def/SpD spread that survives one or more named
attacks, by brute-forcing every legal SP combination against the actual
damage-calc engine — not by hand-deriving or assuming a split.

**Why this needs its own tool, not just a mental rule of thumb**: the
damage formula above makes damage proportional to `Attack / Defense`, so
Defense has *diminishing* returns (each point matters less as Defense
grows), while HP is flat/linear (each point always absorbs exactly one
more point of damage, and HP never gets a nature multiplier). The correct
split between HP and Def/SpD therefore depends on the defender's own base
stats and the attacker's specific power — there's no universal ratio.
Real example that motivated building this: for Aegislash-Shield surviving
Kingambit's real Kowtow Cleave, the true minimum-total-SP spread is **24
HP / 1 Def**, not an even split and not "max Def" — Aegislash's base Def
(150) is already so high that further investment barely reduces incoming
damage, while its base HP (60) is comparatively low.

```bash
# Single threat (mirrors cli.js's flag style):
node tools/damage-calc/optimize-bulk-cli.js \
  --defender "Aegislash-Shield" --defender-ability "Stance Change" --defender-nature "Impish" \
  --defender-fixed-sp "sd:2" --budget 34 \
  --attacker "Kingambit" --attacker-preset "Black Glasses Offense" --move "Kowtow Cleave"

# Multiple threats at once (the "must survive a real physical AND a real
# special attack" case) — pass a JSON file instead of fighting shell
# quoting across bash/PowerShell:
node tools/damage-calc/optimize-bulk-cli.js \
  --defender "Corviknight" --defender-ability "Mirror Armor" --defender-nature "Impish" \
  --budget 34 --threats-file path/to/threats.json
# threats.json: [{ "attacker": {...}, "move": { "name": "..." }, "field"?: {...} }, ...]
```

Returns `{ solvable, minTotal, winners: [...] }` — every (hp, df, sd)
combination tying the true minimum total SP that survives ALL given
threats (there can be more than one, e.g. due to stat-formula flooring).
If nothing within the given budget/32-cap survives, returns
`{ solvable: false, closest: [...] }` instead of silently picking a losing
spread — matching `vgc_teambuilding_methodology.md`'s "some worst cases
have no SP-allocation fix at all" guidance. This is the concrete tool
`scripts/check_sp_spread_optimization.js`'s hook expects a team file's
round (0/2/32) HP/Def/SpD spreads to actually have been run through before
being presented as justified — see that hook and
`vgc_teambuilding_methodology.md`'s "SP spread allocation" section.

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

**`tools/damage-calc/cli.js`'s output already has the 0.75x spread-move
reduction applied — do not multiply its `min`/`max` by 0.75 again.**
`calc.js` hardcodes the Side's format to `'Doubles'` when calling the
vendored engine, and the vendored engine's `calcGeneralMods` applies the
0.75x multiplier internally whenever the move being tested has
`isSpread: true` in the vendored move data. Confirmed via a controlled
A/B test (2026-07-14): forcing a copy of the same call to `'Singles'`
produced a ~33% higher result (Charizard-Y Heat Wave vs. Mega Camerupt:
63-75 real Doubles output vs. 84-99 Singles-forced — ratio ≈0.75). A past
session's process-lesson case study in `vgc_common_pitfalls.md` had this
backwards (manually re-applying 0.75x to the tool's already-correct
output), understating real damage by ~25% — see that file's corrected
"Spread moves" entry for the full story.

Attack and Defense in the formula use the Champions Stat Points (SP)
formula from `vgc_current_regulation.md`'s "Stat system" section, not the
old EV-based one.

This is enough to sanity-check a suspicious number, not to hand-calculate
full damage rolls as a matter of course — use the local CLI (or Pikalytics
as a second opinion) for anything a recommendation actually depends on,
especially once terrain/weather/abilities start stacking.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file; confirmed Pikalytics damage calculator is Champions-specific and what it accounts for | https://www.pikalytics.com/damage-calculator (fetched and confirmed this session) |
| 2026-07-09 | Replaced Pikalytics-only guidance with a local CLI tool (tools/damage-calc/) vendoring the real NCP-VGC-Damage-Calculator engine | tools/damage-calc/VENDOR_MANIFEST.md |
| 2026-07-10 | Corrected multi-hit `min`/`max` caveat: fixed-2-hit numeric-`hitRange` moves (Dual Wingbeat, Double Hit, Twin Beam) are per-hit-only too, not "unaffected and sum correctly" — only Parental Bond and `isTripleHit` moves genuinely auto-sum. Also fixed a stale "use Pikalytics for anything a recommendation depends on" sentence that contradicted the file's own local-CLI-primary framing | tools/damage-calc/calc.js `isVariableMultiHit` fix + this file's own "Web alternative" section, this session |
| 2026-07-14 | Added explicit note that `tools/damage-calc/cli.js` already applies the doubles 0.75x spread-move reduction internally — manually reapplying it is a double-reduction, confirmed via a controlled Singles-vs-Doubles A/B test. Also added "Bulk optimization" section documenting the new `tools/damage-calc/optimize-bulk.js`/`optimize-bulk-cli.js` tool (brute-force search for the true minimum HP/Def/SpD SP spread against named threats), built after discovering Def/SpD have diminishing returns (damage ∝ 1/Def) while HP is linear, so no single equation reliably gives the optimal split per-Pokemon | A/B test this session (Heat Wave vs. Mega Camerupt, 63-75 Doubles vs. 84-99 Singles-forced); brute-force verification (Aegislash-Shield vs. Kingambit Kowtow Cleave, true minimum 24 HP/1 Def) |
