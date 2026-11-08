# MDCAT Prep

Offline Android app for MDCAT preparation (PM&DC Uniform Curriculum 2025). HomiLabs.

- Scope: [docs/scope-v1.md](docs/scope-v1.md) (locked 9 Nov 2026). Research: [docs/mdcat-research.md](docs/mdcat-research.md)
- Build: `npm run build` → `dist/app.html` (+ `www/index.html` for Capacitor). The build validates every MCQ and fails on any error.
- Content: `content/syllabus.json` (subject → unit → topic → LO) and `content/questions/<subject>/<unit>.json`.
- New MCQ batch: write the file → `node scripts/balance_answers.js <file>` → `node scripts/blind_export.js <file> <blind.txt>` → independent AI re-solves blind → `node scripts/blind_compare.js <file> <answers.txt>` must show full agreement → Homi spot-checks → build.

## Pieces
1. App shell + practice player + Biology Unit 1 sample (32 MCQs) — done 9 Nov 2026
2. Rules & guidelines (9 sections) — done 9 Nov 2026
3. Biology bank · 4. Chemistry · 5. Physics · 6. English + LR · 7. Mock engine · 8. 20 mocks · 9. Memory cheats · 10. Important topics · 11. Release (AdMob, store, mdcat.homilabs.org pages)
