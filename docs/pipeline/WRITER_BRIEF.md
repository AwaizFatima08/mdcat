# Brief: writing MDCAT Biology practice MCQs

You are writing practice questions for **MDCAT Prep**, a free Android app for
Pakistani students preparing for MDCAT (the national medical/dental admission
test, set by PM&DC). Students are FSc pre-medical, age 17–19. Every question is
re-solved later by an independent reviewer who does not see your answer key, so
a question with two defensible answers or a wrong key will be caught and
thrown away. Accuracy matters more than speed.

## Read first
- `content/syllabus.json` — your unit's topic ids and learning-outcome (LO) codes.
- `docs/sources/PMDC-Uniform-Curriculum-MDCAT-2025-Final.txt` — the official
  PM&DC curriculum. Stay inside its scope for your LOs.
- `content/questions/bio/bio-01.json` — 32 finished questions showing the
  house style. Match it.
- Your job card (in the message that started you): unit, id range, which LOs,
  how many per LO, and the output file.

## Format
Write a JSON array to your output file, one object per line:

```
{"id":"bio-05-001","topic":"bio-05-neurons","lo":"BIO-5.2","d":"M","q":"...","o":["...","...","...","..."],"a":0,"x":"..."}
```

- `id`: `<unit>-<NNN>`, three digits, consecutive over your range, no gaps.
- `topic` / `lo`: must be a topic id of your unit and an LO code of that topic.
- `d`: `E` easy, `M` moderate, `D` difficult. Aim for about **15% E, 70% M,
  15% D** (the real paper's mix). E = one recall step. M = understand,
  compare, apply. D = two-step reasoning, data, or fine distinctions — still
  strictly within the FSc syllabus, never trivia.
- `o`: exactly 4 options, all different, similar length and style.
- `a`: index 0–3 of the correct option. Don't worry about spreading answers;
  a script moves options around afterwards. **So options and explanations must
  never refer to a letter or position**: no "Both A and B", "A and C", "option
  B", "all of the above", "none of the above". If you need a combined answer,
  write it out ("Insulin and glucagon").
- `x`: the explanation, 1–3 short sentences. Say why the answer is right,
  and where useful why the most tempting wrong option is wrong. Plain English,
  no letters.

## Quality rules
1. **One clearly correct answer.** The other three must be definitely wrong to
   a well-prepared student, not "less good". Avoid "most likely", "best" unless
   the ranking is textbook-clear.
2. **Textbook facts only.** Use the standard facts of the Pakistani FSc
   Biology textbooks (Punjab/Federal/KPK boards) and the PM&DC curriculum.
   Where books or sources disagree (e.g. exact ATP yields, exact numbers of
   bones, contested dates), either avoid the point or ask it in a way that is
   true under every convention.
3. **Plausible distractors.** Use real terms from the same topic, common
   student confusions, and numbers close to the true one. No joke options.
4. **Vary the question types:** direct recall, "Which of the following is NOT…",
   "Which statement is correct?", match a structure to its function,
   cause → effect, short scenarios ("A person's blood test shows…"),
   genetics crosses with ratios, sequences ("correct order of…"). Use
   "NOT/EXCEPT" in capitals and for no more than about 1 in 8 questions.
5. **No repeats.** Each question tests something different, or the same fact
   from a clearly different angle. No two stems the same or nearly the same.
   Spread across *everything* the LO covers, not just its first idea.
6. **Self-contained.** No images, diagrams or tables needed. Keep stems under
   about 45 words.
7. Spelling: British/Pakistani textbook spelling ("haemoglobin" or
   "hemoglobin" — pick one per question and keep it consistent; the app
   already uses "hemophilia" in the syllabus, either is fine).
8. Health content: be factually careful and neutral; no treatment advice
   beyond what the textbook states.

## Check before you finish
Run, from the project root `/mnt/storage/projects/mdcat`:

```
node scripts/check_draft.js <your file> <unit> <first number> <count>
```

Fix every `ERR` until it prints `PASS`. Then re-read your questions once more,
asking for each: is the key right, is exactly one option right, does the
explanation agree with the key? Fix anything doubtful.

Only write your own output file. Don't edit anything else in the project,
don't run git. When done, reply with: the PASS line, and any questions you
were unsure about (id + why), or "none".
