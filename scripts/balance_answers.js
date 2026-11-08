#!/usr/bin/env node
/**
 * balance_answers.js — spreads correct answers evenly over A/B/C/D.
 *
 * MCQs are drafted with the correct option wherever it falls (often first).
 * This moves each correct option to a target position (cycling A,B,C,D in
 * a shuffled order seeded by the question id, so reruns give the same
 * result) and updates "a". Explanations never name a letter, so moving
 * options is safe.
 *
 * Run: node scripts/balance_answers.js content/questions/bio/bio-01.json [...]
 */
const fs = require("fs");

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}

for (const file of process.argv.slice(2)) {
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  const rand = seeded(file);
  // Targets: equal counts of 0..3, shuffled.
  const targets = items.map((_, i) => i % 4);
  for (let i = targets.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [targets[i], targets[j]] = [targets[j], targets[i]]; }
  items.forEach((q, i) => {
    const correct = q.o[q.a];
    const others = q.o.filter((_, k) => k !== q.a);
    const t = targets[i];
    q.o = others.slice(0, t).concat([correct], others.slice(t));
    q.a = t;
  });
  const out = "[\n" + items.map((q) => "  " + JSON.stringify(q)).join(",\n") + "\n]\n";
  fs.writeFileSync(file, out);
  const c = [0, 0, 0, 0]; items.forEach((q) => c[q.a]++);
  console.log(`${file}: A/B/C/D = ${c.join("/")}`);
}
