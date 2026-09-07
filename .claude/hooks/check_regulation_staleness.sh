#!/usr/bin/env bash
# Warns if reference/regulation.md looks stale: either its
# "Last verified" stamp is more than 14 days old, or the active
# regulation's end date has passed. Run as a SessionStart hook.
#
# No dependency on jq (not guaranteed present) — JSON is hand-built from
# plain digit/letter fields only, so no escaping concerns.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
reg_file="$repo_root/reference/regulation.md"

[ -f "$reg_file" ] || exit 0

today="$(date +%Y-%m-%d)"
today_epoch="$(date -d "$today" +%s)"

# Both stamps are ISO YYYY-MM-DD on their own line near the top of the
# regulation file. ISO deliberately, not prose dates: `date -d` parsing of
# "9 September 2026" is locale-dependent, and an earlier version of this
# script grepped for an "Active dates:" prose string that a later rewrite of
# the regulation file removed - leaving the end-date guard silently dead for
# weeks while still reporting success. A distinct, single-purpose stamp that
# only this script reads is much harder to break by accident.
last_verified="$(grep -oE '^\*\*Last verified: [0-9]{4}-[0-9]{2}-[0-9]{2}\*\*' "$reg_file" | head -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')"
end_date_raw="$(grep -oE '^\*\*Regulation ends: [0-9]{4}-[0-9]{2}-[0-9]{2}\*\*' "$reg_file" | head -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')"

warnings=()

if [ -n "$last_verified" ]; then
  verified_epoch="$(date -d "$last_verified" +%s 2>/dev/null || true)"
  if [ -n "$verified_epoch" ]; then
    days_since=$(( (today_epoch - verified_epoch) / 86400 ))
    if [ "$days_since" -gt 14 ]; then
      warnings+=("reference/regulation.md was last verified $last_verified ($days_since days ago, >14) - re-check before relying on it.")
    fi
  else
    warnings+=("Found a Last-verified date ($last_verified) in reference/regulation.md but could not parse it - check the file manually.")
  fi
else
  warnings+=("Could not find a 'Last verified: YYYY-MM-DD' stamp in reference/regulation.md - check the file manually.")
fi

if [ -n "$end_date_raw" ]; then
  end_epoch="$(date -d "$end_date_raw" +%s 2>/dev/null || true)"
  if [ -n "$end_epoch" ]; then
    if [ "$today_epoch" -ge "$end_epoch" ]; then
      warnings+=("The active regulation's end date ($end_date_raw) has passed - reference/regulation.md needs a full refresh, not just a re-verify.")
    fi
  else
    warnings+=("Found a regulation end date ($end_date_raw) in reference/regulation.md but could not parse it - check the file manually.")
  fi
else
  warnings+=("Could not find a '**Regulation ends: YYYY-MM-DD**' stamp in reference/regulation.md - the end-date guard is not running. Restore the stamp near the top of that file.")
fi

if [ "${#warnings[@]}" -eq 0 ]; then
  exit 0
fi

body="STALE REGULATION DATA - reference/regulation.md needs attention:"
for w in "${warnings[@]}"; do
  body="${body}\n- ${w}"
done

escaped="$(printf '%b' "$body" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}')"
escaped="${escaped%\\n}"

printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$escaped" "$escaped"
exit 0
