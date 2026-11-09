#!/usr/bin/env node
/**
 * check_draft.js — checks one draft part file before it is merged.
 *
 * Usage: node scripts/check_draft.js <draft.json> <unitId> <firstNum> <count>
 * e.g.   node scripts/check_draft.js drafts/bio-03.a.json bio-03 1 126
 *
 * Checks: valid JSON array, exactly <count> items with ids <unitId>-<NNN>
 * running from <firstNum>, all fields, topic/LO in the unit, 4 distinct
 * options, a in 0-3, no option or explanation that names a letter (answers
 * are moved later), no repeated stems, and the difficulty mix.
 */
const fs = require("fs");
const path = require("path");
const [file, unitId, firstArg, countArg] = process.argv.slice(2);
if (!countArg) { console.error("usage: check_draft.js <draft.json> <unitId> <firstNum> <count>"); process.exit(1); }
const first = Number(firstArg), count = Number(countArg);
const syllabus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "syllabus.json"), "utf8"));
let unit;
for (const s of syllabus.subjects) for (const u of s.units) if (u.id === unitId) unit = u;
if (!unit) { console.error(`unknown unit ${unitId}`); process.exit(1); }
const loByTopic = {};
for (const t of unit.topics) loByTopic[t.id] = new Set(t.los.map((l) => l.code));

const errs = [];
let items;
try { items = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error(`NOT VALID JSON: ${e.message}`); process.exit(1); }
if (!Array.isArray(items)) { console.error("must be a JSON array"); process.exit(1); }
if (items.length !== count) errs.push(`has ${items.length} items, expected ${count}`);

// "Both A and B", "option C", "(D)", "all of the above" break when options move.
const LETTER_REF = /\b(option|options|choice|answer)\s+[A-D]\b|\b[A-D]\s+(and|or|&)\s+[A-D]\b|\([A-D]\)|\b(all|none|both) of the (above|following)\b/i;
const stems = new Set();
const diff = { E: 0, M: 0, D: 0 };
items.forEach((q, i) => {
  const want = `${unitId}-${String(first + i).padStart(3, "0")}`;
  const at = `item ${i} (${q && q.id})`;
  for (const k of ["id", "topic", "lo", "d", "q", "o", "a", "x"]) if (!q || !(k in q)) errs.push(`${at}: missing "${k}"`);
  if (!q) return;
  if (q.id !== want) errs.push(`${at}: id should be ${want}`);
  if (!loByTopic[q.topic]) errs.push(`${at}: topic "${q.topic}" not in ${unitId}`);
  else if (!loByTopic[q.topic].has(q.lo)) errs.push(`${at}: LO "${q.lo}" not in topic ${q.topic}`);
  if (!["E", "M", "D"].includes(q.d)) errs.push(`${at}: d must be E/M/D`);
  else diff[q.d]++;
  if (!Array.isArray(q.o) || q.o.length !== 4) errs.push(`${at}: needs 4 options`);
  else {
    const norm = q.o.map((o) => String(o).trim().toLowerCase());
    if (new Set(norm).size !== 4 || norm.some((o) => !o)) errs.push(`${at}: options empty or repeated`);
    q.o.forEach((o) => { if (LETTER_REF.test(o)) errs.push(`${at}: option names a letter / "above": ${o}`); });
  }
  if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) errs.push(`${at}: a must be 0-3`);
  if (String(q.q || "").trim().length < 10) errs.push(`${at}: stem too short`);
  if (String(q.x || "").trim().length < 40) errs.push(`${at}: explanation too short`);
  if (LETTER_REF.test(q.x || "") || /\b(option|choice)\s+[A-D]\b/i.test(q.x || "")) errs.push(`${at}: explanation names a letter`);
  const stem = String(q.q || "").trim().toLowerCase();
  if (stems.has(stem)) errs.push(`${at}: repeated stem`);
  stems.add(stem);
});
const n = items.length || 1;
const pct = (k) => Math.round((diff[k] / n) * 100);
const mix = `E/M/D = ${diff.E}/${diff.M}/${diff.D} (${pct("E")}%/${pct("M")}%/${pct("D")}%)`;
if (pct("E") > 25 || pct("D") < 8 || pct("M") < 55) errs.push(`difficulty mix off (aim 15/70/15): ${mix}`);
if (errs.length) { errs.forEach((e) => console.log("ERR " + e)); console.log(`FAIL ${file}: ${errs.length} problem(s)`); process.exit(2); }
console.log(`PASS ${file}: ${items.length} items, ${mix}`);
