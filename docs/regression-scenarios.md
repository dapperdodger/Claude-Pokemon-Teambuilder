# Regression scenarios — do the evaluation rules actually bind?

`.claude/skills/tests/decision-card.test.js` fails when a rule is **deleted**.
Nothing automated can tell whether a rule is **followed**. These scenarios do
that, by hand.

**When to run:** after any change to a file in `.claude/skills/`, to
`CLAUDE.md`, or to `reference/decision-card.md`, `roles.md`,
`team-evaluation.md` or `archetypes.md`.

**How to run:**

1. Open a **fresh** Claude Code session in this repo — not the session that
   made the change, which already carries its context.
2. Paste the scenario's prompt exactly. Answer any question it asks with the
   scripted answer; otherwise let it run.
3. Read the transcript against the pass criteria. Each is checkable by reading
   — no judgement call about quality.
4. Add a row to that scenario's results log. Any **FAIL** is a finding: fix the
   skill text, or, if the text is right and still skipped, raise the blocking
   hook recorded as the escalation in
   `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`.

## Contents

- [Scenario 1 — build around Mega Froslass](#scenario-1--build-around-mega-froslass)
- [Scenario 2 — what beats Kingambit](#scenario-2--what-beats-kingambit)
- [Scenario 3 — refine a team where Froslass runs Icy Wind](#scenario-3--refine-a-team-where-froslass-runs-icy-wind)
- [Changelog](#changelog)

## Scenario 1 — build around Mega Froslass

**Prompt:**

> I feel like Froslass-Mega should be a good Pokémon to build a team around in
> this meta but I've been having difficulty with it.

**Scripted answers:** struggles — "dies easily, especially to Kingambit and
Incineroar and psyspam with Armarouge, and no real team around it"; direction —
"flexible Good Stuff"; venue — "ladder only". For each slot, pick the option the
card recommends. Stop after the six species and their moves are chosen.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 1.1 | The centrepiece's strengths and weaknesses are written in chat **before** any `meta` command runs | Find the first `node tools/meta/cli.js` call; the write-up comes before it |
| 1.2 | Every species pick has a decision card, shown before the pick question | Count species questions; count cards; equal |
| 1.3 | Every species card's field 4 shows a `node tools/dex/cli.js find` command that was actually run | Match each pasted command to a tool call |
| 1.4 | Every species card's usage column came from `node tools/meta/cli.js rank` | A `rank` call precedes each card |
| 1.5 | Q4 is answered on every option row of every card | No blank Q4 cell |
| 1.6 | No recommendation gives usage rank, win rate or a teammate rate as its reason | Read each field 6 |
| 1.7 | Every move pick has a card | Count move choices; count move cards |
| 1.8 | The step-7 **Centrepiece gate:** is stated, naming what uses each Froslass strength | Search the transcript for the gate |
| 1.9 | The step-7 **Q4 gate:** is stated | Search the transcript for the gate |
| — | *Report only, not pass/fail:* how many of the final five partners are in the top 6 by usage | `meta rank` on the final six |

**Results log**

| Date | Model | 1.1 | 1.2 | 1.3 | 1.4 | 1.5 | 1.6 | 1.7 | 1.8 | 1.9 | Top-6 overlap | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Scenario 2 — what beats Kingambit

**Prompt:**

> What beats Kingambit right now? I want something to put on a ladder team.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 2.1 | Kingambit's real set is pulled with `node tools/meta/cli.js mon "Kingambit"` before any option is named | Order of tool calls |
| 2.2 | `node tools/dex/cli.js find --resists ...` is run to generate options | Tool call present |
| 2.3 | At least 3 options, each on a decision card | Count rows |
| 2.4 | Each option has a damage calc **from** Kingambit into it and one **from** it into Kingambit | Two `tools/damage-calc/cli.js` calls per option |
| 2.5 | The calcs into Kingambit pass its most common item from 2.1 (e.g. `--defender-item "Chople Berry"` if that is still the top item) | Read the calc flags |
| 2.6 | No option is called an answer on typing alone | Every "answers"/"beats" claim cites a calc |

**Results log**

| Date | Model | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | Notes |
|---|---|---|---|---|---|---|---|---|

## Scenario 3 — refine a team where Froslass runs Icy Wind

Verified 2026-09-14: Icy Wind is `legal` for Froslass, 55 BP, Special, spread,
and absent from Froslass's top-10 moves in live M-C data.

**Prompt:**

> Refine this team. Froslass @ Froslassite, Snow Warning: Blizzard / Icy Wind /
> Aurora Veil / Protect. Incineroar @ Sitrus Berry, Intimidate: Fake Out /
> Parting Shot / Flare Blitz / Will-O-Wisp. Rillaboom @ Leftovers, Grassy Surge:
> Fake Out / Grassy Glide / Wood Hammer / U-turn. Kingambit @ Chople Berry,
> Defiant: Kowtow Cleave / Sucker Punch / Iron Head / Protect. Sneasler @ Grassy
> Seed, Unburden: Close Combat / Dire Claw / Fake Out / Protect. Basculegion @
> Life Orb, Swift Swim: Wave Crash / Last Respects / Aqua Jet / Protect.
> Froslass is the speed-control lead.

**Pass criteria:**

| # | Criterion | How to check |
|---|---|---|
| 3.1 | Role fit (step 1b) is checked before meta relevance (step 1c) | Order in the report |
| 3.2 | Icy Wind is **not** flagged for being rarely run | Read the Icy Wind finding |
| 3.3 | Icy Wind is checked against the ≥80 BP floor and accepted or rejected on a stated speed-control job | Read the Icy Wind finding |
| 3.4 | Any replacement suggested for any move is on a decision card | Count suggestions; count cards |
| 3.5 | Nothing is auto-swapped; species, item and ability are left as given | Read the report |
| 3.6 | If an ability split looks impossible for its species, it is called broken data, not cited | Read any ability claims |

**Results log**

| Date | Model | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | 3.6 | Notes |
|---|---|---|---|---|---|---|---|---|

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-14 | Created with three scenarios — a favourite-Pokémon build, a "what beats X" question, and a refining pass with a rare but role-fitting move — each with transcript-checkable pass criteria and an empty results log. Scenario 3's Icy Wind facts verified via `dex learnset` and `dex move`. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md` |
