# MDCAT Prep

Offline Android app for MDCAT preparation (PM&DC Uniform Curriculum 2025). HomiLabs.

- Scope: [docs/scope-v1.md](docs/scope-v1.md) (locked 9 Nov 2026). Research: [docs/mdcat-research.md](docs/mdcat-research.md)
- Build: `npm run build` → `dist/app.html` (+ `www/index.html` for Capacitor). The build validates every MCQ and fails on any error.
- Content: `content/syllabus.json` (subject → unit → topic → LO) and `content/questions/<subject>/<unit>.json`.
- New MCQ batch: drafts go in `drafts/` (gitignored); `node scripts/check_draft.js <draft> <unit> <first> <count>` must PASS → `node scripts/merge_parts.js <unit file> <drafts...>` → `node scripts/balance_answers.js <file>` → `node scripts/blind_export.js <file> <blind.txt>` → independent AI re-solves blind → `node scripts/blind_compare.js <file> <answers.txt>` must show full agreement → Homi spot-checks (`node scripts/spotcheck_sheet.js <subject> 20 docs/review/<subject>-spotcheck.md [doubtful ids]`) → build.

## Pieces
1. App shell + practice player + Biology Unit 1 sample (32 MCQs) — done 9 Nov 2026
2. Rules & guidelines (9 sections) — done 9 Nov 2026
3. Biology bank (2,250 MCQs, 16 units, every key agreed by a blind re-check) — done 9 Nov 2026, Homi's spot check pending (`docs/review/bio-spotcheck.md`)
4. Chemistry bank (1,250 MCQs, 20 units, every key agreed by a blind re-check) — done 9 Nov 2026, Homi's spot check pending (`docs/review/chem-spotcheck.md`)
5. Physics bank (1,000 MCQs, 16 units, every key agreed by a blind re-check) — done 9 Nov 2026, Homi's spot check pending (`docs/review/phy-spotcheck.md`)
6. English + Logical Reasoning banks (250 + 250 MCQs, every key agreed by a blind re-check) — done 9 Nov 2026, Homi's spot check pending (`docs/review/eng-spotcheck.md`, `docs/review/lr-spotcheck.md`)
7. Mock exam engine (timed 180-question paper, grid, flags, auto-submit, results with subject/unit breakdown, weak units, review filters, aggregate estimate) — done 9 Nov 2026. Real mocks come in piece 8; `npm run build:test` adds a dev-only sample mock (`node scripts/make_test_mock.js`).
8. 20 full mock papers (3,600 MCQs, separate from the practice bank, every key agreed by a blind re-check) — done 9 Nov 2026. Source pools: `content/mockpool/<unit>.json`; papers: `node scripts/assemble_mocks.js` → `content/mocks/mock-01…20.json` (exact 81/45/36/9/9, ~15/70/15, balanced answers). Overlap with the bank checked by `scripts/overlap_bank.js`.
9. Memory cheats (167 short cards: mnemonics, tables, formula sheets, reaction maps, rules, tricks; every unit covered; fact-checked by independent agents) — done 9 Nov 2026, Homi's read-through pending (`docs/review/cheats-review.md`). Source: `content/cheats/<subject>.json`, brief `docs/pipeline/CHEATS_BRIEF.md`, check drafts with `scripts/check_cheats.js`, regenerate the review sheet with `node scripts/merge_cheats.js`.
10. Important topics (all 61 units ranked into Must-know / Important / Quick wins, each with a why, focus LOs, the student's own accuracy and a Practise button; our estimate from LO share plus exam judgement, labelled as not official; fact-checked by an independent agent) — done 10 Nov 2026, Homi's read-through pending (`docs/review/topics-review.md`). Source: `content/topics.json` (rank order within each subject), brief `docs/pipeline/TOPICS_BRIEF.md`, check with `scripts/check_topics.js`.
11. Release (AdMob, store, mdcat.homilabs.org pages)

## Android (debug)
- Capacitor app id `com.homilabs.mdcatprep`. `npm run build` (or `build:test`) → `npx cap sync android` → `jobq run --name mdcat-debug-apk -- bash -c "cd android && ./gradlew assembleDebug"` → `adb -s <device> install -r android/app/build/outputs/apk/debug/app-debug.apk`.
- Release signing and AdMob come in piece 11.
