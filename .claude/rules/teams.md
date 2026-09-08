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

**None of these are permission**, and each has generated an unwanted edit:

- A regulation rolled over and the file's `Regulation:` stamp is now stale
- The team contains something newly illegal, or a genuine error you just found
- You are mid-audit or mid-refine *of that exact file*
- You are only adding a note, banner, or changelog row rather than changing
  the team
- The user asked you to look at, check, or analyse the file

The pattern in all five is the same: having a good reason to change a file is
not the same as having been asked to. Put the finding in your reply. If it
seems worth writing down, ask in one line and drop it if the answer is no.

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

## Revising a team: the six species decide in-place vs. new file

**Once you have been told to write**, what you write depends on one
countable thing — whether the **six species** change. Not on how big the
change feels. "It's only a small tweak" is not a test; it is the sentence
that precedes every unwanted edit.

| What changed | Where it goes |
|---|---|
| Nothing about the team — typo, broken link, a field left blank that was always true (an empty ability column), a miscalculated number in the prose | **In place.** This is a *correction*: it repairs the record rather than altering it. |
| The team itself, **same six species** — items, abilities, moves, SP spreads, any number of rows | **In place**, with a changelog row per change recording the **old value** |
| **Any species swapped**, or the team **ported to a new regulation** | **New file** |
| You genuinely cannot tell which side it falls on | **Ask, in one line, before writing anything** |

**This table only decides *where* an approved write goes — never *whether* to
write.** The gate above still applies to all four rows, corrections included:
spotting a blank ability column is not permission to fill it in. Report it and
wait to be asked.

### Editing in place

The changelog row is what keeps an in-place edit non-destructive, so it must
record what the value **was**, not merely that it moved:

- ✅ `Gallade Speed 20→24 SP — outspeeds max-Speed Maushold`
- ❌ `Re-tuned Gallade's Speed`

Update `**Last updated:**` in the same edit. Leave `**Regulation:**` alone
unless the team is genuinely being re-verified against a new one — and that
case is a new file anyway.

### Writing a new file

- **Name it** `<original-basename>-v2.md`, then `-v3`. Keep the base name so
  revisions of one team sort together.
- Add a `**Supersedes:**` line under the stamps naming the file it replaces,
  and open the changelog with a row saying what changed from it and why.
- **Leave the predecessor byte-for-byte untouched** — not its stats, not its
  `Status:`, not its `Last updated:`. Don't mark it superseded, archived or
  outdated. The `Supersedes:` pointer runs forward only, on purpose, so
  revising a team never requires editing the record it revises.

### When to ask

The species line is deliberately mechanical, which means it can be satisfied
by something that is really a rebuild — the same six with every item,
ability and moveset replaced. Nothing in the table catches that, so this is
the case to stop on: **if the same six would no longer be described by the
old file's reasoning, ask which the user wants before writing.** One line,
then do what they say.

Ask on any other genuine ambiguity too. Don't ask on routine saves — a
one-line question on every write is the friction this rule set exists to
remove.

Convention history: this file previously said to update in place with a
changelog row; that was reversed to new-file-always on 2026-09-08, then
settled at the species line the same day (both user decisions).

## Before writing a spread into a file

SP allocations use the Champions Stat Points system (66 points, 32/stat cap),
never EVs — see `reference/champions-format.md`'s "Stat system" section. Each
spread should be the solved *minimum* for a named breakpoint, not a round
default; `.claude/hooks/check_sp_spread_optimization.js` flags round-only
spreads whose reasoning shows no minimum/breakpoint language.
