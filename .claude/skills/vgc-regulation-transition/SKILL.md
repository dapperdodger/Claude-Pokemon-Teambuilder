---
name: vgc-regulation-transition
description: Use when a VGC regulation has ended or is about to, when the session-start hook reports REGULATION ENDED or ROLLOVER IMMINENT, or when the user says a new regulation/season has started. Handles the handover — verifying the new rules, archiving the old cycle, re-vendoring the roster data, and flagging teams built for the previous regulation.
---

# VGC Regulation Transition

## Overview
Regulations turn over roughly every 3-4 months. This is a **scheduled event
with a runbook**, not an incident — the whole point of this skill is that a
rollover should be routine rather than something rediscovered each time.

At a transition, three things change together and all three must be handled:
the **rules** (dates, legal mechanics, restricted list), the **roster** (new
Pokémon and Megas, which live in vendored data that lags), and the **meta**
(usage data resets to nothing).

## When to use
- The session-start hook reports `REGULATION ENDED` or `ROLLOVER IMMINENT`
- The user says a new regulation, season, or ruleset has started
- `reference/regulation.md`'s `Regulation ends` date has passed
- Before building anything if the active regulation is in doubt

## Checklist

```
- [ ] 1. Verify the new regulation live
- [ ] 2. Archive the outgoing regulation
- [ ] 3. Rewrite reference/regulation.md
- [ ] 4. Record unverified new mechanics
- [ ] 5. Re-vendor the roster data and run tests
- [ ] 5b. Re-resolve the Pikalytics format slug
- [ ] 6. Flag teams built for the old regulation
- [ ] 7. Set expectations with the user
```

**1. Verify the new regulation live.** Never carry anything over from
assumption. Pull from Victory Road, the official Pokémon news post, and
Serebii; cross-check at least two. You need:
- Regulation id, start date, end date
- Which mechanics are active (Mega only? Tera? Dynamax? something new?)
- Restricted/banned list changes
- New Pokémon and new Mega Evolutions added
- Item-pool changes — Champions' item pool grows per regulation too

**2. Archive the outgoing regulation.** Create
`reference/regulations/<id>.md` with what was active, plus the outgoing
changelog rows from `regulation.md`. Add a row to
`reference/regulations/README.md`. This is what keeps old team files
interpretable — without it you cannot tell which mechanics were legal when a
team was built.

**3. Rewrite `reference/regulation.md`.** Replace it wholesale — it describes
only the current cycle. Update all five stamps in the machine-readable block
(`Regulation`, `Regulation starts`, `Regulation ends`, `Last verified`,
`Pikalytics slug` — see step 5b); the phase hook and the team validator both
parse them, and a missing stamp now reports loudly rather than failing
quietly. Do **not** move
format-invariant material into it — the Stat Points system, platform context
and roster-vs-legality discipline live in `reference/champions-format.md` and
do not change at a rollover.

**4. Record unverified new mechanics.** A regulation usually introduces a
mechanic before its exact ruleset is public. Put it in `regulation.md`'s
**Unverified mechanics** table with the specific open question and what it
blocks — don't quietly assume it works like the thing it resembles. Move it
into "Active mechanics" only once verified. (Real example: "Z Mega Evolution"
is a distinct mechanic from both Z-Moves and plain Mega Evolution, and
whether it stacks with a regular Mega was unknown at M-C's launch.)

**5. Re-vendor the roster data, then run the tests.** New Pokémon and Megas
do **not** appear in `tools/dex` until the vendored data is refreshed —
`POKEDEX_CHAMPIONS` is a point-in-time snapshot. Follow
`tools/damage-calc/VENDOR_MANIFEST.md`'s "Re-vendoring" section, then:

```bash
npm test
```

`tools/dex/tests/type-chart-invariant.test.js` will fail loudly if the
re-vendor changed type effectiveness — that is a real finding, not a broken
test. After re-vendoring, spot-check that the new species actually resolve:

```bash
node tools/dex/cli.js mon "<New Species>"
```

**5b. Re-resolve the Pikalytics format slug.** Read the new slug off
`https://www.pikalytics.com/pokedex` and update the `**Pikalytics slug:**`
stamp in `reference/regulation.md`. **Do not guess it** — naming is not
consistent between regulations (M-B ranked was `battledataregmbs3`, M-A was
`gen9championsvgc2026regma`), and the old slug will keep returning complete,
normal-looking data from the previous regulation rather than failing. This is
the step that most quietly poisons everything downstream if skipped.

**6. Flag teams built for the old regulation.** The phase hook lists team
files whose `Regulation:` stamp no longer matches. Don't silently rewrite
them — a team file is a historical record. Note in the file that it was built
under the previous regulation, and only revise it if the user asks.

**7. Set expectations.** Say plainly that the meta is unsettled and why. For
the first ~2 weeks there is effectively no usage data; see the
`vgc-meta-lookup` skill's "Early in a regulation" section for how to reason
without it. Don't present provisional numbers as settled.

## Common mistakes
- Treating the rollover as an emergency instead of running this checklist
- Updating the prose dates but not the machine-readable stamps, so the phase
  hook silently reports the wrong phase
- Leaving the old Pikalytics slug in place, so every "live" usage lookup
  silently returns the previous regulation's data
- Assuming the vendored dex already has the new roster — it does not until
  re-vendored, and `dex mon` will report the species as unknown or, worse,
  return the pre-update forme
- Carrying a mechanic assumption over from the previous regulation
- Rewriting old team files to look current instead of marking them historical
- Presenting week-one usage data as a settled meta

## References
- `reference/regulation.md` — the current cycle, replaced here
- `reference/champions-format.md` — what does *not* change at a rollover
- `reference/regulations/` — the archive, and its index
- `tools/damage-calc/VENDOR_MANIFEST.md` — re-vendoring procedure
