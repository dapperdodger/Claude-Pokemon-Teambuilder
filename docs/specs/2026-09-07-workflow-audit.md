# Spec: Workflow audit — goals, findability, and flow

**Status:** Implemented 2026-09-07
**Date:** 2026-09-07
**Scope:** Second-pass audit after `2026-09-07-repo-reorganization.md` landed

## Reframing (this spec's own correction)

The first draft filed the M-C rollover as a **P0 incident**. That framing was
wrong, and the user called it: regulations turn over roughly every 3-4 months,
so a rollover is a **scheduled lifecycle event**. Treating each one as an
emergency *is* the defect — it guarantees the same scramble every quarter.

Everything below still holds as a list of findings, but the fix changed shape.
Instead of patching for M-C, the repo now models the regulation lifecycle:

- **`reference/regulation.md` holds only the current cycle** and is replaced
  wholesale at a rollover. Everything invariant moved to
  `reference/champions-format.md`, so a transition swaps one small file
  instead of surgically editing a large mixed one.
- **A four-stamp machine-readable block** (`Regulation`, `Regulation starts`,
  `Regulation ends`, `Last verified`) drives everything else.
- **`.claude/hooks/regulation-phase.js` derives the phase** — EARLY / FORMING
  / SETTLED / ROLLOVER IMMINENT / ENDED — and reports what it implies. The
  correct behaviour genuinely differs by phase, so the phase is computed
  rather than inferred from a date each time.
- **`vgc-regulation-transition` is the runbook**: verify live, archive the old
  cycle, rewrite the current one, record unverified new mechanics, re-vendor
  the roster data, flag old teams, set expectations.
- **`reference/regulations/` archives past cycles**, so a team file stamped
  with an old regulation stays interpretable.
- **`vgc-meta-lookup` gained an "early in a regulation" section** — the
  no-data phase is now a documented approach rather than a broken workflow.
- **The `Unverified mechanics` table** is a standing slot for the
  new-mechanic-with-unknown-rules pattern (Z Mega now; something else next
  cycle).

## Contents

- [Reframing (this spec's own correction)](#reframing-this-specs-own-correction)
- [Summary](#summary)
- [Finding: regulation rollovers were unmodelled](#finding-regulation-rollovers-were-unmodelled-was-p0--m-c-lands-in-two-days)
- [Dangling rule references (regression)](#p0--dangling-rule-references-regression)
- [Q1: Does the repo have clear goals when doing tasks?](#q1-does-the-repo-have-clear-goals-when-doing-tasks)
- [Q2: Does it know what to look for, and where?](#q2-does-it-know-what-to-look-for-and-where)
- [Q3: What would improve the flow?](#q3-what-would-improve-the-flow)
- [What was implemented](#what-was-implemented)
- [Prioritised change list (original)](#prioritised-change-list-original)
- [Explicitly not doing](#explicitly-not-doing)

---

## Summary

The last change fixed *fact verification*. This audit looked at the layer
above it: whether a session knows what it's trying to achieve, where to find
what it needs, and how much friction stands in the way.

Nine findings, all now addressed. The largest one was mis-framed on the first
pass — see [Reframing](#reframing-this-specs-own-correction).

The overall shape: **static facts are now well handled; the workflow around
them is not.** The repo can tell you Mega Raichu Y's ability, but it cannot
tell you whether your team is legal, whether your Pokémon can actually learn
the moves you gave it, or what to do when the regulation everything was built
for expires.

## Finding: regulation rollovers were unmodelled (was "P0 — M-C lands in two days")

`reference/regulation.md` says Regulation M-B ends **2026-09-09**. Today is
2026-09-07. Every one of the **7 saved teams** is stamped `Regulation: M-B`.

Three separate problems land at once:

**1. Nothing flags a team file as built for a dead regulation.** Team files
record the regulation they were built for, which is good — but nothing ever
compares that field against the current one. On 2026-09-09 all seven silently
become historical documents that still read as current.

**2. No guidance exists for operating in a brand-new regulation.** I searched
the whole repo: the only acknowledgement is one line inside `regulation.md`
noting day-one M-C data will be thin. `vgc-meta-lookup`'s entire process
assumes Pikalytics has meaningful data — three surfaces, usage rankings, win
rates. For the first weeks of M-C, that data will be absent or noise, and the
skill has no fallback. **The primary research workflow is about to stop
working and nothing says so.**

**3. M-C's headline mechanic is explicitly unverified.** `regulation.md`
itself flags that "Z Mega Evolution" is a new distinct mechanic whose ruleset
is unconfirmed — one per team? stacks with a regular Mega? That question is
recorded but unowned; nothing makes a session resolve it before building
around a Z Mega.

**Proposed:**
- A `teams/` staleness signal: compare each team file's `Regulation:` field
  against `regulation.md`'s current one, and mark mismatches. Cheap as a
  `tools/dex/cli.js team --check` output or a line in the SessionStart hook.
- A "thin data" section in `vgc-meta-lookup`: what to do when usage data
  doesn't exist yet — lean on prior-regulation carryover, first-principles
  typing/speed/role analysis, and early tournament results, and **say
  explicitly to the user that the meta is unsettled** rather than presenting
  provisional data as settled.
- Resolve the Z Mega ruleset as a live lookup, then record it.

## P0 — Dangling rule references (regression)

CLAUDE.md used to be a numbered list of 13 rules. The reorganization replaced
that with a routing table — but **~15 cross-references to `CLAUDE.md rule N`
survive in live files** and now point at nothing:

| File | Dangling refs |
|---|---|
| `.claude/skills/vgc-meta-lookup/SKILL.md` | rule 5 |
| `reference/team-refining.md` | rules 3, 6, 7, 10 |
| `reference/methodology.md` | rules 3, 6, 7, 10 |
| `reference/damage-calc.md` | rule 3 |
| `reference/mechanics.md` | rule 13 |
| `teams/README.md` | rule 11 |
| `teams/surprise-trick-room-anti-meta.md` | rules 5, 6 |
| `tools/damage-calc/optimize-bulk.js` | rule 3 |

My regression, from the last change. Each should become a named pointer
("CLAUDE.md's session-start checks") rather than a number, so this can't
recur when the file is next restructured. Changelog rows keep their numbers —
they are historical statements about what was true then.

## Q1: Does the repo have clear goals when doing tasks?

**Mostly yes at the strategic level, no at the completion level.**

CLAUDE.md states the two goals clearly, and the skills give ordered
processes. What's missing is a **definition of done**. `vgc-team-building`
step 7 says "run the pitfalls checklist," but nothing establishes what makes
a team finished versus abandoned mid-build. The `Status:` field in team files
is used inconsistently as a result — the seven files carry `Draft`,
`Testing`, `Testing — all six roster slots filled and solved`, `Draft — saved
as user-provided, not yet analyzed`, and `Finalized`, with no shared meaning.

**Finding 1 — no team validator, though most of it is mechanically checkable.**
This is the biggest gap. Every one of these is deterministic and currently
enforced only by prose:

| Check | Currently | Note |
|---|---|---|
| No duplicate items across the six | prose | **hard-illegal, and has been missed twice** |
| SP total ≤ 66, each stat ≤ 32 | prose | trivially checkable |
| Species in the Champions roster | prose | `dex mon` already answers |
| Item / ability in the Champions pool | prose | `dex legal` already answers |
| A Mega's listed ability is the fixed one | prose | the repo's most-repeated error |
| Moves exist in `MOVES_CHAMPIONS` | prose | existence only, not learnability |
| Stat Alignment is one of the 21 valid | prose | `NATURES` is vendored |
| Team's regulation matches the current one | nothing | see P0 |

The team-file tables parse cleanly and consistently — I extracted all seven
without trouble, and `.claude/hooks/check_sp_spread_optimization.js` already
contains a working parser to build on. A `dex team <file>` command plus a
`PostToolUse` hook would convert the "check before finalising" checklist from
something to remember into something that runs.

*I ran these checks by hand against all seven team files while auditing: no
duplicate items, all SP totals exactly 66, and every listed Mega ability
correct. The gap is that nothing guarantees that stays true.*

**Finding 2 — `Status:` values need a defined vocabulary.** Three states with
stated entry criteria (e.g. *Draft* = roster incomplete or unverified;
*Testing* = all six solved and validated, not yet played; *Finalized* =
played and kept) would make the field mean something.

## Q2: Does it know what to look for, and where?

**Static facts: yes, now. Live facts: partly. Learnsets: no.**

**Finding 3 — learnset verification has no named source, and it caused the
worst documented failure.** An entire team's strategic premise was built on
Mega Altaria running Calm Mind, a move Altaria cannot learn in Champions at
all. It went unnoticed until a final audit.

The repo's current state on this:
- `CLAUDE.md` does not mention learnsets at all.
- `vgc-team-building` says "verify the learnset before committing to a role"
  but never says **where**.
- The only place the working source is named is a changelog row in
  `pitfalls.md` (a direct Bulbapedia Champions-learnset fetch).
- **There is no local learnset data.** I confirmed the vendored pokedex
  carries only `t1/t2/bs/w/ab/formes` — no moves. So this can never become a
  `dex` subcommand; it must stay a live lookup.

That combination — highest-severity failure, no named source, no local data,
not in CLAUDE.md — makes it the clearest "knows to look, doesn't know where"
gap in the repo. It should be a row in CLAUDE.md's lookup table pointing at
the live source, and an explicit gate in the team-building process before a
role is committed to.

**Finding 4 — the vendored data's limits aren't written down.** Sessions
should know up front that the local data covers typing, base stats, fixed
Mega abilities, and item/ability legality — and does **not** cover learnsets,
usage, or current sets. `SETDEX_GEN10` presets exist for only **77 of 315**
roster species (24%), which is worth stating so an absent preset reads as
expected rather than as a signal.

**Finding 5 — `MEGA_STONE_USER_LOOKUP` is vendored but unused.** This maps
Mega stones to their users. The 2026-09-04 bug — passing a base species plus
its Mega stone to the calculator, which silently computed the base form —
is exactly what this table would catch. Worth wiring into the damage CLI as a
warning.

## Q3: What would improve the flow?

**Finding 6 — two common task shapes have no skill.**

- **"Here's my team, what does it lose to?"** Falls between skills.
  `vgc-team-refining`'s scope fence explicitly says *do not critique team
  synergy/overall strategy*, and `vgc-team-building` is for building. A team
  *audit* — coverage gaps, shared weaknesses, speed-control holes, matchup
  spread — is a distinct and very common job with no home.
- **"I'm facing this team, what four do I bring?"** Bring-6-pick-4 is
  referenced in `teams/_TEMPLATE.md` and `pitfalls.md` as something to record,
  but no process anywhere says how to reason about it.

**Finding 7 — team-file Mega notation has three competing conventions.**
Across the seven files:

```
| Dragonite (→ Mega Dragonite) | Dragoninite | Multiscale | ...
| Staraptor (→ Mega, fixed Contrary) | Staraptorite | — | ...
| Swampert | Swampertite (→ Mega, fixed Swift Swim) | — | ...
```

Same information, three shapes — ability sometimes in the ability column,
sometimes inlined into the species or item cell, sometimes replaced by `—`.
This makes the tables harder to read and blocks the validator in Finding 1.
Standardise on one: species cell names the Mega forme, ability column carries
the fixed ability.

**Finding 8 — no damage sweep.** `optimize-bulk-cli.js` accepts a
`--threats-file` for multi-threat work, but `damage-calc/cli.js` is strictly
one attacker/defender/move per invocation. Checking one move against ten
threats is ten separate calls — ten agent round-trips. Per-call cost is fine
(~0.1s), so this is purely turn count, but turn count is the real cost in a
session. A `--threats-file` on the damage CLI, matching the idiom
`optimize-bulk` already uses, would collapse that to one call.

**Finding 9 — Pikalytics slug discovery is manual every session.** The format
slug embeds an incrementing season number, so every meta lookup starts by
fetching `/pokedex` to discover the current slug before any real query. A
small helper could resolve it once. Lower priority and genuinely fragile —
it's scraping — so this is worth doing only if the manual step keeps biting.

## What was implemented

All findings addressed. 144 tests pass (was 90).

| Finding | Resolution |
|---|---|
| Rollovers unmodelled | Lifecycle system above: split files, phase hook, transition skill, archive, early-phase guidance |
| Dangling `rule N` refs | ~15 replaced with named pointers; changelog rows keep numbers as historical |
| No definition of done / no validator | `tools/dex/cli.js team` + `validate-team-file.js` PostToolUse hook; 21 tests |
| `Status:` vocabulary undefined | Four defined states in `teams/_TEMPLATE.md` |
| Learnsets: no named source | CLAUDE.md section, `champions-format.md` coverage table, team-building step 4b |
| Vendored-data limits undocumented | `champions-format.md`'s "What the local vendored data does and does not cover" |
| `MEGA_STONE_USER_LOOKUP` unused | Powers the validator's battle-forme resolution, including X/Y suffix matching |
| No team-audit / bring-6-pick-4 skill | `vgc-team-audit` |
| Inconsistent Mega notation | One convention documented in the template; validator accepts and checks it |
| No damage sweep | `tools/damage-calc/sweep-cli.js --file`; 10 tests |
| Pikalytics slug | **Reversed on evidence — now done.** See below. |

### Correction: the Pikalytics slug was mis-rated

I originally rated this "low priority, fragile scraping, one extra fetch."
That was wrong, and checking it against the live site rather than reasoning
about it showed why:

1. **The slug is not derivable.** M-B ranked is `battledataregmbs3`; M-A was
   `gen9championsvgc2026regma`. Two unrelated naming schemes, so the next
   regulation's slug cannot be computed — only looked up.
2. **A stale slug does not fail safely.** A *nonexistent* slug 404s
   (`/pokedex/battledataregmbs1/Garchomp` → 404), which is safe. But a
   *previous regulation's* slug keeps working indefinitely and returns
   complete, normal-looking data: M-A's Garchomp page still serves
   Earthquake 90.8% next to M-B's live 80.7%. Nothing marks it stale except
   the page's own format label.
3. That makes it the repo's signature failure mode — authoritative-looking
   wrong data — sitting on the single most load-bearing data path, one day
   before a rollover makes `battledataregmbs3` the stale-but-working slug.

So the friction framing missed a correctness bug. What shipped:

- **A `**Pikalytics slug:**` stamp** in `regulation.md`'s machine block,
  recorded (not derived) and updated at each rollover.
- **A phase-hook check**: both observed naming schemes embed the regulation
  id with the hyphen dropped (`mb`, `ma`), so the hook flags a slug that
  doesn't mention the active regulation. It can't compute the right slug, but
  it can catch the dangerous one.
- **The load-bearing fix, which needs no tooling at all**: verify the fetched
  page's own format label names the current regulation before using any
  number off it. Every Pikalytics page states it verbatim. This works even
  when the stamp is stale, and is now mandatory in `vgc-meta-lookup`,
  CLAUDE.md's session checks, and step 5b of the transition runbook.

I did not build a live slug resolver. The label check subsumes it: it catches
the same error later but more reliably, and without depending on an
undocumented endpoint's HTML shape.

### Found while implementing

- **`teams/whimsicott-incineroar-antiweather-core.md` lists "Staraptorite";
  the real Champions item is "Staraptite".** A genuine illegal-item bug in a
  saved team, found by the validator on its first run. Not fixed here — team
  files are only written on explicit instruction.
- **The vendor staleness hook had been completely dead since the previous
  change moved it into `.claude/hooks/`** — it computed its repo root as
  `dirname/..`, correct in `scripts/` but one level short afterwards, so it
  never found the manifest and exited 0. Rewritten in Node as
  `vendor-staleness.js`; it now reports when it cannot check.
- **The vendored data does not contain M-C's roster.** Rillaboom, Baxcalibur,
  Salamence, Golisopod and the Z Megas are absent from `POKEDEX_CHAMPIONS`
  (they exist only in the broader dexes, which are never used for results).
  Re-vendoring is a required transition step, now written into the runbook.

## Prioritised change list (original)

| # | Change | Priority | Size |
|---|---|---|---|
| P0a | Team-vs-current-regulation staleness signal | **urgent** | S |
| P0b | "Thin data" fallback section in `vgc-meta-lookup` | **urgent** | S |
| P0c | Resolve and record the Z Mega ruleset | **urgent** | S (live lookup) |
| P0d | Fix ~15 dangling `CLAUDE.md rule N` references | **urgent** | S |
| 1 | `dex team <file>` validator + PostToolUse hook | high | M |
| 3 | Name the learnset source; add to CLAUDE.md + team-building gate | high | S |
| 7 | Standardise team-file Mega notation (unblocks #1) | high | S |
| 6 | `vgc-team-audit` skill; bring-6-pick-4 process | medium | M |
| 4 | Document vendored-data coverage and limits | medium | S |
| 8 | `--threats-file` sweep for the damage CLI | medium | M |
| 2 | Define the `Status:` vocabulary | low | S |
| 5 | Wire `MEGA_STONE_USER_LOOKUP` into the damage CLI | low | S |
| 9 | Pikalytics slug helper | low | M, fragile |

A sensible first cut is **P0a-P0d plus 3 and 7** — all small, all either
time-critical or unblocking, and none of them requiring new architecture.

## Explicitly not doing

- **No learnset data in `tools/dex`.** It isn't in the vendored source, and
  reconstructing it would create exactly the stale-local-copy problem the
  repo exists to avoid. It stays a live lookup with a named source.
- **No caching of meta data.** Same reason; live-first is correct.
- **Not merging `vgc-team-refining` into a broader audit skill.** Its narrow
  scope fence is doing real work — the proposed audit skill is a third,
  separate job, not a reason to widen refining.
- **Not renumbering CLAUDE.md back into a rule list.** Named pointers are
  what survive restructuring; the numbers are what broke.
