#!/usr/bin/env node
// blind_export.js — writes questions WITHOUT answers or explanations, for the
// independent re-check pass. Usage: node scripts/blind_export.js <in.json> <out.txt>
const fs = require("fs");
const [inp, out] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(inp, "utf8"));
const L = ["A", "B", "C", "D"];
fs.writeFileSync(out, items.map((q) => `${q.id}\n${q.q}\n` + q.o.map((o, i) => `  ${L[i]}) ${o}`).join("\n")).join("\n\n") + "\n");
console.log(`wrote ${items.length} blind questions to ${out}`);
