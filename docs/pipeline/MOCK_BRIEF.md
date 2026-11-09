# Brief: writing MCQs for the 20 full MDCAT mock papers

These questions go into full-length mock papers (180 MCQs, 3 hours), not the
practice bank. Read, in this order, and follow all of them:

1. `docs/pipeline/WRITER_BRIEF.md` — format, quality rules, checker.
2. The subject addendum: `docs/pipeline/CHEM_ADDENDUM.md` for chemistry,
   `docs/pipeline/PHY_ADDENDUM.md` for physics,
   `docs/pipeline/ENG_LR_ADDENDUM.md` for English and logical reasoning.
   (Biology needs none.)
3. This file, which wins where they differ.

## What's different for mock questions
- **Exam style.** Write as the real MDCAT paper does: mostly moderate,
  one-step-to-two-step questions that a well-prepared FSc student can answer in
  about a minute. Aim for 15% E, 70% M, 15% D, as before.
- **Never repeat the practice bank.** Before writing a unit, open its practice
  file `content/questions/<subject>/<unit>.json` and skim every stem. Your
  questions must test a different fact, a different example, different numbers
  or a clearly different angle. A reworded copy of a bank question is a failure.
  Then, after writing, run:

  ```
  node scripts/overlap_bank.js <your draft file>
  ```

  and rewrite every question it lists until it prints `CLEAN`.
- **No repeats inside your own file either**, and spread evenly over every LO
  listed for your slice.
- The correct answer can stay at index 0; a script moves options later.

## Your files
For each unit slice on your job card, write a JSON array to
`drafts/mockpool/<unit>.<part>.json` with ids `<unit>-NNN` numbered from the
"first" number on the card, then run both checks:

```
node scripts/check_draft.js drafts/mockpool/<unit>.<part>.json <unit> <first> <count>
node scripts/overlap_bank.js drafts/mockpool/<unit>.<part>.json
```

Only write your own files. Don't edit anything else, don't run git. Reply
with the PASS and CLEAN lines for each file, plus any questions you were
unsure about (id + why), or "none".
