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

This table is machine-written by `node tools/meta/cli.js formats --write`
(`upsertManifestRow`/`readManifestRow` in `formats.js`), and those functions
are scoped structurally to this `## Formats` heading — they never read or
write a row under any other heading in this file. Anyone adding a new
hand-written section below should know that boundary exists and rely on it.

| Format code | Regulation | Usage | Win rate | Record | ETag | Last checked | Currency |
|---|---|---|---|---|---|---|---|
| `battledataregmbs3` | M-B | false | true | true | W/"459e-RBQlRZysoWXer8KGrQ0pAg" | 2026-09-08 | regulation |
| `gen9championsvgc2026regmc` | M-C | true | true | true | W/"485d-0LZpiz1c9MFNg38QLLM8bQ" | 2026-09-10 | regulation |

## Why observed behaviour beats documentation, when the two disagree

`check`'s hard gate is now `reference/regulation.md`'s stamped regulation
against the regulation Pikalytics' own **live default format** currently
answers to — the bare `/ai/pokedex` index, no code, which self-declares
whatever the site currently treats as default. That is the site's actual
*behaviour*. `llms-full.txt`'s stated **"Current Default Format"** is
different: it is prose *describing* the site, written by Pikalytics about
itself, and it is known to lag a real rollover (see the recorded
disagreement below, where it kept declaring the M-B slug days into M-C). So
`llms-full.txt` is demoted to **informational** — reported in `check`'s
`warnings`, never a throw. The fix is the same precedence rule this whole
repo runs on (live web search > this repo's files > recall) applied one layer
deeper: prefer what upstream **does** over what upstream **says about
itself**, and prefer that even over the repo's own hand-maintained stamp when
the two disagree.

This distinction (two-source corroboration, gate vs. informational) is a
second, related fix beyond the slug-agreement mechanism this section
originally documented: the "Resolved slug disagreements" table below records
a stamped-slug-vs-`llms-full.txt` pair, and still works exactly as before
for that informational comparison. It does not, and cannot, resolve a
disagreement against the live default endpoint — that gate has no
resolution mechanism by design (see the corroboration principle in
`tools/meta/formats.js`'s `corroborateRegulation` comment): a genuine
regulation mismatch there means the stamp itself needs fixing, not a
recorded exception.

A disagreement resolved via this table is recorded below rather than fixed in
code, because it is not a bug in this tool — it is a fact about Pikalytics on
the date recorded, and it is expected to stop being true whenever Pikalytics
corrects its own documentation. When that happens, `llms-full.txt`'s declared
value will no longer match the row below, `readResolvedDisagreement` will no
longer find a match, and `check` will report an unresolved disagreement again
(informationally — it still never throws for this comparison) until someone
either re-verifies the (now different) disagreement or confirms upstream has
actually converged — never to permanently trusting the stamp because it used
to be right.

## Resolved slug disagreements

Unlike the Formats table above, **this section is hand-written and hand-read**
— it is the record `check` consults when reporting a `llms-full.txt`-vs-
`regulation.md` disagreement (informational only — see "Why observed
behaviour beats documentation" above; this can no longer make `check`
throw). Without a matching row, that disagreement is reported as unresolved
on every run; a row here lets `check` instead report it as an
already-verified, hand-resolved pair (still reported, never silently
dropped). A row here can only ever apply to one specific pair — never
disagreements in general. Add a row only after fetching the disputed endpoint
live yourself and confirming which side is actually correct; never add one
from `llms-full.txt`'s own prose, since that is precisely the side this
section exists to override.

If either column ever stops matching what `check` observes — `llms-full.txt`
starts declaring some third value, or `reference/regulation.md`'s stamp moves
to a new regulation — this row no longer applies and `check` goes back to
reporting the disagreement as unresolved, exactly as if it had never been
recorded (still never a throw — only the separate live-default-endpoint gate
can throw).

| llms-full.txt declared | regulation.md stamped | Chosen | Date | Evidence |
|---|---|---|---|---|
| `battledataregmbs3` | `gen9championsvgc2026regmc` | `gen9championsvgc2026regmc` | 2026-09-09 | `llms-full.txt` states "Current Default Format: battledataregmbs3" and its format table does not list an M-C code at all — stale, an M-B-era default that was never updated for the M-C rollover. Live fetch of the actual endpoint, `https://www.pikalytics.com/ai/pokedex/gen9championsvgc2026regmc`, returns a page self-titled "Pokemon Champions VGC 2026 Reg M-C" with Format Code `gen9championsvgc2026regmc` and real ladder rows (Rillaboom #1 at 36.64% usage) — unambiguously current M-C data. The endpoint's own behaviour is chosen over the documentation page's stale claim. |
