'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

/* The whole library in memory: practices (with the file each came from), registry, dictionaries, proposals. */
function loadLibrary(root = ROOT) {
  const files = dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.json')).sort();
  const practices = files('practices').map(f => ({ file: f, record: readJson(path.join(root, 'practices', f)) }));
  const dictionaries = Object.fromEntries(files('dictionaries').map(f => [f.replace(/\.json$/, ''), readJson(path.join(root, 'dictionaries', f))]));
  const registry = readJson(path.join(root, 'sources', 'registry.json'));
  const proposals = files('proposals').map(f => ({ file: f, data: readJson(path.join(root, 'proposals', f)) }));
  return { practices, dictionaries, registry, proposals };
}

module.exports = { loadLibrary, ROOT };
