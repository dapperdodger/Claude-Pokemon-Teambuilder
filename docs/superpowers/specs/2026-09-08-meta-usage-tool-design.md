# Design: `tools/meta` — usage data from a documented API, not scraping

**Date:** 2026-09-08
**Status:** Draft, pending user review

## Problem

Meta lookups are ad-hoc HTML scraping. Every "what's the meta" question means
`WebFetch` against Pikalytics pages, letting a summariser read presentation
HTML, and trusting whatever prose comes back. That has produced real failures:

- A threat list built from search snippets missed an entire dominant archetype
  twice (`docs/case-studies.md`).
- Empty client-rendered panels were read as low usage rather than as a loading
  artifact (`reference/pitfalls.md`).
- A summariser's own derived column was wrong on two of six rows while
  counting Megas per archetype, caught only because the rows were re-counted
  by hand (2026-09-08).
- The format slug is a manual habit backed by prose, not a check. A previous
  regulation's slug serves complete, correctly-labelled, wrong data forever.

The underlying issue is that no step in the pipeline can fail. HTML has no
contract, so a changed layout, an empty dataset, or a placeholder string all
arrive looking like an answer.

## Key finding: the metric you get depends on the data source, not the site

Pikalytics publishes a documented agent API — `llms-full.txt`, `/ai/pokedex/
[format]`, `/ai/pokedex/[format]/[pokemon]`, `/ai/tournaments`, all
`text/markdown`, server-rendered, 404 on bad input. Probed 2026-09-08.

It aggregates three different upstreams, and **which metrics exist is a
property of the upstream, not of the site**:

| Format | Upstream | Usage % | Win rate / record |
|---|---|---|---|
| `battledataregmbs3` (current ranked) | HOME Battle Stadium (official ladder) | **absent** | present |
| `championstournaments` | RK9 / Limitless team sheets | present | present |
| `championspreview` | Showdown | present | absent |
| `gen9championsvgc2026regmabo3` | Showdown, **M-A** | present | absent |
| `gen9ou`, `gen9vgc2025regi` | Showdown | present | absent |

Consequences that shape the whole design:

1. **The format this repo currently uses cannot answer "what is used."** The
   official ladder feed carries no usage weighting — confirmed in the API and
   in the raw HTML, whose every percentage is a move/item/ability distribution
   and whose JSON-LD declares a `Usage Rate` property with no value. Scraping
   was never getting this number. We never noticed, because it was absent
   rather than wrong.
2. **"What's used" and "what's winning" are different questions with different
   sources.** They must be reported separately, each labelled, never blended.
3. **Source availability shifts with the regulation.** Today there is no clean
   Showdown feed for current-regulation Champions VGC: `championspreview` is
   flagged upstream as not-current, carries no cores or featured teams, and
   shows what looks like pre-launch data; the one clean Showdown usage feed is
   M-A. That will likely change after the M-C rollover. **So capabilities must
   be detected, not hardcoded.**

### The case that justifies validation

`gen9championsvgc2026regmbbo3` returns a complete, well-formed 50-row usage
table, in rank order, with confident prose:

> "Pokemon Champions VGC 2026 BO3 Reg M-B is currently led by **Abomasnow**.
> The top of the usage chart also includes Abomasnow, Absol, Aegislash,
> Aerodactyl, and Aggron."

It is the dex in alphabetical order with `N/A` in every metric column — an
empty dataset rendered as a full answer. Nothing about the response shape
signals this. It is the same failure as a stale Pikalytics slug and a stale
learnset pin: complete, normal-looking, wrong.

### Known holes to encode, not paper over

| Symptom | Where | Meaning |
|---|---|---|
| `Usage: N/A` | ladder formats | source carries no usage — a fact, not an error |
| `Win Rate: N/A`, `Record: N/A` | **all Megas**, and Showdown formats | genuinely absent |
| `undefined%` ×6 | Common Teammates, every page | upstream bug |
| `high%` | format FAQ prose | unfilled template placeholder |
| `Data Date: 2026-05` | **every format**, incl. VGC 2025 | global constant, not freshness |
| `Game: Pokemon Scarlet Violet` | ranked Champions formats | mislabelled |
| Missing section | e.g. Floette-Eternal has no Featured Teams | legitimate absence |

`Data Date` being constant across every format is why freshness uses **ETags**
instead. `dateModified` in the JSON-LD reads as today's date on all formats,
so it is page-render time, not data time, and is also unusable.

## Architecture

`tools/meta/`, mirroring `tools/dex/`: a thin CLI over a library, one JSON
object per invocation, non-zero exit on error, tests in `tools/meta/tests/`.

```
tools/meta/
  cli.js        argument parsing, JSON out, exit codes
  meta.js       fetch + parse + validate
  formats.js    capability detection and the format registry
  fetch.js      HTTP with ETag handling
  META_MANIFEST.md   pinned ETags and last-seen capabilities
```

### Commands

| Command | Answers |
|---|---|
| `meta formats` | which formats exist, which metrics each carries, which is current |
| `meta usage [--format …]` | what is used — ranked list, per population |
| `meta mon <Species> [--format …]` | moves/items/abilities %, win rate, usage where carried |
| `meta cores [--format …]` | Common Team Cores with real percentages |
| `meta teams [--format …]` | featured/top teams with full sets and records |
| `meta check` | slug agreement with `regulation.md`, ETag drift, capability drift |

### Format resolution

1. Read the current default format code from `llms-full.txt`.
2. Cross-check against `reference/regulation.md`'s `Pikalytics slug` stamp.
3. **Disagreement is an error, not a fallback.** Report both and exit non-zero;
   the human decides which is stale. Silently preferring either reintroduces
   the trap.

### Capability detection

Capabilities are probed by `meta formats` and `meta check` — not on every
call, which would double the request count. Each probe reads the format index
and records which metric columns carry real values, persisting to
`META_MANIFEST.md`. Other commands read the manifest and **fail loudly if the
format they were asked for has no recorded capabilities**, telling the caller
to run `meta formats` first; they never guess. A metric a format does not carry
is reported as `null` **with a stated reason**, never as a missing key and
never as zero:

```json
{
  "species": "Garchomp",
  "usage":    { "value": null, "reason": "battledataregmbs3 (official ladder) carries no usage weighting" },
  "winRate":  { "value": 48.05, "record": "10833-11714-41" }
}
```

A caller that wants usage is told where to get it rather than getting silence.

### Validation — reject before returning

Any of these fails the call loudly:

- `N/A`, `undefined`, `undefined%`, `NaN%`, `null`, `high%` reaching an output
  numeric field
- A usage table whose rows are **alphabetically ordered with all-`N/A`
  metrics** → empty dataset, the `regmbbo3` case
- A format label naming a regulation other than the one requested
- A required section absent where the format's capabilities say it should exist
- HTTP status other than 200

### Usage is per-population, never blended

`meta usage` returns one entry per population that carries usage, each with its
label, sample scope where published (`championstournaments` states a ~2-week
rolling window over qualifying tournaments), and a caveat where the upstream
flags one. Showdown and tournament numbers are both real signals about
different populations; averaging them would invent a number neither reports.

## Testing

Following `tools/dex`, TDD, real fixtures rather than mocks:

- Fixture files captured from the live endpoints, committed under
  `tools/meta/tests/fixtures/`, so parsing is tested without network.
- **Regression: the alphabetical-filler dataset is rejected.** Fixture from
  `gen9championsvgc2026regmbbo3`.
- **Regression: `undefined%` teammates never reach output as a number.**
- **Regression: a Mega's `N/A` win rate is reported as null-with-reason, not 0.**
- **Regression: usage requested from the ladder format returns the reason, not
  an empty value.**
- Slug disagreement between `llms-full.txt` and `regulation.md` exits non-zero.
- Section absent (Floette-Eternal, no Featured Teams) parses cleanly.
- A live-network smoke test, skipped by default, that flags upstream shape
  changes — the fixture equivalent of the vendor-staleness hook.

## Documentation

- `reference/meta-lookup.md` — new; the CLI, what each format carries and why,
  and the population-labelling rule.
- `vgc-meta-lookup` skill — rewritten around the commands. The three-surface
  process survives as *what* to pull; the tool becomes *how*.
- `CLAUDE.md` — a row in the command table; usage claims come from the tool.
- `reference/methodology.md`, `reference/regulation.md` — replace hand-fetch
  URL patterns with the command.
- `reference/pitfalls.md` — the alphabetical-filler case as a data-source trap.

## Scope fence

- **Not** a replacement for `tools/dex`. Usage data only; every fact about
  typing, abilities, legality and learnsets stays with the dex.
- **Not** a cache. Fetches live; the manifest stores ETags and capabilities,
  not payloads.
- **No blending, ranking or scoring across populations.** The tool reports what
  each source says.
- **Does not** decide which population to trust. It labels; the human judges.
- Tournament-detail endpoints (`/ai/tournaments/[source]/[slug]`) are out of
  scope for v1 — index only.

## Open questions for review

Each carries a default, so none of them blocks implementation — they are
decisions worth surfacing, not gaps.

1. **`meta check` in the SessionStart hook?** It costs one HTTP request per
   session and would catch slug and capability drift the way the regulation
   and vendor hooks already do. *Default: manual for v1* — the existing hooks
   are all local, and making session start depend on a third-party endpoint
   being up is a real cost. Revisit once the tool has proven stable.
2. **Include `championspreview` as a Showdown signal?** It is flagged upstream
   as not-current and looks like pre-launch data. *Default: include, labelled,
   with the upstream caveat attached* — it is the only Showdown-side Champions
   usage that exists today, and the population-labelling rule already prevents
   it being mistaken for ladder or tournament data. Drop it if a current
   Showdown Champions feed appears.
3. **Build before or after the M-C rollover?** The format landscape shifts
   tomorrow. *Default: build now* — capability detection exists precisely so a
   changed landscape is data rather than a code change, and building against
   a live rollover is the strongest possible test of that claim. The fixtures
   captured now become a regression record of what M-B looked like.

## Sequencing

1. Capture fixtures and write the failing parser tests.
2. `fetch.js` + ETag manifest.
3. `formats.js` capability detection, `meta formats` / `meta check`.
4. `meta mon`, `meta usage`.
5. `meta cores`, `meta teams`.
6. Documentation and skill rewrite.
