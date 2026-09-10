---
name: vgc-meta-lookup
description: Use when asked what's popular/dominant in the current meta, what to expect to face, or to build a threat list — with no specific Pokémon, matchup, or already-defined team named yet. Not for a single named Pokémon's moveset (see vgc-threat-evaluation) or a specific team being built/refined (see vgc-team-building/vgc-team-refining, which invoke this skill internally for their own meta lookups).
---

# VGC Meta Lookup

## Overview
"What's the meta" needs more than one signal, not one — per-Pokémon usage
rank alone has already missed real archetypes twice in past sessions: a Sun
core and a Swampert-Mega/Pelipper/Archaludon rain core, both invisible from
individual usage rankings. `tools/meta` (`reference/meta-lookup.md`) answers
the per-format/per-Pokémon half of this reliably and structurally; team-level
archetypes (cores, curated top teams) are now their own structured commands
too — `cores` and `teams`, covered below.

## When to use
- "What's the meta right now / what's popular"
- "What am I likely to face this regulation"
- Building a threat list to feed into `vgc-team-building` or
  `vgc-team-refining`'s threat-sourcing step
- Not for a single Pokémon's own set (`vgc-threat-evaluation`) or a
  specific team/matchup already on the table (`vgc-team-building` /
  `vgc-team-refining`)

## Before pulling any data

**1. Confirm the regulation** — `reference/regulation.md`, even if already
checked earlier in this conversation.

**2. Run `node tools/meta/cli.js check`. This is mandatory, first, every
session — not optional and not a one-time habit.**

```bash
$ node tools/meta/cli.js check
{
  "slug": "battledataregmbs3", "agrees": true,
  "etag": "W/\"459e-RBQlRZysoWXer8KGrQ0pAg\"",
  "pinnedEtag": null, "etagStatus": "unpinned",
  "code": "battledataregmbs3", "regulation": "M-B", "current": true,
  "capabilities": { "usage": false, "winRate": true, "record": true }
}
```

Why this replaces the old manual "read the format label on the page" habit:
`mon`, `usage`, and `formats` all trust the `**Pikalytics slug:**` stamped in
`reference/regulation.md` and never verify it against anything live. Only
`check` calls Pikalytics' own `/llms-full.txt` and compares its declared
default format code against that stamp, throwing a hard error on
disagreement instead of guessing which source to trust. A stale stamp does
not fail loudly on any of the other three commands — it keeps returning
complete, normal-looking, wrong-regulation data forever (the exact trap this
skill used to guard against by eyeballing a page label, now closed
structurally as long as `check` actually runs first). `check` also reports
`etagStatus` (`unpinned`/`unchanged`/`changed`) by comparing the live ETag
against the one pinned by the last `formats --write` — `changed` means
upstream moved since that pin; re-run `formats --write`. If `check` throws,
resolve the disagreement by hand — reconcile `reference/regulation.md`'s
stamp against what Pikalytics currently declares — before running anything
else in this skill. Full detail: `reference/meta-lookup.md`'s "What `check`
verifies that the other commands don't" section.

## The command surface

All three Pikalytics surfaces `reference/methodology.md` requires are now
structured tool calls — nothing here still needs a direct fetch.

**1. `node tools/meta/cli.js usage [--format <code>]`** — the top-50
per-Pokémon table for one format: usage, win rate, and W-L-D record, each
`null` with a stated reason when that format's upstream doesn't carry the
metric at all (never a bare `0` — see `reference/meta-lookup.md`).

**2. `node tools/meta/cli.js mon "<Species>" [--format <code>]`** — one
Pokémon's real moves/abilities/items/teammates as `{name, percent}` lists,
plus its usage/win rate/record for that format. This is what answers "what
does X actually run" — never state a moveset or item split from recall.

Both default to the format stamped in `reference/regulation.md` when
`--format` is omitted; pass `--format championstournaments` (or another
code from `meta formats`) explicitly to pull a different population.

**3. `node tools/meta/cli.js cores [--top N] [--format <code>]`** — the
"Common Team Cores" surface: 2/3/4-Pokémon groupings ranked by how many teams
run them, parsed off the same pokedex index page `usage`/`check` already
fetch, so it costs **no extra network request**. This is what surfaces a
popular sub-core (a specific 3-mon rain or Trick Room piece) that's common
across many different six-mon teams even when no single full team dominates
raw usage — a flat per-Pokémon usage list can miss this entirely. Do not
substitute `usage`'s per-Pokémon ranking for this — see Common mistakes
below.

Once you have those groupings, the real follow-up is **which Pokémon run
together, and *why*.** Co-occurrence is a frequency signal, not proof of
synergy — that warning already stands (see Common mistakes). The follow-up
that turns the signal into an answer: when two Pokémon co-occur, name the
actual mechanism — speed control, weather, redirection, a shared check — or
say plainly you could not determine one. A pairing you cannot explain is a
pairing you cannot counter, so don't hand a core onward as a threat without
that explanation attached.

**4. `node tools/meta/cli.js teams [--top N] [--only topteams|team-usage] [--format <code>]`**
— the other two tournament surfaces in one call: `/ai/topteams` (concrete
real six-Pokémon teams as actually brought, each entry tagged with its
**archetype**, e.g. `trick-room`, `tailwind`, `sun`) and `/ai/team-usage`
(full six-Pokémon compositions ranked by win rate and W-L-D record — "is this
archetype actually good," not just "does it exist"). Reported as two separate
sections, never blended — they answer different questions. Two network
requests unless `--only` narrows to one. Defaults to `championstournaments`
(not the current regulation's ranked-ladder slug) since that's the only
format either endpoint is confirmed to serve.

`championstournaments` is a rolling ~14-day window with no regulation of its
own, so for roughly two weeks after a rollover it straddles two regulations
at once. **If the output carries a `straddle` object and warning, that
caveat must reach the user, verbatim or in substance — reporting the
teams/compositions without it defeats the entire point of pulling this
surface.** Its absence means the window has cleared, not that it was never
checked.

**5. Format knowledge — the field's shape, not its names.** Usage tells you
*who* you will face; this tells you *what they do*.

```bash
node tools/meta/cli.js speed-tiers --top 30
node tools/meta/cli.js distribution --move "Fake Out" --top 20
node tools/meta/cli.js distribution --ability Prankster --top 20
```

`reference/format-knowledge.md` holds the last generated snapshot. Check its
`**Generated:**` and `**Regulation:**` stamps before citing it — the
SessionStart hook reports it stale past 7 days or on a regulation mismatch. A
stale snapshot is worse than none, because it reads as current.

**Read `--top N` and `share` correctly — this is a real misreading risk.**
`--top N` means "among the N most-**used**," not "the N most extreme
overall": `speed-tiers --top 5` is not "the field's five fastest Pokémon,"
and a faster but lower-usage species can sit outside that window entirely.
Likewise `distribution`'s `share` is **not usage-weighted** — a species
running Fake Out on 12% of its sets counts the same as one running it on
98%, which is why the per-row `rate` (not `share` alone) is what actually
tells you how committed a given user is to that move or ability.

## Which upstream carries which metric

Copied from `reference/meta-lookup.md`, which has the full evidence:

| Upstream | Usage | Win rate | Record |
|---|---|---|---|
| Official ranked ladder (e.g. `battledataregmbs3`) | No | Yes | Yes |
| RK9/Limitless tournament team sheets (`championstournaments`) | Yes | Yes | Yes |
| Showdown-sourced formats | Yes | No | No |

So "what is used" and "what is winning" are different questions answered by
different populations, never blended — a format's `capabilities` (from
`meta check`/`meta formats`) tells you which question it can even answer
before you ask it. Tournament data is also a **rolling ~2-week window**, not
a season total — treat it as "recent," not "the whole regulation."

## Common mistakes
- **Treating per-Pokémon usage/win-rate (`meta usage`/`meta mon`) as the
  whole meta.** It misses cores and archetypes that don't dominate individual
  rankings but recur constantly as a pairing — that's what the team-level
  surface above is for. A WebSearch-summarized answer has the same blind
  spot and is even less verifiable; fetch the real data.
- **Passing a Mega by the wrong tool's naming convention.** `tools/meta`
  wants `Staraptor-Mega` (or the bare `Staraptor`); `tools/damage-calc` wants
  `"Mega Staraptor"` — opposite conventions, and each fails confidently (not
  loudly) on the other's form. See `reference/pitfalls.md`'s paired entry.
- **Blending formats.** A ladder win rate and a tournament usage figure for
  the same Pokémon are not two views of one number — different players,
  different match format (Bo1 vs. Bo3), different window. Label every figure
  by its format code.
- **Skipping `check` because the stamp "was fine last session."** The stamp
  can go stale between sessions without anyone editing it wrong — a season
  number increments upstream on its own. `check` costs one call.
- Treating co-occurrence (two Pokémon showing up together) as proof of
  synergy rather than a frequency signal — verify the actual mechanism
  before citing a core as a reason for anything.

## Early in a regulation — when there is no data to look up

Every regulation starts with no usage data, and this is a normal phase of
the cycle rather than a problem to work around. The session-start hook
reports it as `REGULATION EARLY` (first ~2 weeks) or `REGULATION FORMING`
(~2-6 weeks). **In the EARLY phase, `meta usage`/`meta mon` will return
empty, near-empty, or previous-regulation rows** (still run `check` first —
it validates the format code independently of whether that format has real
data yet).

What to do instead, in order:

1. **Say so, explicitly and first.** Tell the user the meta is unsettled and
   roughly how far into the cycle it is. Presenting thin data as a settled
   meta is worse than saying there is none.
2. **Carry over the previous regulation deliberately, not silently.** Most of
   the roster is unchanged, so the prior cycle's top threats are a reasonable
   starting hypothesis — but name it as carryover, and check each one against
   the new regulation's restricted list and mechanic changes. Prior-cycle
   archetypes built on a mechanic that just changed are the first to break.
   `reference/regulations/` has the archived cycle.
3. **Reason from what the new additions actually do**, not from what they are
   likely to be popular as. New Pokémon and Megas have known typing, base
   stats and fixed abilities the moment they exist — all queryable via
   `node tools/dex/cli.js mon "<Species>"` once the vendored data has been
   refreshed (see the `vgc-regulation-transition` skill; it lags the
   regulation). Speed tiers and damage rolls are computable on day one even
   though usage is not.
4. **Weight early tournament results over ladder data.** The first events run
   before ladder usage stabilises, and a small number of real results is a
   better signal than a thin usage table.
5. **Re-check often.** An early-phase threat list has a short shelf life;
   don't reuse one from a previous session without re-pulling.

In the FORMING phase the surfaces above work, but treat rankings as
directional rather than settled, and prefer win-rate data over raw usage —
early usage partly measures hype.

## Handing the result onward
A threat list is a *usage* signal, not a set of verified facts. Before any
claim about a threat's typing, Mega ability, or item legality gets made from
it, resolve that claim with `node tools/dex/cli.js` (see CLAUDE.md's table)
and its real moveset with `meta mon`. When relaying a `meta mon`/`meta usage`
figure, check whether it came back `{ "value": null, "reason": "..." }` —
that reason is the actual answer ("this format carries no win rate", "not
reported for this entry") and must be said out loud, not silently dropped or
misread as zero.

Saved files under `teams/` are historical records, never a meta source.

## References
- `reference/meta-lookup.md` — full `tools/meta` command surface, the
  per-upstream metrics table, per-population/no-blending rule, ETag
  freshness, and the Mega naming convention
- `reference/format-knowledge.md` — the last generated speed-tiers/
  distribution snapshot; check its `Generated`/`Regulation` stamps before
  citing it
- `reference/pitfalls.md` — the trap checklist, including the paired Mega
  entity-convention entry and the alphabetical-filler-dataset entry
- `reference/regulation.md` — regulation authority
- `docs/case-studies.md` — the missed Sun core and missed rain core in full
