# Design: making the evaluation layer bind — decision cards for every pick

**Date:** 2026-09-14
**Status:** Draft, pending user review

## Problem

The 2026-09-08 strategy layer (`docs/superpowers/specs/2026-09-08-teambuilding-philosophy-design.md`)
wrote down what makes a team good: archetypes, speed control, roles, and the
"is this Pokémon good" rubric. It did not make any of it bind.

A 2026-09-14 session under `vgc-team-building` ("build around Mega Froslass",
ladder, Good Stuff, Regulation M-C) ended with this six: Froslass (→ Mega),
Sneasler, Incineroar, Rillaboom, Kingambit, Basculegion. By that session's own
live `meta usage` pull, the five partners were ranked **#2, #3, #1, #5 and
#6** — five of the top six. The repo's own `package.json` description says it
exists to support favourite-Pokémon builds "rather than copy-pasting top-usage
squads."

Every tool call in that session was verified. The design steps were not done:

- `reference/roles.md`, `speed-control.md`, `team-evaluation.md` and
  `pitfalls.md` were never opened, though the skill names each at a step.
- `dex find` ran once (slot 1), then the most-used result was recommended.
  Every later slot's candidates came from `meta mon` teammate lists.
- Co-occurrence was cited as "proven synergy" — `pitfalls.md:85` says it is
  not.
- "(Recommended)" went to the highest-usage option all six times.
- Rubric Q4 ("is there another legal Pokémon that fills this role better?")
  was never asked.
- Partners only covered the centrepiece's type weaknesses; none used its Snow /
  Aurora Veil / Blizzard kit, which `archetypes.md` says is what snow is for.
- Slots were spent patching Ground and Rock weaknesses without the Meta
  awareness check; the Rock threats named sat at 3-9% usage.
- "A Fighting-type answers Kingambit" was a typing-only claim; Kingambit's 42%
  Chople Berry was noticed and ignored.
- Mechanics were stated from recall and were wrong: Intimidate "softening"
  Defiant Kingambit (the user caught it); Grassy Terrain "cutting all Ground
  damage by a third" (`mechanics.md` says it halves only Earthquake / Bulldoze /
  Magnitude and heals the opponent too).
- Implausible `meta mon` ability splits were rationalised instead of
  questioned, until the user flagged Farigiraf.

### Root cause

1. **Only steps that produce a tool call leave evidence.** Reading a file or
   answering a rubric question leaves nothing to see, so those were skipped.
2. **Meta data arrives first and anchors.** Step 2 pulls usage before any
   design; a teammate list then works as a ready-made candidate list.
3. **A single "(Recommended)" demands one ranking**, and usage is the easiest
   one to defend.

### The same exposure in the other skills

| Skill | Exposed? | Where |
|---|---|---|
| `vgc-team-building`, strategy / existing-team starts | Yes | Archetype choice from `meta teams` win rates; replacement slots go through the same step 5 |
| `vgc-team-refining` | Yes, for moves | Step 1 flags any move not "actually run on real current sets" as a mismatch, ahead of role fit |
| `vgc-threat-evaluation` | Partly | "What beats X" has no candidate-generation step at all |
| `vgc-team-audit` | Indirectly | Checks legality, coverage, speed, threats — never pick quality or centrepiece use, so the build above would mostly pass |
| `vgc-post-game` | Inherited | "Missing tool" routes to building / refining |

## The principle

Stated by the user when the fix was first framed as "never source candidates
from meta data":

> Meta mons are probably good — using meta data to help pick members is fine,
> BUT they need to go through the other evaluation steps as well.

So: **usage can suggest a pick; it never justifies one.** Meta-suggested and
`find`-generated options sit in the same list and are evaluated identically.

## Design

### 1. The shared rule

Added to `CLAUDE.md` under "Teambuilding defaults":

> **Usage can suggest a pick; it never justifies one.** Every species, move, or
> threat answer — however popular — gets a decision card
> (`reference/decision-card.md`) shown in chat before the choice goes to the
> user.

### 2. The decision card

**Shown in chat**, immediately before the pick question. The user sees every
field, so a skipped step is visible at the moment it happens. No file, no hook.

**Scope — which decisions get a full card:**

- every species pick, in any skill;
- every move chosen, swapped, or flagged;
- every answer to "what beats X".

Items and abilities get a one-line reason tied to the role instead (the Item
Clause and role template already narrow them). SP spreads keep the existing
solve-for-the-minimum method.

**Option counts:** 3-5 for species and threat answers (unchanged). For a move,
the chosen move against the alternatives the role template allows.

**The skeleton** — this exact block lives between
`<!-- card-skeleton:start -->` and `<!-- card-skeleton:end -->` markers in
`reference/decision-card.md`, and is copied verbatim into `vgc-team-building`,
`vgc-team-refining`, and `vgc-threat-evaluation`:

```markdown
**Decision card** — required before any species, move, or threat-answer choice
goes to the user. Full guidance: `reference/decision-card.md`.

1. **Decision** — what is being chosen.
2. **Role** — the job (`reference/roles.md`). On a centrepiece build, also what
   it does for the centrepiece's strengths, not only which weakness it covers.
3. **Gap is real** — current meta evidence the job matters
   (`reference/team-evaluation.md`, Meta awareness), or "no current threat found".
4. **Options from** — the exact `dex find` command (always, for species and
   threat answers) plus any meta source used. For moves: learnset + role template.
5. **Options table** — per option: usage rank (`meta rank`); source (find / meta /
   user); Q1 real matchups, with a calc wherever a counter is claimed; Q2 stats,
   moves, ability, tool-verified; Q3 role fit; Q4 is there a better legal option
   for this role. Moves also: base power and category.
6. **Recommendation** — the reason cites fields 2-5. Usage rank and co-occurrence
   are context, never the reason. If every option is top-10 usage, say so.
7. **Not verified** — anything claimed without a tool call this session.
```

**Placement rationale.** Inline because pointers are what got skipped; the
reference file holds field-by-field guidance and one worked example. The
earlier move from inline copies to pointers (commit `90ab6b2`) was about
copies going stale — the skill-text test (§5A) closes that risk by failing on
any drift.

### 3. Skill edits

**`vgc-team-building`**

- **Step 1, centrepiece start:** before any meta pull, write down what the
  centrepiece does well (ability, kit, stats) and where it struggles (full
  `type --vs-mon` profile, playstyle, speed needs). This feeds card field 2 for
  every later slot.
- **Step 2:** meta data is framed as the threat list and a source of
  suggestions — never a shortlist on its own.
- **Step 5:** the card skeleton replaces "present 3-5 candidates". `find`
  always runs; meta suggestions may be rows beside it.
- **Step 6:** a card per move; usage movesets are suggestions.
- **Step 7 gains two gates:** every pick answered Q4; state what the team does
  with the centrepiece's strengths ("nothing" is a finding).
- **Common mistakes:** one line for this incident, pointing to the case study.

**`vgc-team-refining`**

- Role fit (1b) moves **ahead of** the meta-relevance check. A mismatch is
  breaking the role template, the ≥80 BP floor without a stated non-damage job,
  or a category mismatch — "rarely run" is context, not a flag.
- Any move flagged, or proposed as a replacement, gets a card; options are
  learnable moves that fit the role.
- Ability sanity rule: if meta data shows an ability the species cannot have,
  the data is broken — say so, never cite it.

**`vgc-threat-evaluation`**

- New **"What beats X"** path: pull X's real set (moves, item, speed,
  priority); generate answers with `dex find` (including `--resists`) plus meta
  suggestions; a card per answer; Q1 backed by calcs **both ways** — does the
  answer survive X's hit, and does it threaten X through X's item.

**`vgc-team-audit`**

- New **pick-quality** step before 6b: per pick, Q4 via a `find` query for its
  role; if the team has a centrepiece, name what the partners do for its
  strengths. Reported as findings, not rebuilds. A claim that a pick is
  outclassed shows the alternative's `find` query and Q1-Q3.
- One-line pointer to the card.

**`vgc-post-game`** — one line: a dedicated answer to a repeated threat goes
through threat evaluation's "What beats X" card. One-line pointer to the card.

**`vgc-meta-lookup`** — under "Handing the result onward": a usage list is a
threat list and a source of suggestions, never a shortlist. The ability sanity
rule. One-line pointer to the card.

### 4. Tools

#### A. `node tools/meta/cli.js rank "<Species>" ["<Species>" ...] [--format <code>]`

Fills card field 5's usage column in one call — one usage-index fetch.

- Accepts either naming convention: `"Mega Froslass"` (as `dex find` prints)
  or `"Froslass-Mega"` (Pikalytics). Converts through `megas.dexToPika` →
  `megas.resolve`, so the entity-convention hazard is handled in one place.
- **Every name is validated against the dex first** (`dex.mon`). An unknown or
  misspelled name is a per-row error — never a silent "outside top 50", which
  would be a confident wrong answer.
- Per row: `query`, `usageSpecies`, `isMega`, `rank`, `usage`, `winRate`,
  `record`. A Mega reports its base species' row with a `note` that Pikalytics
  folds Mega usage into the base, so the rank is not read as the Mega's own.
- Not in the index: `rank: null` with reason "outside the top 50 of this format".
- Top-level `anchoring: { threshold: 10, allWithinThreshold, message }`. When
  at least one name resolved and every resolved name ranks within the top 10,
  `message` is the sentence the card must carry; otherwise `allWithinThreshold`
  is `false` and `message` is `null`. Rows that errored are excluded from the
  check. A note, not a failure.
- Pure function `rankFromUsage(usageResult, names)` in `tools/meta/`,
  unit-tested against `tests/fixtures/ranked-index-mc.md` (50 rows; verified
  2026-09-14 to include `Floette-Eternal` at #11 and `Froslass` at #34, which
  exercise both the Mega path and a mid-table rank). CLI test follows the
  existing `META_OFFLINE` skip pattern.

#### B. `node tools/dex/cli.js find --resists <Type>`

Repeatable, AND semantics: keep species taking ≤0.5× (immunity included) from
**each** named type, computed with `dex.typeEffectiveness` against the entry's
own typing — so Megas are judged on their Mega typing. An invalid type name
errors through `canonicalType`, never silently matches nothing.

Makes "what beats X" a direct query:
`find --resists Dark --resists Steel --learns "Close Combat"`.

Tests in `tools/dex/tests/find.test.js`:

- property: every result's multiplier from each `--resists` type is ≤0.5;
- a Mega whose typing differs from its base is filtered on the Mega's typing;
- combines with `--type`, `--learns`, and stat bounds;
- an invalid type errors.

**Deliberately not done:** `dex find` does not fetch usage (the offline tool
stays offline); no automatic anchoring block.

### 5. Verification

#### A. Skill-text tests — `.claude/skills/tests/decision-card.test.js`

Added to the `npm test` glob in `package.json`. Fails if:

1. `reference/decision-card.md` loses its marked skeleton.
2. `vgc-team-building`, `vgc-team-refining` or `vgc-threat-evaluation` does not
   contain that block byte-for-byte.
3. `vgc-team-audit`, `vgc-post-game` or `vgc-meta-lookup` loses its pointer to
   `reference/decision-card.md`.
4. `CLAUDE.md` loses the line "Usage can suggest a pick; it never justifies one."
5. Ordering regresses: `vgc-team-building` must describe the centrepiece before
   its meta pull; `vgc-team-refining` must place role fit before meta relevance;
   `vgc-team-building` step 7 must still name the Q4 gate and the centrepiece
   gate. Order is asserted by comparing the character offsets of fixed anchor
   phrases in each file; the implementation plan names the exact phrases, and
   the skill edits must use them verbatim.

These catch rules being removed, not rules being ignored.

#### B. `docs/regression-scenarios.md`

Each scenario: exact prompt, transcript-checkable pass criteria, and a results
log table (date, model, pass/fail per criterion). Rerun in a fresh session
after any change to a skill or `CLAUDE.md`.

1. **"Build around Mega Froslass" (ladder, Good Stuff).** A card for every
   species and move pick; `dex find` run for every species card; `meta rank`
   used for the usage column; Q4 answered on every row; centrepiece write-up
   before the meta pull; step 7 centrepiece gate stated; no usage rank or
   co-occurrence given as a reason. The final six's overlap with the top 6 by
   usage is **reported**, not scored — meta picks are allowed.
2. **"What beats Kingambit?"** Real set pulled; `find --resists` used; ≥3
   options; calcs both ways with Chople Berry accounted for.
3. **Refine a team where Froslass runs Icy Wind.** Verified 2026-09-14: Icy
   Wind is `legal` for Froslass, 55 BP, Special, spread, and absent from
   Froslass's top-10 moves in live M-C data. Pass: not flagged for rarity;
   checked for a stated speed-control job because it is below the ≥80 BP floor;
   any proposed replacement gets a card.

## Docs and wiring

Each touched reference file gets its own `## Changelog` row.

- **New `reference/decision-card.md`** — the rule; the marked skeleton;
  field-by-field guidance; one worked example, dated and carrying
  `(as of 2026-09 — confirm with meta usage)` per the existing examples policy.
- **`CLAUDE.md`** — the rule under "Teambuilding defaults"; two rows in the
  "Never state these from recall" table (`meta rank` for "where does this
  option rank", `find --resists` for "what takes this type well"); a "Where
  things live" row for the decision card.
- **`reference/pitfalls.md`**, Data source pitfalls — "A usage-suggested
  candidate still needs the whole evaluation" (→ case study); "An ability
  percentage for an ability the species cannot have means the data is broken."
- **`docs/case-studies.md`** — a process-lesson entry for the 2026-09-14
  session: the five-of-top-six result, the skipped design steps, co-occurrence
  cited as synergy, the two recalled-mechanics errors, the rationalised ability
  data, how the user caught it, and what changed.
- **`reference/team-evaluation.md`** — the rubric intro names the card as where
  rubric answers are recorded.
- **`reference/meta-lookup.md`** — `rank` under Command surface.
- **`README.md`** — `rank` and `find --resists` examples; the decision-card
  reference row; the skill-text tests.

## Sequencing

1. **Tools, TDD:** `find --resists`, then `meta rank`.
2. **Skill-text test first (red)**, then `reference/decision-card.md`.
3. **The six skill edits** — the test goes green.
4. **Wiring:** `CLAUDE.md`, `pitfalls.md`, case study, `team-evaluation.md`,
   `meta-lookup.md`, `README.md`.
5. **`docs/regression-scenarios.md`** with an empty results log. The first run
   happens in a fresh session after this lands — running it in the session
   that designed it would carry that session's context.

`npm test` stays green at every step.

## Dependencies

- **The `meta mon` ability-parsing bug** is a separate task. It produced
  Trace / Hospitality / Mold Breaker splits for species that cannot have them
  (Farigiraf, and in the tails of Sneasler, Basculegion, Kingambit, Rillaboom);
  `docs/case-studies.md` records Farigiraf at ~99.9% Armor Tail from Pikalytics
  earlier, which points at the parser rather than upstream data — the separate
  task confirms or rules that out.
  Nothing here depends on its fix — the ability sanity rule covers the gap until
  it lands.

## Out of scope

- **A blocking hook** on the pick question. Recorded as the escalation if a
  scenario run or a real session shows cards being skipped anyway.
- **Automated headless evaluation.**
- **The `meta mon` ability bug** (above).
- **Any edit to `teams/`.**
- **Content changes** to `reference/roles.md`, `speed-control.md`,
  `archetypes.md`.
- **Rebuilding the Froslass team.** A separate session using the new process —
  which doubles as the first real run of scenario 1.
