# Design: a strategy layer — teaching the repo what makes a team *good*

**Date:** 2026-09-08
**Status:** Draft, pending user review

## Problem

This repo is a **verification engine**. Almost every rule in `CLAUDE.md`, the
six skills, `pitfalls.md`, and all five hooks answers one question: *is this
claim true?* Type matchups, Mega abilities, learnsets, item legality, damage
rolls, SP minimums — each was a recurring factual error, and each has been
converted from recall into a tool call. That work succeeded.

It answers a different question badly, and mostly not at all: *is this team
good?* Surveyed 2026-09-08, the repo contains **no**:

- archetype taxonomy — `vgc-team-building` step 3 says "agree the archetype
  with the user" and nothing anywhere says what the archetypes are, what each
  requires, or how to choose between them;
- role framework — the "declare the role, then derive the moveset, then derive
  the spread" ordering appears nowhere, in any file;
- rubric for whether a Pokémon is *good* — usage % is handled rigorously as
  data and never as a judgment input with caveats;
- treatment of speed control as a first-class design axis. `mechanics.md` has
  the Speed *modifiers* (Scarf, Tailwind, paralysis, Trick Room turn order);
  no file has the strategy. Tailwind and Trick Room appear in the skills only
  as things to *audit for*;
- coverage as a **design constraint**. `vgc-team-audit` computes defensive
  profile and offensive coverage rigorously — but only retrospectively, on a
  team that already exists. Nothing constrains the roster while it is built;
- item-distribution or offense/support-distribution guidance;
- inherent vs. relative strength distinction;
- **distributions** for speed tiers or for Fake Out / Follow Me / Rage Powder /
  Wide Guard / Trick Room / Prankster. Verified by grep 2026-09-08: most of
  these names *do* appear across `reference/`, but only ever as **mechanics**
  (Prankster's priority, Rage Powder's Grass/Overcoat immunity, Focus Sash vs
  Fake Out). "Speed tiers" appears three times, each as an aside. Nothing
  states — or can compute — *how common any of them is in the current meta*,
  which is what the notes' "Important Format Knowledge" section asks for. Wide
  Guard appears zero times anywhere;
- post-game loop. Nothing handles "I lost, why." `vgc-team-audit` is static
  analysis, not battle → adjust → battle.

The consequence is a workflow that can verify every fact about a team it had
no principled reason to build.

## Source material

Two files of notes taken from masterclass videos by a Pokémon world champion,
provided by the user 2026-09-08:

- `C:\Users\mrtim\Documents\Teambuildings.txt`
- `C:\Users\mrtim\Documents\Advanced Teambuildings.txt`

The user's instruction: *"Do not summarize, do not distill, the info there is
important and close to authoritative."* Both are therefore committed
near-verbatim to `reference/sources/` as an audit trail, and the working
reference files are built **on top of** them rather than replacing them. This
means any later rewrite of a working file can be diffed against what the
source actually said.

Both files are generic VGC, not Champions-specific. Verified 2026-09-08:
`Urshifu` (cited in the "is there a better Pokémon for this role" example) is
absent from the vendored dex entirely, and `Rillaboom` exists in the broader
dex but not in `POKEDEX_CHAMPIONS`. Localisation to Champions is therefore
real work, not transcription.

*(Separately noted: `reference/mechanics.md`'s Grassy Terrain section cites
Rillaboom's Grassy Surge, and Rillaboom is not in the current Champions roster.
The Grassy Terrain mechanics themselves are verified and evergreen — only the
setter's availability is regulation-specific. So this gets an availability
mark, not a deletion, and not a substitution: the measured numbers in that
section were computed against that example and stay valid.)*

## Key finding: candidate generation runs on recall

`vgc-team-building` step 4 requires **3-5 verified candidates** for any roster
gap — a rule the user asked for explicitly, backed by a case study, and
mirrored in `methodology.md` and in the user's persistent memory.

But `tools/dex/cli.js` exposes `mon`, `type`, `move`, `legal`, `learnset`,
`team`. There is **no search**. There is no way to ask "which Champions-legal
Flying-types learn Tailwind and have base Speed above 100."

So the *facts about* each candidate get verified, while the *candidate list
itself* is produced from training data — the single thing this repo's entire
architecture exists to prevent. The rule is unenforceable as written, and its
failure mode is invisible: a plausible list of three names looks identical
whether it was derived or recalled.

The Advanced notes flag this hole independently and unprompted: *"Pokémon
showdown has a great tool for looking up pokemon for specific niches (e.g. a
fast pokemon that learns a certain move) — (is there a machine usable
tool??? otherwise we need to think about this)"*.

This is why the search tool is in scope for this work rather than deferred.
The philosophy layer creates demand for exactly this query at exactly the step
where the repo currently guesses.

## Practices this contradicts, and how each resolves

Raised because the user asked for conflicts to be surfaced rather than papered
over.

1. **Candidate generation on recall** — above. Resolved by `dex find`.

2. **SP optimization is over-weighted and mis-ordered.** It appears in
   `CLAUDE.md`, `methodology.md` (the longest section in the file), the user's
   memory, and a `PostToolUse` hook. The notes place spread work *last* and
   say plainly that a default split can win. Resolved by **ordering, not
   deletion**: SP moves to step 8 of 10 in the build checklist, behind role,
   moveset and team-level gates. The `check_sp_spread_optimization.js` hook
   **stays unchanged** — reading it confirms it already permits round spreads
   that carry a justification, which is compatible with the notes. The problem
   was never the hook; it was that nothing came before it.

3. **`vgc-team-refining` starts one step too late.** It verifies each move for
   legality and meta-usage but never asks whether the moveset fits the *role*
   the Pokémon plays on that team. The notes' concrete, checkable rules —
   offensive moves at ≥80 BP and preferably ≥90, no Protect alongside a Choice
   item — exist nowhere in the repo. Resolved by adding a role-fit check
   inside refining's existing scope fence.

4. **Type coverage is treated as arithmetic, not judgment.** The audit skill
   counts 2x multipliers precisely and nothing counterweights that precision.
   The notes warn twice: *"resistances matter, but half of a big number can
   still be a big number"* and *"resistances cannot make up for just bad
   stats."* Resolved by making the counterweights explicit content in
   `team-evaluation.md`, cited from the audit skill.

5. **No post-game loop.** Resolved by a new skill.

## Architecture: the reference layer

Philosophy is domain knowledge, so it belongs in `reference/`. It is split by
**when in a build it is read**, not by topic, so each file loads at one
decision point — consistent with the repo's load-on-demand layering.

| File | Read at | Contents |
|---|---|---|
| `reference/sources/teambuilding-notes.md` | never — audit trail | File 1, near-verbatim, marked do-not-edit |
| `reference/sources/teambuilding-notes-advanced.md` | never — audit trail | File 2, near-verbatim, marked do-not-edit |
| `reference/archetypes.md` | build 1-4 | 3 starting points; selecting a strong one; the four archetypes; building around a specific Pokémon; using someone else's team; Mega-as-centrepiece |
| `reference/speed-control.md` | build 3 | Why it comes first; the seven forms; choosing one; backup when the setter is removed |
| `reference/roles.md` | build 5-6 | Role taxonomy; the two moveset templates; item choice per role; the BP floor; offensive vs defensive capability inputs |
| `reference/team-evaluation.md` | build 5 and 7 | "Good Pokémon" rubric; inherent vs relative strength; coverage as constraint; distribution gates; the anti-over-fixation counterweights |
| `reference/format-knowledge.md` | meta lookups | **Generated.** Speed tiers and key-move/ability distributions, with a freshness stamp |

### `reference/archetypes.md`

- **Three starting points**: a strategy (Trick Room, weather, …); a specific
  Pokémon or core; an existing team, self-built or lifted. Each implies a
  different first question.
- **Choosing a strong starting point**: maximise favourable matchups, *or*
  guarantee you always hold some tool to win with. These are different targets
  and the choice is the user's.
- **The four archetypes**, each with what it requires, how many setters, what
  kind of attackers it wants, and its documented failure mode:
  - *Tailwind* — usually one setter; setter must contribute beyond Tailwind;
    saving it for a later turn is often crucial; wants strong spread attackers;
    Fake Out support helps but the Fake Out user must also do more.
  - *Trick Room* — scoped to **hard** TR, not a lone TR carrier. -7 priority
    means setup needs a plan (Fake Out, redirection); usually two setters,
    sometimes one depending on meta; wants slow strong attackers with spread
    moves; needs a plan for getting the sweeper in after the room is up.
  - *Good Stuff / Balance* — bring good Pokémon; very flexible; demands real
    offensive *and* defensive synergy; typically 1-2 slots aimed at specific
    common matchups.
  - *Weather* — set by ability (most common) or move; usually one setter; needs
    a plan for being overwritten; bulky pivots help re-set it. Per-weather:
    rain trends bulkier; sun usually wants about one Chlorophyll abuser; sand
    has the weakest payoff but the sturdiest setter, which itself needs support
    (slow, many weaknesses); snow gets most of its value from Aurora Veil or
    Blizzard and works as *counter*-weather because its setters stand alone —
    so don't over-index on it. **The whole-team rule: a team must not be six
    Pokémon that all need the weather, or it cannot play outside it.**
- **Building around a specific Pokémon**: know what it does well and where it
  struggles — does it need speed control, what are its type weaknesses and
  strengths, is it physical/special/support. Build **one Pokémon at a time**;
  each choice constrains the next. Know *why* each addition helps the core
  piece; do not just add good Pokémon. Prefer partners that tick several boxes.
- **Using someone else's team**: legitimate; and changing it — moves, spread,
  even a species — to fit your playstyle is expected, not a defect.
- **Mega as centrepiece**: Megas are strong and make good centrepieces, so get
  full value and cover their type *and* playstyle weaknesses — but do not feel
  obliged to build every game plan around the Mega; leaving it behind is a real
  option. Cross-links `CLAUDE.md`'s existing two-Mega rule rather than
  restating it.

### `reference/speed-control.md`

Leads with the notes' own claim: speed control is a common starting point and
often the most important axis — moving first both secures KOs before the
opponent acts and reduces exposure to flinch and status luck. It is not
mandatory as a centrepiece.

The seven forms, each with its Champions-verified mechanics and its cost:
priority moves; items (Choice Scarf ×1.5); paralysis (×0.5 — the *full-para*
chance is disputed across sources per `mechanics.md`, so it is not asserted);
abilities (Chlorophyll, Swift Swim); Speed-lowering moves (Icy Wind, Cotton
Spore); turn-order changers (Trick Room, Tailwind); and simply being fast.
Cross-links `mechanics.md` for the modifier numbers and Trick Room's -7
priority rather than duplicating them, and `format-knowledge.md` for where the
current meta's tiers actually sit.

### `reference/roles.md`

- **Pick the role first, then the moveset, then the spread.** Some Pokémon are
  flexible; some are locked into one role.
- **The two templates** — offensive: STAB, STAB, coverage/setup/support,
  Protect. Defensive: support, support, STAB, support/Protect.
- **Offensive capability inputs**: high Atk/SpA; high base power; neutral or
  super-effective hits; boosting items; setup moves; other damage modifiers.
  Setup to +2 equals attacking twice — so the setup must actually pay for the
  turn it costs.
- **The base-power floor**: offensive moves want ≥80 BP, preferably ≥90. Base
  power matters as much as type — Icy Wind is speed control, not damage;
  Blizzard is the damage move.
- **Type coverage, without over-fixating**: you do not need super-effective
  answers to everything, and sometimes raw power suffices. What matters is not
  being unable to hit *key meta threats* hard. Physical/special split matters
  too.
- **Items by role**: Choice items (×1.5, locked in — so Protect is usually
  wasted alongside one, and spread moves pair well); Life Orb (recoil adds up;
  some abilities ignore it); type-boosting items (strong on a Pokémon running
  several moves of one type, or one that mostly clicks a single move).
  Defensive items: Focus Sash, Assault Vest (no status moves), super-effective
  reducing berries, terrain seeds; Sitrus Berry (often considered one of the
  best — can turn a 2HKO into a 3HKO) vs Leftovers (needs five activations to
  match one Sitrus; better paired with other passive healing).
- **Other damage reduction that isn't an item**: screens, Atk/SpA drops,
  Intimidate, abilities like Friend Guard and Multiscale, and setup.
- Cross-links `methodology.md`'s "value isn't always damage" section rather
  than duplicating it.

### `reference/team-evaluation.md`

- **Is this Pokémon good?** How does it fare against common Pokémon; what are
  its stats, moves, ability; what role is it filling; **is there another legal
  Pokémon that fills that role better?** A "bad" Pokémon is not banned — it is
  harder and takes more work. Usage and win rate are a good easy signal and
  **not authoritative**; a low-usage Pokémon is sometimes an undiscovered gem.
  Good and bad are meta-relative and change.
- **Inherent vs relative strength.** Inherent: how good in a vacuum, where
  speed and power dominate. Relative: how good against the *current* meta. A
  team can be inherently strong and relatively weak. The reverse is unlikely
  but possible.
- **Types are not equal** — some are simply better, and offensively-good is not
  the same as defensively-good.
- **Defensive coverage as a design constraint**: no more than two Pokémon of
  the same type, exceptions rare and purposeful; aim for one resistance to
  every type as a rule of thumb, more against common threats; defensive type
  synergy matters more the more the team wants to switch.
- **Distribution gates**: 1-2 support slots with the rest offensive or hybrid;
  most teams carry 1-3 offensive items, fewer when Megas are in the format.
  Both are format-specific. Building the whole team around setting up one
  Pokémon can work but loses to a single misplay or crit.
- **Multiplicative scaling** — STAB × weather × terrain × item × ability
  compound, so combining offensive tools scales superlinearly; and combining
  threats that beat each other's counters is powerful.
- **The counterweights, stated as strongly as the notes state them**: the best
  defence is a strong offence; resistances do not compensate for bad stats;
  half of a big number is still big; do not hyper-fixate on spreads to the
  point of losing what made the Pokémon good.
- **Meta awareness**: a weakness nobody exploits is not a weakness. Think about
  who you will face, which Pokémon run together and why, and weigh ladder and
  tournament results both. There is a counter to every Pokémon, however
  strong — if you keep losing to one, a dedicated answer is legitimate.

## Examples policy

Adopted per the user's answer — verify and replace, but don't over-index on
current examples, because what's current changes. Written into the files
themselves so later edits inherit it:

1. **Every principle stands without its example.** The example illustrates; it
   never carries the claim.
2. **Prefer structurally durable examples** — "a slow, high-Attack Pokémon with
   a spread move" over a species name. Keep a species only where the mechanic
   is durable (Torkoal's base-20 Speed plus Eruption will not drift).
3. **Any example resting on current usage carries a date stamp and a verify
   marker**: `(as of 2026-09 — confirm with meta usage)`.
4. **Examples that are not currently Champions-legal are MARKED, never deleted.**
   Availability is a regulation-specific fact that reverts; the guidance about
   what a thing does is evergreen. Losing the second because of the first
   discards knowledge at every rollover, which is the opposite of what this
   repo is for.
   - Mark it: `*(not in the Champions pool as of <REG>, verified <DATE> — guidance holds for when it returns)*`
   - Keep every caveat the source attached to it.
   - Substitute an example only when the reader needs one they can actually
     use *today* — and then name the original alongside the substitute rather
     than erasing it.
   - Verified 2026-09-09 as currently outside the pool: Assault Vest, Choice
     Band, Choice Specs, and the four terrain seeds; Rillaboom, Amoonguss,
     Indeedee, Barraskewda, Kingdra, Ludicolo, Lilligant, Sawsbuck, Shiftry,
     Togekiss are outside the current roster. Re-check all of them after a
     rollover — absence right after one means "not re-vendored yet," not
     "not legal."

**Three orthogonal marker axes, not a hierarchy.** A claim can carry one from
each: **sourcing strength** (`vgc-format.md`'s `[official]`/`[consensus]`/
`[unresolved]`), **scope** (`*(generic VGC — not Champions-verified)*`), and
**availability** (rule 4 above).

## Tools

### `node tools/dex/cli.js find`

Filtered search over the Champions roster.

```bash
node tools/dex/cli.js find --type Flying --learns "Tailwind" --min-spe 100
node tools/dex/cli.js find --learns "Trick Room" --max-spe 50 --min-atk 100
node tools/dex/cli.js find --ability Prankster
```

Filters: `--type` (repeatable; matches either slot), `--learns` (repeatable,
AND semantics), `--ability`, and `--min-<stat>` / `--max-<stat>` over
`hp atk def spa spd spe`. Roster-legal by default.

**Naming hazard, deliberate:** the vendored dex keys Speed as `sp`, while
everywhere else in this repo `SP` means Stat Points. The CLI therefore exposes
`--min-spe` / `--max-spe` and never `--min-sp`, and the output renames the
stat keys to the unambiguous long forms.

#### Coverage is not the risk — measured 2026-09-08

An earlier draft of this spec called partial learnset coverage "the critical
constraint" for `find`. That was wrong, and measuring it says so: **all 315
Champions roster entries resolve to a usable learnset entry. Coverage is
100%, with zero uncovered species** (240 base species, 75 Mega formes
resolving to their base forms).

It is also already guarded. `tools/dex/tests/learnset-coverage-invariant.test.js`
exists, is named by `VENDOR_MANIFEST.md`'s re-vendoring step 5 as the gate to
run, and asserts *usability* rather than mere resolution — it was written
specifically because five vendored entries are bare `{}` placeholders and one
of them (`gourgeistsuper`) is a live roster species that a weaker assertion
let through. It also pins the ten species that resolve via the stem fallback,
so a new forme silently inheriting the wrong move pool fails the build. All
three invariants pass as of this spec.

So the `notInLearnsetTable` contract stays — it is nearly free, and it is what
keeps the 100% *observed* rather than assumed — but it is a cheap guard on a
currently-empty set, not the design's load-bearing constraint.

#### Staleness is the risk

The real exposure for `find --learns` is the opposite shape: not omission, but
**confident false positives from a stale pin**.

`VENDOR_MANIFEST.md` states it directly — learnsets are regulation-variant,
regulations *cut* move pools as well as adding them (+2019/-353 lines at the
M-B rollover), and the upstream mod is updated **in place**, so a stale pin
"serves complete, normal-looking, wrong data rather than failing." The pin is
currently stamped `M-B`, and **M-B ends tomorrow**.

That matters far more for `find` than for `learnset`. A single `learnset`
query is a deliberate check on one species the user already named. `find`
generates the candidate *set* — so a stale pool doesn't produce one wrong
answer, it seeds every downstream slot decision with species that may no
longer learn the move the slot exists for. The failure is invisible in exactly
the way the notes' recall-based candidate generation was.

Mitigation, reusing machinery that already exists:

- Any `--learns` query stamps its output with the learnset pin:
  `"learnsetPin": { "commit": "cc17bb78…", "regulation": "M-B" }`.
- When that regulation does not match `reference/regulation.md`'s active one,
  `find` prints a loud warning that the candidate list may contain species
  whose move pools the current regulation has cut, and points at the
  re-vendoring section. The existing `vendor-staleness.js` hook reports the
  same drift at session start; this puts it at the point of use.
- The roster half is already covered: re-vendoring `POKEDEX_CHAMPIONS` without
  re-vendoring learnsets makes the invariant test fail loudly rather than
  quietly, which is the case that motivated that test.

### `node tools/meta/cli.js speed-tiers` and `distribution`

```bash
node tools/meta/cli.js speed-tiers --top 30
node tools/meta/cli.js distribution --move "Fake Out" --top 30
node tools/meta/cli.js distribution --ability Prankster --top 30
```

`speed-tiers` joins the current usage list against vendored base Speed and
reports the tiers, flagging Choice Scarf and Tailwind thresholds. `distribution`
reports how many of the top N run a given move or ability, and which.

The defaulted probe list is Trick Room, Fake Out, Follow Me, Rage Powder, Wide
Guard, Prankster — the notes' own list — held in a named constant rather than
hardcoded into the command, so it can grow.

Both accept `--write`, which persists to `reference/format-knowledge.md` with
a generated-on timestamp, the format code used, and the regulation stamp —
mirroring the existing `meta formats --write` → `META_MANIFEST.md` pattern
exactly. The file is marked do-not-hand-edit, as `META_MANIFEST.md` is.

### Freshness

`.claude/hooks/vendor-staleness.js` gains a check: warn at SessionStart when
`reference/format-knowledge.md` is more than 7 days old, **or** when its
regulation stamp does not match `reference/regulation.md`'s active one, **or**
when it is absent. This delivers the user's "refreshes on its own every week
or so" using machinery the repo already runs, and it fails loudly rather than
quietly, per that hook's existing design note.

Regeneration is a manual command; the hook prompts it. It is not automatic,
because writing a reference file as a side effect of opening a session would
make the repo's git history unreadable.

## Workflow changes

### `vgc-team-building` — checklist rewritten

```
- [ ]  1. Starting point — strategy, specific Pokémon/core, or existing team
- [ ]  2. Regulation check + live meta scan
- [ ]  3. Speed-control plan
- [ ]  4. Archetype, and what that archetype requires
- [ ]  5. Per slot: declare the role, then 3-5 verified candidates, user picks
- [ ]  6. Moveset from the role template
- [ ]  7. Team-level gates: coverage, item spread, offense/support distribution
- [ ]  8. SP spreads — solve for the minimum
- [ ]  9. Pitfalls gate + validator
- [ ] 10. Ask before saving
```

Every verification step in the current eight survives, demoted from spine to
sub-step: regulation and legality inside 2; learnset verification inside 5 and
6; threat evaluation inside 5 and 7; the damage CLIs inside 8; the pitfalls
checklist and `dex team` inside 9; the teams/ write gate unchanged at 10.

Step 5 gains `dex find` as the candidate-generation mechanism, which is what
makes the 3-5-candidates rule enforceable rather than aspirational.

### `vgc-team-refining`

Adds a **role-fit** check to the existing move pass: given the role this
Pokémon plays (user-stated, or inferred and confirmed), does the moveset match
the template, clear the ≥80 BP floor, and avoid the Choice-plus-Protect waste?
The scope fence holds — species, item and ability remain fixed inputs, and
findings are reported rather than applied. "Is this move right for this role"
is squarely refining's job; it currently only asks "is this move legal and
used."

### `vgc-team-audit`

The design constraints become audit criteria with thresholds: same-type count
(≤2), resistance coverage across the 18 types, offense/support balance,
offensive-item count, and speed control present **with a backup** if the setter
is removed. Steps 3-5 already compute most of the inputs; they gain the
thresholds to judge against, and the `team-evaluation.md` counterweights so
precision does not become over-fixation.

### `vgc-meta-lookup`

Gains the format-knowledge dimension — speed tiers and the key move/ability
distributions — and the "which Pokémon commonly run together, and *why*"
question, which is distinct from the co-occurrence frequency the skill already
warns is not proof of synergy.

### New skill: `vgc-post-game`

Triggers on "I lost with this team", "I keep losing to X", "lost three games
with this". Distinct from `vgc-team-audit`, which answers "what is wrong with
this team" from a standing start rather than from a played game.

```
- [ ] 1. What happened — turn by turn where the user has it
- [ ] 2. Bucket the loss: bad luck | misplay | genuinely missing tool
- [ ] 3. Only "missing tool" justifies changing the team
- [ ] 4. Route: vgc-team-refining (moves, spreads) | vgc-team-building
        (roster) | no change, play it again
- [ ] 5. Offer to log the iteration in the team file's changelog — and ask
        first
```

Step 3 is the skill's whole point: the notes name three buckets and only one of
them is a team problem. A skill that treats every loss as a build defect would
churn a good team.

Step 5 **asks**. `.claude/rules/teams.md` makes `teams/` read-only without an
explicit instruction to write, and finding a real problem is not permission —
that rule is not relaxed here.

### `vgc-regulation-transition`

Gains a step: regenerate `reference/format-knowledge.md` against the new
regulation, alongside the existing re-vendoring step.

### `CLAUDE.md`

Gains routing rows for the new reference files (including the generated
format-knowledge file) and the new skill, plus a
short always-on block — six lines, not more — carrying only what changes a
build's shape from its first move: speed control is often the first question;
role before moveset before spread; and a Pokémon being verifiable is not the
same as it being good.

## Sequencing

**Revised 2026-09-08, after measuring what actually depends on the rollover.**
An earlier version of this section made the re-vendor a hard gate blocking every
tooling task. That was over-broad: it conflated *building* a tool with *trusting
its output*. The corrected sequencing is below; the reasoning for the change is
in the next section.

**Phase 1 — reference layer.** `reference/sources/` plus the four working
reference files. Regulation-agnostic by construction.

**Phase 2 — `dex find`.** The query function, the CLI wiring, and the learnset
pin stamp.

**Phase 3 — generated format knowledge.** `meta speed-tiers`, `meta distribution`,
`--write`, and the freshness check in the SessionStart hook.

**Phase 4 — skills.** Rewrites of building, refining, audit and meta-lookup, plus
the new `vgc-post-game` skill.

**Phase 5 — wiring.** `CLAUDE.md`, `README.md`, the regeneration step in
`vgc-regulation-transition`, and a changelog row on every touched reference file.

**Phase 6 — the rollover.** On or after 2026-09-09. Runs the regulation
transition, re-vendors **both** datasets, regenerates `format-knowledge.md`, and
re-runs everything.

**Re-vendoring both datasets, not one, is still non-negotiable.**
`tools/dex/vendor/learnsets.js` and `tools/damage-calc/vendor/` come from
different upstreams with independent pins. Re-vendoring either alone breaks the
cross-vendor invariant in a different direction: a newer roster leaves new species
with no move pool; newer learnsets can drop species the older roster still lists.
`learnset-coverage-invariant.test.js` is the gate that proves they agree, and a
failure there is a real finding rather than a broken test.

**Phases 1-5 all run before the rollover.** Their tests assert properties, not
contents — "every result carrying type Fire has Fire", "count > 0", "`find` agrees
with `learnset()`" — so a re-vendor does not invalidate them. The meta tests run
against frozen fixtures.
## Testing

- `dex find`: filter correctness per filter and in combination; the
  `notInLearnsetTable` contract, including that a species absent from the table
  is reported rather than dropped silently; that a `--learns` query stamps the
  learnset pin and warns on a regulation mismatch; `--min-spe` reads base Speed and
  not Stat Points.
- `meta speed-tiers` / `distribution`: computation against fixtures, using the
  existing `tools/meta/tests/fixtures/` pattern.
- Staleness: absent file, stale file, regulation-mismatched file, current file.
- Phase 2 re-vendor: `npm test` must be green with
  `learnset-coverage-invariant.test.js` passing against the **new** roster and
  the **new** learnset table together. That test is the cross-vendor gate, so
  a failure means the two pins disagree — re-vendor the lagging one rather
  than relaxing the assertion.
- Reference files: no test harness — they get changelog rows and a live sweep
  of every example through the CLIs.

## Regulation timing

M-B ends 2026-09-09, one day after this spec.

**Exactly one artifact is invalidated by that.** `reference/format-knowledge.md`
is generated from live usage joined against the vendored dex; generated before
the rollover it describes the outgoing field. Everything else in this design is
either principle (which outlives regulations) or code whose tests assert
structure rather than roster contents.

It is still generated before the rollover, for two reasons. A renderer that has
never run is an untested renderer. And it is the file the staleness check acts
on, so it is the evidence that the check works.

**Building before the rollover is better for verification, not merely faster.**
This design adds two staleness warnings — the learnset pin stamp on `dex find`
and the freshness check on `format-knowledge.md`. Both exist to detect a
regulation change. Building them beforehand means the rollover *exercises* them:
the implementation plan makes observing both warnings fire a required step,
performed before the re-vendor silences them. A warning built after the event it
was meant to catch has never been shown to work.

A branch reachability note that shaped the design: **today the learnset pin and
the active regulation match**, so the stale-pin branch cannot be reached by
calling the CLI. The staleness decisions are therefore pure functions taking
injected regulation ids, unit-tested against a mismatch that does not yet exist
in the repo. An untested branch that first executes at a regulation rollover is
untested at exactly the moment it matters most.

The earlier concern that motivated the gate — shipping a tool that warns about
itself from day one — does not apply for the same reason: the warning is
correctly silent until the rollover, and correctly loud after it until Phase 6
runs.
## Out of scope

- The `mechanics.md` Rillaboom/Grassy Surge inconsistency noted above. (Phase 2
  may resolve it incidentally — if Rillaboom enters the M-C roster on
  re-vendor, the example becomes valid; if it does not, the example is wrong
  and gets fixed separately. Either way it is not a goal of this work.)
- Pokepaste import/export. The notes mention it as a useful interchange format;
  no workflow here needs it yet. Recorded, not built.
- Any change to `check_sp_spread_optimization.js`. Reading it confirmed it
  already permits justified round spreads.
- Any edit to existing files under `teams/`. They are historical records.
