#!/usr/bin/env node
// merge_parts.js — joins checked draft parts into one unit file, in id order.
// Existing items in the unit file are kept. Usage:
//   node scripts/merge_parts.js content/questions/bio/bio-03.json drafts/bio-03.a.json drafts/bio-03.b.json
const fs = require("fs");
const [out, ...parts] = process.argv.slice(2);
const byId = new Map();
if (fs.existsSync(out)) for (const q of JSON.parse(fs.readFileSync(out, "utf8"))) byId.set(q.id, q);
for (const p of parts) for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
  if (byId.has(q.id)) throw new Error(`${p}: ${q.id} already exists`);
  byId.set(q.id, q);
}
const items = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(out, "[\n" + items.map((q) => "  " + JSON.stringify(q)).join(",\n") + "\n]\n");
console.log(`${out}: ${items.length} items`);
