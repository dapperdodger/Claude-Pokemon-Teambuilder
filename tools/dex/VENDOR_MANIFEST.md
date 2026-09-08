# Vendor Manifest — Pokémon Showdown Champions learnsets

Source: https://github.com/smogon/pokemon-showdown
License: MIT (see upstream LICENSE)

## Pin

Commit: `cc17bb7854931ce858ebb1836b9a4ea9418aa258` (last commit to touch `data/mods/champions/learnsets.ts`, 2026-07-09)
Regulation: `M-B`

Both fields are load-bearing. The commit answers "is this behind upstream";
the regulation answers "is this describing the rules we are playing under".
`.claude/hooks/vendor-staleness.js` reads both and reports on either.

## Why this is a separate manifest from tools/damage-calc/VENDOR_MANIFEST.md

Different upstream, and — the operative reason — the two vendors go stale
independently. One manifest per upstream keeps "the roster is current" and
"the move pools are current" as two separate, separately-reportable claims.

## Vendored files

- `vendor/learnsets.js` <- `data/mods/champions/learnsets.ts`

Byte-for-byte upstream **except line 1**, which is rewritten from

    export const Learnsets: import('../../../sim/dex-species').ModdedLearnsetDataTable = {

to

    var CHAMPIONS_LEARNSETS = {

so the file can be `vm`-loaded the same way the NCP vendor files are. This
mirrors the `side.js` "verbatim extract + wrapper" precedent documented in
tools/damage-calc/VENDOR_MANIFEST.md. No other byte is modified.

## Learnsets are regulation-variant — this pin expires

On 2026-06-17 (the M-B start date) upstream `learnsets.ts` changed by
+2019/-353 lines. Regulations add species **and cut existing move pools**, so
a stale pin can report a move as legal that the current regulation removed.

Worse, the base mod is updated **in place** — there is no per-regulation copy
of the file. A stale pin therefore serves complete, normal-looking, wrong data
rather than failing. This is the same hazard the vgc-regulation-transition
skill documents for the Pikalytics format slug (step 5b).

Re-vendoring at a regulation rollover is a required step, not a judgement call.

## Re-vendoring

1. Read the SHA of the last commit that actually touched the vendored file —
   NOT master HEAD, which moves on unrelated commits and makes drift
   detection permanently noisy:
   `curl -s "https://api.github.com/repos/smogon/pokemon-showdown/commits?path=data/mods/champions/learnsets.ts" | grep '"sha"' | head -1`
2. Re-download: `curl -sL "https://raw.githubusercontent.com/smogon/pokemon-showdown/<sha>/data/mods/champions/learnsets.ts" -o tools/dex/vendor/learnsets.js`
3. Re-apply the line-1 transform above.
4. Update **both** the Commit and Regulation fields in this file, and add a changelog row.
5. Run `npm test`. `tools/dex/tests/learnset-coverage-invariant.test.js` fails
   loudly if the roster now contains species the learnsets do not cover — that
   is a real finding, not a broken test.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-07 | Initial vendor at 6b4bc34e, regulation M-B | https://github.com/smogon/pokemon-showdown |
| 2026-09-07 | Re-pinned Commit to `cc17bb7854931ce858ebb1836b9a4ea9418aa258` — the last commit that actually touched `data/mods/champions/learnsets.ts` (2026-07-09) — and scoped `.claude/hooks/vendor-staleness.js`'s upstream check to that path instead of master HEAD, since master HEAD drifts on unrelated commits and made "behind upstream" permanent noise. Content unchanged: no commit between cc17bb78 and the previous 6b4bc34e pin touched this path, so the vendored bytes are identical. | https://github.com/smogon/pokemon-showdown |
