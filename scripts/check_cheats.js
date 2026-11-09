#!/usr/bin/env node
// Checks a draft file of memory-cheat cards with the build's own rules.
// Usage: node scripts/check_cheats.js drafts/cheats/<subject>.<part>.json
const fs = require("fs");
const path = require("path");
const { checkCard } = require("../build/cheats");

const file = process.argv[2];
if (!file) { console.error("usage: check_cheats.js <draft.json>"); process.exit(2); }
const syllabus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "syllabus.json"), "utf8"));
const unitSubject = {};
for (const s of syllabus.subjects) for (const u of s.units) unitSubject[u.id] = s.id;

try {
  const cards = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(cards)) throw new Error("file must be a JSON array");
  const ids = new Set();
  cards.forEach((c, i) => checkCard(c, `item ${i} (${c.id || "no id"})`, (u) => unitSubject[u], ids));
  const perUnit = {};
  for (const c of cards) perUnit[c.unit] = (perUnit[c.unit] || 0) + 1;
  console.log(`PASS ${path.basename(file)}: ${cards.length} cards`, perUnit);
} catch (e) {
  console.log("FAIL " + e.message);
  process.exit(1);
}
