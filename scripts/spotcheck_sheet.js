#!/usr/bin/env node
/**
 * spotcheck_sheet.js — writes a Markdown sheet for Homi's spot check of one
 * subject: per unit, the questions the writers or blind reviewers had doubts
 * about first, then a fixed random sample, up to <perUnit> per unit.
 *
 * Usage: node scripts/spotcheck_sheet.js <subject> <perUnit> <out.md> [doubtful ids...]
 */
const fs = require("fs");
const path = require("path");
const [subject, perArg, out, ...doubt] = process.argv.slice(2);
const per = Number(perArg);
const dir = path.join(__dirname, "..", "content", "questions", subject);
const syllabus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "syllabus.json"), "utf8"));
const names = {};
for (const s of syllabus.subjects) for (const u of s.units) names[u.id] = u.name;
const doubtSet = new Set(doubt);
const L = ["A", "B", "C", "D"];
let md = `# Spot check — ${subject}\n\nGenerated ${new Date().toISOString().slice(0, 10)}. ⚠ = a writer or blind reviewer had a doubt (scope or wording); the rest is a fixed random sample. Mark anything wrong or out of syllabus, with the id.\n`;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const unit = f.replace(".json", "");
  const items = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  let h = 7;
  const rand = () => ((h = (h * 1103515245 + 12345) % 2147483648) / 2147483648);
  const flagged = items.filter((q) => doubtSet.has(q.id));
  const rest = items.filter((q) => !doubtSet.has(q.id)).sort(() => rand() - 0.5);
  const pick = flagged.concat(rest.slice(0, Math.max(0, per - flagged.length))).sort((a, b) => a.id.localeCompare(b.id));
  md += `\n## ${unit} — ${names[unit]} (${pick.length} of ${items.length})\n`;
  for (const q of pick) {
    md += `\n**${doubtSet.has(q.id) ? "⚠ " : ""}${q.id}** · ${q.lo} · ${q.d}  \n${q.q}  \n`;
    md += q.o.map((o, i) => (i === q.a ? `**${L[i]}) ${o} ✓**` : `${L[i]}) ${o}`)).join("  \n") + "  \n";
    md += `_${q.x}_\n`;
  }
}
fs.writeFileSync(out, md);
console.log(`wrote ${out}`);
