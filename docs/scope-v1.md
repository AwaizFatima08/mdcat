# MDCAT Prep app — v1 scope (LOCKED 9 Nov 2026)

Based on [mdcat-research.md](mdcat-research.md). Decisions in §7 answered by Homi on 9 Nov 2026 — see "Locked decisions" at the end.

## 1. What Homi asked for (8 Nov 2026)
- All subjects: Biology, Chemistry, Physics, English, Logical Reasoning (LR is 9/180 in the real paper, so it's included)
- **5,000 practice MCQs**, each with an explanation, arranged by subject → unit → topic (subtopic)
- **20 full-length mock exams** (180 MCQs / 3 h, official split)
- Scoring and explanation review after every exam
- Guidelines and rules section
- Memorisation cheats (mnemonics, quick tables)
- Important topics to study (high-yield list)

## 2. Structure follows the official PM&DC 2025 curriculum
Subject → unit → topic → learning outcome (LO). Every MCQ carries: `subject, unit, topic, LO code (e.g. BIO-15.2), difficulty E/M/D, 4 options, answer, explanation`.

### Practice bank split (5,000, matches paper weightage)
| Subject | Units | MCQs |
|---|---|---|
| Biology | 16 | 2,250 |
| Chemistry | 20 | 1,250 |
| Physics | 16 | 1,000 |
| English | 3 themes | 250 |
| Logical Reasoning | 6 themes | 250 |
| **Total** | | **5,000** |

Within a subject, MCQs are spread by how many LOs a unit has (bigger unit = more questions). Difficulty mix 15/70/15 like the real paper.

## 3. Mock exams
- 20 mocks × 180 = **3,600 question slots**, each mock 81/45/36/9/9 and 15/70/15, timed 3 h, no negative marking.
- **Open question (§7-A):** are mock questions separate from the 5,000, or drawn from them?
- After submit: score /180, pass line (99 MBBS / 90 BDS), per-subject and per-unit breakdown, time used, every question reviewable with its explanation, weak-unit list feeding back into practice. Optional estimated aggregate (MDCAT 50 + FSc 40 + Matric 10).

## 4. Other sections
- **Rules & guidelines:** exam format, pass marks, what to bring and what's banned, OMR bubbling rules, answer key challenge window, score validity 3 years, merit formula, exam-day timetable. Uses official PM&DC/UHS facts with a "check pmdc.pk" note and source date.
- **Memorisation cheats:** per subject, short cards (mnemonics, comparison tables, formula sheets, organic reaction maps, English rules, LR pattern tricks). Original writing only.
- **Important topics:** per subject, ranked high-yield units/LOs with a short "why" (based on weightage, LO count and common question patterns), linked to that unit's practice.
- Progress: questions done, accuracy per unit, mistake list, bookmarks. Stored on the phone.

## 5. Proposed build (reuse what worked for Urdu Safar)
- **Stack:** same as Safar — one offline HTML/JS app, content in JSON bundles, `build/build.js`, Capacitor for Android, a `validate_content.py`-style checker (every MCQ has 4 distinct options, one answer, explanation, valid LO code, mock splits exact). No server, no login, works offline.
- **Content production:** Claude drafts MCQs unit by unit against the LOs; the validator checks structure; a second independent check of each answer (fresh-context review, optionally a cross-check on homidev's local model); Homi spot-checks a sample per unit; in-app "report this question".
- **Pieces, one at a time (each verified before the next):**
  1. App shell: home, subject → unit → topic browser, practice player with explanations, progress — with Biology Unit 1 as the sample content
  2. Rules & guidelines section
  3. Biology bank (2,250)
  4. Chemistry bank (1,250)
  5. Physics bank (1,000)
  6. English + LR banks (500)
  7. Mock exam engine + results/review screens
  8. 20 mocks' content
  9. Memorisation cheats
  10. Important topics
  11. Store listing, icon, privacy page, release build

## 6. Risks to say plainly
- **Size:** 5,000 + up to 3,600 MCQs is the biggest content job so far — many sessions. Quality over speed.
- **Accuracy:** a wrong key in a medical-entrance app destroys trust. Structural checks can be automated; factual correctness needs review. A full human read of 5–8k items is a lot; §7-C decides how much.
- **Originality:** no copying of academy books or past papers; style imitated, content original.
- **Syllabus drift:** PM&DC may change the curriculum for 2027 (watch pmdc.pk spring 2027); LO tags make updates easy.
- **Timing:** useful for MDCAT 2027 if live by ~Mar–Apr 2027.

## 7. Decisions needed
- **A. Mock questions:** separate from the 5,000 / drawn from the 5,000
- **B. Stack:** Safar-style HTML + Capacitor / Flutter
- **C. Answer checking:** how much Homi reviews
- **D. Money:** free / free + one-time unlock / ads
- Also: app name, English-only for v1 (Urdu explanations later?)

## Locked decisions (Homi, 9 Nov 2026)
- **A. Mocks use separate questions:** 20 mocks × 180 = 3,600 MCQs written only for mocks, never shown in practice. Total content ≈ **8,600 MCQs**.
- **B. Stack like Urdu Safar:** offline HTML/JS + JSON content + `build/build.js` + Capacitor Android. No login, no server.
- **C. Review:** Claude writes → validator → a second independent AI pass re-solves every MCQ blind; any disagreement is fixed or dropped → Homi spot-checks ~20 per unit → in-app "report this question".
- **D. Free with ads:** all content free. Ads only between sessions (e.g. after a practice set or on the results screen), **never during a question, a practice set or a mock**. AdMob via Capacitor plugin + consent form; added in the release piece (11), not before. **AdMob account: homilabs.smc@gmail.com** (Homi, 9 Nov 2026).
- Defaults (not asked, change any time): working name **"MDCAT Prep"**, English only for v1, system fonts so it works fully offline.
