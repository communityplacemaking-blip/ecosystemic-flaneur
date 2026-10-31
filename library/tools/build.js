'use strict';
/* Joins the per-practice files into one data file for a future engine. Not used by any page yet.
   Run: node library/tools/build.js  ->  library/build/library.json (not committed) */
const fs = require('fs');
const path = require('path');
const { loadLibrary, ROOT } = require('./load');
const { validate } = require('./validate');

function build(lib = loadLibrary()) {
  const res = validate(lib);
  if (res.errors.length) throw new Error('validation failed:\n' + res.errors.join('\n'));
  return {
    schema: 1,
    practices: lib.practices.map(p => p.record).sort((a, b) => a.review.b_order - b.review.b_order),
    sources: lib.registry.sources,
    dictionaries: lib.dictionaries
  };
}

module.exports = { build };

if (require.main === module) {
  const out = path.join(ROOT, 'build', 'library.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const data = build();
  fs.writeFileSync(out, JSON.stringify(data) + '\n');
  console.log(`${data.practices.length} practices -> ${path.relative(process.cwd(), out)} (${fs.statSync(out).size} bytes)`);
}
