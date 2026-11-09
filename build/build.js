#!/usr/bin/env node
/**
 * build.js — assembles dist/app.html from src/ and content/.
 *
 * Same idea as Urdu Safar: plain HTML/CSS/JS, no bundler. The build reads
 * the syllabus and every question file, validates them hard (a broken MCQ
 * must stop the build, never reach a student), injects them into app.js,
 * inlines the CSS and writes one self-contained HTML file.
 *
 * Run:  node build/build.js
 * Output: dist/app.html (also copied to www/index.html for Capacitor by
 * `npm run build`). Never hand-edit dist/app.html.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

const DIFFICULTIES = ["E", "M", "D"];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    throw new Error(`${path.relative(ROOT, filePath)} is not valid JSON: ${e.message}`);
  }
}

// Indexes the syllabus so question files can be checked against it.
function indexSyllabus(syllabus) {
  const units = new Map();   // unitId -> { subject, unit, topicIds:Set, loCodes:Set }
  const seen = new Set();
  for (const s of syllabus.subjects) {
    for (const u of s.units) {
      if (seen.has(u.id)) throw new Error(`syllabus: duplicate unit id "${u.id}"`);
      seen.add(u.id);
      const topicIds = new Set();
      const loCodes = new Set();
      for (const t of u.topics) {
        if (seen.has(t.id)) throw new Error(`syllabus: duplicate topic id "${t.id}"`);
        seen.add(t.id);
        topicIds.add(t.id);
        for (const lo of t.los || []) loCodes.add(lo.code);
      }
      units.set(u.id, { subject: s.id, unit: u, topicIds, loCodes });
    }
  }
  return units;
}

// Loads content/questions/<subject>/<unitId>.json and validates every MCQ.
function loadQuestions(units) {
  const qDir = path.join(CONTENT_DIR, "questions");
  const all = [];
  const ids = new Set();
  const stems = new Map();
  if (!fs.existsSync(qDir)) return all;
  for (const subjectDir of fs.readdirSync(qDir)) {
    const dir = path.join(qDir, subjectDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const unitId = f.replace(/\.json$/, "");
      const where = `questions/${subjectDir}/${f}`;
      const info = units.get(unitId);
      if (!info) throw new Error(`${where}: "${unitId}" is not a unit id in syllabus.json`);
      if (info.subject !== subjectDir) throw new Error(`${where}: unit belongs to subject "${info.subject}", not "${subjectDir}"`);
      const items = readJson(path.join(dir, f));
      if (!Array.isArray(items)) throw new Error(`${where} must be a JSON array`);
      items.forEach((q, i) => {
        const at = `${where} item ${i} (${q.id || "no id"})`;
        for (const k of ["id", "topic", "lo", "d", "q", "o", "a", "x"]) {
          if (!(k in q)) throw new Error(`${at}: missing "${k}"`);
        }
        if (ids.has(q.id)) throw new Error(`${at}: duplicate id`);
        ids.add(q.id);
        if (!q.id.startsWith(unitId + "-")) throw new Error(`${at}: id must start with "${unitId}-"`);
        if (!info.topicIds.has(q.topic)) throw new Error(`${at}: topic "${q.topic}" is not in unit ${unitId}`);
        if (info.loCodes.size && !info.loCodes.has(q.lo)) throw new Error(`${at}: LO "${q.lo}" is not in unit ${unitId}`);
        if (!DIFFICULTIES.includes(q.d)) throw new Error(`${at}: d must be one of ${DIFFICULTIES.join("/")}`);
        if (!Array.isArray(q.o) || q.o.length !== 4) throw new Error(`${at}: needs exactly 4 options`);
        const norm = q.o.map((o) => String(o).trim().toLowerCase());
        if (norm.some((o) => !o)) throw new Error(`${at}: empty option`);
        if (new Set(norm).size !== 4) throw new Error(`${at}: options are not all different`);
        if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) throw new Error(`${at}: a must be 0-3`);
        if (String(q.q).trim().length < 10) throw new Error(`${at}: question text too short`);
        if (String(q.x).trim().length < 20) throw new Error(`${at}: explanation too short`);
        // Generic stems ("Which statement is correct?") may repeat; stem + options may not.
        const stem = String(q.q).trim().toLowerCase() + "|" + [...norm].sort().join("|");
        if (stems.has(stem)) throw new Error(`${at}: same question and options as ${stems.get(stem)}`);
        stems.set(stem, q.id);
        all.push({ ...q, unit: unitId, subject: subjectDir });
      });
    }
  }
  return all;
}

// Warns (does not fail) when answers bunch on one letter in a unit.
function answerSpreadReport(questions) {
  const byUnit = {};
  for (const q of questions) {
    byUnit[q.unit] = byUnit[q.unit] || [0, 0, 0, 0];
    byUnit[q.unit][q.a]++;
  }
  for (const [unit, c] of Object.entries(byUnit)) {
    const total = c.reduce((a, b) => a + b, 0);
    if (total >= 12 && Math.max(...c) / total > 0.4) {
      console.warn(`  WARN ${unit}: answers bunched (A/B/C/D = ${c.join("/")})`);
    }
  }
}

// Rules & guidelines: sections of typed blocks; checks every block is renderable.
const GUIDE_BLOCKS = {
  p: ["text"], h: ["text"], tip: ["text"], warn: ["text"], list: ["items"], table: ["head", "rows"],
};
function loadGuide() {
  const guide = readJson(path.join(CONTENT_DIR, "guide.json"));
  for (const k of ["updated", "disclaimer", "sources", "sections"]) {
    if (!(k in guide)) throw new Error(`guide.json: missing "${k}"`);
  }
  const ids = new Set();
  guide.sections.forEach((s, i) => {
    const at = `guide.json section ${i} (${s.id || "no id"})`;
    for (const k of ["id", "icon", "title", "summary", "blocks"]) {
      if (!(k in s)) throw new Error(`${at}: missing "${k}"`);
    }
    if (ids.has(s.id)) throw new Error(`${at}: duplicate id`);
    ids.add(s.id);
    s.blocks.forEach((b, j) => {
      const need = GUIDE_BLOCKS[b.type];
      if (!need) throw new Error(`${at} block ${j}: unknown type "${b.type}"`);
      for (const k of need) if (!(k in b)) throw new Error(`${at} block ${j}: ${b.type} needs "${k}"`);
      if (b.type === "table" && b.rows.some((r) => r.length !== b.head.length)) {
        throw new Error(`${at} block ${j}: every table row needs ${b.head.length} cells`);
      }
    });
  });
  return guide;
}

function main() {
  console.log("Loading content...");
  const syllabus = readJson(path.join(CONTENT_DIR, "syllabus.json"));
  const guide = loadGuide();
  console.log(`  guide: ${guide.sections.length} sections`);
  const units = indexSyllabus(syllabus);
  const questions = loadQuestions(units);
  const bySubject = {};
  for (const q of questions) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
  console.log(`  ${units.size} units, ${questions.length} practice MCQs`, bySubject);
  answerSpreadReport(questions);

  // Strip build-only fields to keep the shipped file small.
  const shipped = questions.map(({ id, unit, topic, lo, d, q, o, a, x }) => ({ id, unit, topic, lo, d, q, o, a, x }));

  const styles = fs.readFileSync(path.join(SRC_DIR, "styles.css"), "utf8");
  const appJs = fs.readFileSync(path.join(SRC_DIR, "app.js"), "utf8");
  const template = fs.readFileSync(path.join(SRC_DIR, "index.template.html"), "utf8");

  const contentJs =
    `const SYLLABUS = ${JSON.stringify(syllabus)};\n` +
    `const QUESTIONS = ${JSON.stringify(shipped)};\n` +
    `const GUIDE = ${JSON.stringify(guide)};\n`;

  const finalJs = appJs.replace("/* __CONTENT_INJECTION_POINT__ */", contentJs);
  if (finalJs === appJs) throw new Error("Content injection point missing from src/app.js");

  let output = template.replace("/* __STYLES_INJECTION_POINT__ */", styles);
  if (output === template) throw new Error("Styles injection point missing from src/index.template.html");
  const before = output;
  output = output.replace("/* __SCRIPT_INJECTION_POINT__ */", () => finalJs);
  if (output === before) throw new Error("Script injection point missing from src/index.template.html");

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const outPath = path.join(DIST_DIR, "app.html");
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${(output.length / 1024).toFixed(1)} KB)`);
}

try {
  main();
} catch (e) {
  console.error("BUILD FAILED: " + e.message);
  process.exit(1);
}
