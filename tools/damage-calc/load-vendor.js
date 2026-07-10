'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadVendorUncached() {
  const sandbox = { console, gen: 10 };
  const realGlobalDollar = global.$;
  require('./dom-stub').installDomStub();
  sandbox.$ = global.$;
  global.$ = realGlobalDollar; // don't leak the stub into the real global scope

  const files = ['nature_data.js', 'type_data.js', 'pokedex.js', 'move_data.js',
    'ability_data.js', 'item_data.js', 'damage_MASTER.js', 'damage_SV.js', 'setdex_ncp-g10.js'];
  vm.createContext(sandbox);
  for (const f of files) {
    const code = fs.readFileSync(path.join(__dirname, 'vendor', f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }
  return sandbox;
}

let cached = null;
// Cached singleton — every caller (lookup.js, calc.js, tests) shares one
// loaded vendor context instead of each re-running ~28,000 lines of setup.
function getVendor() {
  if (!cached) cached = loadVendorUncached();
  return cached;
}

module.exports = { getVendor };
