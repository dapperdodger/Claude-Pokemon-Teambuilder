#!/usr/bin/env bash
# Warns if tools/damage-calc's vendored NCP-VGC-Damage-Calculator commit is
# behind the upstream repo's current main HEAD. Run as a SessionStart hook.
# No jq dependency (matches check_regulation_staleness.sh's approach) - uses
# grep on the GitHub API's JSON response instead.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
manifest="$repo_root/tools/damage-calc/VENDOR_MANIFEST.md"

[ -f "$manifest" ] || exit 0

vendored_sha="$(grep -oE 'Commit: `[0-9a-f]{40}`' "$manifest" | head -1 | grep -oE '[0-9a-f]{40}')"
[ -n "$vendored_sha" ] || exit 0

upstream_json="$(curl -s --max-time 5 "https://api.github.com/repos/nerd-of-now/NCP-VGC-Damage-Calculator/commits/main" 2>/dev/null || true)"
[ -n "$upstream_json" ] || exit 0

upstream_sha="$(printf '%s' "$upstream_json" | grep -m1 -oE '"sha": ?"[0-9a-f]{40}"' | grep -oE '[0-9a-f]{40}')"
[ -n "$upstream_sha" ] || exit 0

if [ "$vendored_sha" != "$upstream_sha" ]; then
  body="tools/damage-calc's vendored NCP-VGC-Damage-Calculator data is behind upstream.\\nVendored: ${vendored_sha}\\nUpstream main: ${upstream_sha}\\nRe-vendor per tools/damage-calc/VENDOR_MANIFEST.md's 'Re-vendoring' section if the gap looks significant (new Pokemon, balance changes) - a few commits behind on typo fixes is not urgent."
  escaped="$(printf '%b' "$body" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}')"
  escaped="${escaped%\\n}"
  printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$escaped" "$escaped"
fi
exit 0
