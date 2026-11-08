#!/usr/bin/env node
// blind_compare.js — compares a blind re-check (lines "id LETTER [note]") with
// the keyed answers. Usage: node scripts/blind_compare.js <questions.json> <answers.txt>
const fs = require("fs");
const [inp, ans] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(inp, "utf8"));
const L = ["A", "B", "C", "D"];
const got = {};
for (const line of fs.readFileSync(ans, "utf8").split("\n")) {
  const m = line.trim().match(/^(\S+)\s+([ABCD])\b\s*(.*)$/);
  if (m) got[m[1]] = { letter: m[2], note: m[3] };
}
let agree = 0; const bad = [];
for (const q of items) {
  const g = got[q.id];
  if (g && g.letter === L[q.a]) agree++;
  else bad.push(`${q.id}: key ${L[q.a]}, re-check ${g ? g.letter : "missing"}${g && g.note ? " — " + g.note : ""}`);
}
console.log(`${agree}/${items.length} agree`);
bad.forEach((b) => console.log("  DISAGREE " + b));
process.exit(bad.length ? 2 : 0);
