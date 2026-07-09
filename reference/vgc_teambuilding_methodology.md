# Teambuilding Methodology Notes (VGC / Pokémon Champions)

Process rules for how to evaluate matchups and build teams — not reference data itself, but how to use the reference data correctly.

## Typing alone is not sufficient to call something a "counter"

A type chart only describes a Pokémon's own STAB and its defensive typing — it says nothing about the actual moves a given set is running. A Pokémon is regularly used as a "check" or "counter" to something specifically *because* of a coverage move outside its own type(s), not because of its typing.

Classic example: Garchomp has no Rock-type STAB itself — it isn't a Rock-type — so the offensive threat it poses to Charizard comes entirely from the coverage move **Rock Slide** (Rock is 4x on Fire/Flying), not from typing. Defensively it's a separate, genuinely favorable matchup: Garchomp's Ground typing resists Rock-type moves (½x), and against Charizard specifically its Dragon typing also resists Charizard's Fire STAB (½x), with only Charizard's Flying STAB landing neutrally — letting Garchomp switch in safely. The type chart alone would never surface the offensive half of that.

**So evaluating any matchup requires two separate checks, not one:**
1. **Typing** — what does the type chart say about raw effectiveness in both directions?
2. **Actual moveset** — what coverage moves is this Pokémon *actually running* in the current meta (per usage data like Pikalytics/VGCPastes), and does that change the picture regardless of its base types?

Skipping step 2 and reasoning from typing alone is a common way to misjudge a matchup — a Pokémon can be a real answer to something despite bad "on paper" typing, or a bad answer to something despite good typing if it isn't actually running the relevant coverage move. Always check both before calling something a counter/answer/threat.

*Add further process rules here as they come up (e.g. how to weigh usage stats vs. actual reasoning, how to handle Tera strategy once/if it's activated in a future regulation), keeping this separate from the type chart and mechanics reference files.*

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Original claude.ai session reasoning, no external source needed (process rule, not factual claim) |
| 2026-07-09 | Corrected a factual error in the Garchomp/Charizard example: it previously claimed Garchomp "gets no defensive benefit from Rock at all," but Garchomp's Ground typing actually resists Rock (½x). Also corrected "Ground/Dragon-neutral matchup" to note Dragon resists Charizard's Fire STAB (½x) — only the Flying half of Charizard's STAB is neutral. | Cross-checked against reference/vgc_type_chart_reference.md; caught during task review |
