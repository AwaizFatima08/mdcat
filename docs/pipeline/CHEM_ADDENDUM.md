# Chemistry addendum to WRITER_BRIEF.md

The writer brief was written for Biology; for Chemistry, read it with these
changes. Where they differ, this file wins.

- Subject: FSc Chemistry (Pakistani boards, Part I and II) within the PM&DC
  MDCAT curriculum, `docs/sources/PMDC-Uniform-Curriculum-MDCAT-2025-Final.txt`
  section "2. CHEMISTRY". There are no finished Chemistry questions yet; use
  `content/questions/bio/bio-01.json` only as a format and style example.
- Question files go under `content/questions/chem/` later; you write a draft
  in `drafts/` as your job card says.
- **Numericals:** MDCAT has no calculator. About a quarter to a third of
  questions in calculation-heavy LOs (moles, yield, gas laws, Ksp, rate law,
  Hess's law, oxidation numbers) should be numericals with numbers chosen so
  they work out by hand in under a minute (e.g. 22.4 dm³, molar masses
  H 1, C 12, N 14, O 16, Na 23, Cl 35.5, S 32, Ca 40). Give any data the
  student needs in the stem. Work each answer twice. Distractors should be the
  results of typical mistakes (forgot to balance, used the wrong ratio,
  inverted a fraction), not random numbers.
- **Notation:** plain Unicode only, no HTML or LaTeX: H₂O, SO₄²⁻, Fe³⁺,
  10⁻⁵, ⇌, →, ΔH, °C, dm³, mol dm⁻³. Write structures as condensed formulas
  (CH₃CH₂OH, CH₃COCH₃, C₆H₅CH₃); no drawings.
- **Letters:** the checker rejects text like "A and B" or "(C)". In general
  reactions use names like X, Y, W, Z or real formulas, never A–D.
- **Organic chemistry:** use IUPAC names as the FSc books give them; when a
  common name is better known, give both ("ethanoic acid (acetic acid)").
  Reagent/condition questions must name the conditions the FSc book gives.
- **Conventions that vary between books:** avoid them or word around them
  (e.g. the value of R in different units is fine to ask; contested exact
  bond angles beyond the standard 109.5°, 107°, 104.5°, 120°, 180° are not).
- `x` may include one short line of working for numericals
  ("Moles of O₂ = 64/32 = 2; ratio 2 : 1 gives 4 mol H₂O").
