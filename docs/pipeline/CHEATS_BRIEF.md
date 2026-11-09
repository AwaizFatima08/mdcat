# Brief: writing memory-cheat cards (piece 9)

Format locked with Homi on 9 Nov 2026: about 150 short cards, browsed
subject → unit → card, each with Prev / Next and a "Practise this unit" button.
Target counts: Biology ~48, Chemistry ~45, Physics ~40, English ~10, LR ~10
(every unit gets at least 2 cards; bigger units get up to 4).

## What a card is
One idea a student can revise in under a minute, fitting about one phone
screen: **at most ~120 words**, tables at most 7 rows × 4 columns.
Kinds (pick the one that fits best):

| kind | use it for |
|---|---|
| `mnemonic` | a memory phrase / acronym and what each letter stands for |
| `table` | a side-by-side comparison (A vs B vs C) |
| `formula` | a formula sheet: formula, symbols, units, one trap |
| `map` | a chain or reaction map (A → B → C, with the reagent on each arrow) |
| `rule` | English grammar / usage rules with one right and one wrong example |
| `trick` | a shortcut, pattern or exam trap and how to spot it |

## Rules
- **Correct first.** FSc / PM&DC 2025 curriculum level. Only facts you are
  certain of; when textbooks differ, give the FSc (Punjab Textbook Board)
  convention and say so. No guideline-dependent clinical numbers.
- **Original writing.** No text copied from academy notes, past papers or
  websites. Well-known public mnemonics (e.g. OIL RIG) are fine; write the
  explanation yourself. Invented mnemonics must be clean, easy to say, and
  their letters must really match the facts.
- **Exam-useful.** Pick what MDCAT actually tests from the unit's LOs in
  `content/syllabus.json`; end most cards with one 💡 tip or ⚠️ trap.
- Plain English, short lines. Use Unicode for formulas (H₂O, v², Δ, →, ⇌, λ,
  Ω, μ), never LaTeX.
- No repeats: two cards in one unit must not cover the same thing.

## File format
`drafts/cheats/<subject>.<part>.json` — a JSON array of cards:

```json
{
  "id": "bio-11-c01",
  "unit": "bio-11",
  "kind": "table",
  "title": "ABO blood groups",
  "blocks": [
    { "type": "table", "head": ["Group", "Antigen on RBC", "Antibody in plasma"], "rows": [["A", "A", "anti-B"]] },
    { "type": "tip", "text": "..." }
  ]
}
```

- `id` = `<unit>-cNN`, numbered from c01 within each unit.
- Block types: `p` {text}, `h` {text}, `tip` {text}, `warn` {text},
  `list` {items}, `table` {head, rows} (every row as long as head),
  `mn` {text, items} — the mnemonic phrase and what each part stands for.

Check each file with:

```
node scripts/check_cheats.js drafts/cheats/<subject>.<part>.json
```

until it prints `PASS`. Only write your own files; don't edit anything else
and don't run git. Reply with the PASS line and any card you were unsure
about (id + why), or "none".
