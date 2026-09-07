---
paths:
  - "teams/**"
---

# Working with team files

Loaded only when a file under `teams/` is actually being read or written, so
these conventions don't sit in every session's context.

## Writing is gated on an explicit go-ahead

**Never call `Write` or `Edit` on anything in `teams/` until the user says to
save it** — a new file or an existing one. Working a full loadout out in chat
(species, item, ability, moves, a solved SP spread, all confirmed
back-and-forth) is *not* permission to persist it. Wait for "save it," "write
that in," "update the file," or equivalent.

Reading is unrestricted: open a team file freely when the user asks to revise
or extend it, or to avoid duplicating something they already have.

## These files are history, not meta reference

A team file's per-pick reasoning, threat analysis and "top core" claims were
true as of its own **Last updated** date, not today. Regulations, usage data
and roster availability all shift. Never cite a saved team as current meta
signal — re-derive from a live lookup (the `vgc-meta-lookup` skill) instead,
unless the user explicitly asks about that specific saved team.

## Format

Follow `teams/_TEMPLATE.md`. The sections that carry the real value are the
ones a bare roster doesn't show:

- **Why these six** — the mechanism per pick (speed control, typing plus
  coverage, redirection), not "it's good"
- **Intentional exclusions** — what was considered and rejected, and why
- **Bring-6-pick-4 notes** — which 4-mon subset a synergy claim applies to
- **Changelog** — one row per revision

Update an existing team's file **in place** with a new changelog row rather
than creating a new file per iteration.

## Before writing a spread into a file

SP allocations use the Champions Stat Points system (66 points, 32/stat cap),
never EVs — see `reference/regulation.md`'s "Stat system" section. Each
spread should be the solved *minimum* for a named breakpoint, not a round
default; `.claude/hooks/check_sp_spread_optimization.js` flags round-only
spreads whose reasoning shows no minimum/breakpoint language.
