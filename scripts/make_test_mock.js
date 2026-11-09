#!/usr/bin/env node
// make_test_mock.js — writes content/mocks/test-mock.json, a DEV-ONLY sample
// paper drawn at random from the practice bank in the real 81/45/36/9/9 split,
// for testing the mock engine before the real mocks exist. It is gitignored and
// only built with MDCAT_TEST_MOCKS=1 (npm run build:test).
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const PAPER = { bio: 81, chem: 45, phy: 36, eng: 9, lr: 9 };
const out = [];
for (const [s, n] of Object.entries(PAPER)) {
  const dir = path.join(ROOT, "content", "questions", s);
  let pool = [];
  for (const f of fs.readdirSync(dir)) pool = pool.concat(JSON.parse(fs.readFileSync(path.join(dir, f))).map((q) => ({ ...q, unit: f.replace(".json", "") })));
  pool.sort(() => Math.random() - 0.5);
  out.push(...pool.slice(0, n).sort((x, y) => x.id.localeCompare(y.id)));
}
fs.writeFileSync(path.join(ROOT, "content", "mocks", "test-mock.json"), JSON.stringify({ id: "test-mock", title: "TEST mock (from practice bank)", questions: out }));
console.log(`wrote content/mocks/test-mock.json (${out.length} questions)`);
