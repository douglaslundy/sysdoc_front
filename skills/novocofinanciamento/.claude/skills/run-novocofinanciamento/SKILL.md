---
name: run-novocofinanciamento
description: >
  Validate, smoke-test, or verify the novocofinanciamento knowledge skill.
  Use when asked to run, test, check, validate, or update the skill;
  when adding new reference documents; or before publishing changes.
---

# run-novocofinanciamento

This is a **knowledge skill** — a set of markdown reference documents loaded
as context by Claude. There is no server to start. "Running" it means
validating the skill's structural integrity and content coverage with
`.claude/skills/run-novocofinanciamento/smoke.sh`.

---

## What the skill contains

```
novocofinanciamento/
  SKILL.md                          ← main skill loaded into context
  references/
    componentes_valores.md          ← values for all 6 components (226 lines)
    indicadores_grupo_c.md          ← C1–C7 indicator cards for eSF/eAP (281 lines)
    indicadores_grupo_b_a.md        ← B1–B7 (eSB) + A1–A2 (eMulti) indicators (212 lines)
    faq_operacional.md              ← 30 operational FAQs (181 lines)
    fontes_pesquisa.md              ← official source URLs + search queries (139 lines)
```

---

## Run (agent path): smoke test

Run from the skill root (`novocofinanciamento/`):

```bash
bash .claude/skills/run-novocofinanciamento/smoke.sh
```

The script checks:
1. **Core files** — `SKILL.md` and `references/` exist
2. **Required reference files** — all 5 expected `.md` files are present
3. **Cross-references** — every `references/xxx.md` cited in `SKILL.md` resolves to a real file
4. **Key content** — key values (Portaria numbers, IED, per-capita, indicator codes) are present
5. **Frontmatter** — YAML header is valid with `name:` and `description:`

Expected output on a healthy skill:

```
=== Result: 24 passed, 0 failed ===
SKILL OK
```

Exits `0` on success, `1` on any failure.

---

## When to run the smoke test

- After editing `SKILL.md` (to catch broken cross-references)
- After adding or renaming a reference file
- After updating indicator values or portaria numbers
- Before telling the user the skill is ready

---

## How to invoke the skill in a conversation

In any Claude Code conversation, type:

```
/novocofinanciamento
```

Or ask naturally: *"quanto vou receber com uma eSF no estrato 1?"* — Claude
auto-loads the skill when the description matches.

---

## Updating the skill

| What changed | What to edit |
|---|---|
| New portaria / regulation | `SKILL.md` (legal section) + relevant `references/*.md` |
| Indicator values changed | `references/componentes_valores.md` |
| New/changed indicator definition | `references/indicadores_grupo_c.md` or `indicadores_grupo_b_a.md` |
| New FAQ | `references/faq_operacional.md` |
| New official URL | `references/fontes_pesquisa.md` |

After any edit, re-run the smoke test to catch broken references.

---

## Gotchas

- **`indicadores_grupo_b.md` and `indicadores_grupo_a.md` do not exist.** They were merged into `indicadores_grupo_b_a.md`. The smoke test guards against re-introducing references to the old split names.
- **grep `-P` (PCRE) is not available** in Git Bash on this machine. The smoke script uses POSIX `-o` only.
- The skill loads `SKILL.md` + any `references/` files the model reads inline — the reference files are *not* auto-loaded; they are read on demand when cited.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `[FAIL] references/X.md cited in SKILL.md but FILE NOT FOUND` | Either create the missing file or update the citation in `SKILL.md` |
| `[FAIL] X MISSING` in required files | The file was deleted or renamed; restore it or update `REQUIRED` in `smoke.sh` |
| `[FAIL] pattern '…' not found` | A key value was removed from a reference file; restore it or update the pattern in `smoke.sh` |
