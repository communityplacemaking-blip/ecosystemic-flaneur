'use strict';
/* Reads the data of mechanism B straight from mechanism/index.html, without changing it.
   The slice from MOVEMENTS up to UI holds only data and function definitions; it is run in an empty
   sandbox, so nothing from the page (DOM, storage) is touched. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const B_FILE = path.join(__dirname, '..', '..', 'mechanism', 'index.html');

function extractB(file = B_FILE) {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('const MOVEMENTS');
  const end = html.indexOf('const UI = {');
  if (start < 0 || end < 0 || end < start) throw new Error('mechanism B layout changed: data block not found');
  const code = html.slice(start, end) +
    '\n;({ MOVEMENTS, SLOTS, STATUS, MODES, IDS, PLACES, TIMES, OPEN, STATES, TYPES, MORAL, GROUP_IDS, CONTEXTS, STARTS, AOH, HAS, LIB, FORMS });';
  const data = vm.runInNewContext(code, { localStorage: { getItem: () => null } }, { timeout: 2000 });
  return JSON.parse(JSON.stringify(data)); // plain data, detached from the sandbox
}

module.exports = { extractB, B_FILE };

if (require.main === module) {
  const b = extractB();
  console.log(`B records: ${b.LIB.length}, invitation forms: ${Object.keys(b.FORMS).length}`);
}
