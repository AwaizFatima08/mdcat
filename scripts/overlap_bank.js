#!/usr/bin/env node
// overlap_bank.js <draft.json> — lists draft MCQs that are too close to a
// practice-bank question of the same unit (word-overlap of the stem ≥ 0.55, or
// ≥ 0.4 with the same correct answer). Mock questions must test something the
// bank doesn't, so every line printed should be rewritten. Prints "CLEAN" if none.
const fs = require("fs");
const path = require("path");
const file = process.argv[2];
const ROOT = path.join(__dirname, "..");
const stop = new Set("the a an of in is are which following to and by for on as that with from its it be this at or what when how most".split(" "));
const toks = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !stop.has(w)));
const jac = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (a.size + b.size - n || 1); };
const items = JSON.parse(fs.readFileSync(file, "utf8"));
const bankCache = {};
function bank(unit) {
  if (bankCache[unit]) return bankCache[unit];
  const s = unit.split("-")[0];
  const p = path.join(ROOT, "content", "questions", s, unit + ".json");
  return (bankCache[unit] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")).map((q) => ({ id: q.id, t: toks(q.q), k: toks(q.o[q.a]).size ? [...toks(q.o[q.a])].sort().join(" ") : "", q: q.q })) : []);
}
let hits = 0;
for (const q of items) {
  const unit = q.id.split("-").slice(0, 2).join("-");
  const t = toks(q.q), k = [...toks(q.o[q.a])].sort().join(" ");
  for (const b of bank(unit)) {
    const j = jac(t, b.t);
    if (j >= 0.55 || (j >= 0.4 && k && k === b.k)) {
      hits++;
      console.log(`${q.id} ~ ${b.id} (${j.toFixed(2)}${k === b.k ? ", same answer" : ""})\n   draft: ${q.q}\n   bank:  ${b.q}`);
      break;
    }
  }
}
console.log(hits ? `${hits} too close to the bank — rewrite them` : "CLEAN");
process.exit(hits ? 2 : 0);
