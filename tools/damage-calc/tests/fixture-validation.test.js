const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDamageCalc } = require('../calc');

test('calc.js matches the real NCP calculator for the Gholdengo vs Garchomp fixture', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'gholdengo-vs-garchomp.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const result = runDamageCalc({
    attacker: fixture.attacker,
    defender: fixture.defender,
    move: { name: fixture.move },
    field: fixture.field,
  });

  assert.equal(result.min, fixture.expected.min,
    `min damage mismatch vs real NCP calculator (captured ${fixture.capturedAt} from ${fixture.sourceUrl}) — calc.js may have a porting bug, or the fixture is stale`);
  assert.equal(result.max, fixture.expected.max,
    `max damage mismatch vs real NCP calculator (captured ${fixture.capturedAt} from ${fixture.sourceUrl})`);
});
