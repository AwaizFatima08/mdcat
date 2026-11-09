#!/usr/bin/env node
// Writes docs/review/cheats-review.md (Homi's read-through) from content/cheats/.
// With --merge it first rebuilds content/cheats/<subject>.json from
// drafts/cheats/<subject>.<part>.json (syllabus order). After the first merge,
// content/cheats/ is the source to edit.
// Usage: node scripts/merge_cheats.js [--merge]
const fs = require("fs");
const path = require("path");
const { checkCard } = require("../build/cheats");

const ROOT = path.join(__dirname, "..");
const syllabus = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "syllabus.json"), "utf8"));
const order = [], unitSubject = {}, unitName = {};
for (const s of syllabus.subjects) for (const u of s.units) { order.push(u.id); unitSubject[u.id] = s.id; unitName[u.id] = `${u.n}. ${u.name}`; }

const merge = process.argv.includes("--merge");
const bySubject = {};
if (merge) {
  const draftDir = path.join(ROOT, "drafts", "cheats");
  for (const f of fs.readdirSync(draftDir).filter((f) => /^\w+\.\d+\.json$/.test(f)).sort()) {
    const sid = f.split(".")[0];
    for (const c of JSON.parse(fs.readFileSync(path.join(draftDir, f), "utf8"))) (bySubject[sid] = bySubject[sid] || []).push(c);
  }
} else {
  for (const s of syllabus.subjects) {
    const f = path.join(ROOT, "content", "cheats", `${s.id}.json`);
    if (fs.existsSync(f)) bySubject[s.id] = JSON.parse(fs.readFileSync(f, "utf8"));
  }
}

const ids = new Set();
let md = "# Memory cheats — review sheet\n\nEvery card as it appears in the app. Mark anything wrong or unclear next to its id.\n";
for (const s of syllabus.subjects) {
  const cards = (bySubject[s.id] || []).sort((a, b) => order.indexOf(a.unit) - order.indexOf(b.unit) || a.id.localeCompare(b.id));
  if (!cards.length) continue;
  cards.forEach((c, i) => checkCard(c, `${s.id} item ${i} (${c.id})`, (u) => unitSubject[u], ids));
  if (merge) {
    fs.mkdirSync(path.join(ROOT, "content", "cheats"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "content", "cheats", `${s.id}.json`), JSON.stringify(cards, null, 1) + "\n");
  }
  console.log(`${s.id}: ${cards.length} cards`);
  md += `\n## ${s.name} (${cards.length} cards)\n`;
  let unit = null;
  for (const c of cards) {
    if (c.unit !== unit) { unit = c.unit; md += `\n### ${unitName[unit]}\n`; }
    md += `\n**${c.id} — ${c.title}** _(${c.kind})_\n\n`;
    for (const b of c.blocks) {
      if (b.type === "table") {
        md += `| ${b.head.join(" | ")} |\n|${b.head.map(() => "---").join("|")}|\n` + b.rows.map((r) => `| ${r.join(" | ")} |`).join("\n") + "\n\n";
      } else if (b.type === "list") md += b.items.map((i) => `- ${i}`).join("\n") + "\n\n";
      else if (b.type === "mn") md += `> **${b.text}**\n` + b.items.map((i) => `> - ${i}`).join("\n") + "\n\n";
      else if (b.type === "h") md += `*${b.text}*\n\n`;
      else md += `${b.type === "tip" ? "💡 " : b.type === "warn" ? "⚠️ " : ""}${b.text}\n\n`;
    }
  }
}
fs.writeFileSync(path.join(ROOT, "docs", "review", "cheats-review.md"), md);
console.log("wrote docs/review/cheats-review.md");
