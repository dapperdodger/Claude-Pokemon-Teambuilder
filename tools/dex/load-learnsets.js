'use strict';
// Loads the vendored Champions learnset table.
//
// Kept separate from tools/damage-calc/load-vendor.js on purpose: this is a
// different upstream (smogon/pokemon-showdown) with its own pin, and the two
// go stale independently. Merging them would make "the roster is current" and
// "the move pools are current" a single indistinguishable claim, which is the
// exact confusion the separate manifests exist to prevent.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadUncached() {
  const file = path.join(__dirname, 'vendor', 'learnsets.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'learnsets.js' });
  if (!sandbox.CHAMPIONS_LEARNSETS) {
    throw new Error(
      'tools/dex/vendor/learnsets.js did not define CHAMPIONS_LEARNSETS. ' +
      'The vendored file is a top-level `var` assignment; if a re-vendor ' +
      'skipped the line-1 transform documented in tools/dex/VENDOR_MANIFEST.md, ' +
      'the raw upstream `export const` will parse but define nothing here.'
    );
  }
  return sandbox.CHAMPIONS_LEARNSETS;
}

let cached = null;
function getLearnsets() {
  if (!cached) cached = loadUncached();
  return cached;
}

module.exports = { getLearnsets };
