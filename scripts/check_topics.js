#!/usr/bin/env node
// Checks a draft important-topics list with the build's own rules.
// Usage: node scripts/check_topics.js drafts/topics/topics.json
const fs = require("fs");
const path = require("path");
const { TIERS, checkTopics } = require("../build/topics");

const file = process.argv[2];
if (!file) { console.error("usage: check_topics.js <topics.json>"); process.exit(2); }
const syllabus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "syllabus.json"), "utf8"));
const subjectOf = {};
for (const s of syllabus.subjects) for (const u of s.units) subjectOf[u.id] = s.id;

try {
  const list = checkTopics(JSON.parse(fs.readFileSync(file, "utf8")), syllabus);
  const perSubject = {};
  for (const e of list) {
    const k = subjectOf[e.unit];
    perSubject[k] = perSubject[k] || { 1: 0, 2: 0, 3: 0 };
    perSubject[k][e.tier]++;
  }
  console.log(`PASS ${path.basename(file)}: ${list.length} units`, JSON.stringify(perSubject), `(tiers ${Object.values(TIERS).join("/")})`);
} catch (e) {
  console.log("FAIL " + e.message);
  process.exit(1);
}
