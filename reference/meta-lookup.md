# Meta Usage Lookup (VGC / Pokémon Champions)

Pointer file for `tools/meta` — a CLI that reads Pikalytics' documented
**agent API** (`/ai/pokedex/...`, plain structured markdown meant for exactly
this) instead of scraping or hand-fetching the human site. Prints one JSON
object per invocation, the same shape as `tools/dex`.

Scope fence, same as `reference/damage-calc.md`'s for its own tool: this file
documents how to call the CLI and what its output means, not "what's good
right now" — that's the `vgc-meta-lookup` skill's job, using this tool.

## Contents

- [Command surface](#command-surface)
- [Which upstream carries which metric](#which-upstream-carries-which-metric)
- [Usage is reported per population, never blended](#usage-is-reported-per-population-never-blended)
- [Freshness: Data Date is fake, the ETag is real](#freshness-data-date-is-fake-the-etag-is-real)
- [The Mega naming convention — opposite of `tools/damage-calc`](#the-mega-naming-convention--opposite-of-toolsdamage-calc)
- [What `check` verifies that the other commands don't](#what-check-verifies-that-the-other-commands-dont)
- [Changelog](#changelog)

## Command surface

```
node tools/meta/cli.js formats [--write]      list formats, capabilities, regulation
node tools/meta/cli.js mon <Species> [--format <code>]   per-Pokemon data
node tools/meta/cli.js usage [--format <code>]           ranked list
node tools/meta/cli.js check                  slug agreement and ETag drift
```

`--format <code>` is optional everywhere except `check`; when omitted the
CLI uses the `**Pikalytics slug:**` stamped in `reference/regulation.md`
(the same stamp `vgc-meta-lookup` used to eyeball by hand).

**`formats`** — reports the default format's label, regulation, whether it's
the *current* regulation, and its detected capabilities. `--write` upserts a
row into `tools/meta/META_MANIFEST.md`.

```bash
$ node tools/meta/cli.js formats
{
  "code": "battledataregmbs3",
  "label": "Pokemon Champions VGC 2026 Reg M-B S3 Ranked Battle Data",
  "regulation": "M-B",
  "current": true,
  "capabilities": { "usage": false, "winRate": true, "record": true },
  "etag": "W/\"459e-RBQlRZysoWXer8KGrQ0pAg\"",
  "checked": "2026-09-08"
}
```
(live output, this session)

**`usage [--format <code>]`** — the top-50-by-usage table for one format, as
`{rank, species, usage, winRate, record}` rows. `usage`/`winRate` are each
`{value, reason}`: `value` is `null` with a `reason` when the upstream
doesn't carry that metric at all, never a bare `0` (a real `0%` and "not
measured" must stay distinguishable — see `tools/meta/validate.js`).

```bash
$ node tools/meta/cli.js usage
{
  "format": "battledataregmbs3", "regulation": "M-B", "current": true,
  "warnings": ["this format's upstream carries no usage weighting — use a tournament or Showdown format for usage"],
  "rows": [
    { "rank": 1, "species": "Garchomp", "usage": { "value": null, "reason": "..." },
      "winRate": { "value": 48.05, "reason": null }, "record": "10833-11714-41" },
    ...
  ]
}
```
(live output, this session — ladder format, so `usage` is `null` on every row)

**`mon <Species> [--format <code>]`** — one Pokémon's usage, win rate,
record, and `{name, percent}` lists for moves/abilities/items/teammates.

```bash
$ node tools/meta/cli.js mon "Garchomp" --format championstournaments
{
  "format": "championstournaments",
  "usage": { "value": 30, "reason": null },
  "winRate": { "value": 48.297, "reason": null },
  "record": "10260-10985-40",
  "moves": [ { "name": "Dragon Claw", "percent": { "value": 93.75, "reason": null } }, ... ],
  ...
}
```
(live output, this session, matching `tools/meta/tests/fixtures/tournaments-garchomp.md`)

**`check`** — the only command that cross-verifies the format code against
what Pikalytics itself currently declares as default (via `/llms-full.txt`'s
`**Format Code**`), rather than trusting the local stamp. Throws a hard error
on disagreement instead of silently preferring either source. It also reads
`tools/meta/META_MANIFEST.md` back and compares the pinned ETag against the
live one, returning `pinnedEtag` and `etagStatus` (`"unpinned"` — this format
has never been written with `formats --write`; `"unchanged"`; or `"changed"`
— upstream has moved since the pin). See
["What `check` verifies"](#what-check-verifies-that-the-other-commands-dont)
below for why this matters and what it does *not* cover.

## Which upstream carries which metric

Copied from the tool's own design comment (`tools/meta/formats.js`): **which
metrics a format carries is a property of the upstream data source, not of
Pikalytics as a site.** Confirmed for the two formats this repo has fixtures
and live data for; the Showdown row is the tool's own documented assumption,
not independently re-verified against a live Showdown-sourced format in this
session.

| Upstream | Example format code | Usage | Win rate | W-L-D record |
|---|---|---|---|---|
| Official ranked ladder (HOME Battle Stadium) | `battledataregmbs3` | No | Yes | Yes |
| RK9/Limitless tournament team sheets | `championstournaments` | Yes | Yes | Yes |
| Showdown-sourced formats | *(none fixtured here)* | Yes | No | No |

- **Ladder confirmed live** (`node tools/meta/cli.js formats`, this session):
  `battledataregmbs3` → `{ "usage": false, "winRate": true, "record": true }`.
- **Tournament confirmed live**: Garchomp in `championstournaments` reports
  real `usage: 30` and `winRate: 48.297` together (see the `mon` example
  above) — tournament team sheets carry both because RK9/Limitless log full
  six-Pokémon rosters, not individual battle outcomes.
- **Tournament data is a rolling window, not a season total.** The same
  index page states it directly: "Built from approximately the last 2 weeks
  of qualifying tournaments above a minimum size threshold for relevance"
  (`tools/meta/tests/fixtures/tournaments-index.md`).

So "what is used" and "what is winning" are genuinely different questions,
answered by different populations — never assume a format answers both just
because one number came back non-null.

## Usage is reported per population, never blended

Each call is scoped to exactly one format code, and the tool never merges
two. `formats.js`'s own reasoning: the supported list mixes different
**regulations** (M-A vs. M-B) *and* different **eras** entirely
(`gen9vgc2025regi` is Scarlet/Violet, not Champions) — every one of them
returns clean, confident-looking numbers, and pulling several formats at
once for a single answer makes it easy to blend populations that shouldn't
be combined without noticing.

Practical consequence: a ladder win rate and a tournament usage figure for
the same Pokémon are not two views of one number — they come from different
players, different match formats (Bo1 vs. Bo3), and (for tournaments) a
~2-week rolling window rather than the whole regulation. Report them
separately, labelled by format, the way the CLI itself does (`format` and
`regulation` are stamped on every response).

## Freshness: Data Date is fake, the ETag is real

Do not use the page's own `Data Date` field as a freshness signal — it is a
**global constant**. Every format reports `2026-05`, confirmed directly:
`tools/meta/tests/fixtures/ranked-raichu.md` (ladder) and
`tools/meta/tests/fixtures/tournaments-garchomp.md` (tournament) both show
`**Data Date** | 2026-05` despite being different formats with different
underlying data. JSON-LD `dateModified`, where present, is page-render time,
not data time.

The **ETag** on the HTTP response is the only real change-detection signal
(`tools/meta/fetch.js`'s own header comment). `tools/meta/META_MANIFEST.md`
pins one per format, refreshed by `meta formats --write`, mirroring how
`tools/dex/VENDOR_MANIFEST.md` pins learnset staleness. Live example this
session: `battledataregmbs3` → `W/"459e-RBQlRZysoWXer8KGrQ0pAg"`.

## The Mega naming convention — opposite of `tools/damage-calc`

`tools/meta` needs the **bare species** (`Staraptor`) or Pikalytics' own
hyphenated form (`Staraptor-Mega`, `Raichu-Mega-Y`) — `megas.resolve()`
handles either. This is the **opposite** of `tools/damage-calc`, which needs
`"Mega Staraptor"`.

Why: the ladder's upstream logs battles against the **base species**, with
the Mega Stone recorded as an ordinary held item — there is no separate
"Mega Staraptor" population to query. Confirmed live this session:
`node tools/meta/cli.js mon "Staraptor-Mega"` resolves to `Staraptor` and
reports `megaShare: { stone: "Staraptite", ofSpecies: { value: 94.5 }, ...
}` — 94.5% of all real Staraptor usage is the Mega. Asking Pikalytics'
per-entity page for the Mega name directly (what a naive lookup would try)
returns a real, well-formed page with `undefined%` in every field instead —
confirmed via the vendored fixture for the equivalent case,
`tools/meta/tests/fixtures/ranked-raichu-mega-y.md` (Raichu-Mega-Y: `Usage`
N/A, `Win Rate` N/A, `Common Abilities` "No Guard: undefined%").

Full pitfall write-up, covering both tools and both failure directions:
`reference/pitfalls.md`'s "Data source pitfalls" section.

## What `check` verifies that the other commands don't

`mon`, `usage`, and `formats` all resolve the default format code from
`reference/regulation.md`'s stamped `**Pikalytics slug:**` and trust it.
Only `check` calls out to Pikalytics' own `/llms-full.txt` and compares its
declared default `**Format Code**` against that same stamp, throwing a hard
error on disagreement rather than silently preferring either source
(`formats.js`'s `check()`).

`check` is also the only command that reads `tools/meta/META_MANIFEST.md`
back rather than only writing it. It compares the live ETag of the default
format against the ETag pinned by the most recent `formats --write` for that
same code, returning:

```bash
$ node tools/meta/cli.js check
{
  "slug": "battledataregmbs3", "agrees": true,
  "etag": "W/\"459e-RBQlRZysoWXer8KGrQ0pAg\"",
  "pinnedEtag": null, "etagStatus": "unpinned",
  ...
}
```
(live output, this session — `unpinned` because `formats --write` had never
been run for this code)

`etagStatus` is one of `"unpinned"` (this format code has never been written
to the manifest — distinct from "checked and unchanged", since there is
nothing to compare against), `"unchanged"` (the pin still matches upstream),
or `"changed"` (upstream has moved since the pin — the manifest is stale;
re-run `formats --write` before treating cited data as fresh). All three
require both a status-checked fetch (a non-200 fetch now throws rather than
letting a 404 body parse into a false PASS — see `tools/meta/formats.test.js`)
and a format-code verification. The per-Pokemon page independently normalizes
its declared format code and verifies it against the requested code (case-insensitive),
catching a redirect or alias serving different data. The index page echoes the
requested code back as-is, so this check has less force there; both pages
accept case-variant codes.

This is a real, un-closed gap, not a rounding error: if `regulation.md` gets
hand-edited carelessly at a rollover and `check` is never run afterward,
`mon`/`usage`/`formats` will keep serving confident, well-formed data for
the **wrong regulation** — the exact "stale slug" trap this tool exists to
close, just moved one level down (from "did a human read the label" to "did
anyone run `check`"). There is no automatic gate forcing `check` before the
other commands; `vgc-meta-lookup` makes it the mandatory first step for
exactly this reason.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-08 | FIX 8 regression: format-code comparison is now case-insensitive. The index page echoes the requested code as-is; the per-Pokemon page normalizes to lowercase. Both now accept case-variant codes while still detecting genuinely different codes (redirects, aliases). Updated documentation to clarify that the page-format match check has strong force on the per-Pokemon page (independent normalization) and weaker force on the index page (echoes). | `tools/meta/{meta.js,formats.js}` and test cases in `tools/meta/tests/{meta.test.js,formats.test.js}` |
| 2026-09-08 | Created file, documenting `tools/meta`'s command surface, the per-upstream metrics table, the per-population/no-blending rule, ETag-vs-Data-Date freshness, the Mega naming convention, and the `check`-only regulation-verification gap | `tools/meta/{cli.js,formats.js,meta.js,megas.js,fetch.js,validate.js,META_MANIFEST.md}`; `tools/meta/tests/fixtures/{ranked-raichu.md,ranked-raichu-mega-y.md,tournaments-garchomp.md,tournaments-index.md,filler-index.md}`; live `node tools/meta/cli.js` runs this session (`formats`, `usage`, `mon "Garchomp" --format championstournaments`, `mon "Staraptor-Mega"`, `check`) |
| 2026-09-08 | Final whole-branch review fix wave: `check` and `report` now check HTTP status before parsing (a failed fetch used to parse as an all-null PASS); `check` now actually reads `META_MANIFEST.md` back and reports `pinnedEtag`/`etagStatus` (`unpinned`/`unchanged`/`changed`) — the ETag-drift capability this doc already claimed, now real instead of write-only; `mon`/`usage`/`formats`/`check` all assert the fetched page's own declared format code against what was requested; a Mega whose stub page slips past `megas.js`'s name matching now fails loudly instead of reporting `undefined%` fields as ordinary missing data; Mega name matching is case-insensitive | `tools/meta/{formats.js,meta.js,megas.js,validate.js,cli.js}` and their test files, this session's review-response task |
