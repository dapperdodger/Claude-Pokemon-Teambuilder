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

**1. Confirm the regulation** — `reference/regulation.md`, even if already
checked earlier in this conversation.

**2. Get the format slug right, then prove it.** The slug goes in every URL
(`https://www.pikalytics.com/pokedex/{slug}/{Pokemon}`) and getting it wrong
is the single most dangerous failure in this skill.

`reference/regulation.md` records the current slug in its stamp block. Treat
that as a starting point, not an authority:

- **The slug is not derivable from the regulation id.** M-B ranked is
  `battledataregmbs3`; M-A was `gen9championsvgc2026regma` — completely
  different naming schemes. You cannot compute the next one. Read it off
  `https://www.pikalytics.com/pokedex`.
- **The season number increments *within* a regulation**, so the slug can go
  stale without the regulation changing.
- **A stale slug does not fail loudly.** A nonexistent slug 404s, which is
  safe. But a *previous regulation's* slug keeps working indefinitely and
  returns complete, normal-looking data. Verified 2026-09-07: M-A's page still
  serves full Garchomp usage (Earthquake 90.8%) right alongside M-B's live one
  (Earthquake 80.7%). Nothing distinguishes them except the page's own label.

**So the mandatory check is: read the format label on the page you actually
fetched, and confirm it names the regulation you are in.** Every Pikalytics
page states it verbatim, e.g. *"Pokemon Champions VGC 2026 Regulation Set M-B
S3 Ranked Battle Data"*. If it names a different regulation, discard
everything on that page and re-resolve the slug — do not "adjust for" it.

This check costs one glance, needs no tooling, and is the only step that
still works when the recorded slug is out of date. Do it every session, on
every surface below, not once per conversation.

If the slug in `reference/regulation.md` turns out to be wrong, fix the stamp
in the same session — that is a repo correction, not a chat aside.

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

## Early in a regulation — when there is no data to look up

Every regulation starts with no usage data, and this is a normal phase of
the cycle rather than a problem to work around. The session-start hook
reports it as `REGULATION EARLY` (first ~2 weeks) or `REGULATION FORMING`
(~2-6 weeks). **In the EARLY phase the three-surface process above does not
work** — `/topteams` and `/team-usage` will be empty, near-empty, or
reflecting the previous regulation.

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
and its real moveset with a live per-mon lookup.

Saved files under `teams/` are historical records, never a meta source.

## References
- `reference/methodology.md` — "Live meta lookup": full detail, URL patterns, citations
- `reference/pitfalls.md` — the trap checklist, including the data-source traps above
- `reference/regulation.md` — regulation authority
- `docs/case-studies.md` — the missed Sun core and missed rain core in full
