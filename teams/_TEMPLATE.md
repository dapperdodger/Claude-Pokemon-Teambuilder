# Team: <Name / Core Concept>

**Regulation:** <M-B>
**Status:** <Draft>
**Built for:** Ladder / a specific tournament / exploring a concept
**Last updated:** YYYY-MM-DD

<!-- `**Regulation:**` must start with the bare regulation id (e.g. "M-B"),
     matching reference/regulation.md's `**Regulation:**` stamp. The
     session-start hook and `node tools/dex/cli.js team` both parse it to tell
     you when a team predates the current regulation. Prose may follow the id
     on the same line. -->

**Status vocabulary** — use exactly one, and mean it:

| Status | Means |
|---|---|
| `Draft` | Roster incomplete, or picks not yet verified against live data. |
| `Testing` | All six solved and `dex team` clean; not yet played enough to judge. |
| `Finalized` | Played, kept, and not currently being changed. |
| `Archived` | Built for a past regulation. Historical record only. |

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

**Filling this in:**

- **Pokémon** — the base species name. For a Mega, write the base species and
  annotate the battle forme: `Staraptor (→ Mega Staraptor)`.
- **Ability** — for a Mega, put the **fixed post-Mega battle ability** here,
  not the pre-Mega selection and not `—`. Get it from
  `node tools/dex/cli.js mon "Mega <Species>"`; the `baseFormeAbility` field
  in that output is what usage pages report, and is *not* what goes here.
- **SP allocation** — Champions Stat Points, 66 total, 32 per stat max (see
  `reference/champions-format.md`). Write `32 HP / 16 Atk / 18 Def`. Each
  number should be a solved minimum for a named breakpoint, not a round
  default.
- **Moves** — slash-separated, max 4.

**Validate before calling it done:**

```bash
node tools/dex/cli.js team teams/<this-file>.md
```

That checks duplicate items, SP budget and caps, roster/item/ability
legality, Mega abilities, and whether the team's regulation is still current.
It does **not** check move legality — learnsets are not in the local data, so
verify those live (see `reference/champions-format.md`).

## Why these six

Per-pick reasoning — why this Pokémon, what role it fills, what it covers
for teammates, what it answers in the current meta. Not "it's good", the
actual mechanism (speed control, typing + coverage, redirection, etc.).

## Intentional exclusions

Pokémon that were considered and deliberately left off, and why. This is
as important as what made the cut — it's the record of tradeoffs that
"just the six" doesn't show.

## Known weaknesses / open questions

What this team still loses to, or hasn't been tested against yet. A team with
this section empty is a team that hasn't been examined, not a team with no
weaknesses.

## Bring-6-pick-4 notes

Which 4-mon subsets are the intended leads/backs for common matchups —
see `reference/pitfalls.md`'s bring-6-pick-4 note. A team's
"synergy" claim should specify which 4 it's talking about.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| YYYY-MM-DD | Initial build | |
