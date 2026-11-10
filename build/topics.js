/**
 * topics.js — validates the important-topics list (content/topics.json).
 * Shared by build/build.js and scripts/check_topics.js so a draft is checked
 * by exactly the rules the build applies.
 */
const TIERS = { 1: "Must-know", 2: "Important", 3: "Quick wins" };

function wordCount(s){ return String(s).split(/\s+/).filter(Boolean).length; }

// Checks the whole list against the syllabus; returns it in syllabus subject
// order with each subject's entries kept in their rank order.
function checkTopics(list, syllabus){
  if (!Array.isArray(list)) throw new Error("topics: file must be a JSON array");
  const unit = {}, losOf = {};
  for (const s of syllabus.subjects) for (const u of s.units) {
    unit[u.id] = s.id;
    losOf[u.id] = new Set(u.topics.flatMap((t) => t.los.map((l) => l.code)));
  }
  const seen = new Set(), lastTier = {};
  list.forEach((e, i) => {
    const at = `topics item ${i} (${e.unit || "no unit"})`;
    for (const k of ["unit", "tier", "why", "focus"]) if (!(k in e)) throw new Error(`${at}: missing "${k}"`);
    if (!unit[e.unit]) throw new Error(`${at}: unit is not in syllabus.json`);
    if (seen.has(e.unit)) throw new Error(`${at}: unit listed twice`);
    seen.add(e.unit);
    if (!TIERS[e.tier]) throw new Error(`${at}: tier must be 1, 2 or 3`);
    const sid = unit[e.unit];
    if (e.tier < (lastTier[sid] || 1)) throw new Error(`${at}: rank order broken (tier ${e.tier} after tier ${lastTier[sid]})`);
    lastTier[sid] = e.tier;
    const n = wordCount(e.why);
    if (n < 8 || n > 40) throw new Error(`${at}: why has ${n} words (8–40)`);
    if (/\\(frac|text|mathrm|times|Delta)|\$/.test(e.why)) throw new Error(`${at}: looks like LaTeX; use Unicode`);
    if (!Array.isArray(e.focus) || !e.focus.length || e.focus.length > 3) throw new Error(`${at}: focus needs 1–3 LO codes`);
    if (new Set(e.focus).size !== e.focus.length) throw new Error(`${at}: focus repeats an LO`);
    for (const c of e.focus) if (!losOf[e.unit].has(c)) throw new Error(`${at}: ${c} is not an LO of ${e.unit}`);
  });
  const missing = Object.keys(unit).filter((u) => !seen.has(u));
  if (missing.length) throw new Error(`topics: units missing: ${missing.join(", ")}`);
  for (const s of syllabus.subjects) {
    if (!list.some((e) => unit[e.unit] === s.id && e.tier === 1)) throw new Error(`topics: ${s.id} has no Must-know unit`);
  }
  const order = syllabus.subjects.map((s) => s.id);
  return list.map((e, i) => ({ e, i })).sort((a, b) => order.indexOf(unit[a.e.unit]) - order.indexOf(unit[b.e.unit]) || a.i - b.i).map((x) => x.e);
}

module.exports = { TIERS, checkTopics };
