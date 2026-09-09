---
name: vgc-post-game
description: Use after playing games with a team — "I lost with this", "I keep losing to X", "went 2-3 on ladder, what do I change". Triages a real played game into bad luck, a misplay, or a genuinely missing tool, and only the last justifies changing the team. Not for evaluating a team from a standing start — that is vgc-team-audit.
---

# VGC Post-Game

## Overview
`vgc-team-audit` answers "what is wrong with this team" from a standing
start — no game required, just the roster. This skill answers a different
question: "why did I lose *that* game." A played game is evidence, but most
of what happens in a game is not evidence about the build — it's variance
and execution. Treating every loss as a build defect churns a good team
instead of improving it.

## Checklist
```
- [ ] 1. What happened — turn by turn where the user has it
- [ ] 2. Bucket the loss: bad luck | misplay | genuinely missing tool
- [ ] 3. Only "missing tool" justifies changing the team
- [ ] 4. Route: refining | building | no change
- [ ] 5. Offer to log the iteration — and ask first
```

**1. What happened.** Ask before diagnosing anything. Get the lead, the
bring-4, the key turns, and what the opponent brought. If all the user has
is "I lost to X twice," that's enough to start — say plainly what you're
inferring rather than inventing turn-by-turn detail that wasn't given.

**2. Bucket the loss.** Every loss falls into one of three buckets, each with
its own discriminating question:

- **Bad luck** — would the same decisions usually have won? A missed
  90%-accuracy move, a crit taken, a full-paralysis turn. This is variance,
  not signal.
- **Misplay** — was the right tool there and not used, or used at the wrong
  time? A saved Tailwind spent turn 1, a Protect not clicked, the wrong four
  brought from the six. The fix is a play note, not a build change.
- **Genuinely missing tool** — was there no legal line available with this
  team at all? No answer to the threat that beat you, no speed control once
  the setter went down, nothing on the roster that could break the wall that
  won them the game. This, and only this, is a build finding.

State plainly: **most losses are bad luck or a misplay, and a skill that
treated every loss as a build defect would make a good team worse by
reacting to noise.** If the evidence in hand doesn't distinguish the three —
too little detail, or a plausible read either way — say so and ask for more
games rather than guessing which bucket it was.

**3-4. Route on the bucket.**

| Bucket | Route |
|---|---|
| Bad luck | No change. Say so explicitly — "play it again" is a real answer. |
| Misplay | No build change. Give the play note. |
| Missing tool — moves or spread | `vgc-team-refining` |
| Missing tool — the roster itself | `vgc-team-building` |

**The repeated-loss trap.** A single loss to one Pokémon is not a pattern —
don't route to a build change off one game just because the threat has a
name. But losing to the *same* specific threat repeatedly **is** legitimate
grounds for a dedicated answer: `reference/team-evaluation.md`'s
meta-awareness section is explicit that there is a counter to every
Pokémon, however strong, and building a slot to answer a threat that keeps
beating you is a legitimate response, not a concession. The distinction is
entirely about the count — **once is not a pattern; repeated is.**

**5. Offer to log the iteration.**

`teams/` is read-only unless the user explicitly says to write. Finding a
real problem mid-triage is **not** permission — see `.claude/rules/teams.md`.

If a finding is worth recording, offer it in one line and drop it if the
answer is no. If they say yes, the six species decide where it goes: same
six species → edit in place, with a changelog row recording the **old
value**; any species swapped → a new `<original-basename>-v2.md` with a
`**Supersedes:**` stamp naming the predecessor, which is left untouched.

## Common mistakes
- Treating variance as a build defect
- Rebuilding after a single loss
- Editing a `teams/` file because the finding felt important enough
- Diagnosing before asking what actually happened
- Skipping the bucket step and going straight to a fix

## References
- `reference/team-evaluation.md` — meta-awareness section: a counter exists
  to every Pokémon, and a dedicated answer to a repeated threat is legitimate
- `reference/speed-control.md` — backup-setter question, relevant when the
  missing tool turns out to be speed control
- `.claude/rules/teams.md` — the write gate and in-place-vs-new-file rule
- `docs/case-studies.md` — the incidents behind these rules
