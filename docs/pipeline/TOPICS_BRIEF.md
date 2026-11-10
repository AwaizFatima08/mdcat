# Brief: important topics (piece 10)

Format locked with Homi on 10 Nov 2026:
- **Every unit** of every subject (61) is placed in one of three tiers:
  1. **Must-know** — high share of the syllabus and/or asked in most papers;
  2. **Important** — solid share, regularly asked;
  3. **Quick wins** — small units: few LOs, fast to learn, still worth marks.
- Each entry has a 1–2 sentence **why**, the **2–3 LOs to focus on**, the
  student's own accuracy for the unit and a **Practise** button.
- The ranking is **our estimate, not official PM&DC weightage**. PM&DC
  publishes weightage per subject only (Bio 81, Chem 45, Phy 36, Eng 9,
  LR 9). The app says so on every page.

## Basis for the ranking
1. **LO share** (official, computed): `drafts/topics/lo_share.md` lists each
   unit's LO count and share. This is the starting point.
2. **Exam judgement**: adjust where LO count misleads — e.g. a unit with one
   broad LO that covers a large chapter, or a unit that many other units build
   on. Use your knowledge of FSc / MDCAT exam emphasis.

## Rules for `why`
- 8–40 words, plain English, one or two sentences.
- Say *why* it matters: share of the LOs, breadth, how often the topic type is
  tested, what it links to, or that it is a quick win.
- **No invented numbers about past papers** ("6 MCQs came from this in 2024")
  — we cannot verify them. Wording like "often tested" or "a favourite for
  numericals" is fine only where it is well known.
- Any fact in the sentence must be correct at FSc level. Original writing.

## Rules for `focus`
- 1–3 LO codes taken **exactly** from that unit in `content/syllabus.json`,
  most useful first. Units with one LO list that one.

## File format
`drafts/topics/topics.json` — one JSON array, all 61 units. Within each
subject, entries are in rank order (best first); tiers must not go back up
(all tier 1 before tier 2 before tier 3).

```json
{ "unit": "bio-03", "tier": 1, "why": "...", "focus": ["BIO-3.4", "BIO-3.1"] }
```

Check with `node scripts/check_topics.js drafts/topics/topics.json` until it
prints `PASS`.
