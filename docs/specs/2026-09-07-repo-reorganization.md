# Spec: Repo reorganization for agent navigability

**Status:** Approved 2026-09-07 — all five phases, with the `Stop` hook dropped
**Date:** 2026-09-07
**Author:** Claude Code session

## Decisions taken

- **Scope: all five phases.** Not stopping after Phase 2.
- **`check-claims.js` (the `Stop` hook) is dropped.** A false positive
  interrupting a response mid-flight was judged more costly than the
  marginal coverage it added over the `PostToolUse` hook. Phase 4 ships
  `verify-mega-ability.js` only.
- Remaining open decisions (rename churn, spec directory) resolved in
  favour of doing them: `reference/vgc_*.md` is renamed, and this file
  stays at `docs/specs/`.

## Contents

- [Problem statement](#problem-statement)
- [Evidence](#evidence)
- [Root-cause analysis](#root-cause-analysis)
- [Design principles](#design-principles)
- [Proposed structure](#proposed-structure)
- [Change list by phase](#change-list-by-phase)
- [Bugs found during research](#bugs-found-during-research)
- [Explicitly not doing](#explicitly-not-doing)
- [Open decisions](#open-decisions)
- [Sources](#sources)

---

## Problem statement

This repo was built to stop Claude from stating wrong VGC facts. It has
grown three prose layers (CLAUDE.md rules → skills → reference files) that
all restate each other, and the failure mode it was built to prevent keeps
happening anyway.

The defining data point: **every documented recurrence happened while the
correct fact was already written down in this repo, often in three places
at once.** Mega Raichu Y's fixed ability (No Guard) was named by species in
`vgc_ability_move_mechanics.md` on 2026-07-10 and misreported again on
2026-09-07. Grass resisting Electric is correctly listed in
`vgc_type_chart_reference.md` and was claimed otherwise in a live session.

Adding more prose about the mistake has been the response each time —
CLAUDE.md rule 13 is now 25 lines of narrative about a fact that takes
three words to state. That approach has failed often enough to treat the
cause as structural rather than incidental.

## Evidence

### What the repo actually looks like

| Layer | Files | Lines | When loaded |
|---|---|---|---|
| `CLAUDE.md` | 1 | 124 | Every session, always |
| Skill descriptions | 4 | ~30 | Every session (frontmatter only) |
| `SKILL.md` bodies | 4 | 41 / 68 / 44 / 40 | When a skill triggers |
| `reference/` | 7 | 1,557 | On demand — but rules 3/4/7/10 require most of them |
| `tools/damage-calc/` | 9 + tests | ~1,600 | Executed, not read |
| `teams/` | 8 | ~1,900 | On demand |
| `docs/` + `.superpowers/` | 53 | ~79,700 | Never (dead scaffolding) |

A single `vgc-team-building` invocation that follows its own written
process reads SKILL.md (41) + methodology (301) + pitfalls (497) +
regulation (161) = **~1,000 lines / ~14k tokens of prose before any actual
work starts**, and threat evaluation adds the type chart (139) and
mechanics (70) on top of that.

### The recurrence record, from the repo's own changelogs

| Date | Error | Correct fact already in-repo? |
|---|---|---|
| 2026-07-10 | Mega Swampert ability read off a usage % split | Rule created in response |
| 2026-07-17 | Mega Delphox / Mega Blastoise pre-Mega abilities | Yes — section existed |
| 2026-09-04 | Mega Staraptor typing (base species fed to calc) | Partially |
| 2026-09-07 | Mega Raichu Y ability (Lightning Rod, 93.7% split) | **Yes — named by species since 2026-07-10** |
| (session) | "Rillaboom doesn't resist Electric" | **Yes — type chart file is correct** |

The 2026-08-19 type-chart reformat (18×18 grid → per-attacking-type lists)
is the one intervention in this history that measurably worked, and it
worked because it **changed the shape of the artifact so the error became
harder to make** — not because it restated the rule more forcefully. That
is the model this spec generalizes.

### The prescribed remedy does not execute cleanly

CLAUDE.md rule 13 says to "grep `tools/damage-calc/vendor/pokedex.js` for
the exact `"Mega <Species>"` entry's `.ab` field." Against the real file:

```
$ grep -n "Mega Raichu Y" tools/damage-calc/vendor/pokedex.js
18032:  "Raichu": { "formes": [..., "Mega Raichu Y"] },   <- first hit, wrong line
18066:  "Mega Raichu Y": {                                <- entry starts here
...
18077:      "ab":"No Guard",                              <- 11 lines further down
```

The entry is pretty-printed multi-line JSON. A naive grep returns a
`formes` list, not the ability; getting the answer needs `grep -A 15` plus
visual scanning inside a 421KB file. **The cheap path is recall and the
correct path is friction** — exactly backwards, and a sufficient
explanation on its own for why the rule loses to recall under load.

### Machine-readable ground truth already exists, unused

`tools/damage-calc/vendor/` contains `type_data.js` (`TYPE_CHART_SV`, built
through the `$.extend` chain that this repo's own `load-vendor.js` already
shims) and `pokedex.js` (96 `Mega *` entries, each carrying
`t1`/`t2`/`bs`/`ab`). `tools/damage-calc/lookup.js` already wraps
species/move/ability/item lookups — **but only as an internal module for
the damage calculator. It has no CLI.** The 139-line hand-maintained type
chart markdown is a manual duplicate of `TYPE_CHART_SV`.

## Root-cause analysis

Four distinct problems needing four different fixes:

**1. Facts that should be queried are being read.**
Type effectiveness, Mega abilities, base stats, and item/ability legality
are deterministic lookups against data already in this repo. Serving them
as prose means every use is a read-into-context plus human-style
interpretation, with a real error rate. Serving them as a CLI drops that
error rate to zero and costs ~50 tokens.

**2. The same fact lives in three or four places, so no place is
authoritative.**
The Mega-ability trap appears in CLAUDE.md rule 13, in
`vgc_ability_move_mechanics.md`'s section header, in that file's changelog,
and in `vgc_common_pitfalls.md`'s case studies. Anthropic's guidance is
explicit that redundant or inconsistent instruction leads Claude to "pick
one arbitrarily," and that adherence *drops* as instruction files grow.
Four copies of a rule are weaker than one, not stronger.

**3. Navigation is three to four hops deep; the guidance says one.**
Current path: CLAUDE.md rule → `SKILL.md` → `vgc_teambuilding_methodology.md`
→ `vgc_common_pitfalls.md` → back to a CLAUDE.md rule number. From the
skill-authoring docs: *"Keep references one level deep from SKILL.md...
Claude may partially read files when they're referenced from other
referenced files"* — deep chains get `head -100`'d and silently truncated.
None of the five reference files over 100 lines has a table of contents,
which the same guidance requires precisely so partial reads stay honest.

**4. Guidance is being used where enforcement is needed.**
From Claude Code's memory docs: *"Claude treats them as context, not
enforced configuration. To block an action regardless of what Claude
decides, use a PreToolUse hook instead."* This repo already runs three
hooks — but they guard staleness dates and SP-spread formatting, not the
error class that has actually recurred five times. The one failure mode
with a five-entry track record has zero mechanical enforcement.

## Design principles

1. **Deterministic facts get a CLI, not a markdown file.** If the answer is
   a lookup against vendored data, the session must be able to get it in
   one command whose output cannot be misread.
2. **One authoritative home per fact.** Everything else links; nothing else
   restates.
3. **Rationale and history leave the hot path.** Why a rule exists is
   valuable — for humans, and for future spec work — but it must not sit in
   context at the moment of a decision. Split rule from story.
4. **Always-on context is a routing table, not a manual.** CLAUDE.md says
   what is non-negotiable and where to go; nothing else.
5. **Enforce the recurring errors with hooks; guide everything else with
   prose.** Prose has a demonstrated 0-for-5 record against this specific
   error class in this repo.

## Proposed structure

```
CLAUDE.md                     ~45 lines  routing table + hard gates only
.claude/
  rules/
    teams.md                  paths: teams/**    team-file format
    tools.md                  paths: tools/**    vendor/test conventions
  skills/
    vgc-meta-lookup/SKILL.md
    vgc-team-building/SKILL.md
    vgc-team-refining/SKILL.md
    vgc-threat-evaluation/SKILL.md
  hooks/
    verify-mega-ability.js    PostToolUse on WebFetch|WebSearch
    check_regulation_staleness.sh        (moved from scripts/, regex fixed)
    check_damage_calc_vendor_staleness.sh
    check_sp_spread_optimization.js
tools/
  dex/cli.js                  NEW — the query layer
  damage-calc/                unchanged
reference/
  regulation.md               volatile, dated, single authority
  mechanics.md                formula-level, non-meta-dependent
  methodology.md              process: how to reason
  pitfalls.md                 scannable checklist + TOC, ~120 lines
  damage-calc.md              CLI usage + caveats
  team-refining.md            unchanged in substance
  [type chart file deleted — superseded by tools/dex]
docs/
  case-studies.md             NEW — narrative history, out of the hot path
  specs/  plans/              design history
teams/                        unchanged
```

### The query layer — `tools/dex/cli.js`

The centerpiece. Wraps the existing `load-vendor.js` / `lookup.js` and
exposes what sessions actually ask:

```bash
node tools/dex/cli.js mon "Mega Raichu Y"
# {"name":"Mega Raichu Y","types":["Electric"],"ability":"No Guard",
#  "abilityIsMegaFixed":true,"baseStats":{...},"championsLegal":true}

node tools/dex/cli.js type Electric --vs Grass
# {"attacking":"Electric","defending":["Grass"],"multiplier":0.5,
#  "verdict":"resisted"}

node tools/dex/cli.js type Fire --vs Rock,Flying
# {"multiplier":0.5,"breakdown":[["Rock",0.5],["Flying",1]],"verdict":"resisted"}

node tools/dex/cli.js move "Rock Slide"
node tools/dex/cli.js legal --item "Choice Band"
```

Requirements:

- `type` must accept one or two defending types and perform the
  multiplication itself. Manual multiplication of two markdown lookups is a
  documented error source — `vgc-threat-evaluation`'s own "Common mistakes"
  section lists it first.
- `mon` must report `abilityIsMegaFixed` explicitly, so the answer to the
  recurring question arrives without the session needing to remember that
  the question exists.
- Output one JSON object, no prose. Errors should name the problem — the
  existing `lookup.js` error messages already do this well; reuse them.
- Ships with tests alongside `tools/damage-calc/tests/`.

**This one addition retires the 139-line type chart file, removes the
grep-a-421KB-file instruction from rule 13, and makes both recurring error
classes mechanically unavailable rather than merely discouraged.**

### Enforcement hooks

**`verify-mega-ability.js`** — `PostToolUse`, matcher `WebFetch|WebSearch`.
When fetched content contains `Mega <Species>` alongside
ability-percentage patterns, inject `additionalContext` carrying the actual
vendored `.ab` value plus the one-line warning that usage pages report
pre-Mega selection. This fires *at the moment of the trap* — the trap being
specifically that a usage page looks authoritative — rather than hoping a
rule read 10,000 tokens earlier is still salient.

**`check-claims.js` (dropped).** The original spec proposed a `Stop` hook
that would re-verify type and Mega-ability claims in the finished response
and exit 2 on a mismatch. It was cut: a false positive interrupting a
response mid-flight is worse than the marginal coverage it adds over the
`PostToolUse` hook plus the query layer, which together make the wrong
answer harder to reach in the first place.

### Splitting rule from story

`reference/vgc_common_pitfalls.md` is 497 lines — past the README's own
stated 300-400 line split threshold — and CLAUDE.md rule 10 requires
reading it before finalizing *any* recommendation. Roughly 40% is
provenance narrative ("caught by the user, not proactively", full
before/after damage numbers, which session found it).

Proposal: `reference/pitfalls.md` becomes a scannable checklist with a TOC
— one or two lines per trap, stating the trap and the correct action, each
linking to `docs/case-studies.md#anchor`. The narrative moves to
`docs/case-studies.md` intact. Nothing is deleted; the story simply stops
being loaded at decision time.

Same treatment for the changelog tables. The README's argument for keeping
them as an at-a-glance decay signal holds for `regulation.md`, where
freshness drives a real decision. It holds much less for `mechanics.md`,
whose changelog is now longer than its content and is pure history.

## Change list by phase

Each phase is independently shippable and independently valuable.

### Phase 1 — Fix what is broken (small, no restructuring)

- Fix `check_regulation_staleness.sh`: its end-date regex greps for
  `Active dates:`, a string that no longer exists in
  `vgc_current_regulation.md`. The end-date guard has been silently dead,
  and its fallback warning fired at the start of this very session.
- Fix CLAUDE.md rule 13's grep instruction — or delete it once Phase 2
  lands and replaces it.
- `package.json`'s `test` script is `exit 1` while a real suite exists under
  `tools/damage-calc/tests/`. Point it at the suite.
- Prune `.claude/settings.local.json`: 15 of ~19 allow-entries are one-shot
  absolute paths to superpowers scripts from completed work.

### Phase 2 — Build the query layer (highest leverage)

- Add `tools/dex/cli.js` plus tests, per the spec above.
- Rewrite `vgc-threat-evaluation`'s typing step to call it instead of
  reading a chart.
- Delete `reference/vgc_type_chart_reference.md`, leaving a three-line
  pointer in `mechanics.md`.
- Replace CLAUDE.md rule 13's grep instruction with the `dex mon` command.

Verification: replay the five historical failures as scenarios and confirm
each is now answered by a tool call rather than by recall.

### Phase 3 — Restructure the prose

- Rewrite `CLAUDE.md` to ~45 lines: hard gates plus routing table. Each rule
  becomes one or two lines with a pointer — no case studies, no history, no
  restatement of skill content.
- Split narrative out of `pitfalls.md` into `docs/case-studies.md`; add a
  TOC to every reference file over 100 lines.
- Rename `reference/vgc_*.md` → `reference/*.md` (the `vgc_` prefix carries
  no information inside a repo that is entirely VGC) and align on the
  kebab-case already used under `.claude/skills/`.
- Add path-scoped `.claude/rules/teams.md` (`paths: teams/**`) so team-file
  format rules load only when a team file is actually being touched;
  currently they occupy always-on context as CLAUDE.md rule 11.
- Flatten skill → reference links to one hop. Where a skill currently routes
  through methodology.md to reach pitfalls.md, link both directly.

### Phase 4 — Enforcement

- Add `verify-mega-ability.js` (PostToolUse on `WebFetch|WebSearch`).
- Consolidate `scripts/` into `.claude/hooks/` so hook code lives next to
  its registration.

### Phase 5 — Hygiene

- Gitignore or archive `.superpowers/sdd/` — 53 files, ~2,500 lines of
  completed task briefs and review diffs.
- Update README to match the new structure. Keep its maintenance-notes
  section, which is genuinely good and was simply not followed.

## Bugs found during research

Independent of whether this reorganization is adopted:

1. **`check_regulation_staleness.sh`'s end-date check is dead.** It greps
   for `Active dates:`; the file states dates in prose under
   `## Active regulation`. Confirmed the string appears nowhere in the file,
   and the fallback warning fired this session.
2. **CLAUDE.md rule 13's grep does not return the ability.** Pretty-printed
   multi-line JSON; the first match is a `formes` array.
3. **`package.json`'s `test` script is `exit 1`** despite eight real test
   files.
4. **`vgc_common_pitfalls.md` at 497 lines** violates the README's own
   documented 300-400 line split threshold.

## Explicitly not doing

- **No "top meta picks" or "speed tiers" file.** CLAUDE.md rule 7's
  reasoning against a static ranked list is correct and untouched here. The
  query layer serves *stable* facts only — type chart, base stats, fixed
  abilities, legality — never meta-dependent ones.
- **Not merging the four skills.** Their trigger boundaries are distinct and
  their descriptions already disambiguate against each other well, which is
  the hardest part of multi-skill design.
- **Not removing `regulation.md`'s changelog.** The README's argument for it
  as an at-a-glance decay signal holds where a decision depends on freshness.
- **Not touching `tools/damage-calc/`.** It works, it is tested, and its
  vendored-data discipline is sound.
- **No content deletion.** Everything moved in Phase 3 is moved intact.

## Open decisions

All resolved at approval time — see [Decisions taken](#decisions-taken) at
the top of this file. Recorded here for the record:

1. ~~**Scope.**~~ All five phases.
2. ~~**Stop-hook appetite.**~~ Dropped.
3. ~~**Rename churn.**~~ Doing the rename.
4. ~~**Spec directory.**~~ `docs/specs/` it is.

## Sources

- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
  — 500-line SKILL.md ceiling, one-level-deep references, TOC for files over
  100 lines, degrees of freedom, description-field guidance.
- [How Claude remembers your project](https://code.claude.com/docs/en/memory)
  — CLAUDE.md under 200 lines, "context, not enforced configuration", use a
  hook when an instruction must actually run, `.claude/rules/` path scoping.
- [Hooks reference](https://code.claude.com/docs/en/hooks)
  — event list, `additionalContext` injection, exit-2 blocking semantics.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  — right altitude, minimal high-signal tokens, just-in-time retrieval,
  context rot.
- This repo's own `## Changelog` tables, `reference/vgc_common_pitfalls.md`
  case studies, and the 2026-09-07 `/insights` usage report.
