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
8. 20 mocks · 9. Memory cheats · 10. Important topics · 11. Release (AdMob, store, mdcat.homilabs.org pages)

## Android (debug)
- Capacitor app id `com.homilabs.mdcatprep`. `npm run build` (or `build:test`) → `npx cap sync android` → `jobq run --name mdcat-debug-apk -- bash -c "cd android && ./gradlew assembleDebug"` → `adb -s <device> install -r android/app/build/outputs/apk/debug/app-debug.apk`.
- Release signing and AdMob come in piece 11.
