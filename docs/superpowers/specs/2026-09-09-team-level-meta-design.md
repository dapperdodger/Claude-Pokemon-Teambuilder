# Design: team-level meta — the two thirds of the meta process the tooling cannot see

**Date:** 2026-09-09
**Status:** Approved in principle, not yet implemented. Written down before the
M-C regulation transition so the finding and its evidence survive it.

## Problem

`reference/methodology.md` states that answering "what's the meta" requires
**three** Pikalytics surfaces, and that none substitutes for the others:

1. `/topteams` — real six-Pokémon teams as brought by real players. Concrete
   builds to test against; each entry is one build, not a frequency signal.
2. `/team-usage` — six-Pokémon *archetypes* ranked by win rate and record.
   The "is this archetype actually good" check that `/topteams` cannot give.
3. `/pokedex`'s **"Common Team Cores"** — 2/3/4-Pokémon groupings ranked by how
   many teams run them. Surfaces a sub-core common across *many different* six-
   mon teams, which the other two miss when a core pairs with a long tail of
   different last-two picks.

**`tools/meta` parses none of them.** Its four parsers are `parseQuickInfo`,
`parseFormatInfo`, `parsePercentList` and `parseUsageTable`. Nothing in the
module mentions cores or top teams. Verified 2026-09-09 by grep.

That rule exists because of a logged incident: a session gave bring-6-pick-4
advice from per-Pokémon usage alone and **missed the entire Sun archetype**,
which directly conflicted with the team being built (`methodology.md` changelog,
2026-07-10). Cores exist to catch exactly that, and the tool cannot see them.

## Key finding: two of the three are already downloaded and thrown away

`meta usage` fetches `/ai/pokedex/{code}`. That page contains
`## Common Team Cores` **and** `## Recent Top Teams` as sections in the very
text it parses — and `parseUsageTable` reads only "Best 50 Pokemon by Usage"
and discards the rest.

So surface 3 costs **a parser and zero new network requests.**

Sample of what is in the bytes today (from the committed fixture
`tools/meta/tests/fixtures/ranked-index.md`, M-B):

```
## Common Team Cores
### 2-Pokemon Cores
| Rank | Core | Teams | Usage |
| 1 | Charizard-Mega-Y, Garchomp | 2155 | 16.3% |
| 2 | Garchomp, Kingambit | 1975 | 14.9% |
| 3 | Garchomp, Whimsicott | 1772 | 13.4% |
### 3-Pokemon Cores
| 1 | Charizard-Mega-Y, Garchomp, Kingambit | 1203 | 9.1% |
```

## Endpoint probe — all confirmed 2026-09-09

| Endpoint | Status | Contents |
|---|---|---|
| `/ai/topteams` | 200 | 127 teams. Per entry: rank, author, record, tournament, **archetype tags**, six species |
| `/ai/team-usage` | 200 | 308 compositions. Per row: rank, uses, win rate, record, unique teams, six species |
| `/ai/cores` | 404 | Does not exist — cores come from the pokedex index, not a dedicated endpoint |

`/ai/topteams` sample entry:

```
- **Rank**: 1
- **Author**: Roid Blancaflor
- **Record**: 7-2
- **Tournament**: Mid-Week Smoke #10
- **Archetypes**: trick-room, tailwind
- **Pokemon**: Basculegion, Farigiraf, Blaziken, Whimsicott, Floette-Eternal, Salamence-Mega
```

`/ai/team-usage` sample row:

```
| Rank | Uses | Win Rate | Record | Unique Teams | Pokemon |
| 1 | 12 | 59.46% | 22 - 15 - 0 | 12 | Rillaboom, Incineroar, Salamence-Mega, ... |
```

## Why this is worth building — three payoffs beyond the stated rule

**1. It settles claims the strategy layer currently states without evidence.**
`reference/archetypes.md` says things like "usually one Tailwind setter" and
"about one Chlorophyll abuser". With 127 archetype-tagged six-mon rosters those
become countable rather than asserted — count how many Tailwind learners a
`tailwind`-tagged team actually carries.

**2. `/topteams`' archetype tags connect directly to `reference/archetypes.md`.**
The tags (`trick-room`, `tailwind`, …) are the same taxonomy that file defines.
Joining them gives archetype **frequency and win rate** — which is precisely the
"relative strength" concept the masterclass source describes and which nothing
in the repo can currently measure.

**3. Win rate is the "is it good" axis the ladder format cannot provide.**
The official ladder feed (`battledataregmbs3`) carries win rate but **no usage
weighting**; the tournament feed carries both. See
`docs/superpowers/specs/2026-09-08-meta-usage-tool-design.md`'s capability table.

## Open design questions — decide before implementing

**Command shape.** Probably `meta cores` (free, from the already-fetched index)
and `meta teams` (the two tournament endpoints). Whether `/topteams` and
`/team-usage` are one subcommand or two is unresolved — they answer different
questions ("a concrete build to test against" vs "which archetypes win").

**Where the output lands.** `reference/format-knowledge.md` is already generated
by `meta speed-tiers --write` and already has a staleness check keyed to
regulation and age. Folding cores into it would give "what's the meta" a durable,
self-invalidating artifact for free. Probably right; not yet decided.

**Enforcement — the user's actual question was "make sure it gets used."**
Candidate points, in rough priority:
- `vgc-meta-lookup` — its three-surface step currently names URLs the tool cannot
  reach; it should name commands instead.
- `vgc-team-building`'s live-meta-scan step and its archetype step.
- `vgc-team-audit`'s threat-matchup step.
- `CLAUDE.md`'s "Never state these from recall — run the command" table.
- Possibly the generated `format-knowledge.md`, per above.

## Blocking dependency — read this first

**This must be built AFTER the M-C regulation transition, not before.** Its whole
job is describing the current meta; built against M-B rosters and item pools it
would describe a format nobody plays. The transition also re-vendors, which
settles a question left open on 2026-09-09: Rillaboom, Indeedee and Amoonguss
appear on real tournament teams while the vendored `POKEDEX_CHAMPIONS` says they
are not in the roster. That is very likely a stale pin rather than a real roster
gap, but it was not resolved before this document was written.

## Not in scope

Building it. This records the finding, the evidence, and the open questions so
none of it has to be rediscovered.
