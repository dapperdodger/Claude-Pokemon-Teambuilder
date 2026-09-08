# Claude-Pokemon-Teambuilder

Reference workflow for high-quality VGC (Pokémon Champions, official doubles
format) team-building help — built to force verification against current
sources instead of letting the model coast on stale training data, and to
support both ladder/tournament prep and building around user-chosen favourite
Pokémon rather than copy-pasting top-usage squads.

This repo is the **sole source of truth** for this project — reference files,
behavioural rules, tools, and built teams all live here with real version
history via git.

## How it's organised

The repo is layered by *what kind of thing* each piece is, because the layers
have different failure modes:

| Layer | What it is | Why |
|---|---|---|
| `tools/` | Executable lookups over vendored game data | Deterministic facts should be **queried, not recalled or read**. Type matchups and Mega abilities were the two most-repeated errors in this repo's history; both are now tool calls. |
| `.claude/hooks/` | Enforcement | Instructions are context, not configuration. What must actually happen gets a hook. |
| `CLAUDE.md` | Always-on gates and a routing table | Loaded every session, so it stays short. |
| `.claude/skills/` | Procedures that load on task shape | Only enter context when they're relevant. |
| `.claude/rules/` | Path-scoped instructions | Load only when matching files are touched. |
| `reference/` | Domain knowledge, read on demand | Each file leads with a TOC; the checklist comes before the prose. |
| `docs/case-studies.md` | Why the rules exist | Rationale and history, deliberately **out** of the decision-time path. |

The design reasoning behind this layout — including the recurrence data that
motivated it — is in
[`docs/specs/2026-09-07-repo-reorganization.md`](docs/specs/2026-09-07-repo-reorganization.md).

## Tools

### `tools/dex/` — the query layer

Stable facts, answered in one command against the vendored Champions data.
Prints JSON.

```bash
node tools/dex/cli.js mon "Mega Raichu Y"       # types, base stats, FIXED ability
node tools/dex/cli.js type Electric --vs Grass  # 0.5 — resisted
node tools/dex/cli.js type Fire --vs Rock,Flying # multiplies both halves
node tools/dex/cli.js move "Rock Slide"
node tools/dex/cli.js legal --item "Choice Band"
node tools/dex/cli.js team teams/my-team.md     # validate a team file
node tools/dex/cli.js team --all                # validate every saved team
```

`team` checks the things that are mechanically decidable and had been prose
checklists: duplicate items (hard illegal), the 66-point SP budget and
32-per-stat cap, roster/item/ability legality, whether a Mega is listed with
its **fixed** ability rather than its pre-Mega one, and whether the team's
regulation is still the current one. It exits non-zero on an error, and says
explicitly what it did *not* check.

`mon` reports `abilityIsMegaFixed` and, for a Mega, the `baseFormeAbility` —
which is what a usage-stat page's percentages actually show. That distinction
is the single most-repeated factual error in this repo's history.

Scope fence: **stable facts only**. Nothing meta-dependent (usage, common
sets, threat rankings) belongs here — those go stale and must come from a
live lookup.

### `tools/damage-calc/` — damage and SP optimisation

Vendors the real NCP-VGC-Damage-Calculator engine; see
[`VENDOR_MANIFEST.md`](tools/damage-calc/VENDOR_MANIFEST.md) for provenance.
`cli.js` for a single roll or a speed breakpoint, `sweep-cli.js --file` to run
many matchups in one invocation (checking one move against ten threats used to
be ten separate calls), and `optimize-bulk-cli.js` for the minimum HP/Def/SpD
that survives a named attack. Needs Node.js.

```bash
npm test   # 144 tests across the tools and the hooks
```

## Reference files

| File | Contents |
|---|---|
| [`reference/regulation.md`](reference/regulation.md) | **The current cycle only** — dates, active mechanics, unverified new mechanics, what's incoming. Replaced wholesale at each rollover. Carries the four stamps the phase hook and team validator read. |
| [`reference/champions-format.md`](reference/champions-format.md) | What does **not** change between regulations: Stat Points system and formulas, platform context, roster-vs-legality discipline, and exactly what the local vendored data does and does not cover. |
| [`reference/regulations/`](reference/regulations/) | Archived past regulations, so old team files stay interpretable. |
| [`reference/pitfalls.md`](reference/pitfalls.md) | Trap checklist, scannable. Data-source traps, weather, doubles-specific traps, build assumptions, team-finalization checks. |
| [`reference/methodology.md`](reference/methodology.md) | Process rules: how to evaluate a matchup, how to solve an SP spread, when damage isn't the right lens, live meta lookup. |
| [`reference/mechanics.md`](reference/mechanics.md) | Priority, speed modifiers, item mechanics, Mega ability changes — things typing alone doesn't capture. |
| [`reference/damage-calc.md`](reference/damage-calc.md) | Damage-calc CLI usage, flags, and its real caveats. |
| [`reference/team-refining.md`](reference/team-refining.md) | The narrower refine-an-existing-team workflow. |

The 18×18 type chart markdown was **removed** — `tools/dex/cli.js type`
replaces it. All 324 cells were confirmed identical to the vendored chart
before deletion, and that hand-verified chart is preserved as a test
(`tools/dex/tests/type-chart-invariant.test.js`) so a future re-vendor can't
silently change type effectiveness.

## Skills

[`.claude/skills/`](.claude/skills/) holds project skills that load when a
session matches their trigger. Each is a self-contained procedure that links
one hop out to reference files — never a chain through several of them.

| Skill | Triggers on |
|---|---|
| [`vgc-team-building`](.claude/skills/vgc-team-building/SKILL.md) | Building a new team, extending a partial one, or building around a named favourite. |
| [`vgc-team-refining`](.claude/skills/vgc-team-refining/SKILL.md) | An already-decided team needing move verification + SP optimisation only. |
| [`vgc-threat-evaluation`](.claude/skills/vgc-threat-evaluation/SKILL.md) | "Does X counter/answer/beat Y" — used standalone or from the two above. |
| [`vgc-team-audit`](.claude/skills/vgc-team-audit/SKILL.md) | "What does my team lose to", "is this legal", "which four do I bring". |
| [`vgc-meta-lookup`](.claude/skills/vgc-meta-lookup/SKILL.md) | "What's the meta" with no specific Pokémon or team named yet — including what to do early in a regulation when there is no data. |
| [`vgc-regulation-transition`](.claude/skills/vgc-regulation-transition/SKILL.md) | A regulation ended or is about to. The rollover runbook. |

## Hooks

[`.claude/hooks/`](.claude/hooks/) — registered in
[`.claude/settings.json`](.claude/settings.json).

| Hook | Event | Does |
|---|---|---|
| `regulation-phase.js` | SessionStart | Reports which **phase** the regulation is in — EARLY / FORMING / SETTLED / ROLLOVER IMMINENT / ENDED — and names team files built for a different regulation. |
| `vendor-staleness.js` | SessionStart | Warns if the vendored calculator is behind upstream, **and reports when it could not check** rather than looking healthy. |
| `check_sp_spread_optimization.js` | PostToolUse (Write/Edit) | Flags team-file SP spreads that are round-numbered with no breakpoint reasoning. |
| `validate-team-file.js` | PostToolUse (Write/Edit) | Runs the team validator whenever a file under `teams/` is written. Reports, doesn't block. |
| `verify-mega-ability.js` | PostToolUse (WebFetch/WebSearch) | When a fetched page shows a Mega alongside ability percentages, injects the real fixed ability from the local dex. Fails open. |

Every hook fails open, and every one **says so when it cannot run**. A guard
that exits quietly on failure is indistinguishable from a guard that passed —
that exact bug left the regulation end-date check and the vendor check dead
for weeks each.

## Teams

[`teams/`](teams/) holds built teams, one file per team, using
[`teams/_TEMPLATE.md`](teams/_TEMPLATE.md) — the roster plus the reasoning per
pick and what was deliberately left out.

Two standing rules, enforced by [`.claude/rules/teams.md`](.claude/rules/teams.md):
nothing gets written here until the user explicitly says to save, and saved
teams are **historical records, never a meta source**.

## Using this repo for your own teambuilding

The `CLAUDE.md` rules, `reference/` files and `tools/` are general VGC
material; `teams/` is where one person's builds accumulate.

1. Clone and open in Claude Code — `CLAUDE.md` is picked up automatically.
2. Clear out `teams/` — those are someone else's specific builds.
3. Install Node.js so `tools/` works, then run `npm test` to confirm.
4. Expect `reference/regulation.md` to be re-verified live each session; it
   decays fast, which is why it carries a dated stamp and a staleness hook.
5. Tell Claude which Pokémon you want to build around, or that you're
   prepping for ladder — it won't default to the top-usage squad.

## Regulation changes

Regulations turn over roughly every 3-4 months. That is a **scheduled
lifecycle event with a runbook**, not an incident:

- `reference/regulation.md` describes only the current cycle and is replaced
  wholesale; anything invariant lives in `reference/champions-format.md`, so a
  rollover swaps one small file.
- The [`vgc-regulation-transition`](.claude/skills/vgc-regulation-transition/SKILL.md)
  skill is the checklist: verify live, archive the old cycle, rewrite the
  current one, record unverified new mechanics, **re-vendor the roster data**,
  flag teams built for the old regulation, and set expectations.
- The phase hook warns a week ahead of a rollover and refuses to be quiet
  after one.
- Early in a cycle there is no usage data. That is a normal phase with its own
  documented approach, not a data problem to work around.

## Maintenance notes

- **Keep facts queryable, not written down.** If a new fact is deterministic
  and lives in the vendored data, add it to `tools/dex/` rather than to a
  reference file. Prose about a fact has repeatedly lost to recall; a command
  hasn't.
- **File size**: `reference/` files should stay under ~300 lines and lead with
  a TOC. If one grows past that or covers two distinct topics, split it and
  move the narrative to `docs/case-studies.md` rather than letting it grow.
- **Rule vs. story**: a rule belongs in `reference/` or `CLAUDE.md`; the
  incident behind it belongs in `docs/case-studies.md`. Keeping the story out
  of the hot path is deliberate — it's what let the checklist get short enough
  to actually run.
- **Changelogs vs. git history**: each file's `## Changelog` is a fast, in-file
  "when was this last verified and why" signal that doesn't require leaving the
  file. Keep it even though full history lives in git; the two serve different
  purposes.
- **One home per fact.** If a rule needs restating in a second place, link
  instead. Four copies of a rule are weaker than one, not stronger.

## Design history

[`docs/specs/`](docs/specs/) and `docs/superpowers/` contain the design specs
and implementation plans for how this repo evolved.
