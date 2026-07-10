# Ability & Move Mechanics Notes (VGC / Pokémon Champions)

Separate from raw type effectiveness — this file is for ability- and move-specific rules that change how a matchup actually plays out, verified against Bulbapedia/Serebii as they come up.

## Priority & turn order
- **Trick Room** has -7 priority (the lowest priority value that exists) and therefore always resolves last in the turn it's used, regardless of the user's Speed stat. This means any normal-priority attack from either side lands before Trick Room takes effect on the turn it's set — you don't need to out-speed a Trick Room setter to hit it before the room goes up, you just need enough damage that turn. On subsequent turns while Trick Room is active, turn order within the same priority bracket is reversed — the *lowest*-Speed Pokémon acts first — priority moves still go before non-priority moves as usual, only the Speed comparison within a bracket flips.
- **Armor Tail** (Farigiraf's signature ability; functionally similar to Dazzling/Queenly Majesty) blocks any priority-boosted move — including Prankster-boosted status moves like Taunt/Encore/Fake Tears — from hitting the ability holder *or its ally* that turn. It does NOT affect moves at normal (0) priority, and it doesn't stop field/side effects (screens, hazards, Tailwind on the other side of the field).

## Speed calculation

Base Speed at Level 50 comes from the Champions Stat Points (SP) formula
in `vgc_current_regulation.md`'s "Stat system" section — don't use the old
EV-based formula, Champions replaced it entirely and the two don't
convert cleanly (see that file for why this matters).

Once you have a Pokémon's raw Speed stat, these modifiers commonly decide
who actually moves first — check for them before assuming raw Speed
settles a matchup:
- **Choice Scarf**: ×1.5 to Speed.
- **Tailwind**: ×2 to Speed for every Pokémon on the affected side, lasts
  4 turns.
- **Paralysis**: cuts Speed by 50% (×0.5). This multiplier is confirmed
  unchanged in Champions. Separately, the *chance* of full paralysis
  (being unable to act at all that turn) is reported inconsistently
  across current sources as of this writing — 25% per one source vs. a
  claimed Champions-specific nerf to 12.5% per another — verify that
  number before relying on it specifically; this note only vouches for
  the Speed multiplier.
- **Trick Room**: does not modify anyone's Speed stat at all — see the
  Trick Room bullet above for what it actually does (reverses turn order,
  doesn't touch the stat itself).

## Type-immunity reminders (easy to forget when checking coverage)
- Ghost-type moves have no effect on Normal-types, and Normal-type moves have no effect on Ghost-types. Relevant any time a Ghost-STAB attacker (e.g. Gholdengo's Shadow Ball) is being counted on to threaten a Normal-type support Pokémon (e.g. Farigiraf) — it won't.

*Add further verified ability/move interactions here as they come up in team-building sessions, rather than folding them into the type chart file.*

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Bulbapedia, Serebii (verified in original claude.ai session) |
| 2026-07-09 | Fixed Armor Tail bullet: removed Tailwind from blocked-moves example (Tailwind is a field effect, not a direct-target move) | Task review |
| 2026-07-09 | Added Speed calculation section (Champions SP-formula pointer + Choice Scarf/Tailwind/Paralysis modifiers) and expanded Trick Room bullet with the ascending-Speed turn-order note for while Trick Room is active | champsdex.com status conditions guide (paralysis); Trick Room turn-order reversal is standard, unchanged mechanic across generations |
