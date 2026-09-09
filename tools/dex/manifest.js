'use strict';
// Reads the learnset vendor's pin so a query can stamp its own answer with it.
//
// Both fields are load-bearing, for different questions: the commit answers
// "is this behind upstream", the regulation answers "is this describing the
// rules we are playing under". A stale pin is the dangerous case precisely
// because it does not fail — upstream updates the Champions mod IN PLACE, so
// a previous regulation's pin serves complete, normal-looking, wrong move
// pools rather than erroring.

const fs = require('node:fs');
const path = require('node:path');

function learnsetPin() {
  const p = path.join(__dirname, 'VENDOR_MANIFEST.md');
  try {
    const text = fs.readFileSync(p, 'utf8');
    const commit = text.match(/^Commit:\s*`([0-9a-f]+)`/m);
    const regulation = text.match(/^Regulation:\s*`([A-Za-z0-9-]+)`/m);
    return { commit: commit ? commit[1] : null, regulation: regulation ? regulation[1] : null };
  } catch {
    return { commit: null, regulation: null };
  }
}

// Pure: takes the two regulation ids rather than reading them, so the stale
// branch is reachable in a test on a day when the real pin happens to match.
//
// Unknown on either side is NOT stale. Absence of information is not evidence
// of drift, and a warning that fires whenever a field cannot be parsed trains
// the reader to ignore it.
function pinStatus({ pinRegulation, activeRegulation }) {
  if (!pinRegulation || !activeRegulation || pinRegulation === activeRegulation) {
    return { stale: false, caveat: null };
  }
  return {
    stale: true,
    caveat:
      `STALE LEARNSET PIN: move pools are pinned to regulation ${pinRegulation}, but the active ` +
      `regulation is ${activeRegulation}. Regulations CUT move pools as well as adding them, and ` +
      'upstream updates the mod in place — so this list may contain species that no longer learn ' +
      'the move it was filtered on. Re-vendor per tools/dex/VENDOR_MANIFEST.md before trusting ' +
      'these candidates.',
  };
}

module.exports = { learnsetPin, pinStatus };
