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

## Formats

| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked |
|---|---|---|---|---|---|---|
| _(populated by `meta formats --write`)_ | | | | | | |
