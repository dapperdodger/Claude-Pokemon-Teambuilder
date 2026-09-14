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
- [Team-level surfaces: `cores` and `teams`](#team-level-surfaces-cores-and-teams)
- [Currency: three ways a format can be current (or not)](#currency-three-ways-a-format-can-be-current-or-not)
- [Which upstream carries which metric](#which-upstream-carries-which-metric)
- [Usage is reported per population, never blended](#usage-is-reported-per-population-never-blended)
- [Freshness: Data Date is fake, the ETag is real](#freshness-data-date-is-fake-the-etag-is-real)
- [The Mega naming convention — opposite of `tools/damage-calc`](#the-mega-naming-convention--opposite-of-toolsdamage-calc)
- [The three rollover failures, and which check catches each](#the-three-rollover-failures-and-which-check-catches-each)
- [What `check` verifies that the other commands don't](#what-check-verifies-that-the-other-commands-dont)
- [Changelog](#changelog)

## Command surface

```
node tools/meta/cli.js formats [--write]      list formats, capabilities, regulation
node tools/meta/cli.js mon <Species> [--format <code>]   per-Pokemon data
node tools/meta/cli.js usage [--format <code>]           ranked list
node tools/meta/cli.js cores [--top N] [--format <code>]  Common Team Cores (2/3/4-mon groupings)
node tools/meta/cli.js teams [--top N] [--only topteams|team-usage] [--format <code>]
                                               topteams + team-usage, one call
node tools/meta/cli.js check                  slug agreement and ETag drift
```

`--format <code>` is optional everywhere except `check`; when omitted the
CLI uses the `**Pikalytics slug:**` stamped in `reference/regulation.md`
(the same stamp `vgc-meta-lookup` used to eyeball by hand).

**`formats`** — reports the default format's label, regulation, currency
classification, whether it's *current*, and its detected capabilities.
`--write` upserts a row into `tools/meta/META_MANIFEST.md`.

```bash
$ node tools/meta/cli.js formats
{
  "code": "battledataregmbs3",
  "label": "Pokemon Champions VGC 2026 Reg M-B S3 Ranked Battle Data",
  "regulation": "M-B",
  "currency": "regulation",
  "current": true,
  "straddle": null,
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
  "format": "battledataregmbs3", "regulation": "M-B", "currency": "regulation", "current": true,
  "warnings": ["this format's upstream carries no usage weighting — use a tournament or Showdown format for usage"],
  "rows": [
    { "rank": 1, "species": "Garchomp", "usage": { "value": null, "reason": "..." },
      "winRate": { "value": 48.05, "reason": null }, "record": "10833-11714-41" },
    ...
  ]
}
```
(live output, this session — ladder format, so `usage` is `null` on every row)

```bash
$ node tools/meta/cli.js usage --format championstournaments
{
  "format": "championstournaments", "regulation": null, "currency": "rolling", "current": true,
  "warnings": [],
  "rows": [ ... ]
}
```
(live output, this session, 2026-09-08 — `regulation` is `null` because a
rolling window carries no regulation token, but `current` is still `true`
and `warnings` is empty: this is the exact case that used to get a wrong
"previous regulation" warning, see the section below)

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

## Team-level surfaces: `cores` and `teams`

`usage`/`mon` answer per-Pokémon questions. These two answer team-level
ones — `reference/methodology.md`'s "three Pikalytics surfaces" passage
requires all three (`usage`, `cores`, and `teams`' two halves) before
answering "what's the meta."

**`cores [--top N] [--format <code>]`** — Pikalytics' own 2/3/4-Pokémon
"Common Team Cores" groupings, ranked by how many sampled teams run each one.
Parsed off the same pokedex index page `usage`/`check` already fetch, so this
costs **no extra network request**. `--top N` bounds each size-group's own
already-ranked list independently; it does not re-sort or merge them.

```bash
$ node tools/meta/cli.js cores --top 3
{
  "format": "gen9championsvgc2026regmc", "regulation": "M-C",
  "groups": [
    { "size": 2, "cores": [
      { "rank": 1, "species": ["Rillaboom", "Sneasler"],
        "teams": { "value": 159, "reason": null },
        "usage": { "value": 24.3, "reason": null } },
      ...
    ] },
    { "size": 3, "cores": [ ... ] },
    { "size": 4, "cores": [ ... ] }
  ],
  "note": "Cores are Pikalytics' own 2/3/4-Pokemon groupings ranked by how many sampled teams run them, read off the same pokedex index page `usage` already fetches — no extra network request. \"top\" bounds each group's own already-ranked list; it does not re-sort."
}
```
(live output, this session, 2026-09-10)

**`teams [--top N] [--only topteams|team-usage] [--format <code>]`** — the
other two tournament surfaces, in one call:

- `topTeams` (Pikalytics `/ai/topteams`) — concrete real six-Pokémon teams
  as actually brought, each tagged with its `archetypes` (using the same
  vocabulary `reference/archetypes.md` defines — `trick-room`, `tailwind`,
  `sun`, etc.; `[]` when Pikalytics didn't tag that entry). One row is one
  build, not a frequency signal.
- `teamUsage` (Pikalytics `/ai/team-usage`) — six-Pokémon *compositions*
  ranked by `uses`, `winRate`, and W-L-D `record` — "which archetype actually
  wins," not just "does it exist."

The two sections are reported separately and **never blended** — they answer
different questions. Costs two network requests unless `--only` narrows to
one (then one). A fetch failure on one endpoint is reported as that section's
own `error` and does not abort the other section.

**Defaults to `championstournaments`**, not the current regulation's
ranked-ladder slug — that's the only format code either endpoint is
confirmed to serve. `championstournaments` is a rolling ~14-day window with
no regulation of its own (see "The rollover straddle" below): for roughly
two weeks after every rollover it mixes the new regulation's results with
the previous one's. When that's currently true, the response carries a
top-level `straddle` object and a plain-language warning in `warnings`.
**Surface that warning to the user — reporting `teams`' contents without it
defeats the entire point of pulling tournament data.** Its absence means the
window has cleared, not that it was never checked.

```bash
$ node tools/meta/cli.js teams --top 2
{
  "format": "championstournaments", "regulation": "M-C",
  "straddle": {
    "regulation": "M-C", "regulationStart": "2026-09-09",
    "windowDays": 14, "clearsOn": "2026-09-23"
  },
  "warnings": [
    "Format \"championstournaments\" is a rolling ~14-day tournament window that currently straddles the regulation rollover: it reaches back before M-C started (2026-09-09), so BOTH sections below mix M-C with the previous regulation. Expect it to clear of the old regulation's data around 2026-09-23."
  ],
  "topTeams": { "included": true, "teams": [
    { "rank": 1, "author": "M_rada", "record": "7-0",
      "archetypes": [], "species": ["Gengar-Mega", "Snorlax", ...] },
    { "rank": 2, "author": "Hazarai", "record": "4-0",
      "archetypes": ["sun", "trick-room"], "species": [...] }
  ] },
  "teamUsage": { "included": true, "compositions": [
    { "rank": 1, "uses": { "value": 12, "reason": null },
      "winRate": { "value": 59.46, "reason": null },
      "record": "22 - 15 - 0", "species": [...] },
    ...
  ] }
}
```
(live output, this session, 2026-09-10 — straddle fires because M-C started
yesterday and the ~14-day window reaches back into M-B)

**`check`** — the only command that cross-verifies `reference/regulation.md`'s
stamped regulation against a SECOND, independent source rather than trusting
the local stamp alone: Pikalytics' own **live default format** (the bare
`/ai/pokedex` index, no code — it self-declares whatever the site currently
treats as current). A regulation **mismatch throws** a hard error. A **same
regulation but different format code** (e.g. a season bump —
`battledataregmbs3` → `...s4` is not a regulation change) is reported as a
warning telling you to update the `**Pikalytics slug:**` stamp, not a throw.
If the live default can't be reached, or is reachable but carries no
regulation token at all (e.g. Pikalytics switched its default to a
tournament/preview format), that is reported too — as `unverified` or
`uncorroborated` respectively — **never presented as agreement**. See
`corroborateRegulation` in `tools/meta/formats.js` for the full four-outcome
design and `reference/pitfalls.md`/`docs/case-studies.md` for the 2026-09-09
M-B → M-C incident this closes: the stamp went stale while every
*self*-referential check kept reporting healthy, because nothing compared it
against anything outside this repo.

`llms-full.txt`'s own **"Current Default Format"** line (Pikalytics'
changelog prose about itself, not its behaviour, and known to lag a real
rollover) is now **informational only** — reported in `warnings`, never a
throw. `check` still also reads `tools/meta/META_MANIFEST.md` back and
compares the pinned ETag against the live one, returning `pinnedEtag` and
`etagStatus` (`"unpinned"` — this format has never been written with
`formats --write`; `"unchanged"`; or `"changed"` — upstream has moved since
the pin). See
["What `check` verifies"](#what-check-verifies-that-the-other-commands-dont)
below for the full picture of what each layer catches.

## Currency: three ways a format can be current (or not)

`current` used to be a straight comparison — does the format's own
regulation token match `reference/regulation.md`'s active one? That binary
put a "previous regulation" warning on `championstournaments`, the single
best usage source this tool has: it carries no regulation token at all, not
because its data is stale, but because it's a **rolling ~2-week window over
whatever's currently played** — current by construction, not by comparison.
Slapping a staleness warning on the tool's best source trains a reader to
distrust correct data, so `currency` now names *why* a format is (or isn't)
current, as one of three states:

| `currency` | Meaning | `current` |
|---|---|---|
| `regulation` | The label carries a regulation token (e.g. "Reg M-B") | `true` iff the token matches the active regulation |
| `rolling` | A rolling window over current play | **always `true`** |
| `unknown` | Cannot be determined | `false` |

**`rolling` is a curated list, never inferred from a missing token.**
`tools/meta/formats.js`'s `ROLLING_WINDOW_FORMATS` names exactly which
formats qualify — today, only `championstournaments`. A format with no
regulation token that is *not* on that list stays `unknown`, deliberately:
`championspreview` also carries no token, but Pikalytics itself flags it as
pre-launch preview data (not current), so "no token ⇒ rolling" would
misclassify actively suspect data as current. A newly-appearing token-less
format therefore surfaces as `unknown` on purpose, so a person adds it to
the list after confirming it live — the same way `championstournaments` was
confirmed — rather than the code guessing.

**`unknown` gets a warning worded as unknown provenance, not as staleness.**
Saying "this is a previous regulation" about a format nothing establishes as
one is stating something not known. The `unknown` warning says exactly
that — provenance unverified, not confirmed current or stale — and tells
the reader to verify before citing a number from it.

### The rollover straddle

A rolling window spans whatever's actually been played recently, which means
it can span *across* a regulation rollover: for roughly the window's own
length (`ROLLING_WINDOW_DAYS` in `formats.js`, currently 14 — upstream's own
stated approximation, see `tools/meta/tests/fixtures/tournaments-index.md`'s
Format Notes) after a new regulation starts, the window still reaches back
into tournaments run under the *previous* one. That data is genuinely
current — it's the real recent window — **and** genuinely mixed. That's a
third state, distinct from both "fine" and "stale", and it gets its own
warning rather than being silent (mixed and unremarked is worse than mixed
and labeled) or reusing the previous-regulation wording (the data isn't from
a previous regulation, it's *also* from a previous regulation).

`describe()` computes this by comparing the window's own reach-back
(today − `ROLLING_WINDOW_DAYS`) against the active regulation's own start
date (`reference/regulation.md`'s `**Regulation starts:**` stamp, read via
`activeRegulationStart()`) — if the window start falls *before* the
regulation's start, the straddle is live. A `rolling` format's `describe()`
output carries a `straddle` object (`{ regulation, regulationStart,
windowDays, clearsOn }`) when this is true, `null` otherwise, and the
resulting warning names the regulation being mixed in and roughly when the
window clears it:

```
Format "championstournaments" is a rolling ~14-day tournament window that
currently straddles the regulation rollover: it reaches back before M-C
started (2026-09-09), so results mix M-C with the previous regulation.
Expect it to clear of the old regulation's data around 2026-09-23.
```

This does **not** fire today (2026-09-08): M-B started 2026-06-17, nearly
three months ago, far outside any 14-day window. It's expected to fire for
roughly two weeks starting the day M-C launches (2026-09-09) — the
`windowStraddlesRollover` pure function and its direction (`today −
windowDays` earlier than `regulationStart`) are pinned with injected dates
in `tools/meta/tests/formats.test.js`, not the real clock, so the test stays
meaningful regardless of when it runs.

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

## The three rollover failures, and which check catches each

A stale slug is this repo's oldest trap: a previous regulation's Pikalytics
URL keeps serving complete, correctly-formatted, wrong data forever, and
nothing about the response looks wrong. It is worth knowing which signal
covers what — the danger is narrower than it first appears, and concentrated
in one specific case.

`reference/regulation.md` carries **two independent stamps** — `**Regulation:**`
and `**Pikalytics slug:**` — and the fetched page declares its own regulation
in its label. Those three sources catch most disagreements with no network
call beyond the one every command already makes:

| What went wrong at the rollover | Caught by | How |
|---|---|---|
| Slug stale, `**Regulation:**` updated | **every command** | The fetched page's label says the old regulation, the active stamp says the new one → `current: false` plus a warning. No extra network call needed. |
| Slug updated, `**Regulation:**` stale | **every command** | The mirror of the above, same mechanism. |
| **Nobody edited `regulation.md` at all** | **every command**, via the end date | Both stamps agree with each other and both are wrong, so no comparison between them can help. The **calendar** catches it: if `**Regulation ends:**` has passed, `describe()` sets `stampExpired` — which now also forces `current: false` — and every command warns. |
| **Someone hand-edits `regulation.md` itself with a wrong value** (the actual 2026-09-09 M-B → M-C incident: the stamp was simply never updated at rollover) | **`check` only**, via independent corroboration | Every check above compares parts of `regulation.md` against OTHER parts of `regulation.md` — a human error there vouches for itself. `check` is the only command that asks something outside this repo: Pikalytics' own **live default format** (bare `/ai/pokedex`, no code). A regulation mismatch there **throws**; an unreachable or tokenless response is reported as `unverified`/`uncorroborated`, never silently treated as agreement. |
| Pikalytics changed its own default format code but kept the same regulation (a season bump) | **`check` only** | The live default's format code is compared against the stamped slug; a mismatch with a MATCHING regulation is a warning to update the slug stamp, not a throw. |

The third row is the one the end-date calendar check closed. The end date was
already stamped in `regulation.md`; the tool simply never read it — and
having read it, never let it override an otherwise-agreeing `current`. It
remains a warning, never an error — deliberately reading a finished cycle is
legitimate, and the `vgc-regulation-transition` skill's early-phase guidance
explicitly calls for it — but `current` can no longer be `true` at the same
time.

The fourth and fifth rows are what `check`'s independent corroboration
closes: nothing else in this tool asks anything outside `reference/regulation.md`
itself, so a hand-edit error (wrong regulation, wrong end date, or simply
never edited at rollover) previously vouched for itself no matter how many
internal cross-stamp comparisons ran. That is why `check` still runs first —
it is the only command that can catch a human getting the stamp wrong.

## What `check` verifies that the other commands don't

`mon`, `usage`, and `formats` all resolve the default format code from
`reference/regulation.md`'s stamped `**Pikalytics slug:**` and trust it.
Only `check` fetches Pikalytics' own **live default format** (the bare
`/ai/pokedex` index, no code) and compares its regulation against
`reference/regulation.md`'s stamped one — throwing a hard error on a genuine
regulation mismatch, warning (not throwing) on a same-regulation code
difference, and reporting rather than silencing an unreachable or tokenless
result (`formats.js`'s `corroborateRegulation`, wired into `check()`).
`llms-full.txt`'s own declared default is compared too, but only
informationally now — see the `check` description above.

`check` is also the only command that reads `tools/meta/META_MANIFEST.md`
back rather than only writing it. It compares the live ETag of the default
format against the ETag pinned by the most recent `formats --write` for that
same code, returning:

```bash
$ node tools/meta/cli.js check
{
  "slug": "gen9championsvgc2026regmc", "agrees": false,
  "resolvedDisagreement": { "declared": "battledataregmbs3", "stamped": "gen9championsvgc2026regmc", "chosen": "gen9championsvgc2026regmc", "date": "2026-09-09", ... },
  "corroboration": { "status": "agrees", "message": "reference/regulation.md's stamped regulation (M-C) agrees with Pikalytics' own live default format (M-C)." },
  "warnings": [ "llms-full.txt declares \"battledataregmbs3\" vs. the stamped \"gen9championsvgc2026regmc\" — a disagreement already resolved by hand on 2026-09-09 (see META_MANIFEST.md's \"Resolved slug disagreements\")." ],
  "etag": "W/\"4898-4eEUmA75tKJRorrcMWxl8g\"",
  "pinnedEtag": "W/\"485d-0LZpiz1c9MFNg38QLLM8bQ\"", "etagStatus": "changed",
  ...
}
```
(live output, this session, 2026-09-14 — `corroboration.status: "agrees"`
because Pikalytics' live default and the stamp both currently say M-C, so the
hard gate is quiet. `agrees: false` and the `resolvedDisagreement` are the
pre-existing, still-informational llms-full.txt comparison — it still lags
the M-C rollover and still resolves via the recorded row, but can no longer
throw. `etagStatus: "changed"` here just means nobody has re-run
`formats --write` since upstream's page last changed — unrelated to
regulation corroboration)

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
| 2026-09-14 | Closed the design flaw the 2026-09-09 M-B → M-C rollover exposed: every currency/regulation check (`current`, `stampExpired`, the old `check` slug-agreement gate) ultimately compared parts of `reference/regulation.md` against OTHER parts of the same file, so a stale hand-edited stamp vouched for itself and every tool reported healthy. Added `formats.corroborateRegulation` (pure, four outcomes: agrees/disagrees/uncorroborated/unverified) and `fetchLiveDefaultRegulation`, which compares the stamp against Pikalytics' own **live default format** (bare `/ai/pokedex`, no code) — a second, independent source. `check`'s gate is now this comparison: a regulation mismatch **throws**; a same-regulation different-code mismatch (season bump) **warns**, no throw; `llms-full.txt`'s declared default is demoted from a throwing gate to **informational** (`warnings`), since it is Pikalytics' own changelog prose about itself and known to lag a real rollover. `stampExpired` now also **forces `current: false`** — it used to be reported but never gate `current`, so an expired stamp could still read as current. `regulationHasEnded` and the phase hook's ENDED branch changed from `>` to `>=` against `Regulation ends`, because the stamps record UTC dates and the real cutover instant falls within the stamped end date, not the day after it — documented in `reference/regulation.md`'s stamp-block comment and the `vgc-regulation-transition` skill. The corroboration check also runs at session start via `.claude/hooks/vendor-staleness.js` (chosen over `regulation-phase.js` because its tests already exercise exported functions with an injected fetcher rather than spawning the real hook process, so adding a live network call there could not accidentally make the existing phase-hook test suite hit the network); it stays silent on agreement, matching how the hook already treats an up-to-date vendor. | `tools/meta/formats.js`, `.claude/hooks/{vendor-staleness.js,regulation-phase.js}`, `tools/meta/META_MANIFEST.md`, this file; test cases in `tools/meta/tests/formats.test.js` and `.claude/hooks/tests/{vendor-staleness,regulation-phase}.test.js`; live `node tools/meta/cli.js check` / `node .claude/hooks/vendor-staleness.js` / `node .claude/hooks/regulation-phase.js` this session |
| 2026-09-08 | Design correction: `current` was a straight regulation-token comparison, which put a "previous regulation is NOT the current one" warning on `championstournaments` — the tool's best usage source, wrongly flagged, because it has no regulation token (it's a rolling ~2-week window over current play, current by construction, not something with a token to compare). Replaced with a three-way `currency` taxonomy (`regulation`/`rolling`/`unknown`) classified by a curated list (`ROLLING_WINDOW_FORMATS` in `formats.js`) rather than inferred from a missing token — `championspreview` also has no token but Pikalytics flags it as not-current pre-launch data, so a heuristic would have misclassified it as rolling. Added rollover-straddle detection: a rolling window can span a regulation change (confirmed live 2026-09-08: M-B ends 2026-09-09, tomorrow, and the ~2-week tournament window will then contain both M-B and M-C data), which is a third state — genuinely current AND genuinely mixed — distinct from both "fine" and "stale", with its own warning naming the mixed regulation and roughly when the window clears. `unknown`-currency formats keep a warning too, reworded to state genuinely unknown provenance rather than falsely claiming "a previous regulation." Verified live: `node tools/meta/cli.js usage --format championstournaments` now reports `currency: "rolling", current: true, warnings: []`; `battledataregmbs3` (regulation-tagged, matches active) and `gen9championsvgc2026regmabo3` (genuinely off-regulation) are unchanged | `tools/meta/{formats.js,meta.js,cli.js,META_MANIFEST.md}` and test cases in `tools/meta/tests/{formats.test.js,meta.test.js,cli.test.js}`; live `node tools/meta/cli.js usage --format championstournaments` this session |
| 2026-09-08 | FIX 8 regression: format-code comparison is now case-insensitive. The index page echoes the requested code as-is; the per-Pokemon page normalizes to lowercase. Both now accept case-variant codes while still detecting genuinely different codes (redirects, aliases). Updated documentation to clarify that the page-format match check has strong force on the per-Pokemon page (independent normalization) and weaker force on the index page (echoes). | `tools/meta/{meta.js,formats.js}` and test cases in `tools/meta/tests/{meta.test.js,formats.test.js}` |
| 2026-09-08 | Created file, documenting `tools/meta`'s command surface, the per-upstream metrics table, the per-population/no-blending rule, ETag-vs-Data-Date freshness, the Mega naming convention, and the `check`-only regulation-verification gap | `tools/meta/{cli.js,formats.js,meta.js,megas.js,fetch.js,validate.js,META_MANIFEST.md}`; `tools/meta/tests/fixtures/{ranked-raichu.md,ranked-raichu-mega-y.md,tournaments-garchomp.md,tournaments-index.md,filler-index.md}`; live `node tools/meta/cli.js` runs this session (`formats`, `usage`, `mon "Garchomp" --format championstournaments`, `mon "Staraptor-Mega"`, `check`) |
| 2026-09-08 | Final whole-branch review fix wave: `check` and `report` now check HTTP status before parsing (a failed fetch used to parse as an all-null PASS); `check` now actually reads `META_MANIFEST.md` back and reports `pinnedEtag`/`etagStatus` (`unpinned`/`unchanged`/`changed`) — the ETag-drift capability this doc already claimed, now real instead of write-only; `mon`/`usage`/`formats`/`check` all assert the fetched page's own declared format code against what was requested; a Mega whose stub page slips past `megas.js`'s name matching now fails loudly instead of reporting `undefined%` fields as ordinary missing data; Mega name matching is case-insensitive | `tools/meta/{formats.js,meta.js,megas.js,validate.js,cli.js}` and their test files, this session's review-response task |
| 2026-09-08 | Added the stamp-expiry check: `describe()` now reads `**Regulation ends:**` from `reference/regulation.md` and sets `stampExpired` once that date has passed, so every command warns instead of only `check`. This closes the one rollover failure the cross-stamp logic structurally cannot see — nobody editing `regulation.md` at all, where both stamps agree with each other and both are wrong. Costs no network call; the date was already stamped in the file and simply went unread. Added the three-rollover-failures table so the remaining `check`-only gap (Pikalytics renaming a format code) is stated rather than implied | Verified live: quiet on 2026-09-08 and 2026-09-09 (M-B's stamped end date), warns from 2026-09-10; `regulationHasEnded` is pure and its tests inject dates so they cannot rot |
| 2026-09-10 | Documented the two new team-level commands, `cores` and `teams`, which close the gap this file's "team-level cores/curated top teams still need a direct fetch" note used to describe: `cores` parses Pikalytics' "Common Team Cores" section off the same pokedex page `usage` fetches (no extra request); `teams` parses `/ai/topteams` (archetype-tagged real teams) and `/ai/team-usage` (win-rate-ranked compositions) in one call, two network requests unless `--only` narrows to one. Documented `teams`' default format (`championstournaments`) and its rollover-straddle behavior, including the requirement that a `straddle` warning in its output gets surfaced to the user rather than swallowed | `node tools/meta/cli.js cores --top 3` and `node tools/meta/cli.js teams --top 2` run live this session (2026-09-10), straddle warning fired as expected one day after the M-C rollover |
