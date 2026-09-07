---
name: vgc-meta-lookup
description: Use when asked what's popular/dominant in the current meta, what to expect to face, or to build a threat list — with no specific Pokémon, matchup, or already-defined team named yet. Not for a single named Pokémon's moveset (see vgc-threat-evaluation) or a specific team being built/refined (see vgc-team-building/vgc-team-refining, which invoke this skill internally for their own meta lookups).
---

# VGC Meta Lookup

## Overview
"What's the meta" needs three Pikalytics surfaces together, not one — each
answers a different question, and a WebSearch-only pass (or a single
per-mon usage check) has already missed real archetypes twice in past
sessions: a Sun core and a Swampert-Mega/Pelipper/Archaludon rain core,
both invisible from individual usage rankings alone.

## When to use
- "What's the meta right now / what's popular"
- "What am I likely to face this regulation"
- Building a threat list to feed into `vgc-team-building` or
  `vgc-team-refining`'s threat-sourcing step
- Not for a single Pokémon's own set (`vgc-threat-evaluation`) or a
  specific team/matchup already on the table (`vgc-team-building` /
  `vgc-team-refining`)

## Before pulling any data
Confirm the regulation is current this session — `reference/regulation.md`,
even if already checked earlier in this conversation (CLAUDE.md rule 5).
Then check `https://www.pikalytics.com/pokedex` for the current
format-slug before using any per-mon or per-format URL — the slug
includes a season number that increments within a regulation and isn't
permanent (currently on its 3rd M-B slug as of last check).

## The three surfaces (pull all three, not just one)
1. **`/topteams`** — real six-Pokémon tournament builds as actually
   brought. Concrete, but each entry is one specific build, not a
   frequency signal.
2. **`/team-usage`** — full six-Pokémon archetypes ranked by win rate and
   team count/W-L-D record. The "is this archetype actually good" check
   that `/topteams` alone doesn't give.
3. **`/pokedex`'s "Common Team Cores" section** (distinct from a per-mon
   page's teammates list) — 2/3/4-Pokémon core groupings ranked by team
   count, sitting between the top-20 individual-usage table and the
   recent-top-teams listing. Surfaces a popular sub-core even when no
   single full team dominates raw usage.

Pull all three before answering "what's the meta" or "what should I
prepare for" — cores tell you what's commonly paired, team-usage tells
you which full archetypes actually win, topteams gives concrete real
builds to test against. One surface alone has already produced a wrong
threat list in this repo's history (see Common mistakes below).

## Common mistakes
- **Generic WebSearch snippets are not the same as fetching the
  team-level pages.** A WebSearch-summarized answer can sound authoritative
  while never having touched `/topteams` or `/team-usage` — verify by
  actually fetching those URLs, not by trusting a search summary that
  mentions Pikalytics.
- Treating per-Pokémon usage rank alone as "the meta" — misses cores that
  don't dominate individual rankings but recur constantly as a pairing.
- Hardcoding a season-slug as if it's permanent.
- Treating co-occurrence (two Pokémon showing up together) as proof of
  synergy rather than a frequency signal — verify the actual mechanism
  before citing a core as a reason for anything.

## Handing the result onward
A threat list is a *usage* signal, not a set of verified facts. Before any
claim about a threat's typing, Mega ability, or item legality gets made from
it, resolve that claim with `node tools/dex/cli.js` (see CLAUDE.md's table)
and its real moveset with a live per-mon lookup.

Saved files under `teams/` are historical records, never a meta source.

## References
- `reference/methodology.md` — "Live meta lookup": full detail, URL patterns, citations
- `reference/pitfalls.md` — the trap checklist, including the data-source traps above
- `reference/regulation.md` — regulation authority
- `docs/case-studies.md` — the missed Sun core and missed rain core in full
