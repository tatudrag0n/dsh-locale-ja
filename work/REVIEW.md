# Review brief — Japanese UI copy, DSH web UI

You are reviewing machine-assisted translations of user-interface strings before
they ship in a language pack. Your job is to find defects, not to praise or
rewrite wholesale.

## Input

For each assigned chunk number `NN`, read:

- `work/chunks/chunk-NN.json` — id → English source.
- `work/chunks/out-NN.json` — id → Japanese translation.

Read `work/BRIEF.md` for the glossary and tone the translators were given.

## What counts as a defect

Report only these, each with the id, the current Japanese, and your replacement:

1. **Wrong meaning** — the Japanese says something the English does not, or
   drops a clause the user needs (especially in errors and destructive prompts).
2. **Broken rendering** — a `{placeholder}` missing, renamed, or moved where the
   sentence no longer reads; whitespace-only sources altered; a leading or
   trailing space dropped where the source keeps one.
3. **Not Japanese** — an English sentence left untranslated without a reason.
   Product names, protocol names, tool names, file paths, format skeletons
   (`{value} tok`, `{percent}%`), and bare identifiers are correctly left alone.
4. **Unnatural or wrong register** — translationese, a literal idiom, a verb
   form that reads wrong for the control it labels (a button must not read as a
   sentence), or です・ます調 where the string is a terse label.
5. **Terminology off-glossary** — a term rendered differently from the glossary
   in `work/BRIEF.md`, or the same English term rendered two ways inside your
   own assigned chunks. Report the pair when you see both.
6. **Truncation risk** — a Japanese rendering far longer than the English for a
   string that labels a button, tab, or badge (roughly 2x or more).

## What is not a defect

- Stylistic preferences where the Japanese is already correct and natural.
- Terms kept in Latin script per the brief.
- Strings you would merely phrase differently.

## Output

Write `work/review/review-NN.md` (one file per chunk, created by you) with:

- A one-line count: `defects: <n>`.
- Then one block per defect:

```
### <id> — <severity: high|medium|low>
EN: <source>
JA: <current>
FIX: <replacement Japanese, or "none — explanation only">
WHY: <one sentence>
```

Write only the review file(s) you were assigned, and create no other files.
Finish with a reply of exactly one line: `review-NN: <n> defects`.
