# Vendor Manifest — NCP VGC Damage Calculator

Source: https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator
License: MIT (see upstream LICENSE)

## Vendored files (unmodified, byte-for-byte)

Commit: `0e766b01c951d4de05c4af2a3566a0d5c7c8372d` (main branch HEAD, 2026-09-09)
Regulation: `M-C`

- `pokedex.js` <- `script_res/pokedex.js`
- `move_data.js` <- `script_res/move_data.js`
- `ability_data.js` <- `script_res/ability_data.js`
- `item_data.js` <- `script_res/item_data.js`
- `type_data.js` <- `script_res/type_data.js`
- `nature_data.js` <- `script_res/nature_data.js`
- `stat_data.js` <- `script_res/stat_data.js` (reference only, not required at runtime — see calc.js's own stat formula module)
- `damage_MASTER.js` <- `script_res/damage_MASTER.js`
- `damage_SV.js` <- `script_res/damage_SV.js`
- `setdex_ncp-g10.js` <- `script_res/setdex_ncp-g10.js` (`SETDEX_GEN10` —
  Champions preset builds, used only for the CLI's optional `--*-preset`
  flag, Task 5. Best-effort community-curated coverage, not comprehensive —
  e.g. Vileplume is Champions-legal per `POKEDEX_CHAMPIONS` but has no
  preset entry here as of this vendoring; that's expected.)

## Vendored files (verbatim extract, not the whole source file)

- `side.js` <- the `Side` function only, from `script_res/ap_calc.js` (source
  lines 2148-2176 at the pinned commit). Extracted rather than the whole
  file because the rest of `ap_calc.js` has top-level DOM/jQuery side effects
  (event bindings, `localStorage` reads) that throw outside a browser. The
  `Side` function itself has none. Verified byte-for-byte identical to the
  upstream body except for the added `module.exports.Side = ` wrapper (and
  the resulting trailing `;` on the closing brace).

## Not vendored

- `ap_calc.js` (except the `Side` extract above) — DOM-orchestration layer,
  replaced by this repo's own `calc.js`/`cli.js`.
- `ko_chance.js`, `statuscalc.js` — not used by this tool's initial scope.
- `damage_xy.js`, `damage_dpp.js`, `damage_rse.js`, `damage_gsc.js`,
  `damage_rby.js` — legacy-generation calculators, out of scope (Champions/
  gen 10 only, per this repo's own scope boundaries).

## Loading approach: `vm` context, not plain `require`

The vendored data/engine files declare bare `var X = ...` at top level, not
`module.exports`. Empirically verified (2026-07-09) via:

```
node -e "require('./tools/damage-calc/vendor/pokedex.js'); console.log(typeof POKEDEX_CHAMPIONS)"
```

This printed `undefined` — plain `require()` runs the file without throwing,
but Node's CommonJS module wrapper means top-level `var` declarations do
**not** leak onto `global`. Because of this, `tools/damage-calc/load-vendor.js`
runs the vendor files through Node's `vm` module against a single shared
sandbox context object, so their top-level `var`s land as properties on that
object (`getVendor()` returns it). All later tasks that need vendor data
(Tasks 3 and 4) must consume it via `require('./load-vendor').getVendor()`,
not `global.*` — do not mix approaches.

`side.js` is the one exception: it explicitly does `module.exports.Side = ...`
so it is `require`d directly like a normal Node module, independent of the
`vm` question.

## Re-vendoring

This is a deliberate, manual step — not automated. To re-sync:
1. Check the current upstream commit: `curl -s https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main | grep sha`
2. Re-download each file listed above at the new commit.
3. Re-extract `Side` from the new commit's `ap_calc.js` if it changed.
4. Update the commit SHA in this file and add a changelog row below.
5. Run the full test suite (`node --test tools/damage-calc/tests/`) before committing.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Initial vendor from commit dfbf020d4ed7df8921c6e11bbaa23410f6ca1448 | https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator |
| 2026-09-07 | Added `Regulation: \`M-B\`` pin, matching tools/dex/VENDOR_MANIFEST.md's format, so roster regulation drift is reportable by `.claude/hooks/vendor-staleness.js` the same way learnset drift already is | (docs only, no re-vendor) |
| 2026-09-09 | Re-vendored for M-B → M-C rollover. Re-pinned Commit to `0e766b01c951d4de05c4af2a3566a0d5c7c8372d` (main HEAD) and Regulation to `M-C`. `pokedex.js`, `move_data.js`, `ability_data.js`, `item_data.js`, and `damage_MASTER.js` changed upstream (M-C additions: 24 new species, 6 new Megas including the 3 "Z Mega" reworks, new items — Rocky Helmet, Air Balloon, Terrain Extender, all four terrain Seeds — and M-C move-power/flag updates). `type_data.js`, `nature_data.js`, `stat_data.js`, `damage_SV.js`, `setdex_ncp-g10.js` unchanged. Also re-extracted `side.js`'s `Side` function — its signature grew 6 new trailing parameters upstream (`isLeechSeed`, `isIngrain`, `isCurse`, `isBinding`, `isAquaRing`, `isNightmare`); re-extracted verbatim from the new commit's `ap_calc.js` (now source lines 2164-2198) with the same `module.exports.Side =` wrapper. | https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator |
