/**
 * cheats.js — validates memory-cheat cards (content/cheats/<subject>.json).
 * Shared by build/build.js and scripts/check_cheats.js so a draft is checked
 * by exactly the rules the build applies.
 */
const KINDS = ["mnemonic", "table", "formula", "map", "rule", "trick"];
const BLOCKS = {
  p: ["text"], h: ["text"], tip: ["text"], warn: ["text"], list: ["items"], table: ["head", "rows"], mn: ["text", "items"],
};
const MAX_WORDS = 160;   // brief says ~120; leave headroom for tables

function words(card) {
  const parts = [card.title];
  for (const b of card.blocks) {
    if (b.text) parts.push(b.text);
    if (b.items) parts.push(...b.items);
    if (b.head) parts.push(...b.head, ...b.rows.flat());
  }
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

// Checks one card; `unitSubject(unitId)` returns the unit's subject or undefined.
function checkCard(c, at, unitSubject, ids) {
  for (const k of ["id", "unit", "kind", "title", "blocks"]) {
    if (!(k in c)) throw new Error(`${at}: missing "${k}"`);
  }
  if (ids.has(c.id)) throw new Error(`${at}: duplicate id`);
  ids.add(c.id);
  if (!unitSubject(c.unit)) throw new Error(`${at}: unit "${c.unit}" is not in syllabus.json`);
  if (!new RegExp(`^${c.unit}-c\\d\\d$`).test(c.id)) throw new Error(`${at}: id must be "${c.unit}-cNN"`);
  if (!KINDS.includes(c.kind)) throw new Error(`${at}: kind must be one of ${KINDS.join("/")}`);
  if (String(c.title).trim().length < 4) throw new Error(`${at}: title too short`);
  if (!Array.isArray(c.blocks) || !c.blocks.length) throw new Error(`${at}: needs at least one block`);
  c.blocks.forEach((b, j) => {
    const need = BLOCKS[b.type];
    if (!need) throw new Error(`${at} block ${j}: unknown type "${b.type}"`);
    for (const k of need) if (!(k in b)) throw new Error(`${at} block ${j}: ${b.type} needs "${k}"`);
    if (b.text != null && !String(b.text).trim()) throw new Error(`${at} block ${j}: empty text`);
    if (b.items && (!Array.isArray(b.items) || !b.items.length || b.items.some((i) => typeof i !== "string" || !i.trim()))) {
      throw new Error(`${at} block ${j}: items must be non-empty strings`);
    }
    if (b.type === "table") {
      if (!Array.isArray(b.rows) || !b.rows.length) throw new Error(`${at} block ${j}: table needs rows`);
      if (b.rows.some((r) => !Array.isArray(r) || r.length !== b.head.length)) {
        throw new Error(`${at} block ${j}: every table row needs ${b.head.length} cells`);
      }
      if (b.head.length > 4 || b.rows.length > 8) throw new Error(`${at} block ${j}: table too big for a phone (max 4 columns, 8 rows)`);
    }
    if (/\\(frac|text|mathrm|times|Delta)|\$/.test(JSON.stringify(b))) throw new Error(`${at} block ${j}: looks like LaTeX; use Unicode`);
  });
  const n = words(c);
  if (n > MAX_WORDS) throw new Error(`${at}: ${n} words, too long for one card (max ${MAX_WORDS})`);
}

module.exports = { KINDS, checkCard };
