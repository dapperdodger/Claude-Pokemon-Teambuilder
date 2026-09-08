# Pikalytics agent-API manifest

Pinned ETags and detected capabilities, written by `meta formats`.
Purpose is the same as `tools/dex/VENDOR_MANIFEST.md`: make "has the upstream
changed since we last cited it?" answerable.

**Do not hand-edit.** Regenerate with `node tools/meta/cli.js formats --write`.

## Why ETags rather than the page's own date

The API's `Data Date` field is a **global constant** — every format reports
`2026-05`, including VGC 2025 Regulation I and the preview dataset. JSON-LD
`dateModified` is page-render time, not data time. The ETag is the only real
change-detection signal available.

## Currency

`formats.js` classifies each format's currency into one of three states
(see `reference/meta-lookup.md` for the full explanation):

- `regulation` — the label carries a regulation token; current iff it
  matches `reference/regulation.md`'s active one.
- `rolling` — a rolling window over current play, from a curated list
  (`ROLLING_WINDOW_FORMATS` in `formats.js`). Always current.
- `unknown` — cannot be determined. Never current, and never inferred from
  the absence of a regulation token — a format only becomes `rolling` when
  named in that list by hand, after being confirmed live.

## Formats

| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked | Currency |
|---|---|---|---|---|---|---|---|
| `battledataregmbs3` | M-B | false | true | true | W/"459e-RBQlRZysoWXer8KGrQ0pAg" | 2026-09-08 | regulation |
